// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Ben Richardson — https://benrichardson.dev
// Additional terms under AGPL-3.0 section 7(b) apply; see ADDITIONAL-TERMS.md.
import type { CouncilStats, Insight } from './types';

/** Generate actionable insights from council stats */
export function generateInsights(councils: CouncilStats[]): Insight[] {
  const insights: Insight[] = [];
  if (councils.length === 0) return insights;

  // Compute medians across all councils
  const processingTimes = councils.filter(c => c.medianProcessingDays !== null).map(c => c.medianProcessingDays!);
  const approvalRates = councils.filter(c => c.approvalRate !== null).map(c => c.approvalRate!);
  const rejectionRates = councils.filter(c => c.rejectionRate !== null).map(c => c.rejectionRate!);

  const medianProcessing = sortedMedian(processingTimes);
  const medianApproval = sortedMedian(approvalRates);
  const medianRejection = sortedMedian(rejectionRates);

  for (const c of councils) {
    // Processing time outliers (>2x median)
    if (c.medianProcessingDays !== null && medianProcessing > 0) {
      const ratio = c.medianProcessingDays / medianProcessing;
      if (ratio > 2) {
        insights.push({
          id: `slow-${c.slug}`,
          title: `${c.name} processes applications ${ratio.toFixed(1)}x slower than average`,
          description: `Median processing time is ${c.medianProcessingDays} days, compared to the overall median of ${Math.round(medianProcessing)} days. This means applicants wait significantly longer for decisions.`,
          severity: ratio > 3 ? 'alert' : 'warning',
          councilSlug: c.slug,
          councilName: c.name,
          metric: 'processingTime',
          value: c.medianProcessingDays,
          comparison: Math.round(medianProcessing),
        });
      } else if (ratio < 0.5 && c.decidedCount > 50) {
        insights.push({
          id: `fast-${c.slug}`,
          title: `${c.name} is ${(1 / ratio).toFixed(1)}x faster than average at processing`,
          description: `Median processing time is only ${c.medianProcessingDays} days, compared to ${Math.round(medianProcessing)} days overall.`,
          severity: 'info',
          councilSlug: c.slug,
          councilName: c.name,
          metric: 'processingTime',
          value: c.medianProcessingDays,
          comparison: Math.round(medianProcessing),
        });
      }
    }

    // High rejection rate (>2x median)
    if (c.rejectionRate !== null && medianRejection > 0) {
      const ratio = c.rejectionRate / medianRejection;
      if (ratio > 2 && c.refusedCount > 10) {
        insights.push({
          id: `reject-${c.slug}`,
          title: `${c.name} refuses ${c.rejectionRate}% of applications — ${ratio.toFixed(1)}x the average`,
          description: `${c.refusedCount} applications refused out of ${c.decidedCount} decided. The overall refusal rate is ${medianRejection.toFixed(1)}%.`,
          severity: ratio > 3 ? 'alert' : 'warning',
          councilSlug: c.slug,
          councilName: c.name,
          metric: 'rejectionRate',
          value: c.rejectionRate,
          comparison: Math.round(medianRejection * 10) / 10,
        });
      }
    }

    // Low approval rate
    if (c.approvalRate !== null && medianApproval > 0 && c.approvalRate < medianApproval * 0.7 && c.decidedCount > 50) {
      insights.push({
        id: `low-approval-${c.slug}`,
        title: `${c.name} has a low approval rate of ${c.approvalRate}%`,
        description: `Only ${c.approvedCount} of ${c.decidedCount} decided applications were approved, compared to the average of ${medianApproval.toFixed(1)}%.`,
        severity: 'warning',
        councilSlug: c.slug,
        councilName: c.name,
        metric: 'approvalRate',
        value: c.approvalRate,
        comparison: Math.round(medianApproval * 10) / 10,
      });
    }

    // Stalled applications (>30% pending for >120 days)
    if (c.stalledRate !== null && c.stalledRate > 30 && c.stalledCount > 20) {
      insights.push({
        id: `stalled-${c.slug}`,
        title: `${c.stalledCount} applications stalled at ${c.name} (${c.stalledRate}% of pending)`,
        description: `${c.stalledRate}% of pending applications have been waiting over 120 days with no decision. This suggests a backlog or resourcing issue.`,
        severity: c.stalledRate > 50 ? 'alert' : 'warning',
        councilSlug: c.slug,
        councilName: c.name,
        metric: 'stalledRate',
        value: c.stalledRate,
      });
    }

    // Category concentration (>60% in one category)
    if (c.recordCount > 50) {
      for (const [cat, count] of Object.entries(c.byCategory)) {
        const pct = (count / c.recordCount) * 100;
        if (pct > 60) {
          insights.push({
            id: `concentration-${c.slug}-${cat}`,
            title: `${pct.toFixed(0)}% of ${c.name}'s applications are ${cat}`,
            description: `${count} of ${c.recordCount} applications are classified as "${cat}". This unusual concentration may reflect the area's development patterns or a classification issue.`,
            severity: 'info',
            councilSlug: c.slug,
            councilName: c.name,
            metric: 'categoryConcentration',
            value: Math.round(pct),
          });
        }
      }
    }

    // Very high per-capita rate
    if (c.applicationsPerCapita !== null && c.applicationsPerCapita > 100) {
      insights.push({
        id: `high-percapita-${c.slug}`,
        title: `${c.name} has ${c.applicationsPerCapita} applications per 10,000 residents`,
        description: `This is a high rate of development activity relative to population. It may indicate a growth area or high-density development.`,
        severity: 'info',
        councilSlug: c.slug,
        councilName: c.name,
        metric: 'perCapita',
        value: c.applicationsPerCapita,
      });
    }

    // Year-over-year volume changes
    const months = Object.entries(c.byMonth).sort((a, b) => a[0].localeCompare(b[0]));
    if (months.length >= 24) {
      const thisYear = months.filter(([m]) => m.startsWith(new Date().getFullYear().toString()));
      const lastYear = months.filter(([m]) => m.startsWith((new Date().getFullYear() - 1).toString()));
      const thisYearTotal = thisYear.reduce((s, [, v]) => s + v, 0);
      const lastYearTotal = lastYear.reduce((s, [, v]) => s + v, 0);
      // Annualise this year's total
      const thisYearMonths = thisYear.length || 1;
      const annualised = Math.round(thisYearTotal * (12 / thisYearMonths));
      if (lastYearTotal > 50 && annualised > lastYearTotal * 2) {
        const pctChange = Math.round(((annualised - lastYearTotal) / lastYearTotal) * 100);
        insights.push({
          id: `yoy-spike-${c.slug}`,
          title: `${c.name} is on track for ${pctChange}% more applications this year`,
          description: `Annualised ${new Date().getFullYear()} volume is ${annualised}, compared to ${lastYearTotal} in ${new Date().getFullYear() - 1}. This is a significant spike in development activity.`,
          severity: 'warning',
          councilSlug: c.slug,
          councilName: c.name,
          metric: 'yoyChange',
          value: pctChange,
        });
      }
    }
  }

  // Sort: alerts first, then warnings, then info
  const severityOrder: Record<string, number> = { alert: 0, warning: 1, info: 2 };
  insights.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return insights;
}

function sortedMedian(arr: number[]): number {
  if (arr.length === 0) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
