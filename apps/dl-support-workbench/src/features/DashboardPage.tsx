import { useNavigate } from 'react-router-dom';
import {
  Body1,
  Button,
  Card,
  CardHeader,
  Title1,
  Title3,
} from '@fluentui/react-components';
import {
  AddRegular,
  ArrowRightRegular,
  CheckmarkCircleRegular,
  ClipboardTaskRegular,
  DataBarVerticalRegular,
  ShieldTaskRegular,
} from '../components/icons';
import { useWorkbench } from '../app/WorkbenchContext';
import { LIFECYCLE_STAGES } from '../api/types';
import type { WorkItem, WorkItemStatus } from '../api/types';
import { DataState } from '../components/States';
import { WorkItemTable } from '../components/WorkItemTable';

function Metric({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) {
  return (
    <Card className="metric-card" appearance="outline">
      <div className="metric-icon">{icon}</div>
      <span className="metric-label">{label}</span>
      <strong className="metric-value">{value}</strong>
      <span className="metric-note">{note}</span>
    </Card>
  );
}

export function DashboardPage() {
  const { data, state, error, reload, updateWorkItem } = useWorkbench();
  const navigate = useNavigate();
  const completeStages = new Set<string>(data.items.filter((item) => item.category === 'checklist' && item.status === 'complete').map((item) => item.stage));
  const verifiedCount = Number(data.engagements.aep.verificationStatus === 'verified') + Number(data.engagements.bizapps.verificationStatus === 'verified');

  async function saveStatus(item: WorkItem, status: WorkItemStatus): Promise<void> {
    await updateWorkItem(item.id, { ...item, status });
  }

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="hero-mesh" aria-hidden="true">
          <svg viewBox="0 0 800 260" preserveAspectRatio="none">
            <defs>
              <radialGradient id="hero-accent" cx="100%" cy="100%" r="80%"><stop offset="0%" stopColor="#2D766D" stopOpacity="0.36" /><stop offset="100%" stopColor="#2D766D" stopOpacity="0" /></radialGradient>
              <radialGradient id="hero-primary" cx="0%" cy="0%" r="75%"><stop offset="0%" stopColor="#A3424A" stopOpacity="0.4" /><stop offset="100%" stopColor="#A3424A" stopOpacity="0" /></radialGradient>
            </defs>
            <rect width="800" height="260" fill="url(#hero-accent)" />
            <rect width="800" height="260" fill="url(#hero-primary)" />
          </svg>
        </div>
        <span className="hero-eyebrow"><span className="eyebrow-dot" /> DELIVERY LIFECYCLE</span>
        <Title1 as="h1">A clear view of delivery readiness</Title1>
        <Body1>Track lifecycle progress, manually record engagement checks, and keep delivery actions visible in one shared local workbench.</Body1>
        <div className="hero-actions">
          <Button appearance="primary" icon={<AddRegular />} onClick={() => navigate('/actions')}>Create work item</Button>
          <Button appearance="secondary" icon={<ArrowRightRegular />} onClick={() => navigate('/lifecycle')}>Open lifecycle playbook</Button>
        </div>
      </section>

      <section className="metric-grid" aria-label="Workbench summary">
        <Metric icon={<DataBarVerticalRegular />} label="Lifecycle stages" value="6" note={`${completeStages.size} with completed checklist items`} />
        <Metric icon={<ShieldTaskRegular />} label="Verified engagements" value={`${verifiedCount} / 2`} note="Manually recorded, not platform-checked" />
        <Metric icon={<ClipboardTaskRegular />} label="Actions" value={String(data.items.filter((item) => item.category === 'action').length)} note="Stored work items" />
      </section>

      <DataState
        state={state}
        error={error}
        onRetry={() => void reload()}
        isEmpty={!data.items.length}
        emptyTitle="No work items yet"
        emptyText="Create a work item to track ownership, target dates, status, and evidence in the local database."
        emptyAction={{ label: 'Create a work item', onClick: () => navigate('/actions') }}
      >
        <section className="dashboard-grid">
          <div className="section-block">
            <div className="section-heading">
              <h2><DataBarVerticalRegular aria-hidden="true" /> Stage readiness</h2>
              <span>{completeStages.size} of 6 stages have completed checklist items</span>
            </div>
            <div className="stage-grid">
              {LIFECYCLE_STAGES.map((stage, index) => (
                <Card key={stage} className="stage-card" appearance="outline">
                  <div className="stage-card-top"><span>0{index + 1}</span><CheckmarkCircleRegular aria-hidden="true" /></div>
                  <strong>{stage}</strong>
                  <span>{completeStages.has(stage) ? 'Checklist progress recorded' : 'Readiness not recorded'}</span>
                </Card>
              ))}
            </div>
          </div>

          <section className="section-block">
            <div className="section-heading">
              <h2><ClipboardTaskRegular aria-hidden="true" /> Recent actions</h2>
              <Button appearance="subtle" onClick={() => navigate('/actions')}>View all actions</Button>
            </div>
            <WorkItemTable items={data.items.slice(0, 3)} onEdit={() => navigate('/actions')} onStatusChange={(item, status) => void saveStatus(item, status)} />
          </section>
        </section>
      </DataState>

      <section className="support-section">
        <div className="section-heading">
          <h2><ShieldTaskRegular aria-hidden="true" /> Support desk</h2>
          <span className="guidance-label">Guidance only · not connected</span>
        </div>
        <div className="guidance-grid">
          <Card className="guidance-card" appearance="outline">
            <CardHeader header={<Title3>AEP engagement verification</Title3>} description={<Body1>Guidance only · not connected</Body1>} />
            <p>Confirm the project engagement manually in AEP, then record its name, identifier, URL, verifier, date, and evidence reference.</p>
            <Button appearance="subtle" onClick={() => navigate('/engagements')}>Record a manual check</Button>
          </Card>
          <Card className="guidance-card" appearance="outline">
            <CardHeader header={<Title3>BizApps Platform match</Title3>} description={<Body1>Guidance only · not connected</Body1>} />
            <p>Compare the DnA engagement details yourself. Record any mismatch or access follow-up; this workbench does not inspect the platform.</p>
            <Button appearance="subtle" onClick={() => navigate('/engagements')}>Open engagement checks</Button>
          </Card>
          <Card className="guidance-card" appearance="outline">
            <CardHeader header={<Title3>Lifecycle next step</Title3>} description={<Body1>Guidance only · not connected</Body1>} />
            <p>Review the current stage checklist and capture owner, due date, and evidence before marking readiness.</p>
            <Button appearance="subtle" onClick={() => navigate('/lifecycle')}>Review lifecycle guidance</Button>
          </Card>
        </div>
      </section>
    </div>
  );
}