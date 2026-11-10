import { randomUUID } from 'node:crypto';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { closeDatabase, openDatabase, type Database } from './database.js';
import { AzureOpenAIConfigurationError, generateReasonIdeas, type ReasonIdeaRequest } from './reasonSuggestions.js';

type WorkItemCategory = 'checklist' | 'action' | 'raid' | 'decision' | 'change';
type WorkItemStatus = 'not-started' | 'in-progress' | 'blocked' | 'complete';
type LifecycleStage = 'Mobilize' | 'Plan and Analyze' | 'Execute Delivery' | 'Prepare for Phase Transition' | 'Recover/Escalate' | 'Close/Handover';
type ThemePreference = 'light' | 'dark' | 'system';

interface WorkItemDraft {
  title: string;
  category: WorkItemCategory;
  stage: LifecycleStage | '';
  status: WorkItemStatus;
  owner: string;
  dueDate: string;
  evidence: string;
  sourceTool: string;
  sourceUrl: string;
  notes: string;
}

interface WorkItem extends WorkItemDraft {
  id: string;
  createdAt: string;
  updatedAt: string;
}

interface EngagementRecord {
  name: string;
  identifier: string;
  url: string;
  verificationStatus: 'not-verified' | 'verified' | 'mismatch' | 'access-needed';
  verifiedBy: string;
  verifiedOn: string;
  evidence: string;
  accessNotes: string;
  followUpOwner: string;
  followUpDueDate: string;
  followUpStatus: 'not-started' | 'in-progress' | 'waiting' | 'complete';
}

interface EngagementWorkspace {
  clientProjectName: string;
  aep: EngagementRecord;
  bizapps: EngagementRecord;
  matchStatus: 'not-checked' | 'matched' | 'mismatch' | 'access-needed' | 'follow-up';
  matchNotes: string;
  matchOwner: string;
  matchDueDate: string;
  matchFollowUpStatus: 'not-started' | 'in-progress' | 'waiting' | 'complete';
}

interface WorkbenchPreferences {
  theme: ThemePreference;
}

interface WorkItemRow {
  id: string;
  title: string;
  category: WorkItemCategory;
  stage: LifecycleStage | '';
  status: WorkItemStatus;
  owner: string;
  due_date: string | null;
  evidence: string;
  source_tool: string;
  source_url: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface ReasonCommentInput {
  payPeriodStart: string;
  payPeriodEnd: string;
  enterpriseId: string;
  costCollectorId: string;
  comment: string;
}

interface ReasonCommentRow {
  pay_period_start: string;
  pay_period_end: string;
  enterprise_id: string;
  cost_collector_id: string;
  comment: string;
  updated_at: string;
}

class HttpError extends Error {
  constructor(readonly statusCode: number, message: string) {
    super(message);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertString(value: unknown, field: string): asserts value is string {
  if (typeof value !== 'string') throw new HttpError(400, `${field} must be a string.`);
}

function assertIsoDate(value: unknown, field: string): asserts value is string {
  assertString(value, field);
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new HttpError(400, `${field} must be a valid YYYY-MM-DD date.`);
  }
}

function parseReasonComment(value: unknown): ReasonCommentInput {
  if (!isRecord(value)) throw new HttpError(400, 'A reason comment object is required.');
  const { payPeriodStart, payPeriodEnd, enterpriseId, costCollectorId, comment } = value;
  assertIsoDate(payPeriodStart, 'payPeriodStart');
  assertIsoDate(payPeriodEnd, 'payPeriodEnd');
  assertString(enterpriseId, 'enterpriseId');
  assertString(costCollectorId, 'costCollectorId');
  assertString(comment, 'comment');
  if (payPeriodEnd < payPeriodStart) throw new HttpError(400, 'payPeriodEnd must not be before payPeriodStart.');
  if (!enterpriseId.trim() || enterpriseId.length > 200) throw new HttpError(400, 'enterpriseId must be between 1 and 200 characters.');
  if (costCollectorId.length > 200) throw new HttpError(400, 'costCollectorId must not exceed 200 characters.');
  if (!comment.trim()) throw new HttpError(400, 'comment cannot be empty.');
  if (comment.length > 4000) throw new HttpError(400, 'comment must not exceed 4000 characters.');
  return { payPeriodStart, payPeriodEnd, enterpriseId: enterpriseId.trim(), costCollectorId: costCollectorId.trim(), comment: comment.trim() };
}

function parseReasonIdeaRequest(value: unknown): ReasonIdeaRequest {
  if (!isRecord(value)) throw new HttpError(400, 'A variance summary is required.');
  const { payPeriodStart, payPeriodEnd, plannedHours, submittedHours, varianceHours, status } = value;
  assertIsoDate(payPeriodStart, 'payPeriodStart');
  assertIsoDate(payPeriodEnd, 'payPeriodEnd');
  if (payPeriodEnd < payPeriodStart) throw new HttpError(400, 'payPeriodEnd must not be before payPeriodStart.');
  if (typeof plannedHours !== 'number' || !Number.isFinite(plannedHours) || plannedHours < 0) {
    throw new HttpError(400, 'plannedHours must be a non-negative number.');
  }
  if (submittedHours !== null && (typeof submittedHours !== 'number' || !Number.isFinite(submittedHours) || submittedHours < 0)) {
    throw new HttpError(400, 'submittedHours must be a non-negative number or null.');
  }
  if (varianceHours !== null && (typeof varianceHours !== 'number' || !Number.isFinite(varianceHours))) {
    throw new HttpError(400, 'varianceHours must be a number or null.');
  }
  if (typeof status !== 'string' || !['submitted', 'awaiting', 'unplanned'].includes(status)) {
    throw new HttpError(400, 'status is not supported.');
  }
  return { payPeriodStart, payPeriodEnd, plannedHours, submittedHours: submittedHours as number | null, varianceHours: varianceHours as number | null, status: status as ReasonIdeaRequest['status'] };
}

function reasonCommentFromRow(row: ReasonCommentRow) {
  return {
    payPeriodStart: row.pay_period_start,
    payPeriodEnd: row.pay_period_end,
    enterpriseId: row.enterprise_id,
    costCollectorId: row.cost_collector_id,
    comment: row.comment,
    updatedAt: row.updated_at,
  };
}

function parseWorkItemDraft(value: unknown): WorkItemDraft {
  if (!isRecord(value)) throw new HttpError(400, 'A work item object is required.');
  const categories: readonly string[] = ['checklist', 'action', 'raid', 'decision', 'change'];
  const statuses: readonly string[] = ['not-started', 'in-progress', 'blocked', 'complete'];
  const stages: readonly string[] = ['', 'Mobilize', 'Plan and Analyze', 'Execute Delivery', 'Prepare for Phase Transition', 'Recover/Escalate', 'Close/Handover'];
  const { title, category, stage, status, owner, dueDate, evidence, sourceTool, sourceUrl, notes } = value;
  assertString(title, 'title');
  assertString(category, 'category');
  assertString(stage, 'stage');
  assertString(status, 'status');
  assertString(owner, 'owner');
  assertString(dueDate, 'dueDate');
  assertString(evidence, 'evidence');
  assertString(sourceTool, 'sourceTool');
  assertString(sourceUrl, 'sourceUrl');
  assertString(notes, 'notes');
  if (!title.trim()) throw new HttpError(400, 'title cannot be empty.');
  if (!categories.includes(category)) throw new HttpError(400, 'category is not supported.');
  if (!statuses.includes(status)) throw new HttpError(400, 'status is not supported.');
  if (!stages.includes(stage)) throw new HttpError(400, 'stage is not supported.');
  if (sourceUrl) {
    try {
      const url = new URL(sourceUrl);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('Unsupported protocol.');
    } catch {
      throw new HttpError(400, 'sourceUrl must be an HTTP or HTTPS URL.');
    }
  }

  return { title, category: category as WorkItemCategory, stage: stage as LifecycleStage | '', status: status as WorkItemStatus, owner, dueDate, evidence, sourceTool, sourceUrl, notes };
}

function parseEngagements(value: unknown): EngagementWorkspace {
  if (!isRecord(value) || !isRecord(value.aep) || !isRecord(value.bizapps)) {
    throw new HttpError(400, 'An engagement workspace with AEP and BizApps records is required.');
  }
  assertString(value.clientProjectName, 'clientProjectName');
  const matchStatuses: readonly string[] = ['not-checked', 'matched', 'mismatch', 'access-needed', 'follow-up'];
  if (typeof value.matchStatus !== 'string' || !matchStatuses.includes(value.matchStatus)) {
    throw new HttpError(400, 'matchStatus is not supported.');
  }
  return value as unknown as EngagementWorkspace;
}

function emptyEngagementRecord(): EngagementRecord {
  return {
    name: '', identifier: '', url: '', verificationStatus: 'not-verified', verifiedBy: '', verifiedOn: '',
    evidence: '', accessNotes: '', followUpOwner: '', followUpDueDate: '', followUpStatus: 'not-started',
  };
}

function emptyEngagements(): EngagementWorkspace {
  return {
    clientProjectName: '', aep: emptyEngagementRecord(), bizapps: emptyEngagementRecord(),
    matchStatus: 'not-checked', matchNotes: '', matchOwner: '', matchDueDate: '', matchFollowUpStatus: 'not-started',
  };
}

function sendJson(response: ServerResponse, statusCode: number, body: unknown): void {
  response.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let length = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    length += buffer.length;
    if (length > 1_000_000) throw new HttpError(413, 'Request body is too large.');
    chunks.push(buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
  } catch {
    throw new HttpError(400, 'Request body must be valid JSON.');
  }
}

function workItemFromRow(row: WorkItemRow): WorkItem {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    stage: row.stage,
    status: row.status,
    owner: row.owner,
    dueDate: row.due_date ?? '',
    evidence: row.evidence,
    sourceTool: row.source_tool,
    sourceUrl: row.source_url,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getEngagements(database: Database): Promise<EngagementWorkspace> {
  const { rows } = await database.query<{ data: EngagementWorkspace }>(
    'SELECT data FROM workbench_engagements WHERE singleton = TRUE',
  );
  return rows[0]?.data ?? emptyEngagements();
}

async function putEngagements(database: Database, engagements: EngagementWorkspace): Promise<void> {
  await database.query(
    `INSERT INTO workbench_engagements (singleton, data) VALUES (TRUE, $1::jsonb)
     ON CONFLICT (singleton) DO UPDATE SET data = EXCLUDED.data`,
    [JSON.stringify(engagements)],
  );
}

async function handleRequest(request: IncomingMessage, response: ServerResponse, database: Database): Promise<void> {
  const url = new URL(request.url ?? '/', 'http://localhost');
  const path = url.pathname;
  const method = request.method ?? 'GET';

  if (method === 'GET' && path === '/api/health') {
    sendJson(response, 200, { status: 'ok' });
    return;
  }

  if (method === 'GET' && path === '/api/hvlv-reconciliation/comments') {
    const payPeriodStart = url.searchParams.get('payPeriodStart');
    const payPeriodEnd = url.searchParams.get('payPeriodEnd');
    assertIsoDate(payPeriodStart, 'payPeriodStart');
    assertIsoDate(payPeriodEnd, 'payPeriodEnd');
    if (payPeriodEnd < payPeriodStart) throw new HttpError(400, 'payPeriodEnd must not be before payPeriodStart.');
    const { rows } = await database.query<ReasonCommentRow>(
      `SELECT pay_period_start::text, pay_period_end::text, enterprise_id, cost_collector_id, comment, updated_at::text
       FROM hvlv_reconciliation_comments
       WHERE pay_period_start = $1::date AND pay_period_end = $2::date
       ORDER BY enterprise_id, cost_collector_id`,
      [payPeriodStart, payPeriodEnd],
    );
    sendJson(response, 200, rows.map(reasonCommentFromRow));
    return;
  }

  if (method === 'PUT' && path === '/api/hvlv-reconciliation/comments') {
    const input = parseReasonComment(await readJson(request));
    const { rows } = await database.query<ReasonCommentRow>(
      `INSERT INTO hvlv_reconciliation_comments (pay_period_start, pay_period_end, enterprise_id, cost_collector_id, comment)
       VALUES ($1::date, $2::date, $3, $4, $5)
       ON CONFLICT (pay_period_start, pay_period_end, enterprise_id, cost_collector_id)
       DO UPDATE SET comment = EXCLUDED.comment, updated_at = now()
       RETURNING pay_period_start::text, pay_period_end::text, enterprise_id, cost_collector_id, comment, updated_at::text`,
      [input.payPeriodStart, input.payPeriodEnd, input.enterpriseId, input.costCollectorId, input.comment],
    );
    sendJson(response, 200, reasonCommentFromRow(rows[0]));
    return;
  }

  if (method === 'POST' && path === '/api/hvlv-reconciliation/reason-ideas') {
    const input = parseReasonIdeaRequest(await readJson(request));
    try {
      const ideas = await generateReasonIdeas(input);
      sendJson(response, 200, { ideas });
    } catch (cause) {
      if (cause instanceof AzureOpenAIConfigurationError) throw new HttpError(503, cause.message);
      console.error('AI reason ideas request failed', { errorName: cause instanceof Error ? cause.name : 'UnknownError' });
      throw new HttpError(502, 'AI ideas could not be generated. Record the cause you verify yourself.');
    }
    return;
  }

  if (method === 'GET' && path === '/api/workbench') {
    const [engagements, items] = await Promise.all([
      getEngagements(database),
      database.query<WorkItemRow>('SELECT * FROM work_items ORDER BY created_at DESC, id'),
    ]);
    sendJson(response, 200, {
      projectName: engagements.clientProjectName,
      engagements,
      items: items.rows.map(workItemFromRow),
      financialGovernance: { asOf: null, mme: null, azureDevOps: null, hvlvReconciliation: null },
    });
    return;
  }

  if (method === 'GET' && path === '/api/preferences') {
    const { rows } = await database.query<{ theme: ThemePreference }>(
      'SELECT theme FROM workbench_preferences WHERE singleton = TRUE',
    );
    sendJson(response, 200, { theme: rows[0]?.theme ?? 'system' });
    return;
  }

  if (method === 'PUT' && path === '/api/preferences') {
    const value = await readJson(request);
    if (!isRecord(value) || !['light', 'dark', 'system'].includes(String(value.theme))) {
      throw new HttpError(400, 'theme must be light, dark, or system.');
    }
    const preferences: WorkbenchPreferences = { theme: value.theme as ThemePreference };
    await database.query(
      `INSERT INTO workbench_preferences (singleton, theme) VALUES (TRUE, $1)
       ON CONFLICT (singleton) DO UPDATE SET theme = EXCLUDED.theme`,
      [preferences.theme],
    );
    sendJson(response, 200, preferences);
    return;
  }

  if (method === 'POST' && path === '/api/work-items') {
    const draft = parseWorkItemDraft(await readJson(request));
    const id = randomUUID();
    const { rows } = await database.query<WorkItemRow>(
      `INSERT INTO work_items (id, title, category, stage, status, owner, due_date, evidence, source_tool, source_url, notes)
       VALUES ($1, $2, $3, $4, $5, $6, NULLIF($7, '')::date, $8, $9, $10, $11) RETURNING *`,
      [id, draft.title.trim(), draft.category, draft.stage, draft.status, draft.owner, draft.dueDate, draft.evidence, draft.sourceTool, draft.sourceUrl, draft.notes],
    );
    sendJson(response, 201, workItemFromRow(rows[0]));
    return;
  }

  const workItemMatch = path.match(/^\/api\/work-items\/([^/]+)$/);
  if (method === 'PUT' && workItemMatch) {
    const id = decodeURIComponent(workItemMatch[1]);
    const draft = parseWorkItemDraft(await readJson(request));
    const { rows } = await database.query<WorkItemRow>(
      `UPDATE work_items SET title = $2, category = $3, stage = $4, status = $5, owner = $6,
      due_date = NULLIF($7, '')::date, evidence = $8, source_tool = $9, source_url = $10, notes = $11, updated_at = now()
       WHERE id = $1 RETURNING *`,
          [id, draft.title.trim(), draft.category, draft.stage, draft.status, draft.owner, draft.dueDate, draft.evidence, draft.sourceTool, draft.sourceUrl, draft.notes],
    );
    if (!rows[0]) throw new HttpError(404, 'This work item does not exist in the workbench.');
    sendJson(response, 200, workItemFromRow(rows[0]));
    return;
  }

  if (method === 'PUT' && path === '/api/engagements') {
    const engagements = parseEngagements(await readJson(request));
    await putEngagements(database, engagements);
    sendJson(response, 200, engagements);
    return;
  }

  if (method === 'PUT' && path === '/api/project-name') {
    const value = await readJson(request);
    if (!isRecord(value)) throw new HttpError(400, 'A project name is required.');
    assertString(value.name, 'name');
    const engagements = { ...await getEngagements(database), clientProjectName: value.name };
    await putEngagements(database, engagements);
    sendJson(response, 200, value.name);
    return;
  }

  sendJson(response, 404, { error: 'Route not found.' });
}

export function createApiServer(database: Database): Server {
  return createServer((request, response) => {
    void handleRequest(request, response, database).catch((cause: unknown) => {
      if (cause instanceof HttpError) {
        sendJson(response, cause.statusCode, { error: cause.message });
        return;
      }
      console.error('API request failed', { method: request.method, url: request.url, error: cause });
      sendJson(response, 500, { error: 'The request could not be completed.' });
    });
  });
}

async function main(): Promise<void> {
  const database = await openDatabase();
  const server = createApiServer(database);
  const port = Number(process.env.PORT ?? 3001);
  const host = process.env.HOST ?? '127.0.0.1';
  server.listen(port, host, () => console.log(`DL Support API listening at http://${host}:${port}`));

  const shutdown = (): void => {
    server.close(() => void closeDatabase(database));
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  void main().catch((error: unknown) => {
    console.error('Could not start the DL Support API.', error);
    process.exitCode = 1;
  });
}