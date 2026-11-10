import assert from 'node:assert/strict';
import { once } from 'node:events';
import { closeDatabase, openDatabase } from './database.js';
import { createApiServer } from './server.js';

const database = await openDatabase({ memory: true });
const server = createApiServer(database);

try {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const healthResponse = await fetch(`${baseUrl}/api/health`);
  assert.equal(healthResponse.status, 200);
  assert.deepEqual(await healthResponse.json(), { status: 'ok' });

  const initialResponse = await fetch(`${baseUrl}/api/workbench`);
  assert.equal(initialResponse.status, 200);
  const initialData = await initialResponse.json() as { items: unknown[]; projectName: string; financialGovernance: { asOf: string | null; mme: unknown; azureDevOps: unknown; hvlvReconciliation: unknown } };
  assert.deepEqual(initialData.items, []);
  assert.equal(initialData.projectName, '');
  assert.deepEqual(initialData.financialGovernance, { asOf: null, mme: null, azureDevOps: null, hvlvReconciliation: null });

  const reasonComment = {
    payPeriodStart: '2026-10-26', payPeriodEnd: '2026-11-08', enterpriseId: 'E001', costCollectorId: 'CC-100',
    comment: 'DL confirmed additional approved work; review change request and update MME plan.',
  };
  const savedReasonResponse = await fetch(`${baseUrl}/api/hvlv-reconciliation/comments`, {
    method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(reasonComment),
  });
  assert.equal(savedReasonResponse.status, 200);
  assert.equal((await savedReasonResponse.json() as { comment: string }).comment, reasonComment.comment);
  const reasonQuery = new URLSearchParams({ payPeriodStart: reasonComment.payPeriodStart, payPeriodEnd: reasonComment.payPeriodEnd });
  const reasonsResponse = await fetch(`${baseUrl}/api/hvlv-reconciliation/comments?${reasonQuery}`);
  assert.equal(reasonsResponse.status, 200);
  assert.equal((await reasonsResponse.json() as { comment: string }[])[0].comment, reasonComment.comment);

  const environmentKeys = ['AZURE_OPENAI_ENDPOINT', 'AZURE_OPENAI_API_KEY', 'AZURE_OPENAI_DEPLOYMENT'] as const;
  const previousEnvironment = environmentKeys.map((key) => process.env[key]);
  const localFetch = fetch;
  for (const key of environmentKeys) delete process.env[key];
  try {
    const ideasResponse = await fetch(`${baseUrl}/api/hvlv-reconciliation/reason-ideas`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ payPeriodStart: '2026-10-26', payPeriodEnd: '2026-11-08', plannedHours: 80, submittedHours: 72, varianceHours: -8, status: 'submitted' }),
    });
    assert.equal(ideasResponse.status, 503);
  } finally {
    environmentKeys.forEach((key, index) => {
      const value = previousEnvironment[index];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    });
  }

  const previousFetch = globalThis.fetch;
  const outboundAiRequests: { url: string; apiKey: string | undefined; body: { messages: { content: string }[] } }[] = [];
  process.env.AZURE_OPENAI_ENDPOINT = 'https://test-resource.openai.azure.com';
  process.env.AZURE_OPENAI_API_KEY = 'test-key';
  process.env.AZURE_OPENAI_DEPLOYMENT = 'test-deployment';
  globalThis.fetch = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    outboundAiRequests.push({
      url: String(input),
      apiKey: new Headers(init?.headers).get('api-key') ?? undefined,
      body: JSON.parse(String(init?.body)) as { messages: { content: string }[] },
    });
    return new Response(JSON.stringify({ choices: [{ message: { content: '1. Check whether additional approved work was added.\n2. Was the MME plan updated after work moved earlier?' } }] }), {
      headers: { 'content-type': 'application/json' },
    });
  };
  try {
    const ideasResponse = await localFetch(`${baseUrl}/api/hvlv-reconciliation/reason-ideas`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ payPeriodStart: '2026-10-26', payPeriodEnd: '2026-11-08', plannedHours: 80, submittedHours: 72, varianceHours: -8, status: 'submitted' }),
    });
    assert.equal(ideasResponse.status, 200);
    assert.deepEqual((await ideasResponse.json() as { ideas: string[] }).ideas, [
      'Check whether additional approved work was added.',
      'Was the MME plan updated after work moved earlier?',
    ]);
    assert.equal(outboundAiRequests[0].url, 'https://test-resource.openai.azure.com/openai/deployments/test-deployment/chat/completions?api-version=2024-10-21');
    assert.equal(outboundAiRequests[0].apiKey, 'test-key');
    const aiInput = JSON.parse(outboundAiRequests[0].body.messages[1].content) as Record<string, unknown>;
    assert.deepEqual(Object.keys(aiInput).sort(), ['payPeriodEnd', 'payPeriodStart', 'plannedHours', 'status', 'submittedHours', 'varianceHours']);
    assert.equal(JSON.stringify(aiInput).includes('E001'), false);
    assert.equal(JSON.stringify(aiInput).includes('CC-100'), false);
  } finally {
    globalThis.fetch = previousFetch;
    environmentKeys.forEach((key, index) => {
      const value = previousEnvironment[index];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    });
  }

  const draft = {
    title: 'Verify API work item writes', category: 'action', stage: 'Mobilize', status: 'not-started',
    owner: '', dueDate: '', evidence: '', sourceTool: 'MME', sourceUrl: 'https://example.test/engagement/123', notes: '',
  };
  const createdResponse = await fetch(`${baseUrl}/api/work-items`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(draft),
  });
  assert.equal(createdResponse.status, 201);
  const created = await createdResponse.json() as { id: string; sourceTool: string; sourceUrl: string };
  assert.equal(created.sourceTool, 'MME');
  assert.equal(created.sourceUrl, draft.sourceUrl);

  const updatedResponse = await fetch(`${baseUrl}/api/work-items/${created.id}`, {
    method: 'PUT', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...draft, status: 'complete', sourceUrl: 'https://example.test/engagement/456' }),
  });
  assert.equal(updatedResponse.status, 200);
  const updated = await updatedResponse.json() as { status: string; sourceUrl: string };
  assert.equal(updated.status, 'complete');
  assert.equal(updated.sourceUrl, 'https://example.test/engagement/456');

  const emptyEngagements = {
    clientProjectName: 'Smoke-test workspace',
    aep: { name: '', identifier: '', url: '', verificationStatus: 'not-verified', verifiedBy: '', verifiedOn: '', evidence: '', accessNotes: '', followUpOwner: '', followUpDueDate: '', followUpStatus: 'not-started' },
    bizapps: { name: '', identifier: '', url: '', verificationStatus: 'not-verified', verifiedBy: '', verifiedOn: '', evidence: '', accessNotes: '', followUpOwner: '', followUpDueDate: '', followUpStatus: 'not-started' },
    matchStatus: 'not-checked', matchNotes: '', matchOwner: '', matchDueDate: '', matchFollowUpStatus: 'not-started',
  };
  const engagementsResponse = await fetch(`${baseUrl}/api/engagements`, {
    method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(emptyEngagements),
  });
  assert.equal(engagementsResponse.status, 200);

  const projectNameResponse = await fetch(`${baseUrl}/api/project-name`, {
    method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'API smoke test' }),
  });
  assert.equal(projectNameResponse.status, 200);
  assert.equal(await projectNameResponse.json(), 'API smoke test');

  const preferencesResponse = await fetch(`${baseUrl}/api/preferences`);
  assert.equal(preferencesResponse.status, 200);
  assert.deepEqual(await preferencesResponse.json(), { theme: 'system' });
  const savedPreferencesResponse = await fetch(`${baseUrl}/api/preferences`, {
    method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ theme: 'dark' }),
  });
  assert.equal(savedPreferencesResponse.status, 200);
  assert.deepEqual(await savedPreferencesResponse.json(), { theme: 'dark' });

  const missingResponse = await fetch(`${baseUrl}/api/work-items/missing`, {
    method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(draft),
  });
  assert.equal(missingResponse.status, 404);

  console.log('API smoke test passed: health, workbench, HVLV comments and AI configuration, work items, engagements, project name, and preferences.');
} finally {
  server.close();
  await closeDatabase(database);
}