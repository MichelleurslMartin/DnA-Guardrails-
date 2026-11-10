import { describe, expect, it } from 'vitest';
import type { FinancialGovernanceSnapshot } from '../api/types';
import { calculateFinancialGovernanceMetrics } from './financialGovernance';

const connectedSnapshot: FinancialGovernanceSnapshot = {
  asOf: '2026-11-09T12:00:00Z',
  mme: {
    engagementUrl: 'https://example.test/mme/engagement',
    lastSyncedAt: '2026-11-09T12:00:00Z',
    weeklyPlan: [
      { weekStart: '2026-11-02', plannedHours: 40 },
      { weekStart: '2026-11-09', plannedHours: 40 },
    ],
  },
  azureDevOps: {
    projectUrl: 'https://example.test/ado/project',
    lastSyncedAt: '2026-11-09T12:00:00Z',
    originalEstimateHours: 90,
    completedWorkHours: 45,
  },
    hvlvReconciliation: null,
};

describe('financial governance effort comparison', () => {
  it('compares prorated MME planned effort with Azure DevOps completed effort', () => {
    const metrics = calculateFinancialGovernanceMetrics(connectedSnapshot);

    expect(metrics?.plannedHoursTotal).toBe(80);
    expect(metrics?.plannedHoursToDate).toBe(48);
    expect(metrics?.plannedProgressPercent).toBe(60);
    expect(metrics?.actualProgressPercent).toBe(50);
    expect(metrics?.varianceHours).toBe(-3);
    expect(metrics?.variancePercentagePoints).toBe(-10);
  });

  it('waits for both source snapshots and a common as-of time', () => {
    expect(calculateFinancialGovernanceMetrics({ asOf: null, mme: null, azureDevOps: null, hvlvReconciliation: null })).toBeNull();
    expect(calculateFinancialGovernanceMetrics({ ...connectedSnapshot, azureDevOps: null })).toBeNull();
  });

  it('reconciles by enterprise ID and cost collector and flags missing or unplanned hours', async () => {
    const { calculateHvlvReconciliation } = await import('./financialGovernance');
    const result = calculateHvlvReconciliation({
      payPeriodStart: '2026-11-02',
      payPeriodEnd: '2026-11-15',
      mmeEngagementUrl: 'https://example.test/mme/engagement',
      mmeLastSyncedAt: '2026-11-15T12:00:00Z',
      hvlvSourceUrl: 'https://example.test/hvlv/project',
      hvlvLastSyncedAt: '2026-11-15T12:00:00Z',
      mmeResourcePlan: [
        { enterpriseId: 'E001', resourceName: 'Consultant A', costCollectorId: 'CC01', plannedHours: 80 },
        { enterpriseId: 'E002', resourceName: 'Consultant B', costCollectorId: 'CC01', plannedHours: 40 },
      ],
      hvlvSubmissions: [
        { enterpriseId: 'E001', resourceName: 'Consultant A', costCollectorId: 'CC01', submittedHours: 32 },
        { enterpriseId: 'E001', resourceName: 'Consultant A', costCollectorId: 'CC01', submittedHours: 40 },
        { enterpriseId: 'E003', resourceName: 'Consultant C', costCollectorId: 'CC02', submittedHours: 10 },
      ],
      azureDevOpsPlan: { projectUrl: 'https://example.test/ado/project', lastSyncedAt: '2026-11-15T12:00:00Z', plannedHours: 110 },
    });

    expect(result.plannedHoursTotal).toBe(120);
    expect(result.submittedHoursTotal).toBe(82);
    expect(result.azureDevOpsPlannedHours).toBe(110);
    expect(result.hvlvVsMmeVarianceHours).toBe(-38);
    expect(result.mmeVsAzureDevOpsVarianceHours).toBe(10);
    expect(result.hvlvVsAzureDevOpsVarianceHours).toBe(-28);
    expect(result.pendingPlanHours).toBe(40);
    expect(result.matchedPlannedHours).toBe(80);
    expect(result.coveragePercent).toBeCloseTo(66.67, 1);
    expect(result.varianceHours).toBe(-8);
    expect(result.unplannedActualHours).toBe(10);
    expect(result.rows.map((row) => row.status)).toEqual(['submitted', 'awaiting', 'unplanned']);
  });
});