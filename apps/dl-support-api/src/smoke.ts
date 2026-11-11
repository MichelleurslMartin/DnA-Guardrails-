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
  const initialData = await initialResponse.json() as { items: unknown[]; projectName: string; financialGovernance: { asOf: string | null; mme: unknown; azureDevOps: unknown; hvlvReconciliation: unknown }; portfolio: { asOf: string | null; projects: unknown[] } };
  assert.deepEqual(initialData.items, []);
  assert.equal(initialData.projectName, '');
  assert.deepEqual(initialData.financialGovernance, { asOf: null, mme: null, azureDevOps: null, hvlvReconciliation: null });
  assert.deepEqual(initialData.portfolio, { asOf: null, projects: [] });

  const portfolioProject = {
    projectName: 'Portfolio smoke test',
    clientName: 'Sample client',
    sourceLinks: {
      mme: { url: 'https://example.test/mme/project-1', externalId: 'MME-001' },
      dna: { url: 'https://example.test/ado/project-1', externalId: 'ADO-001' },
      aep: { url: '', externalId: '' },
      sharepoint: { url: 'https://example.test/sharepoint/project-1', externalId: 'SITE-001' },
      myWizzard: { url: '', externalId: '' },
      hvlv: { url: 'https://example.test/hvlv/project-1', externalId: 'HVLV-001' },
    },
  };
  const createProjectResponse = await fetch(`${baseUrl}/api/portfolio/projects`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(portfolioProject),
  });
  assert.equal(createProjectResponse.status, 201);
  const createdProject = await createProjectResponse.json() as { projectId: string; sourceLinks: { dna: { externalId: string } } };
  assert.equal(createdProject.sourceLinks.dna.externalId, 'ADO-001');

  const listProjectsResponse = await fetch(`${baseUrl}/api/portfolio/projects`);
  assert.equal(listProjectsResponse.status, 200);
  assert.equal((await listProjectsResponse.json() as unknown[]).length, 1);

  const updatedPortfolioProject = { ...portfolioProject, projectName: 'Updated portfolio smoke test' };
  const updateProjectResponse = await fetch(`${baseUrl}/api/portfolio/projects/${createdProject.projectId}`, {
    method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(updatedPortfolioProject),
  });
  assert.equal(updateProjectResponse.status, 200);
  assert.equal((await updateProjectResponse.json() as { projectName: string }).projectName, updatedPortfolioProject.projectName);

  const unsafePortfolioProject = {
    ...portfolioProject,
    sourceLinks: { ...portfolioProject.sourceLinks, mme: { url: 'https://example.test/mme?access_token=secret', externalId: '' } },
  };
  const unsafeProjectResponse = await fetch(`${baseUrl}/api/portfolio/projects`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(unsafePortfolioProject),
  });
  assert.equal(unsafeProjectResponse.status, 400);

  const projectEngagementResponse = await fetch(`${baseUrl}/api/portfolio/projects/${createdProject.projectId}/engagements`);
  assert.equal(projectEngagementResponse.status, 200);
  const initialProjectEngagements = await projectEngagementResponse.json() as { clientProjectName: string; aep: { name: string } };
  assert.equal(initialProjectEngagements.clientProjectName, portfolioProject.clientName);
  assert.equal(initialProjectEngagements.aep.name, '');

  const projectEngagements = {
    clientProjectName: portfolioProject.projectName,
    aep: { name: 'Project-specific AEP record', identifier: 'AEP-001', url: '', verificationStatus: 'not-verified', verifiedBy: '', verifiedOn: '', evidence: '', accessNotes: '', followUpOwner: '', followUpDueDate: '', followUpStatus: 'not-started' },
    bizapps: { name: '', identifier: '', url: '', verificationStatus: 'not-verified', verifiedBy: '', verifiedOn: '', evidence: '', accessNotes: '', followUpOwner: '', followUpDueDate: '', followUpStatus: 'not-started' },
    matchStatus: 'not-checked', matchNotes: '', matchOwner: '', matchDueDate: '', matchFollowUpStatus: 'not-started',
  };
  const saveProjectEngagementsResponse = await fetch(`${baseUrl}/api/portfolio/projects/${createdProject.projectId}/engagements`, {
    method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(projectEngagements),
  });
  assert.equal(saveProjectEngagementsResponse.status, 200);
  const rereadProjectEngagementsResponse = await fetch(`${baseUrl}/api/portfolio/projects/${createdProject.projectId}/engagements`);
  assert.equal((await rereadProjectEngagementsResponse.json() as { aep: { name: string } }).aep.name, 'Project-specific AEP record');

  const secondPortfolioProject = { ...portfolioProject, projectName: 'Second isolated smoke project' };
  const secondProjectResponse = await fetch(`${baseUrl}/api/portfolio/projects`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(secondPortfolioProject),
  });
  assert.equal(secondProjectResponse.status, 201);
  const secondProject = await secondProjectResponse.json() as { projectId: string };

  const reasonComment = {
    projectId: createdProject.projectId,
    payPeriodStart: '2026-10-26', payPeriodEnd: '2026-11-08', enterpriseId: 'E001', costCollectorId: 'CC-100',
    comment: 'DL confirmed additional approved work; review change request and update MME plan.',
  };
  const savedReasonResponse = await fetch(`${baseUrl}/api/hvlv-reconciliation/comments`, {
    method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(reasonComment),
  });
  assert.equal(savedReasonResponse.status, 200);
  assert.equal((await savedReasonResponse.json() as { comment: string }).comment, reasonComment.comment);
  const reasonQuery = new URLSearchParams({ projectId: reasonComment.projectId, payPeriodStart: reasonComment.payPeriodStart, payPeriodEnd: reasonComment.payPeriodEnd });
  const reasonsResponse = await fetch(`${baseUrl}/api/hvlv-reconciliation/comments?${reasonQuery}`);
  assert.equal(reasonsResponse.status, 200);
  const projectReasons = await reasonsResponse.json() as { projectId: string; comment: string }[];
  assert.equal(projectReasons[0].projectId, createdProject.projectId);
  assert.equal(projectReasons[0].comment, reasonComment.comment);

  const secondProjectReasonQuery = new URLSearchParams({ projectId: secondProject.projectId, payPeriodStart: reasonComment.payPeriodStart, payPeriodEnd: reasonComment.payPeriodEnd });
  const secondProjectReasonsResponse = await fetch(`${baseUrl}/api/hvlv-reconciliation/comments?${secondProjectReasonQuery}`);
  assert.deepEqual(await secondProjectReasonsResponse.json(), []);

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

  const deletedResponse = await fetch(`${baseUrl}/api/work-items/${created.id}`, { method: 'DELETE' });
  assert.equal(deletedResponse.status, 200);
  assert.deepEqual(await deletedResponse.json(), { id: created.id });
  const afterDeleteResponse = await fetch(`${baseUrl}/api/workbench`);
  assert.deepEqual((await afterDeleteResponse.json() as { items: unknown[] }).items, []);

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