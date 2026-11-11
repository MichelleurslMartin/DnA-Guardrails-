import type { FormEvent } from 'react';
import { Button, Card, Field, Input } from '@fluentui/react-components';
import type { PortfolioProjectDraft, PortfolioProjectLinks } from '../api/types';

const sourceFields: { key: keyof PortfolioProjectLinks; label: string; idLabel: string }[] = [
  { key: 'mme', label: 'MME', idLabel: 'Engagement ID' },
  { key: 'dna', label: 'DnA / Azure DevOps', idLabel: 'Organization, project, team, or iteration ID' },
  { key: 'aep', label: 'AEP', idLabel: 'Engagement ID' },
  { key: 'sharepoint', label: 'Project SharePoint', idLabel: 'Site or library ID' },
  { key: 'myWizzard', label: 'myWizzard', idLabel: 'Project ID' },
  { key: 'hvlv', label: 'HVLV', idLabel: 'Engagement ID' },
];

interface PortfolioProjectEditorProps {
  value: PortfolioProjectDraft;
  isEditing: boolean;
  saving: boolean;
  error: string | null;
  onChange: (value: PortfolioProjectDraft) => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}

export function PortfolioProjectEditor({ value, isEditing, saving, error, onChange, onSave, onCancel }: PortfolioProjectEditorProps) {
  function updateSourceLink(key: keyof PortfolioProjectLinks, field: 'url' | 'externalId', fieldValue: string): void {
    onChange({
      ...value,
      sourceLinks: {
        ...value.sourceLinks,
        [key]: { ...value.sourceLinks[key], [field]: fieldValue },
      },
    });
  }

  return (
    <Card className="form-panel" appearance="outline">
      <form className="portfolio-project-form" onSubmit={onSave}>
        <div className="section-heading">
          <h2>{isEditing ? 'Edit project links' : 'Register a project'}</h2>
          <Button appearance="subtle" type="button" onClick={onCancel}>Cancel</Button>
        </div>
        <div className="form-grid form-grid-two">
          <Field label="Project name" required>
            <Input aria-label="Project name" required maxLength={200} value={value.projectName} onChange={(_, input) => onChange({ ...value, projectName: input.value })} />
          </Field>
          <Field label="Client name">
            <Input aria-label="Client name" maxLength={200} value={value.clientName} onChange={(_, input) => onChange({ ...value, clientName: input.value })} />
          </Field>
        </div>
        <p className="disclaimer-line">Add direct project links and source IDs to help map future feeds. These are navigation references only; no source data is read or synced yet. Use HTTPS links and do not include credentials or tokens.</p>
        <div className="portfolio-source-grid">
          {sourceFields.map((source) => (
            <section className="portfolio-source-group" key={source.key} aria-label={`${source.label} project reference`}>
              <h3>{source.label}</h3>
              <Field label={`${source.label} link`}>
                <Input aria-label={`${source.label} link`} type="url" placeholder="https://" value={value.sourceLinks[source.key].url} onChange={(_, input) => updateSourceLink(source.key, 'url', input.value)} />
              </Field>
              <Field label={source.idLabel}>
                <Input aria-label={`${source.label} external ID`} value={value.sourceLinks[source.key].externalId} onChange={(_, input) => updateSourceLink(source.key, 'externalId', input.value)} />
              </Field>
              <span>Link only · connection not configured</span>
            </section>
          ))}
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="form-actions">
          <Button appearance="primary" type="submit" disabled={saving}>{saving ? 'Saving…' : isEditing ? 'Save project links' : 'Add project'}</Button>
        </div>
      </form>
    </Card>
  );
}
