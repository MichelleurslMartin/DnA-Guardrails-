import { useState, type FormEvent } from 'react';
import { Button, Field, Input, Select, Textarea } from '@fluentui/react-components';
import type { LifecycleStage, WorkItemCategory, WorkItemDraft, WorkItemStatus } from '../api/types';
import { LIFECYCLE_STAGES } from '../api/types';

export const emptyWorkItemDraft = (category: WorkItemCategory = 'action'): WorkItemDraft => ({
  title: '',
  category,
  stage: '',
  status: 'not-started',
  owner: '',
  dueDate: '',
  evidence: '',
  sourceTool: '',
  sourceUrl: '',
  notes: '',
});

interface WorkItemFormProps {
  initialValue?: WorkItemDraft;
  onSave: (draft: WorkItemDraft) => Promise<unknown>;
  submitLabel: string;
}

const categories: { value: WorkItemCategory; label: string }[] = [
  { value: 'checklist', label: 'Checklist' },
  { value: 'action', label: 'Action' },
  { value: 'raid', label: 'RAID item' },
  { value: 'decision', label: 'Decision' },
  { value: 'change', label: 'Change request' },
];

const statuses: { value: WorkItemStatus; label: string }[] = [
  { value: 'not-started', label: 'Not started' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'complete', label: 'Complete' },
];

export function WorkItemForm({ initialValue, onSave, submitLabel }: WorkItemFormProps) {
  const [draft, setDraft] = useState<WorkItemDraft>(initialValue ?? emptyWorkItemDraft());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof WorkItemDraft>(key: K, value: WorkItemDraft[K]): void {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!draft.title.trim()) {
      setError('Add a short title before saving this work item.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({ ...draft, title: draft.title.trim() });
      if (!initialValue) setDraft(emptyWorkItemDraft(draft.category));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The work item could not be updated for this session.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="work-item-form" onSubmit={(event) => void handleSubmit(event)}>
      <Field
        label="Work item title"
        required
        validationState={draft.title.trim() ? 'none' : 'warning'}
        validationMessage={draft.title.trim() ? undefined : 'Enter an item to create a local record.'}
      >
        <Input id="work-item-title" aria-label="Work item title" value={draft.title} onChange={(_, data) => update('title', data.value)} />
      </Field>
      <div className="form-grid form-grid-two">
        <Field label="Type">
          <Select aria-label="Type" value={draft.category} onChange={(_, data) => update('category', data.value as WorkItemCategory)}>
            {categories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
          </Select>
        </Field>
        <Field label="Lifecycle stage">
          <Select aria-label="Lifecycle stage" value={draft.stage} onChange={(_, data) => update('stage', data.value as LifecycleStage | '')}>
            <option value="">Not linked to a stage</option>
            {LIFECYCLE_STAGES.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
          </Select>
        </Field>
        <Field label="Owner">
          <Input aria-label="Owner" value={draft.owner} onChange={(_, data) => update('owner', data.value)} placeholder="Unassigned" />
        </Field>
        <Field label="Due date">
          <Input aria-label="Due date" type="date" value={draft.dueDate} onChange={(_, data) => update('dueDate', data.value)} />
        </Field>
        <Field label="Status">
          <Select aria-label="Status" value={draft.status} onChange={(_, data) => update('status', data.value as WorkItemStatus)}>
            {statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
          </Select>
        </Field>
        <Field label="Evidence reference">
          <Input aria-label="Evidence reference" value={draft.evidence} onChange={(_, data) => update('evidence', data.value)} placeholder="Link or record reference" />
        </Field>
      </div>
      <Field label="Notes">
        <Textarea aria-label="Notes" rows={3} value={draft.notes} onChange={(_, data) => update('notes', data.value)} />
      </Field>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions">
        <Button appearance="primary" type="submit" disabled={saving}>{saving ? 'Saving locally…' : submitLabel}</Button>
      </div>
    </form>
  );
}