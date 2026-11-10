import { useState } from 'react';
import {
  Button,
  Card,
  Dialog,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Tab,
  TabList,
  Title2,
} from '@fluentui/react-components';
import { AddRegular, EditRegular } from '../components/icons';
import { useWorkbench } from '../app/WorkbenchContext';
import type { WorkItem, WorkItemCategory, WorkItemDraft, WorkItemStatus } from '../api/types';
import { DataState } from '../components/States';
import { WorkItemForm, emptyWorkItemDraft } from '../components/WorkItemForm';
import { WorkItemTable } from '../components/WorkItemTable';

const categories: { value: WorkItemCategory; label: string }[] = [
  { value: 'action', label: 'Actions' },
  { value: 'raid', label: 'RAID' },
  { value: 'decision', label: 'Decisions' },
  { value: 'change', label: 'Change requests' },
];

export function ActionsPage() {
  const { data, state, error, reload, createWorkItem, updateWorkItem } = useWorkbench();
  const [category, setCategory] = useState<WorkItemCategory>('action');
  const [editing, setEditing] = useState<WorkItem | null>(null);
  const items = data.items.filter((item) => item.category === category);

  async function updateStatus(item: WorkItem, status: WorkItemStatus): Promise<void> {
    await updateWorkItem(item.id, { ...item, status });
  }

  async function saveEdit(draft: WorkItemDraft): Promise<void> {
    if (!editing) return;
    await updateWorkItem(editing.id, draft);
    setEditing(null);
  }

  return (
    <div className="page-stack">
      <section className="page-intro">
        <div className="page-title-row"><EditRegular aria-hidden="true" /><Title2 as="h1">Actions &amp; Decisions</Title2></div>
        <p>Maintain local actions, RAID items, decisions, and change requests with clear ownership, dates, status, and evidence.</p>
        <span className="quiet-label">Manual tracking · saved to the workbench database</span>
      </section>

      <Card className="form-panel" appearance="outline">
        <div className="section-heading"><h2>Create a work item</h2><span>Saved by the workbench service</span></div>
        <WorkItemForm key={category} initialValue={emptyWorkItemDraft(category)} onSave={async (draft) => { await createWorkItem(draft); }} submitLabel="Create work item" />
      </Card>

      <section className="section-block">
        <div className="section-heading"><h2>Work records</h2><Button appearance="subtle" icon={<AddRegular />} onClick={() => document.getElementById('work-item-title')?.focus()}>New item</Button></div>
        <TabList selectedValue={category} onTabSelect={(_, tab) => setCategory(tab.value as WorkItemCategory)} aria-label="Work item categories">
          {categories.map((item) => <Tab key={item.value} value={item.value}>{item.label}</Tab>)}
        </TabList>
        <DataState
          state={state}
          error={error}
          onRetry={() => void reload()}
          isEmpty={!items.length}
          emptyTitle={`No ${categories.find((item) => item.value === category)?.label.toLowerCase()} recorded`}
          emptyText="Create a work item above. No client or engagement data is prefilled."
        >
          <WorkItemTable items={items} onEdit={setEditing} onStatusChange={(item, status) => void updateStatus(item, status)} />
        </DataState>
      </section>

      <Dialog open={editing !== null} onOpenChange={(_, dialog) => { if (!dialog.open) setEditing(null); }}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Edit work item</DialogTitle>
            <DialogContent>
              {editing && <WorkItemForm key={editing.id} initialValue={editing} onSave={saveEdit} submitLabel="Save changes" />}
            </DialogContent>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}