import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api';
import type { EngagementWorkspace, PortfolioProjectDraft, PortfolioProjectSnapshot, WorkItemDraft } from '../api/types';

const actionDraft: WorkItemDraft = {
  title: 'Confirm delivery approach',
  category: 'decision',
  stage: 'Mobilize',
  status: 'not-started',
  owner: 'Delivery lead',
  dueDate: '2026-11-10',
  evidence: 'Decision log',
  sourceTool: '',
  sourceUrl: '',
  notes: '',
};

describe('live workbench API workflows', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response('{}', { headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends work item create and update operations to the API', async () => {
    const created = await api.createWorkItem(actionDraft);
    await api.updateWorkItem('work item/1', { ...actionDraft, title: 'Confirm environment responsibilities', status: 'complete' });

    expect(created).toEqual({});
    expect(fetchMock.mock.calls[0][0]).toBe('/api/work-items');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST', body: JSON.stringify(actionDraft) });
    expect(fetchMock.mock.calls[1][0]).toBe('/api/work-items/work%20item%2F1');
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'PUT' });
  });

  it('deletes a local follow-up through the workbench API', async () => {
    await api.deleteWorkItem('local follow-up/1');

    expect(fetchMock.mock.calls[0][0]).toBe('/api/work-items/local%20follow-up%2F1');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'DELETE' });
  });

  it('creates and updates per-project source links through the portfolio API', async () => {
    const projectDraft: PortfolioProjectDraft = {
      projectName: 'Sample project',
      clientName: 'Sample client',
      sourceLinks: {
        mme: { url: 'https://example.test/mme/project', externalId: 'MME-1' },
        dna: { url: 'https://example.test/ado/project', externalId: 'ADO-1' },
        aep: { url: '', externalId: '' },
        sharepoint: { url: '', externalId: '' },
        myWizzard: { url: '', externalId: '' },
        hvlv: { url: '', externalId: '' },
      },
    };
    const projectResult: PortfolioProjectSnapshot = {
      ...projectDraft,
      projectId: 'project/1',
      updatedAt: '2026-11-11T12:00:00Z',
      financialGovernance: { asOf: null, mme: null, azureDevOps: null, hvlvReconciliation: null },
    };
    const jsonHeaders = { headers: { 'content-type': 'application/json' } };
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify(projectResult), jsonHeaders))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...projectResult, projectName: 'Updated project' }), jsonHeaders));

    await api.createPortfolioProject(projectDraft);
    await api.updatePortfolioProject(projectResult.projectId, { ...projectDraft, projectName: 'Updated project' });

    expect(fetchMock.mock.calls[0][0]).toBe('/api/portfolio/projects');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST', body: JSON.stringify(projectDraft) });
    expect(fetchMock.mock.calls[1][0]).toBe('/api/portfolio/projects/project%2F1');
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'PUT' });
  });

  it('scopes engagement checks and reason comments to a portfolio project', async () => {
    const emptyRecord = {
      name: '', identifier: '', url: '', verificationStatus: 'not-verified' as const, verifiedBy: '', verifiedOn: '',
      evidence: '', accessNotes: '', followUpOwner: '', followUpDueDate: '', followUpStatus: 'not-started' as const,
    };
    const engagements: EngagementWorkspace = {
      clientProjectName: 'Sample project',
      aep: { ...emptyRecord, name: 'AEP sample' },
      bizapps: emptyRecord,
      matchStatus: 'not-checked',
      matchNotes: '',
      matchOwner: '',
      matchDueDate: '',
      matchFollowUpStatus: 'not-started',
    };
    const reasonComment = {
      projectId: 'portfolio/1',
      payPeriodStart: '2026-10-26',
      payPeriodEnd: '2026-11-08',
      enterpriseId: 'E001',
      costCollectorId: 'CC-100',
      comment: 'Verified additional approved work.',
      updatedAt: '2026-11-09T12:00:00Z',
    };
    const jsonHeaders = { headers: { 'content-type': 'application/json' } };
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify(engagements), jsonHeaders))
      .mockResolvedValueOnce(new Response(JSON.stringify(engagements), jsonHeaders))
      .mockResolvedValueOnce(new Response(JSON.stringify([reasonComment]), jsonHeaders))
      .mockResolvedValueOnce(new Response(JSON.stringify(reasonComment), jsonHeaders));

    await api.getPortfolioProjectEngagements('portfolio/1');
    await api.savePortfolioProjectEngagements('portfolio/1', engagements);
    await api.getHvlvReconciliationComments('portfolio/1', reasonComment.payPeriodStart, reasonComment.payPeriodEnd);
    await api.saveHvlvReconciliationComment(reasonComment);

    expect(fetchMock.mock.calls.map(([url, init]) => [url, init?.method ?? 'GET'])).toEqual([
      ['/api/portfolio/projects/portfolio%2F1/engagements', 'GET'],
      ['/api/portfolio/projects/portfolio%2F1/engagements', 'PUT'],
      ['/api/hvlv-reconciliation/comments?projectId=portfolio%2F1&payPeriodStart=2026-10-26&payPeriodEnd=2026-11-08', 'GET'],
      ['/api/hvlv-reconciliation/comments', 'PUT'],
    ]);
    expect(fetchMock.mock.calls[3][1]?.body).toContain('"projectId":"portfolio/1"');
  });

  it('loads and saves workbench, engagements, project name, and preferences over HTTP', async () => {
    const engagementRecord = {
      name: '', identifier: '', url: '', verificationStatus: 'not-verified' as const, verifiedBy: '', verifiedOn: '',
      evidence: '', accessNotes: '', followUpOwner: '', followUpDueDate: '', followUpStatus: 'not-started' as const,
    };
    const engagements: EngagementWorkspace = {
      clientProjectName: '',
      aep: engagementRecord,
      bizapps: engagementRecord,
      matchStatus: 'not-checked',
      matchNotes: '',
      matchOwner: '',
      matchDueDate: '',
      matchFollowUpStatus: 'not-started',
    };

    await api.getWorkbench();
    await api.getPreferences();
    await api.saveEngagements({
      ...engagements,
      clientProjectName: 'Local workspace',
      aep: { ...engagementRecord, identifier: 'AEP-001' },
      matchStatus: 'matched',
    });
    await api.saveProjectName('Local workspace');
    await api.savePreferences({ theme: 'dark' });

    expect(fetchMock.mock.calls.map(([url, init]) => [url, init?.method ?? 'GET'])).toEqual([
      ['/api/workbench', 'GET'],
      ['/api/preferences', 'GET'],
      ['/api/engagements', 'PUT'],
      ['/api/project-name', 'PUT'],
      ['/api/preferences', 'PUT'],
    ]);
  });

  it('surfaces structured API errors to the caller', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Unavailable' }), {
      status: 503,
      headers: { 'content-type': 'application/json' },
    }));
    await expect(api.getWorkbench()).rejects.toThrow('Unavailable');
  });
});