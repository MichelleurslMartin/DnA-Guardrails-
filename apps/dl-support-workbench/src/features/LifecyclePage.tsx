import { useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Tab,
  TabList,
  Title2,
} from '@fluentui/react-components';
import { AddRegular, CheckmarkCircleRegular, ClipboardTaskRegular } from '../components/icons';
import { useWorkbench } from '../app/WorkbenchContext';
import { LIFECYCLE_STAGES, type LifecycleStage, type WorkItem, type WorkItemDraft, type WorkItemStatus } from '../api/types';
import { DataState } from '../components/States';
import { WorkItemForm } from '../components/WorkItemForm';
import { WorkItemTable } from '../components/WorkItemTable';

const mobilizeActions = [
  {
    title: 'Review contract and statement of work',
    description: 'Check assumptions, scope, deliverables, acceptance terms, and constraints.',
    evidence: 'Contract and assumption review',
    sourceTool: '',
  },
  {
    title: 'Confirm team roles, governance, and escalation routes',
    description: 'Identify the sponsor, client and delivery leads, decision owners, and team responsibilities.',
    evidence: 'Team and governance map',
    sourceTool: '',
  },
  {
    title: 'Verify AEP and BizApps Platform DnA engagement records',
    description: 'Match both records to the approved project; assign missing, inaccessible, or mismatched records for follow-up.',
    evidence: 'Verified engagement links or IDs',
    sourceTool: 'AEP / BizApps Platform',
  },
  {
    title: 'Align delivery approach, environments, tools, and access',
    description: 'Confirm the implementation model, working environments, tools, and required access.',
    evidence: 'Access and environment actions',
    sourceTool: '',
  },
  {
    title: 'Establish initial plan, milestones, and financial baseline',
    description: 'Set the initial plan, budget and forecast, delivery cadence, and reporting approach.',
    evidence: 'Initial plan and financial baseline',
    sourceTool: 'MME',
  },
  {
    title: 'Start RAID, decision, and change logs',
    description: 'Create the initial risk, assumption, issue, dependency, decision, and change records.',
    evidence: 'RAID, decision, and change logs',
    sourceTool: '',
  },
  {
    title: 'Identify onboarding, security, privacy, quality, and compliance activities',
    description: 'Determine which project controls apply and record owners for the required work.',
    evidence: 'Applicable control activities and owners',
    sourceTool: '',
  },
] as const;

export function LifecyclePage() {
  const { data, state, error, reload, createWorkItem, updateWorkItem } = useWorkbench();
  const [selectedStage, setSelectedStage] = useState<LifecycleStage>('Mobilize');
  const [adding, setAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<WorkItem | null>(null);
  const [addingSuggestion, setAddingSuggestion] = useState<string | null>(null);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const stageItems = data.items.filter((item) => item.stage === selectedStage);
  const completed = stageItems.filter((item) => item.status === 'complete').length;
  const nextItem = stageItems.find((item) => item.status !== 'complete');
  const availableMobilizeActions = selectedStage === 'Mobilize'
    ? mobilizeActions.filter((action) => !stageItems.some((item) => item.title.toLowerCase() === action.title.toLowerCase()))
    : [];

  async function updateStatus(item: WorkItem, status: WorkItemStatus): Promise<void> {
    await updateWorkItem(item.id, { ...item, status });
  }

  async function saveItem(draft: WorkItemDraft): Promise<void> {
    if (editingItem) {
      await updateWorkItem(editingItem.id, draft);
      setEditingItem(null);
    } else {
      await createWorkItem({ ...draft, category: 'checklist', stage: selectedStage });
    }
    setAdding(false);
  }

  async function addMobilizeAction(action: (typeof mobilizeActions)[number]): Promise<void> {
    setAddingSuggestion(action.title);
    setSuggestionError(null);
    try {
      await createWorkItem({
        title: action.title,
        category: 'checklist',
        stage: 'Mobilize',
        status: 'not-started',
        owner: '',
        dueDate: '',
        evidence: action.evidence,
        sourceTool: action.sourceTool,
        sourceUrl: '',
        notes: action.description,
      });
    } catch (cause) {
      setSuggestionError(cause instanceof Error ? cause.message : 'The suggested action could not be added.');
    } finally {
      setAddingSuggestion(null);
    }
  }

  return (
    <div className="page-stack">
      <section className="page-intro">
        <div className="page-title-row"><ClipboardTaskRegular aria-hidden="true" /><Title2 as="h1">Lifecycle Playbook</Title2></div>
        <p>Browse delivery stages and track the action, owner, due date, and evidence needed to assess readiness.</p>
        <span className="quiet-label">Manual guidance · no platform connection</span>
      </section>

      <section className="metric-grid lifecycle-metrics" aria-label="Lifecycle progress">
        <Card className="metric-card" appearance="outline"><span className="metric-label">Current stage</span><strong className="metric-value metric-value-text">{selectedStage}</strong><span className="metric-note">Stage {LIFECYCLE_STAGES.indexOf(selectedStage) + 1} of 6</span></Card>
        <Card className="metric-card" appearance="outline"><span className="metric-label">Stage actions</span><strong className="metric-value metric-value-text">{completed} of {stageItems.length} complete</strong><span className="metric-note">Status is stored by the workbench service</span></Card>
        <Card className="metric-card" appearance="outline"><span className="metric-label">Next step</span><strong className="metric-value metric-value-text">{nextItem?.title ?? 'No open item'}</strong><span className="metric-note">{nextItem?.evidence || 'Add evidence as work progresses'}</span></Card>
      </section>

      <section className="section-block">
        <div className="section-heading"><h2><CheckmarkCircleRegular aria-hidden="true" /> Delivery stages</h2><span>Select a stage to review its checklist</span></div>
        <TabList className="stage-tabs" selectedValue={selectedStage} onTabSelect={(_, tab) => setSelectedStage(tab.value as LifecycleStage)} aria-label="Delivery lifecycle stages">
          {LIFECYCLE_STAGES.map((stage) => <Tab key={stage} value={stage}>{stage}</Tab>)}
        </TabList>
      </section>

      {availableMobilizeActions.length > 0 && (
        <section className="section-block" aria-label="Typical Mobilize actions">
          <div className="section-heading">
            <h2><ClipboardTaskRegular aria-hidden="true" /> Typical Mobilize actions</h2>
            <span>Based on the Delivery Lead Project Journey; tailor to the contract and approved methodology.</span>
          </div>
          <ul className="recommended-actions">
            {availableMobilizeActions.map((action) => (
              <li key={action.title}>
                <div>
                  <strong>{action.title}</strong>
                  <p>{action.description}</p>
                  <span>Evidence: {action.evidence}</span>
                  <span>Source tool: {action.sourceTool || 'Add when applicable'}</span>
                </div>
                <Button
                  appearance="subtle"
                  size="small"
                  icon={<AddRegular />}
                  disabled={addingSuggestion !== null}
                  onClick={() => void addMobilizeAction(action)}
                >
                  {addingSuggestion === action.title ? 'Adding' : 'Add'}
                </Button>
              </li>
            ))}
          </ul>
          {suggestionError && <p className="form-error" role="alert">{suggestionError}</p>}
        </section>
      )}

      <section className="section-block">
        <div className="section-heading">
          <h2><ClipboardTaskRegular aria-hidden="true" /> {selectedStage} actions</h2>
          <Badge appearance="tint" color={completed === stageItems.length && stageItems.length ? 'success' : 'subtle'}>{completed} / {stageItems.length} complete</Badge>
        </div>
        <DataState
          state={state}
          error={error}
          onRetry={() => void reload()}
          isEmpty={!stageItems.length}
          emptyTitle={`No checklist items for ${selectedStage}`}
          emptyText="Add a local checklist item for this stage. No client or engagement is prefilled."
          emptyAction={{ label: 'Add lifecycle action', onClick: () => setAdding(true) }}
        >
          <WorkItemTable items={stageItems} onEdit={(item) => { setEditingItem(item); setAdding(true); }} onStatusChange={(item, status) => void updateStatus(item, status)} />
        </DataState>
      </section>

      {adding && (
        <Card className="form-panel" appearance="outline">
          <div className="section-heading"><h2>{editingItem ? 'Edit lifecycle action' : 'Add lifecycle action'}</h2><Button appearance="subtle" onClick={() => { setAdding(false); setEditingItem(null); }}>Cancel</Button></div>
          <WorkItemForm
            key={editingItem?.id ?? selectedStage}
            onSave={saveItem}
            submitLabel={editingItem ? 'Save changes' : 'Create lifecycle action'}
            initialValue={editingItem ?? { title: '', category: 'checklist', stage: selectedStage, status: 'not-started', owner: '', dueDate: '', evidence: '', sourceTool: '', sourceUrl: '', notes: '' }}
          />
        </Card>
      )}

      <div className="action-bar">
        <span>Owners, dates, evidence, and checklist state clear when this page is refreshed.</span>
        <Button appearance="primary" icon={<AddRegular />} onClick={() => setAdding(true)}>Add lifecycle action</Button>
      </div>
    </div>
  );
}