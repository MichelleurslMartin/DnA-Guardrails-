import { describe, expect, it } from 'vitest';
import type { PortfolioProjectLinks, PortfolioProjectSnapshot } from '../api/types';
import { reviewPortfolioProjects } from './portfolioMetrics';

const emptyLinks: PortfolioProjectLinks = {
  mme: { url: '', externalId: '' },
  dna: { url: '', externalId: '' },
  aep: { url: '', externalId: '' },
  sharepoint: { url: '', externalId: '' },
  myWizzard: { url: '', externalId: '' },
  hvlv: { url: '', externalId: '' },
};

const projectWithVariance: PortfolioProjectSnapshot = {
  projectId: 'sample-1',
  projectName: 'Sample ERP rollout',
  clientName: 'Sample client',
  sourceLinks: emptyLinks,
  updatedAt: '2026-11-09T12:00:00Z',
  financialGovernance: {
    asOf: '2026-11-10T12:00:00Z',
    mme: {
      engagementUrl: 'https://example.test/mme/sample-1',
      lastSyncedAt: '2026-11-10T12:00:00Z',
      weeklyPlan: [
        { weekStart: '2026-11-02', plannedHours: 100 },
        { weekStart: '2026-11-09', plannedHours: 100 },
      ],
    },
    azureDevOps: {
      projectUrl: 'https://example.test/ado/sample-1',
      lastSyncedAt: '2026-11-10T12:00:00Z',
      originalEstimateHours: 200,
      completedWorkHours: 50,
    },
    hvlvReconciliation: {
      payPeriodStart: '2026-11-02',
      payPeriodEnd: '2026-11-15',
      mmeEngagementUrl: 'https://example.test/mme/sample-1',
      mmeLastSyncedAt: '2026-11-10T12:00:00Z',
      hvlvSourceUrl: 'https://example.test/hvlv/sample-1',
      hvlvLastSyncedAt: '2026-11-10T12:00:00Z',
      azureDevOpsPlan: { projectUrl: 'https://example.test/ado/sample-1', lastSyncedAt: '2026-11-10T12:00:00Z', plannedHours: 180 },
      mmeResourcePlan: [{ enterpriseId: 'E001', resourceName: 'Consultant A', costCollectorId: 'CC01', plannedHours: 100 }],
      hvlvSubmissions: [{ enterpriseId: 'E001', resourceName: 'Consultant A', costCollectorId: 'CC01', submittedHours: 80 }],
    },
  },
};

const projectWaitingForFeeds: PortfolioProjectSnapshot = {
  projectId: 'sample-2',
  projectName: 'Sample CRM migration',
  clientName: 'Another sample client',
  sourceLinks: emptyLinks,
  updatedAt: '2026-11-09T12:00:00Z',
  financialGovernance: { asOf: null, mme: null, azureDevOps: null, hvlvReconciliation: null },
};

describe('portfolio project review', () => {
  it('flags variance separately from missing source data', () => {
    const [varianceProject, waitingProject] = reviewPortfolioProjects([projectWithVariance, projectWaitingForFeeds]);

    expect(varianceProject.status).toBe('review');
    expect(varianceProject.financialVariance).toBe(true);
    expect(varianceProject.missingSources).toEqual([]);
    expect(waitingProject.status).toBe('waiting');
    expect(waitingProject.financialVariance).toBe(false);
    expect(waitingProject.missingSources.length).toBeGreaterThan(0);
  });
});