import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api';
import type { EngagementWorkspace, WorkItemDraft } from '../api/types';

const actionDraft: WorkItemDraft = {
  title: 'Confirm delivery approach',
  category: 'decision',
  stage: 'Mobilize',
  status: 'not-started',
  owner: 'Delivery lead',
  dueDate: '2026-11-10',
  evidence: 'Decision log',
  sourceTool: 'MME',
  sourceUrl: 'https://example.test/engagement/123',
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

  it('loads and saves DL reason comments and requests anonymous AI ideas', async () => {
    const comment = {
      payPeriodStart: '2026-10-26', payPeriodEnd: '2026-11-08', enterpriseId: 'E001', costCollectorId: 'CC-100',
      comment: 'Additional approved work; review the change request.', updatedAt: '2026-11-09T12:00:00Z',
    };
    const jsonHeaders = { headers: { 'content-type': 'application/json' } };
    fetchMock
      .mockResolvedValueOnce(new Response('[]', jsonHeaders))
      .mockResolvedValueOnce(new Response(JSON.stringify(comment), jsonHeaders))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ideas: ['Check for approved additional work.'] }), jsonHeaders));

    await api.getHvlvReconciliationComments(comment.payPeriodStart, comment.payPeriodEnd);
    await api.saveHvlvReconciliationComment(comment);
    await api.getHvlvReasonIdeas({
      payPeriodStart: comment.payPeriodStart,
      payPeriodEnd: comment.payPeriodEnd,
      plannedHours: 80,
      submittedHours: 72,
      varianceHours: -8,
      status: 'submitted',
    });

    expect(fetchMock.mock.calls.map(([url, init]) => [url, init?.method ?? 'GET'])).toEqual([
      ['/api/hvlv-reconciliation/comments?payPeriodStart=2026-10-26&payPeriodEnd=2026-11-08', 'GET'],
      ['/api/hvlv-reconciliation/comments', 'PUT'],
      ['/api/hvlv-reconciliation/reason-ideas', 'POST'],
    ]);
    expect(fetchMock.mock.calls[2][1]?.body).not.toContain('E001');
    expect(fetchMock.mock.calls[2][1]?.body).not.toContain('CC-100');
  });
});