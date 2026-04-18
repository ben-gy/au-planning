import { describe, expect, it } from 'vitest';
import { generateInsights } from '../src/analysis';
import type { CouncilStats } from '../src/types';

function mockCouncil(overrides: Partial<CouncilStats> = {}): CouncilStats {
  return {
    slug: 'test-council',
    name: 'Test Council',
    state: 'VIC',
    lat: -38,
    lng: 145,
    recordCount: 500,
    population: 100000,
    applicationsPerCapita: 50,
    medianProcessingDays: 60,
    avgProcessingDays: 65,
    approvalRate: 80,
    rejectionRate: 10,
    withdrawalRate: 10,
    stalledCount: 5,
    stalledRate: 10,
    pendingCount: 50,
    approvedCount: 400,
    refusedCount: 50,
    decidedCount: 450,
    byCategory: { Residential: 200, Subdivision: 150, Commercial: 50, Other: 100 },
    byDecision: { Approved: 400, Refused: 50 },
    byMonth: {},
    topSuburbs: [['Suburb A', 100], ['Suburb B', 80]],
    flows: {},
    processingTimes: Array.from({ length: 100 }, (_, i) => i * 2),
    ...overrides,
  };
}

describe('generateInsights', () => {
  it('returns empty array for no councils', () => {
    expect(generateInsights([])).toEqual([]);
  });

  it('detects slow processing time outliers', () => {
    const councils = [
      mockCouncil({ slug: 'fast', name: 'Fast Council', medianProcessingDays: 30 }),
      mockCouncil({ slug: 'normal', name: 'Normal Council', medianProcessingDays: 40 }),
      mockCouncil({ slug: 'slow', name: 'Slow Council', medianProcessingDays: 100 }),
    ];
    const insights = generateInsights(councils);
    const slowInsight = insights.find(i => i.id === 'slow-slow');
    expect(slowInsight).toBeDefined();
    expect(slowInsight?.severity).toBe('warning');
    expect(slowInsight?.title).toContain('Slow Council');
  });

  it('detects extremely slow processing (alert severity)', () => {
    const councils = [
      mockCouncil({ slug: 'normal', medianProcessingDays: 30 }),
      mockCouncil({ slug: 'normal2', medianProcessingDays: 40 }),
      mockCouncil({ slug: 'very-slow', name: 'Very Slow', medianProcessingDays: 300 }),
    ];
    const insights = generateInsights(councils);
    const alertInsight = insights.find(i => i.id === 'slow-very-slow');
    expect(alertInsight).toBeDefined();
    expect(alertInsight?.severity).toBe('alert');
  });

  it('detects fast processing (info)', () => {
    const councils = [
      mockCouncil({ slug: 'normal', medianProcessingDays: 100, decidedCount: 100 }),
      mockCouncil({ slug: 'fast', name: 'Fast Council', medianProcessingDays: 20, decidedCount: 100 }),
    ];
    const insights = generateInsights(councils);
    const fastInsight = insights.find(i => i.id === 'fast-fast');
    expect(fastInsight).toBeDefined();
    expect(fastInsight?.severity).toBe('info');
  });

  it('detects high rejection rate', () => {
    const councils = [
      mockCouncil({ slug: 'normal', rejectionRate: 5, refusedCount: 20 }),
      mockCouncil({ slug: 'normal2', rejectionRate: 6, refusedCount: 20 }),
      mockCouncil({ slug: 'rejecter', name: 'High Reject', rejectionRate: 25, refusedCount: 50 }),
    ];
    const insights = generateInsights(councils);
    const rejectInsight = insights.find(i => i.id === 'reject-rejecter');
    expect(rejectInsight).toBeDefined();
    expect(rejectInsight?.title).toContain('25%');
  });

  it('detects stalled applications', () => {
    const council = mockCouncil({
      slug: 'stalled',
      name: 'Stalled Council',
      stalledCount: 100,
      stalledRate: 80,
      pendingCount: 125,
    });
    const insights = generateInsights([council]);
    const stalledInsight = insights.find(i => i.id === 'stalled-stalled');
    expect(stalledInsight).toBeDefined();
    expect(stalledInsight?.severity).toBe('alert');
  });

  it('detects category concentration', () => {
    const council = mockCouncil({
      slug: 'concentrated',
      name: 'Concentrated Council',
      recordCount: 200,
      byCategory: { Residential: 150, Other: 50 },
    });
    const insights = generateInsights([council]);
    const concInsight = insights.find(i => i.id?.startsWith('concentration-'));
    expect(concInsight).toBeDefined();
    expect(concInsight?.title).toContain('Residential');
  });

  it('sorts insights by severity (alerts first)', () => {
    const councils = [
      mockCouncil({ slug: 'a', medianProcessingDays: 30, stalledCount: 100, stalledRate: 80, pendingCount: 125 }),
      mockCouncil({ slug: 'b', medianProcessingDays: 200 }),
    ];
    const insights = generateInsights(councils);
    if (insights.length >= 2) {
      const severities = insights.map(i => i.severity);
      const alertIdx = severities.indexOf('alert');
      const infoIdx = severities.indexOf('info');
      if (alertIdx >= 0 && infoIdx >= 0) {
        expect(alertIdx).toBeLessThan(infoIdx);
      }
    }
  });
});
