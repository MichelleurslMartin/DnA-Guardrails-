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
import { LIFECYCLE_GUIDANCE } from './lifecycleGuidance';

export function LifecyclePage() {
  const { data, state, error, reload, createWorkItem, updateWorkItem, deleteWorkItem } = useWorkbench();
  const [selectedStage, setSelectedStage] = useState<LifecycleStage>('Mobilize');
  const [adding, setAdding] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const stageItems = data.items.filter((item) => item.stage === selectedStage);
  const guidanceItems = LIFECYCLE_GUIDANCE[selectedStage];

  async function updateStatus(item: WorkItem, status: WorkItemStatus): Promise<void> {
    await updateWorkItem(item.id, { ...item, status });
  }

  async function addItem(draft: WorkItemDraft): Promise<void> {
    await createWorkItem({ ...draft, category: 'action', stage: selectedStage });
    setAdding(false);
  }

  async function deleteLocalFollowUp(item: WorkItem): Promise<void> {
    setDeleteError(null);
    try {
      await deleteWorkItem(item.id);
    } catch (cause) {
      setDeleteError(cause instanceof Error ? cause.message : 'The local follow-up could not be deleted.');
    }
  }

  return (
    <div className="page-stack">
      <section className="page-intro">
        <div className="page-title-row"><ClipboardTaskRegular aria-hidden="true" /><Title2 as="h1">Lifecycle Playbook</Title2></div>
        <p>Browse delivery stages and track the action, owner, due date, and evidence needed to assess readiness.</p>
        <span className="quiet-label">Manual guidance · no platform connection</span>
      </section>

      <section className="metric-grid lifecycle-metrics" aria-label="Lifecycle guidance">
        <Card className="metric-card" appearance="outline"><span className="metric-label">Current stage</span><strong className="metric-value metric-value-text">{selectedStage}</strong><span className="metric-note">Stage {LIFECYCLE_STAGES.indexOf(selectedStage) + 1} of 6</span></Card>
        <Card className="metric-card" appearance="outline"><span className="metric-label">Guidance topics</span><strong className="metric-value metric-value-text">{guidanceItems.length}</strong><span className="metric-note">How-to and pitfalls; no phase completion is recorded here</span></Card>
        <Card className="metric-card" appearance="outline"><span className="metric-label">Next topic</span><strong className="metric-value metric-value-text">{guidanceItems[0]?.title ?? 'No guidance available'}</strong><span className="metric-note">Expand a topic for practical guidance</span></Card>
      </section>

      <section className="section-block">
        <div className="section-heading"><h2><CheckmarkCircleRegular aria-hidden="true" /> Delivery stages</h2><span>Select a stage to review its checklist</span></div>
        <TabList className="stage-tabs" selectedValue={selectedStage} onTabSelect={(_, tab) => setSelectedStage(tab.value as LifecycleStage)} aria-label="Delivery lifecycle stages">
          {LIFECYCLE_STAGES.map((stage) => <Tab key={stage} value={stage}>{stage}</Tab>)}
        </TabList>
      </section>

      <section className="section-block" aria-label={`${selectedStage} guidance`}>
          <div className="section-heading">
            <h2><ClipboardTaskRegular aria-hidden="true" /> Guidance for {selectedStage}</h2>
            <span>Guidance only · confirm task completion in Azure DevOps</span>
          </div>
          <p className="stakeholder-guidance-intro">Use these topics to guide the DL’s work. They are not work items or completion gates; record completion in the task system and source of record.</p>
          <ul className="lifecycle-guidance-list">
            {guidanceItems.map((item) => (
              <li key={item.id}>
                <details id={`guidance-${item.id}`} className="lifecycle-guidance-item">
                  <summary>
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.sourceTool ? `Source: ${item.sourceTool}` : 'Source: project-specific plan or approved method'}</small>
                      <small>Documents to consult or review: {item.documents}</small>
                    </span>
                    <span className="guidance-disclosure-label">How to and pitfalls</span>
                  </summary>
                  <div className="guidance-detail-grid">
                    <div><h3>How to approach</h3><p>{item.howTo}</p></div>
                    <div><h3>Pitfalls to watch</h3><p>{item.watchFor}</p></div>
                  </div>
                </details>
              </li>
            ))}
          </ul>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <h2><ClipboardTaskRegular aria-hidden="true" /> Optional local follow-ups</h2>
          <Badge appearance="tint" color="subtle">Not a task completion record</Badge>
        </div>
        <p className="disclaimer-line">Use this area for extra local notes only. Official task status and completion evidence belong in Azure DevOps or the project's source tool.</p>
        {deleteError && <p className="form-error" role="alert">{deleteError}</p>}
        <DataState
          state={state}
          error={error}
          onRetry={() => void reload()}
          isEmpty={!stageItems.length}
          emptyTitle={`No local follow-ups for ${selectedStage}`}
          emptyText="Guidance topics above are not saved as actions. Add an optional local follow-up only when useful."
          emptyAction={{ label: 'Add local follow-up', onClick: () => setAdding(true) }}
        >
          <WorkItemTable items={stageItems} onEdit={() => setAdding(true)} onStatusChange={(item, status) => void updateStatus(item, status)} onDelete={(item) => void deleteLocalFollowUp(item)} />
        </DataState>
      </section>

      {adding && (
        <Card className="form-panel" appearance="outline">
          <div className="section-heading"><h2>Add local follow-up</h2><Button appearance="subtle" onClick={() => setAdding(false)}>Cancel</Button></div>
          <WorkItemForm key={selectedStage} onSave={addItem} submitLabel="Create local follow-up" initialValue={{ title: '', category: 'action', stage: selectedStage, status: 'not-started', owner: '', dueDate: '', evidence: '', sourceTool: '', sourceUrl: '', notes: '' }} />
        </Card>
      )}

      <div className="action-bar">
        <span>Guidance does not track completion. Confirm phase work in Azure DevOps or the system of record.</span>
        <Button appearance="primary" icon={<AddRegular />} onClick={() => setAdding(true)}>Add local follow-up</Button>
      </div>
    </div>
  );
}