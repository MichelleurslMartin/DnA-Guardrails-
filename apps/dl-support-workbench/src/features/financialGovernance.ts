import type { FinancialGovernanceSnapshot, HvlvReconciliationSnapshot } from '../api/types';

export interface FinancialGovernanceMetrics {
  plannedHoursTotal: number;
  plannedHoursToDate: number;
  plannedProgressPercent: number | null;
  originalEstimateHours: number;
  completedWorkHours: number;
  actualProgressPercent: number | null;
  varianceHours: number;
  variancePercentagePoints: number | null;
  weeklyPlan: {
    weekStart: string;
    plannedHours: number;
    cumulativePlannedHours: number;
    cumulativeProgressPercent: number | null;
  }[];
}

export interface ResourceReconciliationRow {
  enterpriseId: string;
  resourceName: string;
  costCollectorId: string;
  plannedHours: number;
  submittedHours: number | null;
  varianceHours: number | null;
  variancePercent: number | null;
  status: 'submitted' | 'awaiting' | 'unplanned';
}

export interface HvlvReconciliationMetrics {
  rows: ResourceReconciliationRow[];
  plannedHoursTotal: number;
  submittedHoursTotal: number;
  azureDevOpsPlannedHours: number | null;
  hvlvVsMmeVarianceHours: number;
  mmeVsAzureDevOpsVarianceHours: number | null;
  hvlvVsAzureDevOpsVarianceHours: number | null;
  pendingPlanHours: number;
  matchedPlannedHours: number;
  varianceHours: number;
  coveragePercent: number | null;
  unplannedActualHours: number;
}

function resourceKey(enterpriseId: string, costCollectorId: string): string {
  return JSON.stringify([enterpriseId, costCollectorId]);
}

export function calculateHvlvReconciliation(
  snapshot: HvlvReconciliationSnapshot,
): HvlvReconciliationMetrics {
  const planByResource = new Map<string, { enterpriseId: string; resourceName: string; costCollectorId: string; plannedHours: number }>();
  const actualByResource = new Map<string, { enterpriseId: string; resourceName: string; costCollectorId: string; submittedHours: number }>();

  for (const resource of snapshot.mmeResourcePlan) {
    const key = resourceKey(resource.enterpriseId, resource.costCollectorId);
    const current = planByResource.get(key);
    planByResource.set(key, {
      ...resource,
      plannedHours: (current?.plannedHours ?? 0) + Math.max(0, resource.plannedHours),
    });
  }

  for (const resource of snapshot.hvlvSubmissions) {
    const key = resourceKey(resource.enterpriseId, resource.costCollectorId);
    const current = actualByResource.get(key);
    actualByResource.set(key, {
      ...resource,
      submittedHours: (current?.submittedHours ?? 0) + Math.max(0, resource.submittedHours),
    });
  }

  let pendingPlanHours = 0;
  let matchedPlannedHours = 0;
  let varianceHours = 0;
  let unplannedActualHours = 0;
  const keys = new Set([...planByResource.keys(), ...actualByResource.keys()]);
  const rows = [...keys].map((key): ResourceReconciliationRow => {
    const plan = planByResource.get(key);
    const actual = actualByResource.get(key);
    const plannedHours = plan?.plannedHours ?? 0;
    const submittedHours = actual?.submittedHours ?? null;
    const variance = plan && actual ? submittedHours! - plannedHours : null;

    if (plan && actual) {
      matchedPlannedHours += plannedHours;
      varianceHours += variance ?? 0;
    } else if (plan) {
      pendingPlanHours += plannedHours;
    } else if (actual) {
      unplannedActualHours += actual.submittedHours;
    }

    return {
      enterpriseId: plan?.enterpriseId ?? actual?.enterpriseId ?? '',
      resourceName: plan?.resourceName ?? actual?.resourceName ?? 'Unknown resource',
      costCollectorId: plan?.costCollectorId ?? actual?.costCollectorId ?? '',
      plannedHours,
      submittedHours,
      varianceHours: variance,
      variancePercent: variance !== null && plannedHours > 0 ? variance / plannedHours * 100 : null,
      status: plan && actual ? 'submitted' : plan ? 'awaiting' : 'unplanned',
    };
  }).sort((left, right) => left.resourceName.localeCompare(right.resourceName) || left.enterpriseId.localeCompare(right.enterpriseId));

  const plannedHoursTotal = [...planByResource.values()].reduce((total, resource) => total + resource.plannedHours, 0);
  const submittedHoursTotal = [...actualByResource.values()].reduce((total, resource) => total + resource.submittedHours, 0);
  const azureDevOpsPlannedHours = snapshot.azureDevOpsPlan
    ? Math.max(0, snapshot.azureDevOpsPlan.plannedHours)
    : null;

  return {
    rows,
    plannedHoursTotal,
    submittedHoursTotal,
    azureDevOpsPlannedHours,
    hvlvVsMmeVarianceHours: submittedHoursTotal - plannedHoursTotal,
    mmeVsAzureDevOpsVarianceHours: azureDevOpsPlannedHours === null ? null : plannedHoursTotal - azureDevOpsPlannedHours,
    hvlvVsAzureDevOpsVarianceHours: azureDevOpsPlannedHours === null ? null : submittedHoursTotal - azureDevOpsPlannedHours,
    pendingPlanHours,
    matchedPlannedHours,
    varianceHours,
    coveragePercent: plannedHoursTotal > 0 ? matchedPlannedHours / plannedHoursTotal * 100 : null,
    unplannedActualHours,
  };
}

function elapsedWorkdayFraction(weekStart: string, asOf: string): number {
  const weekStartDate = new Date(`${weekStart}T00:00:00Z`);
  const asOfDate = new Date(asOf);
  if (Number.isNaN(weekStartDate.getTime()) || Number.isNaN(asOfDate.getTime())) return 0;

  const asOfDay = Date.UTC(asOfDate.getUTCFullYear(), asOfDate.getUTCMonth(), asOfDate.getUTCDate());
  const start = weekStartDate.getTime();
  let workdaysInWeek = 0;
  let elapsedWorkdays = 0;

  for (let day = 0; day < 7; day += 1) {
    const currentDay = start + day * 24 * 60 * 60 * 1000;
    const weekday = new Date(currentDay).getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    workdaysInWeek += 1;
    if (currentDay <= asOfDay) elapsedWorkdays += 1;
  }

  return workdaysInWeek ? elapsedWorkdays / workdaysInWeek : 0;
}

export function calculateFinancialGovernanceMetrics(
  snapshot: FinancialGovernanceSnapshot,
): FinancialGovernanceMetrics | null {
  if (!snapshot.asOf || !snapshot.mme || !snapshot.azureDevOps) return null;

  const sortedPlan = [...snapshot.mme.weeklyPlan].sort((left, right) => left.weekStart.localeCompare(right.weekStart));
  const plannedHoursTotal = sortedPlan.reduce((total, week) => total + Math.max(0, week.plannedHours), 0);
  let plannedHoursToDate = 0;
  const weeklyPlan = sortedPlan.map((week) => {
    plannedHoursToDate += Math.max(0, week.plannedHours) * elapsedWorkdayFraction(week.weekStart, snapshot.asOf as string);
    return {
      weekStart: week.weekStart,
      plannedHours: week.plannedHours,
      cumulativePlannedHours: plannedHoursToDate,
      cumulativeProgressPercent: plannedHoursTotal > 0 ? plannedHoursToDate / plannedHoursTotal * 100 : null,
    };
  });

  const originalEstimateHours = Math.max(0, snapshot.azureDevOps.originalEstimateHours);
  const completedWorkHours = Math.max(0, snapshot.azureDevOps.completedWorkHours);
  const plannedProgressPercent = plannedHoursTotal > 0 ? plannedHoursToDate / plannedHoursTotal * 100 : null;
  const actualProgressPercent = originalEstimateHours > 0 ? completedWorkHours / originalEstimateHours * 100 : null;

  return {
    plannedHoursTotal,
    plannedHoursToDate,
    plannedProgressPercent,
    originalEstimateHours,
    completedWorkHours,
    actualProgressPercent,
    varianceHours: completedWorkHours - plannedHoursToDate,
    variancePercentagePoints: plannedProgressPercent !== null && actualProgressPercent !== null
      ? actualProgressPercent - plannedProgressPercent
      : null,
    weeklyPlan,
  };
}