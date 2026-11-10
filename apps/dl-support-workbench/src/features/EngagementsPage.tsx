import { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  ProgressBar,
  Select,
  Textarea,
  Title2,
} from '@fluentui/react-components';
import { ArrowSyncCheckmarkRegular, BuildingRegular, ShieldTaskRegular } from '../components/icons';
import { api } from '../api';
import { useWorkbench } from '../app/WorkbenchContext';
import type { EngagementRecord, EngagementWorkspace, FinancialGovernanceSnapshot, FollowUpStatus, HvlvReasonComment, HvlvReconciliationSnapshot, MatchStatus, VerificationStatus } from '../api/types';
import { DataState } from '../components/States';
import { calculateFinancialGovernanceMetrics, calculateHvlvReconciliation } from './financialGovernance';

type Platform = 'aep' | 'bizapps';

const verificationOptions: { value: VerificationStatus; label: string }[] = [
  { value: 'not-verified', label: 'Not verified' },
  { value: 'verified', label: 'Verified manually' },
  { value: 'mismatch', label: 'Mismatch found' },
  { value: 'access-needed', label: 'Access needed' },
];

const followUpOptions: { value: FollowUpStatus; label: string }[] = [
  { value: 'not-started', label: 'Not started' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'complete', label: 'Complete' },
];

const matchOptions: { value: MatchStatus; label: string }[] = [
  { value: 'not-checked', label: 'Not checked' },
  { value: 'matched', label: 'Match confirmed manually' },
  { value: 'mismatch', label: 'Mismatch found' },
  { value: 'access-needed', label: 'Access needed' },
  { value: 'follow-up', label: 'Follow-up needed' },
];

function safeHttpUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

function formatHours(value: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value);
}

function formatSignedHours(value: number | null): string {
  if (value === null) return 'Not connected';
  return `${value > 0 ? '+' : ''}${formatHours(value)} h`;
}

function formatPercent(value: number | null): string {
  return value === null ? 'Not available' : `${value.toFixed(1)}%`;
}

function formatSyncTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Sync time unavailable' : date.toLocaleString();
}

function reconciliationKey(enterpriseId: string, costCollectorId: string): string {
  return JSON.stringify([enterpriseId, costCollectorId]);
}

function HvlvReconciliation({ snapshot }: { snapshot: HvlvReconciliationSnapshot | null }) {
  const metrics = snapshot ? calculateHvlvReconciliation(snapshot) : null;
  const [reasonComments, setReasonComments] = useState<Record<string, HvlvReasonComment>>({});
  const [reasonDrafts, setReasonDrafts] = useState<Record<string, string>>({});
  const [reasonStatuses, setReasonStatuses] = useState<Record<string, string>>({});
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [loadingComments, setLoadingComments] = useState(false);
  const [savingReasonKey, setSavingReasonKey] = useState<string | null>(null);
  const [ideasByResource, setIdeasByResource] = useState<Record<string, string[]>>({});
  const [ideaErrors, setIdeaErrors] = useState<Record<string, string>>({});
  const [loadingIdeasKey, setLoadingIdeasKey] = useState<string | null>(null);
  const payPeriodStart = snapshot?.payPeriodStart;
  const payPeriodEnd = snapshot?.payPeriodEnd;

  useEffect(() => {
    if (!payPeriodStart || !payPeriodEnd) {
      setReasonComments({});
      setReasonDrafts({});
      return;
    }
    let active = true;
    setLoadingComments(true);
    setReasonError(null);
    void api.getHvlvReconciliationComments(payPeriodStart, payPeriodEnd)
      .then((comments) => {
        if (!active) return;
        const nextComments = Object.fromEntries(comments.map((comment) => [
          reconciliationKey(comment.enterpriseId, comment.costCollectorId),
          comment,
        ]));
        setReasonComments(nextComments);
        setReasonDrafts(Object.fromEntries(Object.entries(nextComments).map(([key, comment]) => [key, comment.comment])));
      })
      .catch((cause: unknown) => {
        if (active) setReasonError(cause instanceof Error ? cause.message : 'Saved DL comments could not be loaded.');
      })
      .finally(() => {
        if (active) setLoadingComments(false);
      });
    return () => { active = false; };
  }, [payPeriodStart, payPeriodEnd]);

  async function saveReason(enterpriseId: string, costCollectorId: string): Promise<void> {
    if (!snapshot) return;
    const key = reconciliationKey(enterpriseId, costCollectorId);
    setSavingReasonKey(key);
    setReasonError(null);
    setReasonStatuses((current) => ({ ...current, [key]: '' }));
    try {
      const saved = await api.saveHvlvReconciliationComment({
        payPeriodStart: snapshot.payPeriodStart,
        payPeriodEnd: snapshot.payPeriodEnd,
        enterpriseId,
        costCollectorId,
        comment: reasonDrafts[key] ?? reasonComments[key]?.comment ?? '',
      });
      setReasonComments((current) => ({ ...current, [key]: saved }));
      setReasonDrafts((current) => ({ ...current, [key]: saved.comment }));
      setReasonStatuses((current) => ({ ...current, [key]: 'DL reason saved.' }));
    } catch (cause) {
      setReasonStatuses((current) => ({ ...current, [key]: cause instanceof Error ? cause.message : 'The DL reason could not be saved.' }));
    } finally {
      setSavingReasonKey(null);
    }
  }

  async function requestIdeas(row: ReturnType<typeof calculateHvlvReconciliation>['rows'][number]): Promise<void> {
    if (!snapshot) return;
    const key = reconciliationKey(row.enterpriseId, row.costCollectorId);
    setLoadingIdeasKey(key);
    setIdeaErrors((current) => ({ ...current, [key]: '' }));
    try {
      const ideas = await api.getHvlvReasonIdeas({
        payPeriodStart: snapshot.payPeriodStart,
        payPeriodEnd: snapshot.payPeriodEnd,
        plannedHours: row.plannedHours,
        submittedHours: row.submittedHours,
        varianceHours: row.varianceHours,
        status: row.status,
      });
      setIdeasByResource((current) => ({ ...current, [key]: ideas }));
    } catch (cause) {
      setIdeaErrors((current) => ({ ...current, [key]: cause instanceof Error ? cause.message : 'AI ideas are unavailable.' }));
    } finally {
      setLoadingIdeasKey(null);
    }
  }

  function addIdeaToReason(key: string, idea: string): void {
    setReasonDrafts((current) => {
      const existing = current[key] ?? reasonComments[key]?.comment ?? '';
      return { ...current, [key]: existing ? `${existing}\n${idea}` : idea };
    });
  }

  return (
    <section className="section-block" aria-label="Financial governance">
      <div className="section-heading">
        <h2>Financial governance</h2>
        <span>MME resource plan vs HVLV submitted hours</span>
      </div>
      {snapshot && metrics ? (
        <>
          <div className="governance-sources" aria-label="Financial data sources">
            <div>
              <strong>MME resource plan</strong>
              <Badge appearance="tint" color="success">Connected</Badge>
              <span>Last sync: {formatSyncTime(snapshot.mmeLastSyncedAt)}</span>
              {safeHttpUrl(snapshot.mmeEngagementUrl) && <a href={safeHttpUrl(snapshot.mmeEngagementUrl) ?? undefined} target="_blank" rel="noreferrer">Open MME engagement</a>}
            </div>
            <div>
              <strong>HVLV time submissions</strong>
              <Badge appearance="tint" color="success">Connected</Badge>
              <span>Last sync: {formatSyncTime(snapshot.hvlvLastSyncedAt)}</span>
              {safeHttpUrl(snapshot.hvlvSourceUrl) && <a href={safeHttpUrl(snapshot.hvlvSourceUrl) ?? undefined} target="_blank" rel="noreferrer">Open HVLV</a>}
            </div>
            <div>
              <strong>Azure DevOps task plan</strong>
              <Badge appearance="tint" color={snapshot.azureDevOpsPlan ? 'success' : 'subtle'}>{snapshot.azureDevOpsPlan ? 'Connected' : 'Not connected'}</Badge>
              {snapshot.azureDevOpsPlan && <span>Last sync: {formatSyncTime(snapshot.azureDevOpsPlan.lastSyncedAt)}</span>}
              {snapshot.azureDevOpsPlan && safeHttpUrl(snapshot.azureDevOpsPlan.projectUrl) && <a href={safeHttpUrl(snapshot.azureDevOpsPlan.projectUrl) ?? undefined} target="_blank" rel="noreferrer">Open Azure DevOps plan</a>}
            </div>
          </div>
          <p className="disclaimer-line">Pay period: {snapshot.payPeriodStart} to {snapshot.payPeriodEnd}. Early check uses HVLV submissions directly; it does not wait for transfer through myTE into MME actuals.</p>
          <div className="governance-progress-grid governance-reconciliation-metrics">
            <Card className="metric-card" appearance="outline">
              <span className="metric-label">MME planned hours</span>
              <strong className="metric-value">{formatHours(metrics.plannedHoursTotal)} h</strong>
              <span className="metric-note">For this two-week pay period</span>
            </Card>
            <Card className="metric-card" appearance="outline">
              <span className="metric-label">Azure DevOps task plan</span>
              <strong className="metric-value">{metrics.azureDevOpsPlannedHours === null ? 'Not connected' : `${formatHours(metrics.azureDevOpsPlannedHours)} h`}</strong>
              <span className="metric-note">Task hours aggregated for this fortnight; no resource names matched</span>
            </Card>
            <Card className="metric-card" appearance="outline">
              <span className="metric-label">HVLV submitted</span>
              <strong className="metric-value">{formatHours(metrics.submittedHoursTotal)} h</strong>
              <span className="metric-note">{formatHours(metrics.matchedPlannedHours)} of {formatHours(metrics.plannedHoursTotal)} planned hours covered ({formatPercent(metrics.coveragePercent)}); {formatHours(metrics.pendingPlanHours)} pending and {formatHours(metrics.unplannedActualHours)} unplanned</span>
            </Card>
            <Card className="metric-card" appearance="outline">
              <span className="metric-label">Pairwise variance</span>
              <div className="governance-variance-list">
                <span>HVLV vs MME <strong>{formatSignedHours(metrics.hvlvVsMmeVarianceHours)}</strong></span>
                <span>MME vs DevOps <strong>{formatSignedHours(metrics.mmeVsAzureDevOpsVarianceHours)}</strong></span>
                <span>HVLV vs DevOps <strong>{formatSignedHours(metrics.hvlvVsAzureDevOpsVarianceHours)}</strong></span>
              </div>
            </Card>
          </div>
          <p className="disclaimer-line">Azure DevOps planned hours are an aggregate of task estimates for this same pay period. No person-level match is attempted. The resource table below compares MME plans with HVLV submissions only.</p>
          <div className="governance-table-wrap">
            <table className="governance-table resource-reconciliation-table">
              <caption>Resource-level comparison by enterprise ID and cost collector. Every variance, missing submission, or unplanned actual needs DL review.</caption>
              <thead>
                <tr>
                  <th scope="col">Resource</th>
                  <th scope="col">Enterprise ID</th>
                  <th scope="col">Cost collector</th>
                  <th scope="col">MME plan</th>
                  <th scope="col">HVLV submitted</th>
                  <th scope="col">Variance</th>
                  <th scope="col">Check</th>
                  <th scope="col">DL reason and follow-up</th>
                </tr>
              </thead>
              <tbody>
                {metrics.rows.map((row) => {
                  const statusLabel = row.status === 'submitted' ? 'Submitted' : row.status === 'awaiting' ? 'Awaiting HVLV' : 'Unplanned actual';
                  const statusColor = row.status === 'submitted' ? 'success' : row.status === 'awaiting' ? 'warning' : 'danger';
                  const key = reconciliationKey(row.enterpriseId, row.costCollectorId);
                  const needsReview = row.status !== 'submitted' || Math.abs(row.varianceHours ?? 0) > 0.01;
                  const savedComment = reasonComments[key]?.comment ?? '';
                  const reasonSaved = reasonStatuses[key] === 'DL reason saved.';
                  return (
                    <tr key={`${row.enterpriseId}:${row.costCollectorId}`}>
                      <td>{row.resourceName}</td>
                      <td>{row.enterpriseId}</td>
                      <td>{row.costCollectorId}</td>
                      <td>{formatHours(row.plannedHours)} h</td>
                      <td>{row.submittedHours === null ? 'Not submitted' : `${formatHours(row.submittedHours)} h`}</td>
                      <td>{row.varianceHours === null ? 'Not comparable' : `${row.varianceHours > 0 ? '+' : ''}${formatHours(row.varianceHours)} h (${row.variancePercent?.toFixed(1)}%)`}</td>
                      <td>
                        <Badge appearance="tint" color={statusColor}>{statusLabel}</Badge>
                        {needsReview && <Badge appearance="tint" color={savedComment ? 'success' : 'warning'}>{savedComment ? 'Reason recorded' : 'DL review required'}</Badge>}
                      </td>
                      <td className="reason-comment-cell">
                        {needsReview ? (
                          <>
                            <Textarea
                              aria-label={`DL reason and follow-up for ${row.resourceName} ${row.costCollectorId}`}
                              rows={3}
                              maxLength={4000}
                              value={reasonDrafts[key] ?? savedComment}
                              onChange={(_, data) => setReasonDrafts((current) => ({ ...current, [key]: data.value }))}
                              placeholder="Record the cause the DL verified and the follow-up, such as a change request or MME plan update."
                            />
                            <div className="reason-actions">
                              <Button appearance="subtle" size="small" disabled={loadingIdeasKey !== null} onClick={() => void requestIdeas(row)}>
                                {loadingIdeasKey === key ? 'Getting ideas…' : 'AI reason ideas'}
                              </Button>
                              <Button appearance="primary" size="small" disabled={savingReasonKey !== null || loadingComments || !(reasonDrafts[key] ?? savedComment).trim()} onClick={() => void saveReason(row.enterpriseId, row.costCollectorId)}>
                                {savingReasonKey === key ? 'Saving…' : 'Save reason'}
                              </Button>
                            </div>
                            {ideasByResource[key]?.length ? (
                              <ul className="reason-ideas">
                                {ideasByResource[key].map((idea) => <li key={idea}><span>{idea}</span><Button appearance="subtle" size="small" onClick={() => addIdeaToReason(key, idea)}>Use idea</Button></li>)}
                              </ul>
                            ) : null}
                            {ideaErrors[key] && <p className="form-error" role="alert">{ideaErrors[key]}</p>}
                            {reasonStatuses[key] && <p className={reasonSaved ? 'form-success' : 'form-error'} role={reasonSaved ? 'status' : 'alert'}>{reasonStatuses[key]}</p>}
                            <span className="reason-help">AI ideas are hypotheses, not evidence. Verify the actual cause before saving.</span>
                          </>
                        ) : <span>On plan</span>}
                      </td>
                    </tr>
                  );
                })}
                {!metrics.rows.length && <tr><td colSpan={8}>No resource rows were returned for this pay period.</td></tr>}
              </tbody>
            </table>
          </div>
          {loadingComments && <p className="metric-note" role="status">Loading saved DL comments…</p>}
          {reasonError && <p className="form-error" role="alert">{reasonError}</p>}
          <p className="disclaimer-line">Resource variance compares submitted hours with plan only for resources present in both MME and HVLV. Missing submissions and actual hours without a matching MME resource and cost collector are shown separately. No rates or revenue amounts are inferred.</p>
        </>
      ) : (
        <div className="governance-empty" role="status">
          <strong>Waiting for MME resource plan and HVLV time submissions</strong>
          <p>When both sources are connected, this check will compare the same two-week period by enterprise ID and cost collector.</p>
          <p>It will flag missing submissions and HVLV hours without a matching MME plan. No sample values are shown.</p>
        </div>
      )}
    </section>
  );
}

function DeliveryProgress({ snapshot }: { snapshot: FinancialGovernanceSnapshot }) {
  const metrics = calculateFinancialGovernanceMetrics(snapshot);
  const targetProgress = metrics?.plannedProgressPercent ?? 0;
  const actualProgress = metrics?.actualProgressPercent ?? 0;
  const missingSources = [
    !snapshot.mme && 'MME weekly resource plan',
    !snapshot.azureDevOps && 'Azure DevOps effort data',
  ].filter(Boolean);

  return (
    <section className="section-block" aria-label="Delivery progress">
      <div className="section-heading">
        <h2>Delivery progress</h2>
        <span>MME planned effort vs Azure DevOps completion · not financial actuals</span>
      </div>
      <div className="governance-sources" aria-label="Financial data sources">
        <div>
          <strong>MME weekly plan</strong>
          <Badge appearance="tint" color={snapshot.mme ? 'success' : 'subtle'}>{snapshot.mme ? 'Connected' : 'Not connected'}</Badge>
          {snapshot.mme && <span>Last sync: {formatSyncTime(snapshot.mme.lastSyncedAt)}</span>}
          {snapshot.mme && safeHttpUrl(snapshot.mme.engagementUrl) && <a href={safeHttpUrl(snapshot.mme.engagementUrl) ?? undefined} target="_blank" rel="noreferrer">Open MME engagement</a>}
        </div>
        <div>
          <strong>Azure DevOps effort</strong>
          <Badge appearance="tint" color={snapshot.azureDevOps ? 'success' : 'subtle'}>{snapshot.azureDevOps ? 'Connected' : 'Not connected'}</Badge>
          {snapshot.azureDevOps && <span>Last sync: {formatSyncTime(snapshot.azureDevOps.lastSyncedAt)}</span>}
          {snapshot.azureDevOps && safeHttpUrl(snapshot.azureDevOps.projectUrl) && <a href={safeHttpUrl(snapshot.azureDevOps.projectUrl) ?? undefined} target="_blank" rel="noreferrer">Open Azure DevOps project</a>}
        </div>
      </div>

      {metrics ? (
        <>
          <div className="governance-progress-grid">
            <Card className="metric-card" appearance="outline">
              <span className="metric-label">Expected progress</span>
              <strong className="metric-value">{formatPercent(metrics.plannedProgressPercent)}</strong>
              <ProgressBar value={Math.min(1, Math.max(0, targetProgress / 100))} aria-label="Expected progress from MME plan" />
              <span className="metric-note">{formatHours(metrics.plannedHoursToDate)} of {formatHours(metrics.plannedHoursTotal)} planned hours to date</span>
            </Card>
            <Card className="metric-card" appearance="outline">
              <span className="metric-label">Azure DevOps completion</span>
              <strong className="metric-value">{formatPercent(metrics.actualProgressPercent)}</strong>
              <ProgressBar value={Math.min(1, Math.max(0, actualProgress / 100))} aria-label="Actual completion from Azure DevOps effort" />
              <span className="metric-note">{formatHours(metrics.completedWorkHours)} of {formatHours(metrics.originalEstimateHours)} estimated hours complete</span>
            </Card>
            <Card className="metric-card" appearance="outline">
              <span className="metric-label">Variance to plan</span>
              <strong className="metric-value metric-value-text">{metrics.variancePercentagePoints === null ? 'Not available' : `${metrics.variancePercentagePoints > 0 ? '+' : ''}${metrics.variancePercentagePoints.toFixed(1)} pp`}</strong>
              <span className="metric-note">{metrics.varianceHours > 0 ? '+' : ''}{formatHours(metrics.varianceHours)} hours versus planned effort to date</span>
            </Card>
          </div>
          <div className="governance-baseline">
            <span>MME planned baseline: <strong>{formatHours(metrics.plannedHoursTotal)} h</strong></span>
            <span>Azure DevOps original estimate: <strong>{formatHours(metrics.originalEstimateHours)} h</strong></span>
            <span>Comparison as of {snapshot.asOf ? formatSyncTime(snapshot.asOf) : 'date unavailable'}</span>
          </div>
          <div className="governance-table-wrap">
            <table className="governance-table">
              <caption>MME weekly plan and cumulative expected progress</caption>
              <thead>
                <tr><th scope="col">Week starting</th><th scope="col">Planned hours</th><th scope="col">Cumulative target</th></tr>
              </thead>
              <tbody>
                {metrics.weeklyPlan.map((week) => (
                  <tr key={week.weekStart}>
                    <td>{week.weekStart}</td>
                    <td>{formatHours(week.plannedHours)} h</td>
                    <td>{formatHours(week.cumulativePlannedHours)} h · {formatPercent(week.cumulativeProgressPercent)}</td>
                  </tr>
                ))}
                {!metrics.weeklyPlan.length && <tr><td colSpan={3}>No weekly plan rows were returned by MME.</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="disclaimer-line">Expected progress is cumulative MME planned hours through the comparison date, prorated across weekdays, divided by total planned hours. Actual progress is Azure DevOps completed effort divided by original estimated effort. Confirm that both sources cover the same engagement scope.</p>
        </>
      ) : (
        <div className="governance-empty" role="status">
          <strong>{missingSources.length ? `Waiting for ${missingSources.join(' and ')}` : 'Baseline data is incomplete'}</strong>
          <p>Once both feeds and a comparison timestamp are available, this view will compare MME planned hours with Azure DevOps estimated and completed effort.</p>
          <p>Expected progress uses the MME weekly plan; actual progress uses Azure DevOps completed effort over original estimate. No sample values are shown.</p>
        </div>
      )}
    </section>
  );
}

function PlatformForm({
  platform,
  record,
  onChange,
}: {
  platform: Platform;
  record: EngagementRecord;
  onChange: (next: EngagementRecord) => void;
}) {
  const title = platform === 'aep' ? 'AEP engagement' : 'BizApps Platform DnA engagement';
  const platformLabel = platform === 'aep' ? 'AEP' : 'BizApps Platform DnA';
  const verifiedMissing = record.verificationStatus === 'verified' && (!record.name.trim() || !record.identifier.trim() || !record.url.trim());

  function update<K extends keyof EngagementRecord>(key: K, value: EngagementRecord[K]): void {
    onChange({ ...record, [key]: value });
  }

  return (
    <Card className="engagement-form" appearance="outline">
      <div className="section-heading"><h2><BuildingRegular aria-hidden="true" /> {title}</h2><Badge appearance="tint" color={record.verificationStatus === 'verified' ? 'success' : 'subtle'}>{verificationOptions.find((option) => option.value === record.verificationStatus)?.label}</Badge></div>
      <div className="form-grid">
        <Field label={`${platformLabel} engagement name`} validationState={verifiedMissing && !record.name.trim() ? 'error' : 'none'} validationMessage={verifiedMissing && !record.name.trim() ? 'Record the name before marking this manually verified.' : undefined}>
          <Input aria-label={`${platformLabel} engagement name`} value={record.name} onChange={(_, data) => update('name', data.value)} />
        </Field>
        <Field label={`${platformLabel} engagement identifier`} validationState={verifiedMissing && !record.identifier.trim() ? 'error' : 'none'} validationMessage={verifiedMissing && !record.identifier.trim() ? 'Record the identifier before marking this manually verified.' : undefined}>
          <Input aria-label={`${platformLabel} engagement identifier`} value={record.identifier} onChange={(_, data) => update('identifier', data.value)} />
        </Field>
        <Field label={`${platformLabel} engagement URL`} validationState={verifiedMissing && !record.url.trim() ? 'error' : 'none'} validationMessage={verifiedMissing && !record.url.trim() ? 'Record the URL before marking this manually verified.' : undefined}>
          <Input aria-label={`${platformLabel} engagement URL`} type="url" value={record.url} onChange={(_, data) => update('url', data.value)} placeholder="https://" />
        </Field>
        <Field label={`${platformLabel} manual verification status`}>
          <Select aria-label={`${platformLabel} manual verification status`} value={record.verificationStatus} onChange={(_, data) => update('verificationStatus', data.value as VerificationStatus)}>
            {verificationOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </Select>
        </Field>
        <Field label="Verified by"><Input aria-label={`${platformLabel} verified by`} value={record.verifiedBy} onChange={(_, data) => update('verifiedBy', data.value)} placeholder="Unassigned" /></Field>
        <Field label="Verification date"><Input aria-label={`${platformLabel} verification date`} type="date" value={record.verifiedOn} onChange={(_, data) => update('verifiedOn', data.value)} /></Field>
        <Field label="Evidence reference"><Input aria-label={`${platformLabel} evidence reference`} value={record.evidence} onChange={(_, data) => update('evidence', data.value)} placeholder="Link or record reference" /></Field>
        <Field label="Access or mismatch notes"><Textarea aria-label={`${platformLabel} access or mismatch notes`} rows={2} value={record.accessNotes} onChange={(_, data) => update('accessNotes', data.value)} /></Field>
      </div>
      <div className="form-grid form-grid-three follow-up-fields">
        <Field label="Follow-up owner"><Input aria-label={`${platformLabel} follow-up owner`} value={record.followUpOwner} onChange={(_, data) => update('followUpOwner', data.value)} placeholder="Unassigned" /></Field>
        <Field label="Follow-up due date"><Input aria-label={`${platformLabel} follow-up due date`} type="date" value={record.followUpDueDate} onChange={(_, data) => update('followUpDueDate', data.value)} /></Field>
        <Field label="Follow-up status"><Select aria-label={`${platformLabel} follow-up status`} value={record.followUpStatus} onChange={(_, data) => update('followUpStatus', data.value as FollowUpStatus)}>{followUpOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select></Field>
      </div>
    </Card>
  );
}

export function EngagementsPage() {
  const { data, state, error, reload, saveEngagements } = useWorkbench();
  const [draft, setDraft] = useState<EngagementWorkspace>(data.engagements);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => setDraft(data.engagements), [data.engagements]);

  function updatePlatform(platform: Platform, record: EngagementRecord): void {
    setDraft((current) => ({ ...current, [platform]: record }));
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const verifiedRecords = [draft.aep, draft.bizapps].filter((record) => record.verificationStatus === 'verified');
    if (verifiedRecords.some((record) => !record.name.trim() || !record.identifier.trim() || !record.url.trim())) {
      setFormError('A manually verified record needs a name, identifier, and URL. Nothing has been checked automatically.');
      setSaveMessage(null);
      return;
    }
    if (draft.matchStatus === 'matched' && (draft.aep.verificationStatus !== 'verified' || draft.bizapps.verificationStatus !== 'verified')) {
      setFormError('Record both platform checks as manually verified before recording a match.');
      setSaveMessage(null);
      return;
    }
    try {
      await saveEngagements(draft);
      setFormError(null);
      setSaveMessage('Manual engagement details saved. No platform was checked.');
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'The engagement record could not be saved.');
      setSaveMessage(null);
    }
  }

  const hasRecordedEngagement = Boolean(data.engagements.aep.name || data.engagements.bizapps.name || data.engagements.clientProjectName);

  return (
    <div className="page-stack">
      <section className="page-intro">
        <div className="page-title-row"><ShieldTaskRegular aria-hidden="true" /><Title2 as="h1">Engagement Checks</Title2></div>
        <p>Record AEP and BizApps Platform details that you verify manually. This page never reads either platform.</p>
        <span className="quiet-label">Manual records only · no platform connection</span>
      </section>

      <HvlvReconciliation snapshot={data.financialGovernance.hvlvReconciliation} />
      <DeliveryProgress snapshot={data.financialGovernance} />

      <DataState state={state} error={error} onRetry={() => void reload()} isEmpty={!hasRecordedEngagement} emptyTitle="No engagement details recorded" emptyText="Enter the names, identifiers, and URLs you verify yourself. No client or engagement values are prefilled.">
        <Card className="match-summary" appearance="filled-alternative">
          <div className="section-heading"><h2><ArrowSyncCheckmarkRegular aria-hidden="true" /> Cross-platform match</h2><Badge appearance="tint" color={draft.matchStatus === 'matched' ? 'success' : 'subtle'}>{matchOptions.find((option) => option.value === draft.matchStatus)?.label}</Badge></div>
          <p>Matching is a manual comparison recorded by you. It does not confirm that either platform record exists.</p>
        </Card>
      </DataState>

      <form className="page-stack" onSubmit={(event) => void handleSave(event)}>
        <Card className="form-panel" appearance="outline">
          <div className="section-heading"><h2>Workspace reference</h2><span>Optional and blank by default</span></div>
          <Field label="Client or project name"><Input aria-label="Client or project name" value={draft.clientProjectName} onChange={(_, input) => setDraft((current) => ({ ...current, clientProjectName: input.value }))} /></Field>
        </Card>

        <div className="engagement-grid">
          <PlatformForm platform="aep" record={draft.aep} onChange={(record) => updatePlatform('aep', record)} />
          <PlatformForm platform="bizapps" record={draft.bizapps} onChange={(record) => updatePlatform('bizapps', record)} />
        </div>

        <Card className="form-panel" appearance="outline">
          <div className="section-heading"><h2>Match and follow-up</h2><span>Enter only what you personally verify</span></div>
          <div className="form-grid form-grid-two">
            <Field label="Manual cross-platform status"><Select aria-label="Manual cross-platform status" value={draft.matchStatus} onChange={(_, input) => setDraft((current) => ({ ...current, matchStatus: input.value as MatchStatus }))}>{matchOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select></Field>
            <Field label="Follow-up status"><Select aria-label="Match follow-up status" value={draft.matchFollowUpStatus} onChange={(_, input) => setDraft((current) => ({ ...current, matchFollowUpStatus: input.value as FollowUpStatus }))}>{followUpOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select></Field>
            <Field label="Follow-up owner"><Input aria-label="Match follow-up owner" value={draft.matchOwner} onChange={(_, input) => setDraft((current) => ({ ...current, matchOwner: input.value }))} placeholder="Unassigned" /></Field>
            <Field label="Follow-up due date"><Input aria-label="Match follow-up due date" type="date" value={draft.matchDueDate} onChange={(_, input) => setDraft((current) => ({ ...current, matchDueDate: input.value }))} /></Field>
            <Field label="Mismatch or follow-up notes"><Textarea aria-label="Mismatch or follow-up notes" rows={3} value={draft.matchNotes} onChange={(_, input) => setDraft((current) => ({ ...current, matchNotes: input.value }))} /></Field>
          </div>
          {formError && <p className="form-error" role="alert">{formError}</p>}
          {saveMessage && <p className="form-success" role="status">{saveMessage}</p>}
          <div className="form-actions"><Button appearance="primary" type="submit">Save manual engagement checks</Button></div>
        </Card>
      </form>
      <p className="disclaimer-line">This is a manual record only. No AEP, BizApps Platform, or agent-service connection is active.</p>
    </div>
  );
}