import type { ApiClient, EngagementWorkspace, HvlvReasonComment, HvlvReasonCommentInput, HvlvReasonIdeaRequest, WorkbenchData, WorkbenchPreferences, WorkItem, WorkItemDraft } from './types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '');

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...init.headers },
  });
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok) {
    const message = typeof payload === 'object' && payload !== null && 'error' in payload && typeof payload.error === 'string'
      ? payload.error
      : `The workbench API returned ${response.status}.`;
    throw new Error(message);
  }
  return payload as T;
}

function jsonBody(value: unknown): string {
  return JSON.stringify(value);
}

export const liveClient: ApiClient = {
  getWorkbench: () => request<WorkbenchData>('/workbench'),
  createWorkItem: (input: WorkItemDraft) => request<WorkItem>('/work-items', { method: 'POST', body: jsonBody(input) }),
  updateWorkItem: (id: string, updates: WorkItemDraft) => request<WorkItem>(`/work-items/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: jsonBody(updates),
  }),
  saveEngagements: (input: EngagementWorkspace) => request<EngagementWorkspace>('/engagements', {
    method: 'PUT',
    body: jsonBody(input),
  }),
  saveProjectName: (name: string) => request<string>('/project-name', { method: 'PUT', body: jsonBody({ name }) }),
  getPreferences: () => request<WorkbenchPreferences>('/preferences'),
  savePreferences: (input: WorkbenchPreferences) => request<WorkbenchPreferences>('/preferences', {
    method: 'PUT',
    body: jsonBody(input),
  }),
  getHvlvReconciliationComments: (payPeriodStart: string, payPeriodEnd: string) => request<HvlvReasonComment[]>(
    `/hvlv-reconciliation/comments?payPeriodStart=${encodeURIComponent(payPeriodStart)}&payPeriodEnd=${encodeURIComponent(payPeriodEnd)}`,
  ),
  saveHvlvReconciliationComment: (input: HvlvReasonCommentInput) => request<HvlvReasonComment>('/hvlv-reconciliation/comments', {
    method: 'PUT',
    body: jsonBody(input),
  }),
  getHvlvReasonIdeas: (input: HvlvReasonIdeaRequest) => request<{ ideas: string[] }>('/hvlv-reconciliation/reason-ideas', {
    method: 'POST',
    body: jsonBody(input),
  }).then((result) => result.ideas),
};