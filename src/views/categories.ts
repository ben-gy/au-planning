// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Ben Richardson — https://benrichardson.dev
// Additional terms under AGPL-3.0 section 7(b) apply; see ADDITIONAL-TERMS.md.
import type { Aggregates } from '../types';
import { formatNumber, sortedEntries, categoryColor } from '../utils';
import { renderHorizontalBars } from '../charts';

export function renderCategories(container: HTMLElement, agg: Aggregates): void {
  const entries = sortedEntries(agg.byCategory);

  // Compute percentages
  const total = entries.reduce((s, d) => s + d[1], 0);

  container.innerHTML = `
    <div class="chart-grid">
      <div class="chart-card" style="grid-column: 1 / -1;">
        <div class="chart-title">Applications by Category</div>
        <div class="chart-subtitle">
          ${formatNumber(total)} total applications classified by development type.
          <span class="glossary-link" data-term="Development Application" data-def="A formal application to a local council for permission to carry out building work, change the use of a property, or subdivide land.">What is a DA?</span>
        </div>
        <div id="cat-bars"></div>
      </div>
      <div class="chart-card">
        <div class="chart-title">Category Breakdown</div>
        <div class="chart-subtitle">Share of each category as a percentage of total applications</div>
        <div class="cat-breakdown">
          ${entries.map(([cat, count]) => {
            const pct = ((count / total) * 100).toFixed(1);
            return `
              <div style="display:flex;align-items:center;gap:var(--space-md);padding:var(--space-xs) 0;border-bottom:1px solid var(--border-subtle);">
                <div style="width:12px;height:12px;border-radius:3px;background:${categoryColor(cat)};flex-shrink:0;"></div>
                <div style="flex:1;font-size:var(--font-size-sm);">${cat}</div>
                <div style="font-family:var(--font-mono);font-size:var(--font-size-sm);color:var(--text-secondary);">${formatNumber(count)}</div>
                <div style="font-family:var(--font-mono);font-size:var(--font-size-xs);color:var(--text-tertiary);width:50px;text-align:right;">${pct}%</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      <div class="chart-card">
        <div class="chart-title">Decision Outcomes</div>
        <div class="chart-subtitle">How applications were decided across all categories</div>
        <div id="decision-bars"></div>
      </div>
    </div>
  `;

  const barsEl = document.getElementById('cat-bars');
  if (barsEl) {
    renderHorizontalBars(barsEl, entries, { colorFn: categoryColor });
  }

  const decisionEntries = sortedEntries(agg.byDecision);
  const decisionEl = document.getElementById('decision-bars');
  const decisionColors: Record<string, string> = {
    'Approved': '#16a34a',
    'Refused': '#dc2626',
    'Withdrawn': '#d97706',
    'Pending': '#0284c7',
    'No Permit Required': '#94a3b8',
    'Unknown': '#64748b',
  };
  if (decisionEl) {
    renderHorizontalBars(decisionEl, decisionEntries, {
      colorFn: (label) => decisionColors[label] || '#94a3b8',
    });
  }
}
