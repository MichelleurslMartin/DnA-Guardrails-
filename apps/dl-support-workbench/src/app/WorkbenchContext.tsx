import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../api';
import type {
  EngagementWorkspace,
  WorkbenchData,
  WorkbenchLoadState,
  WorkbenchPreferences,
  WorkItem,
  WorkItemDraft,
} from '../api/types';

interface WorkbenchContextValue {
  data: WorkbenchData;
  preferences: WorkbenchPreferences;
  state: WorkbenchLoadState;
  error: string | null;
  reload: () => Promise<void>;
  createWorkItem: (input: WorkItemDraft) => Promise<WorkItem>;
  updateWorkItem: (id: string, input: WorkItemDraft) => Promise<WorkItem>;
  saveEngagements: (input: EngagementWorkspace) => Promise<void>;
  saveProjectName: (name: string) => Promise<void>;
  savePreferences: (input: WorkbenchPreferences) => Promise<void>;
}

const blankData: WorkbenchData = {
  projectName: '',
  engagements: {
    clientProjectName: '',
    aep: { name: '', identifier: '', url: '', verificationStatus: 'not-verified', verifiedBy: '', verifiedOn: '', evidence: '', accessNotes: '', followUpOwner: '', followUpDueDate: '', followUpStatus: 'not-started' },
    bizapps: { name: '', identifier: '', url: '', verificationStatus: 'not-verified', verifiedBy: '', verifiedOn: '', evidence: '', accessNotes: '', followUpOwner: '', followUpDueDate: '', followUpStatus: 'not-started' },
    matchStatus: 'not-checked',
    matchNotes: '',
    matchOwner: '',
    matchDueDate: '',
    matchFollowUpStatus: 'not-started',
  },
  items: [],
  financialGovernance: { asOf: null, mme: null, azureDevOps: null, hvlvReconciliation: null },
};

const WorkbenchContext = createContext<WorkbenchContextValue | null>(null);

export function WorkbenchProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<WorkbenchData>(blankData);
  const [preferences, setPreferences] = useState<WorkbenchPreferences>({ theme: 'system' });
  const [state, setState] = useState<WorkbenchLoadState>('loading');
  const [error, setError] = useState<string | null>(null);

  async function reload(): Promise<void> {
    setState('loading');
    setError(null);
    try {
      const [nextData, nextPreferences] = await Promise.all([api.getWorkbench(), api.getPreferences()]);
      setData(nextData);
      setPreferences(nextPreferences);
      setState('ready');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The workbench API could not be reached.');
      setState('error');
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function createWorkItem(input: WorkItemDraft): Promise<WorkItem> {
    const item = await api.createWorkItem(input);
    setData((current) => ({ ...current, items: [item, ...current.items] }));
    return item;
  }

  async function updateWorkItem(id: string, input: WorkItemDraft): Promise<WorkItem> {
    const item = await api.updateWorkItem(id, input);
    setData((current) => ({ ...current, items: current.items.map((existing) => (existing.id === id ? item : existing)) }));
    return item;
  }

  async function saveEngagements(input: EngagementWorkspace): Promise<void> {
    const engagements = await api.saveEngagements(input);
    setData((current) => ({ ...current, projectName: engagements.clientProjectName, engagements }));
  }

  async function saveProjectName(name: string): Promise<void> {
    const projectName = await api.saveProjectName(name);
    setData((current) => ({
      ...current,
      projectName,
      engagements: { ...current.engagements, clientProjectName: projectName },
    }));
  }

  async function savePreferences(input: WorkbenchPreferences): Promise<void> {
    try {
      setPreferences(await api.savePreferences(input));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The preference could not be updated.');
    }
  }

  return (
    <WorkbenchContext.Provider value={{
      data,
      preferences,
      state,
      error,
      reload,
      createWorkItem,
      updateWorkItem,
      saveEngagements,
      saveProjectName,
      savePreferences,
    }}>
      {children}
    </WorkbenchContext.Provider>
  );
}

export function useWorkbench(): WorkbenchContextValue {
  const value = useContext(WorkbenchContext);
  if (!value) throw new Error('useWorkbench must be used within WorkbenchProvider.');
  return value;
}