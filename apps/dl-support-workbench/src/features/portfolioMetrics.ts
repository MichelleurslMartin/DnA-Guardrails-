import type { PortfolioProjectSnapshot } from '../api/types';
import { calculateFinancialGovernanceMetrics, calculateHvlvReconciliation, type FinancialGovernanceMetrics, type HvlvReconciliationMetrics } from './financialGovernance';

export interface PortfolioProjectReview {
  project: PortfolioProjectSnapshot;
  financial: HvlvReconciliationMetrics | null;
  progress: FinancialGovernanceMetrics | null;
  missingSources: string[];
  financialVariance: boolean;
  progressVariance: boolean;
  status: 'review' | 'waiting' | 'no-variance';
}

function hasVariance(value: number | null): boolean {
  return value !== null && Math.abs(value) > 0.01;
}

export function reviewPortfolioProjects(projects: PortfolioProjectSnapshot[]): PortfolioProjectReview[] {
  return projects.map((project) => {
    const snapshot = project.financialGovernance;
    const hvlvSnapshot = snapshot.hvlvReconciliation;
    const financial = hvlvSnapshot ? calculateHvlvReconciliation(hvlvSnapshot) : null;
    const progress = calculateFinancialGovernanceMetrics(snapshot);
    const missingSources = [
      !hvlvSnapshot && 'MME/HVLV pay-period data',
      hvlvSnapshot && !hvlvSnapshot.azureDevOpsPlan && 'Azure DevOps period task plan',
      !snapshot.mme && 'MME weekly progress plan',
      !snapshot.azureDevOps && 'Azure DevOps completed-effort data',
    ].filter((source): source is string => Boolean(source));
    const financialVariance = Boolean(financial && (
      hasVariance(financial.hvlvVsMmeVarianceHours)
      || hasVariance(financial.mmeVsAzureDevOpsVarianceHours)
      || hasVariance(financial.hvlvVsAzureDevOpsVarianceHours)
      || financial.pendingPlanHours > 0
      || financial.unplannedActualHours > 0
    ));
    const progressVariance = hasVariance(progress?.variancePercentagePoints ?? null);
    const status = financialVariance || progressVariance
      ? 'review'
      : missingSources.length
        ? 'waiting'
        : 'no-variance';

    return { project, financial, progress, missingSources, financialVariance, progressVariance, status };
  });
}