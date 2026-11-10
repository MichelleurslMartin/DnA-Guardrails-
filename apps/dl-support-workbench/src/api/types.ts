export const LIFECYCLE_STAGES = [
  'Mobilize',
  'Plan and Analyze',
  'Execute Delivery',
  'Prepare for Phase Transition',
  'Recover/Escalate',
  'Close/Handover',
] as const;

export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];
export type WorkItemCategory = 'checklist' | 'action' | 'raid' | 'decision' | 'change';
export type WorkItemStatus = 'not-started' | 'in-progress' | 'blocked' | 'complete';
export type VerificationStatus = 'not-verified' | 'verified' | 'mismatch' | 'access-needed';
export type FollowUpStatus = 'not-started' | 'in-progress' | 'waiting' | 'complete';
export type MatchStatus = 'not-checked' | 'matched' | 'mismatch' | 'access-needed' | 'follow-up';
export type ThemePreference = 'light' | 'dark' | 'system';
export type WorkbenchLoadState = 'loading' | 'ready' | 'error';

export interface WorkItemDraft {
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

export interface WorkItem extends WorkItemDraft {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface EngagementRecord {
  name: string;
  identifier: string;
  url: string;
  verificationStatus: VerificationStatus;
  verifiedBy: string;
  verifiedOn: string;
  evidence: string;
  accessNotes: string;
  followUpOwner: string;
  followUpDueDate: string;
  followUpStatus: FollowUpStatus;
}

export interface EngagementWorkspace {
  clientProjectName: string;
  aep: EngagementRecord;
  bizapps: EngagementRecord;
  matchStatus: MatchStatus;
  matchNotes: string;
  matchOwner: string;
  matchDueDate: string;
  matchFollowUpStatus: FollowUpStatus;
}

export interface PlannedHoursWeek {
  weekStart: string;
  plannedHours: number;
}

export interface MMEPlannedResourceHours {
  enterpriseId: string;
  resourceName: string;
  costCollectorId: string;
  plannedHours: number;
}

export interface HVLVSubmittedResourceHours {
  enterpriseId: string;
  resourceName: string;
  costCollectorId: string;
  submittedHours: number;
}

export interface AzureDevOpsPeriodPlan {
  projectUrl: string;
  lastSyncedAt: string;
  plannedHours: number;
}

export interface HvlvReconciliationSnapshot {
  payPeriodStart: string;
  payPeriodEnd: string;
  mmeEngagementUrl: string;
  mmeLastSyncedAt: string;
  hvlvSourceUrl: string;
  hvlvLastSyncedAt: string;
  mmeResourcePlan: MMEPlannedResourceHours[];
  hvlvSubmissions: HVLVSubmittedResourceHours[];
  azureDevOpsPlan: AzureDevOpsPeriodPlan | null;
}

export interface HvlvReasonCommentInput {
  payPeriodStart: string;
  payPeriodEnd: string;
  enterpriseId: string;
  costCollectorId: string;
  comment: string;
}

export interface HvlvReasonComment extends HvlvReasonCommentInput {
  updatedAt: string;
}

export type HvlvVarianceStatus = 'submitted' | 'awaiting' | 'unplanned';

export interface HvlvReasonIdeaRequest {
  payPeriodStart: string;
  payPeriodEnd: string;
  plannedHours: number;
  submittedHours: number | null;
  varianceHours: number | null;
  status: HvlvVarianceStatus;
}

export interface FinancialGovernanceSnapshot {
  asOf: string | null;
  mme: {
    engagementUrl: string;
    lastSyncedAt: string;
    weeklyPlan: PlannedHoursWeek[];
  } | null;
  azureDevOps: {
    projectUrl: string;
    lastSyncedAt: string;
    originalEstimateHours: number;
    completedWorkHours: number;
  } | null;
  hvlvReconciliation: HvlvReconciliationSnapshot | null;
}

export interface WorkbenchData {
  projectName: string;
  engagements: EngagementWorkspace;
  items: WorkItem[];
  financialGovernance: FinancialGovernanceSnapshot;
}

export interface WorkbenchPreferences {
  theme: ThemePreference;
}

export interface ApiClient {
  getWorkbench(): Promise<WorkbenchData>;
  createWorkItem(input: WorkItemDraft): Promise<WorkItem>;
  updateWorkItem(id: string, updates: WorkItemDraft): Promise<WorkItem>;
  saveEngagements(input: EngagementWorkspace): Promise<EngagementWorkspace>;
  saveProjectName(name: string): Promise<string>;
  getPreferences(): Promise<WorkbenchPreferences>;
  savePreferences(input: WorkbenchPreferences): Promise<WorkbenchPreferences>;
  getHvlvReconciliationComments(payPeriodStart: string, payPeriodEnd: string): Promise<HvlvReasonComment[]>;
  saveHvlvReconciliationComment(input: HvlvReasonCommentInput): Promise<HvlvReasonComment>;
  getHvlvReasonIdeas(input: HvlvReasonIdeaRequest): Promise<string[]>;
}