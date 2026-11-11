import { useState, type FormEvent } from 'react';
import { Badge, Button, Card, Title2 } from '@fluentui/react-components';
import { AddRegular, BuildingRegular, EditRegular } from '../components/icons';
import { api } from '../api';
import type { PortfolioProjectDraft, PortfolioProjectLinks, PortfolioProjectSnapshot } from '../api/types';
import { useWorkbench } from '../app/WorkbenchContext';
import { PortfolioProjectEditor } from './PortfolioProjectEditor';
import { reviewPortfolioProjects } from './portfolioMetrics';

function sampleSourceLinks(project: string): PortfolioProjectLinks {
  return {
    mme: { url: `https://example.test/mme/${project}`, externalId: `MME-${project.toUpperCase()}` },
    dna: { url: `https://example.test/ado/${project}`, externalId: `ADO-${project.toUpperCase()}` },
    aep: { url: `https://example.test/aep/${project}`, externalId: `AEP-${project.toUpperCase()}` },
    sharepoint: { url: `https://example.test/sharepoint/${project}`, externalId: `SITE-${project.toUpperCase()}` },
    myWizzard: { url: `https://example.test/mywizzard/${project}`, externalId: `MW-${project.toUpperCase()}` },
    hvlv: { url: `https://example.test/hvlv/${project}`, externalId: `HVLV-${project.toUpperCase()}` },
  };
}

function emptyPortfolioProjectDraft(): PortfolioProjectDraft {
  return {
    projectName: '',
    clientName: '',
    sourceLinks: {
      mme: { url: '', externalId: '' },
      dna: { url: '', externalId: '' },
      aep: { url: '', externalId: '' },
      sharepoint: { url: '', externalId: '' },
      myWizzard: { url: '', externalId: '' },
      hvlv: { url: '', externalId: '' },
    },
  };
}

const samplePortfolio: PortfolioProjectSnapshot[] = [
  {
    projectId: 'sample-erp-01',
    projectName: 'Finance modernization',
    clientName: 'Northstar Group',
    sourceLinks: sampleSourceLinks('northstar'),
    updatedAt: '2026-11-10T12:00:00Z',
    financialGovernance: {
      asOf: '2026-11-10T12:00:00Z',
      mme: {
        engagementUrl: 'https://example.test/mme/northstar',
        lastSyncedAt: '2026-11-10T12:00:00Z',
        weeklyPlan: [
          { weekStart: '2026-10-26', plannedHours: 100 },
          { weekStart: '2026-11-02', plannedHours: 100 },
          { weekStart: '2026-11-09', plannedHours: 100 },
          { weekStart: '2026-11-16', plannedHours: 100 },
          { weekStart: '2026-11-23', plannedHours: 100 },
        ],
      },
      azureDevOps: {
        projectUrl: 'https://example.test/ado/northstar',
        lastSyncedAt: '2026-11-10T12:00:00Z',
        originalEstimateHours: 480,
        completedWorkHours: 215,
      },
      hvlvReconciliation: {
        payPeriodStart: '2026-10-26',
        payPeriodEnd: '2026-11-08',
        mmeEngagementUrl: 'https://example.test/mme/northstar',
        mmeLastSyncedAt: '2026-11-09T12:00:00Z',
        hvlvSourceUrl: 'https://example.test/hvlv/northstar',
        hvlvLastSyncedAt: '2026-11-09T12:00:00Z',
        azureDevOpsPlan: { projectUrl: 'https://example.test/ado/northstar', lastSyncedAt: '2026-11-09T12:00:00Z', plannedHours: 190 },
        mmeResourcePlan: [
          { enterpriseId: 'E001', resourceName: 'Consultant A', costCollectorId: 'CC-100', plannedHours: 80 },
          { enterpriseId: 'E002', resourceName: 'Consultant B', costCollectorId: 'CC-100', plannedHours: 80 },
          { enterpriseId: 'E003', resourceName: 'Consultant C', costCollectorId: 'CC-200', plannedHours: 40 },
        ],
        hvlvSubmissions: [
          { enterpriseId: 'E001', resourceName: 'Consultant A', costCollectorId: 'CC-100', submittedHours: 72 },
          { enterpriseId: 'E002', resourceName: 'Consultant B', costCollectorId: 'CC-100', submittedHours: 82 },
          { enterpriseId: 'E004', resourceName: 'Consultant D', costCollectorId: 'CC-200', submittedHours: 8 },
        ],
      },
    },
  },
  {
    projectId: 'sample-crm-02',
    projectName: 'Customer platform rollout',
    clientName: 'Fabrikam Services',
    sourceLinks: sampleSourceLinks('fabrikam'),
    updatedAt: '2026-11-10T12:00:00Z',
    financialGovernance: {
      asOf: '2026-11-10T12:00:00Z',
      mme: {
        engagementUrl: 'https://example.test/mme/fabrikam',
        lastSyncedAt: '2026-11-10T12:00:00Z',
        weeklyPlan: [
          { weekStart: '2026-10-26', plannedHours: 80 },
          { weekStart: '2026-11-02', plannedHours: 80 },
          { weekStart: '2026-11-09', plannedHours: 80 },
          { weekStart: '2026-11-16', plannedHours: 80 },
          { weekStart: '2026-11-23', plannedHours: 80 },
        ],
      },
      azureDevOps: {
        projectUrl: 'https://example.test/ado/fabrikam',
        lastSyncedAt: '2026-11-10T12:00:00Z',
        originalEstimateHours: 400,
        completedWorkHours: 265,
      },
      hvlvReconciliation: {
        payPeriodStart: '2026-10-26',
        payPeriodEnd: '2026-11-08',
        mmeEngagementUrl: 'https://example.test/mme/fabrikam',
        mmeLastSyncedAt: '2026-11-09T12:00:00Z',
        hvlvSourceUrl: 'https://example.test/hvlv/fabrikam',
        hvlvLastSyncedAt: '2026-11-09T12:00:00Z',
        azureDevOpsPlan: { projectUrl: 'https://example.test/ado/fabrikam', lastSyncedAt: '2026-11-09T12:00:00Z', plannedHours: 250 },
        mmeResourcePlan: [
          { enterpriseId: 'F001', resourceName: 'Consultant X', costCollectorId: 'CC-310', plannedHours: 120 },
          { enterpriseId: 'F002', resourceName: 'Consultant Y', costCollectorId: 'CC-310', plannedHours: 120 },
        ],
        hvlvSubmissions: [
          { enterpriseId: 'F001', resourceName: 'Consultant X', costCollectorId: 'CC-310', submittedHours: 130 },
          { enterpriseId: 'F002', resourceName: 'Consultant Y', costCollectorId: 'CC-310', submittedHours: 120 },
        ],
      },
    },
  },
  {
    projectId: 'sample-data-03',
    projectName: 'Data services upgrade',
    clientName: 'Woodgrove Bank',
    sourceLinks: sampleSourceLinks('woodgrove'),
    updatedAt: '2026-11-10T12:00:00Z',
    financialGovernance: {
      asOf: '2026-11-10T12:00:00Z',
      mme: {
        engagementUrl: 'https://example.test/mme/woodgrove',
        lastSyncedAt: '2026-11-10T12:00:00Z',
        weeklyPlan: [{ weekStart: '2026-11-02', plannedHours: 120 }, { weekStart: '2026-11-09', plannedHours: 120 }],
      },
      azureDevOps: null,
      hvlvReconciliation: null,
    },
  },
];

function isPortfolioPreview(): boolean {
  return import.meta.env.DEV && new URLSearchParams(window.location.search).get('portfolio-preview') === 'sample';
}

function formatHours(value: number | null): string {
  return value === null ? 'Not connected' : `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value)} h`;
}

function formatPercent(value: number | null): string {
  return value === null ? 'Not available' : `${value.toFixed(1)}%`;
}

function formatSignedHours(value: number | null): string {
  if (value === null) return 'Not connected';
  return `${value > 0 ? '+' : ''}${new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value)} h`;
}

function safeHttpUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

function ProjectSourceLinks({ links }: { links: PortfolioProjectLinks }) {
  const sources: { key: keyof PortfolioProjectLinks; label: string }[] = [
    { key: 'mme', label: 'MME' },
    { key: 'dna', label: 'DnA' },
    { key: 'aep', label: 'AEP' },
    { key: 'sharepoint', label: 'SharePoint' },
    { key: 'myWizzard', label: 'myWizzard' },
    { key: 'hvlv', label: 'HVLV' },
  ];

  return (
    <div className="portfolio-project-links">
      {sources.map((source) => {
        const link = links[source.key];
        const url = safeHttpUrl(link.url);
        return (
          <div key={source.key}>
            {url ? <a href={url} target="_blank" rel="noreferrer">{source.label}</a> : <span>{source.label}: not linked</span>}
            {link.externalId && <small>{link.externalId}</small>}
          </div>
        );
      })}
    </div>
  );
}

function PortfolioSummary({
  projects,
  asOf,
  previewMode,
  onAddProject,
  onEditProject,
}: {
  projects: PortfolioProjectSnapshot[];
  asOf: string | null;
  previewMode: boolean;
  onAddProject: () => void;
  onEditProject: (project: PortfolioProjectSnapshot) => void;
}) {
  const reviews = reviewPortfolioProjects(projects);
  const reviewCount = reviews.filter((row) => row.status === 'review').length;
  const waitingCount = reviews.filter((row) => row.status === 'waiting').length;
  const asOfLabel = asOf ? `Snapshot: ${new Date(asOf).toLocaleString()}` : 'Snapshot date unavailable';

  return (
    <>
      <section className="page-intro">
        <div className="page-title-row"><BuildingRegular aria-hidden="true" /><Title2 as="h1">Portfolio</Title2></div>
        <p>Scan financial and delivery-progress signals across the projects you are authorized to review.</p>
        <span className="quiet-label">Aggregate view · investigate each signal in its source project</span>
      </section>

      {previewMode && (
        <div className="sample-preview-notice" role="note">
          <span>SAMPLE PREVIEW · Illustrative project figures and links only. No live project feeds or saved sample data.</span>
          <a href="/portfolio">Return to live portfolio</a>
        </div>
      )}

      <section className="metric-grid portfolio-summary" aria-label="Portfolio overview">
        <Card className="metric-card" appearance="outline"><span className="metric-label">Projects in snapshot</span><strong className="metric-value">{projects.length}</strong><span className="metric-note">{asOfLabel}</span></Card>
        <Card className="metric-card" appearance="outline"><span className="metric-label">Variance to review</span><strong className="metric-value">{reviewCount}</strong><span className="metric-note">Non-zero financial or progress differences</span></Card>
        <Card className="metric-card" appearance="outline"><span className="metric-label">Waiting for source data</span><strong className="metric-value">{waitingCount}</strong><span className="metric-note">One or more feeds are unavailable</span></Card>
      </section>

      <section className="section-block" aria-label="Portfolio project checks">
        <div className="section-heading">
          <div><h2>Engagement checks</h2><span>Non-zero variances are review signals, not health verdicts</span></div>
          <Button appearance="primary" icon={<AddRegular />} disabled={previewMode} onClick={onAddProject}>Register project</Button>
        </div>
        {reviews.length ? (
          <div className="governance-table-wrap">
            <table className="governance-table portfolio-table">
              <caption>Project links are navigation references. MME, Azure DevOps, and HVLV task hours are not person-matched across systems.</caption>
              <thead>
                <tr>
                  <th scope="col">Project</th>
                  <th scope="col">Tool links / IDs</th>
                  <th scope="col">Period</th>
                  <th scope="col">MME plan</th>
                  <th scope="col">DevOps plan</th>
                  <th scope="col">HVLV actual</th>
                  <th scope="col">HVLV vs MME</th>
                  <th scope="col">Progress plan / done</th>
                  <th scope="col">Signal</th>
                  <th scope="col">Manage</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((row) => {
                  const reconciliation = row.project.financialGovernance.hvlvReconciliation;
                  const progress = row.progress;
                  const statusLabel = row.status === 'review' ? 'Review variance' : row.status === 'waiting' ? 'Waiting for data' : 'No variance';
                  const statusColor = row.status === 'review' ? 'warning' : row.status === 'waiting' ? 'subtle' : 'informative';
                  const period = reconciliation ? `${reconciliation.payPeriodStart} to ${reconciliation.payPeriodEnd}` : 'Not available';

                  return (
                    <tr key={row.project.projectId}>
                      <td><div className="portfolio-project-cell"><strong>{row.project.projectName}</strong><span>{row.project.clientName}</span><small>Links updated {new Date(row.project.updatedAt).toLocaleDateString()}</small></div></td>
                      <td><ProjectSourceLinks links={row.project.sourceLinks} /></td>
                      <td>{period}</td>
                      <td>{formatHours(row.financial?.plannedHoursTotal ?? null)}</td>
                      <td>{formatHours(row.financial?.azureDevOpsPlannedHours ?? null)}</td>
                      <td>{formatHours(row.financial?.submittedHoursTotal ?? null)}</td>
                      <td>{formatSignedHours(row.financial?.hvlvVsMmeVarianceHours ?? null)}</td>
                      <td><div className="portfolio-progress-cell"><span>Expected {formatPercent(progress?.plannedProgressPercent ?? null)}</span><span>Actual {formatPercent(progress?.actualProgressPercent ?? null)}</span><strong>Gap {progress?.variancePercentagePoints === null || progress?.variancePercentagePoints === undefined ? 'Not available' : `${progress.variancePercentagePoints > 0 ? '+' : ''}${progress.variancePercentagePoints.toFixed(1)} pp`}</strong></div></td>
                      <td><Badge appearance="tint" color={statusColor}>{statusLabel}</Badge>{row.status === 'review' && <span className="portfolio-signal-note">{row.financialVariance && row.progressVariance ? 'Financial + progress' : row.financialVariance ? 'Financial variance' : 'Progress variance'}</span>}{row.missingSources.length > 0 && <span className="portfolio-signal-note">Missing: {row.missingSources.join(', ')}</span>}</td>
                      <td><Button appearance="subtle" icon={<EditRegular />} aria-label={`Edit links for ${row.project.projectName}`} disabled={previewMode} onClick={() => onEditProject(row.project)}>Edit links</Button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="governance-empty" role="status">
            <strong>No connected portfolio snapshots are available</strong>
            <p>This workbench has no live MME, Azure DevOps, or HVLV project feeds yet. No projects are inferred from the single-project workspace.</p>
            {import.meta.env.DEV && <a href="/portfolio?portfolio-preview=sample">Open sample portfolio preview</a>}
          </div>
        )}
        {!previewMode && reviews.length > 0 && <p className="disclaimer-line">Portfolio signals summarize source data only. Review source freshness, period, and project scope before acting; no universal thresholds are applied.</p>}
      </section>
    </>
  );
}

export function PortfolioPage() {
  const { data, reload } = useWorkbench();
  const previewMode = isPortfolioPreview();
  const portfolio = previewMode ? samplePortfolio : data.portfolio.projects;
  const asOf = previewMode ? '2026-11-10T12:00:00Z' : data.portfolio.asOf;
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<PortfolioProjectSnapshot | null>(null);
  const [draft, setDraft] = useState<PortfolioProjectDraft>(emptyPortfolioProjectDraft());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startCreate(): void {
    setEditingProject(null);
    setDraft(emptyPortfolioProjectDraft());
    setError(null);
    setEditorOpen(true);
  }

  function startEdit(project: PortfolioProjectSnapshot): void {
    setEditingProject(project);
    setDraft({ projectName: project.projectName, clientName: project.clientName, sourceLinks: project.sourceLinks });
    setError(null);
    setEditorOpen(true);
  }

  async function saveProject(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (previewMode) return;
    setSaving(true);
    setError(null);
    try {
      if (editingProject) await api.updatePortfolioProject(editingProject.projectId, draft);
      else await api.createPortfolioProject(draft);
      await reload();
      setEditorOpen(false);
      setEditingProject(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Project links could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-stack">
      <PortfolioSummary projects={portfolio} asOf={asOf} previewMode={previewMode} onAddProject={startCreate} onEditProject={startEdit} />
      {!previewMode && editorOpen && <PortfolioProjectEditor value={draft} isEditing={editingProject !== null} saving={saving} error={error} onChange={setDraft} onSave={(event) => void saveProject(event)} onCancel={() => { setEditorOpen(false); setEditingProject(null); }} />}
    </div>
  );
}