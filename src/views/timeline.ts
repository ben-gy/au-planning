// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Ben Richardson — https://benrichardson.dev
// Additional terms under AGPL-3.0 section 7(b) apply; see ADDITIONAL-TERMS.md.
import type { Aggregates } from '../types';
import { formatNumber, sortedEntries } from '../utils';
import { renderTimeline, renderHorizontalBars } from '../charts';

export function renderTimelineView(container: HTMLElement, agg: Aggregates): void {
  const monthEntries = Object.entries(agg.byMonth).sort((a, b) => a[0].localeCompare(b[0]));

  // Compute year totals
  const byYear: Record<string, number> = {};
  for (const [month, count] of monthEntries) {
    const year = month.slice(0, 4);
    byYear[year] = (byYear[year] || 0) + count;
  }
  const yearEntries = sortedEntries(byYear, 'asc');

  // Average per month
  const avgPerMonth = monthEntries.length > 0
    ? Math.round(monthEntries.reduce((s, d) => s + d[1], 0) / monthEntries.length)
    : 0;

  container.innerHTML = `
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-value">${formatNumber(monthEntries.length)}</div>
        <div class="stat-label">Months of data</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${formatNumber(avgPerMonth)}</div>
        <div class="stat-label">Avg per month</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${monthEntries.length > 0 ? monthEntries[0][0] : '—'}</div>
        <div class="stat-label">Earliest month</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${monthEntries.length > 0 ? monthEntries[monthEntries.length - 1][0] : '—'}</div>
        <div class="stat-label">Latest month</div>
      </div>
    </div>
    <div class="chart-grid">
      <div class="chart-card" style="grid-column: 1 / -1;">
        <div class="chart-title">Monthly Application Volume</div>
        <div class="chart-subtitle">Number of development applications lodged per month</div>
        <div id="timeline-chart"></div>
      </div>
      <div class="chart-card">
        <div class="chart-title">Annual Totals</div>
        <div class="chart-subtitle">Total applications per calendar year</div>
        <div id="year-chart"></div>
      </div>
      <div class="chart-card">
        <div class="chart-title">Busiest Months</div>
        <div class="chart-subtitle">Top 10 months by application volume</div>
        <div id="top-months"></div>
      </div>
    </div>
  `;

  const timelineEl = document.getElementById('timeline-chart');
  if (timelineEl) renderTimeline(timelineEl, monthEntries);

  const yearEl = document.getElementById('year-chart');
  if (yearEl) {
    renderHorizontalBars(yearEl, yearEntries, {
      colorFn: () => '#1e3a5f',
    });
  }

  const topEl = document.getElementById('top-months');
  if (topEl) {
    const top10 = [...monthEntries].sort((a, b) => b[1] - a[1]).slice(0, 10);
    renderHorizontalBars(topEl, top10, {
      colorFn: () => '#0d9488',
    });
  }
}
