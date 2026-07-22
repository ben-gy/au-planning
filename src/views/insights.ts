// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Ben Richardson — https://benrichardson.dev
// Additional terms under AGPL-3.0 section 7(b) apply; see ADDITIONAL-TERMS.md.
import type { CouncilStats } from '../types';
import { formatNumber } from '../utils';
import { generateInsights } from '../analysis';

const SEVERITY_ICONS: Record<string, string> = {
  alert: '🔴',
  warning: '🟡',
  info: '🔵',
};

const SEVERITY_BG: Record<string, string> = {
  alert: '#fee2e2',
  warning: '#fef3c7',
  info: '#dbeafe',
};

const SEVERITY_BORDER: Record<string, string> = {
  alert: '#fca5a5',
  warning: '#fde68a',
  info: '#93c5fd',
};

export function renderInsightsView(
  container: HTMLElement,
  councils: CouncilStats[],
  onCouncilClick: (slug: string) => void
): void {
  const insights = generateInsights(councils);

  const alertCount = insights.filter(i => i.severity === 'alert').length;
  const warningCount = insights.filter(i => i.severity === 'warning').length;
  const infoCount = insights.filter(i => i.severity === 'info').length;

  // Summary stats
  const totalApps = councils.reduce((s, c) => s + c.recordCount, 0);
  const totalCouncils = councils.length;
  const avgApproval = councils.filter(c => c.approvalRate !== null).reduce((s, c) => s + c.approvalRate!, 0) / (councils.filter(c => c.approvalRate !== null).length || 1);
  const avgProcessing = councils.filter(c => c.medianProcessingDays !== null).reduce((s, c) => s + c.medianProcessingDays!, 0) / (councils.filter(c => c.medianProcessingDays !== null).length || 1);

  container.innerHTML = `
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-value">${formatNumber(insights.length)}</div>
        <div class="stat-label">Insights found</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:var(--status-bad)">${alertCount}</div>
        <div class="stat-label">Alerts</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:var(--status-warn)">${warningCount}</div>
        <div class="stat-label">Warnings</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:var(--status-info)">${infoCount}</div>
        <div class="stat-label">Info</div>
      </div>
    </div>

    <div style="margin-bottom:var(--space-lg);padding:var(--space-lg);background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--radius-md);">
      <div class="chart-title">National Summary</div>
      <div class="chart-subtitle" style="margin-bottom:0;">
        ${formatNumber(totalApps)} applications across ${totalCouncils} council${totalCouncils !== 1 ? 's' : ''}.
        Average approval rate: <strong>${avgApproval.toFixed(1)}%</strong>.
        Average processing time: <strong>${Math.round(avgProcessing)} days</strong>.
      </div>
    </div>

    <div class="insights-grid">
      ${insights.length === 0 ? '<div class="loading">No insights detected — add more councils to enable comparative analysis.</div>' : ''}
      ${insights.map(insight => `
        <div class="insight-card" style="background:${SEVERITY_BG[insight.severity]};border:1px solid ${SEVERITY_BORDER[insight.severity]};" ${insight.councilSlug ? `data-slug="${insight.councilSlug}"` : ''}>
          <div class="insight-header">
            <span class="insight-severity">${SEVERITY_ICONS[insight.severity]}</span>
            <span class="insight-title">${insight.title}</span>
          </div>
          <div class="insight-body">${insight.description}</div>
          ${insight.councilSlug ? `<div class="insight-action"><button class="insight-link" data-slug="${insight.councilSlug}">View ${insight.councilName} →</button></div>` : ''}
        </div>
      `).join('')}
    </div>
  `;

  // Click handlers for insight cards
  container.querySelectorAll<HTMLElement>('.insight-link').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const slug = btn.dataset.slug;
      if (slug) onCouncilClick(slug);
    });
  });
}
