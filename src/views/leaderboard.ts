// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Ben Richardson — https://benrichardson.dev
// Additional terms under AGPL-3.0 section 7(b) apply; see ADDITIONAL-TERMS.md.
import type { CouncilStats } from '../types';
import { formatNumber } from '../utils';

type SortKey = 'name' | 'recordCount' | 'applicationsPerCapita' | 'medianProcessingDays' | 'approvalRate' | 'rejectionRate' | 'stalledRate';
let currentSort: SortKey = 'medianProcessingDays';
let sortDir: 'asc' | 'desc' = 'desc';

function metricColor(value: number | null, median: number, inverted = false): string {
  if (value === null) return '';
  const ratio = value / median;
  if (inverted) {
    // Lower is better (processing time, rejection rate)
    if (ratio > 2) return 'color:var(--status-bad);font-weight:700;';
    if (ratio > 1.3) return 'color:#b45309;';
    if (ratio < 0.5) return 'color:var(--status-good);font-weight:700;';
    return '';
  }
  // Higher is better (approval rate)
  if (ratio < 0.7) return 'color:var(--status-bad);font-weight:700;';
  if (ratio < 0.9) return 'color:#b45309;';
  if (ratio > 1.1) return 'color:var(--status-good);';
  return '';
}

function miniBar(value: number, max: number, color: string): string {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return `<div style="display:flex;align-items:center;gap:6px;">
    <div style="flex:1;height:6px;background:var(--bg-elevated);border-radius:3px;overflow:hidden;">
      <div style="width:${pct}%;height:100%;background:${color};border-radius:3px;"></div>
    </div>
    <span style="font-family:var(--font-mono);font-size:var(--font-size-xs);min-width:40px;text-align:right;">${formatNumber(value)}</span>
  </div>`;
}

export function renderLeaderboard(
  container: HTMLElement,
  councils: CouncilStats[],
  onCouncilClick: (slug: string) => void
): void {
  if (councils.length === 0) {
    container.innerHTML = '<div class="loading">No council data available</div>';
    return;
  }

  // Compute medians for color-coding
  const processingVals = councils.filter(c => c.medianProcessingDays !== null).map(c => c.medianProcessingDays!);
  const approvalVals = councils.filter(c => c.approvalRate !== null).map(c => c.approvalRate!);
  const rejectionVals = councils.filter(c => c.rejectionRate !== null).map(c => c.rejectionRate!);
  const medProcessing = sortedMedian(processingVals);
  const medApproval = sortedMedian(approvalVals);
  const medRejection = sortedMedian(rejectionVals);

  // Compute maxes for mini bars
  const maxRecords = Math.max(...councils.map(c => c.recordCount));
  const maxPerCapita = Math.max(...councils.filter(c => c.applicationsPerCapita !== null).map(c => c.applicationsPerCapita!), 1);
  const maxProcessing = Math.max(...councils.filter(c => c.medianProcessingDays !== null).map(c => c.medianProcessingDays!), 1);

  // Sort
  const sorted = [...councils].sort((a, b) => {
    let va: number, vb: number;
    switch (currentSort) {
      case 'name': return sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      case 'recordCount': va = a.recordCount; vb = b.recordCount; break;
      case 'applicationsPerCapita': va = a.applicationsPerCapita ?? -1; vb = b.applicationsPerCapita ?? -1; break;
      case 'medianProcessingDays': va = a.medianProcessingDays ?? -1; vb = b.medianProcessingDays ?? -1; break;
      case 'approvalRate': va = a.approvalRate ?? -1; vb = b.approvalRate ?? -1; break;
      case 'rejectionRate': va = a.rejectionRate ?? -1; vb = b.rejectionRate ?? -1; break;
      case 'stalledRate': va = a.stalledRate ?? -1; vb = b.stalledRate ?? -1; break;
      default: va = 0; vb = 0;
    }
    return sortDir === 'desc' ? vb - va : va - vb;
  });

  // Summary stats
  const totalApps = councils.reduce((s, c) => s + c.recordCount, 0);
  const totalPending = councils.reduce((s, c) => s + c.pendingCount, 0);
  const totalStalled = councils.reduce((s, c) => s + c.stalledCount, 0);

  const arrow = (key: SortKey) => {
    const active = currentSort === key;
    return `<span class="sort-arrow">${active ? (sortDir === 'desc' ? '▼' : '▲') : '▽'}</span>`;
  };

  container.innerHTML = `
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-value">${formatNumber(totalApps)}</div>
        <div class="stat-label">Total applications</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${formatNumber(councils.length)}</div>
        <div class="stat-label">Councils</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${formatNumber(totalPending)}</div>
        <div class="stat-label">Currently pending</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:${totalStalled > 100 ? 'var(--status-bad)' : 'var(--text-primary)'}">${formatNumber(totalStalled)}</div>
        <div class="stat-label">Stalled (&gt;120 days)</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${Math.round(medProcessing)}d</div>
        <div class="stat-label">Median processing</div>
      </div>
    </div>
    <div class="chart-card" style="max-width:1600px;overflow:auto;">
      <div class="chart-title">Council Leaderboard</div>
      <div class="chart-subtitle">Click any council name to see the full breakdown. Colour indicates performance vs the median — <span style="color:var(--status-bad)">red = worse</span>, <span style="color:var(--status-good)">green = better</span>.</div>
      <table class="da-table leaderboard-table">
        <thead>
          <tr>
            <th>#</th>
            <th data-sort="name">Council ${arrow('name')}</th>
            <th>State</th>
            <th data-sort="recordCount" style="text-align:right;">Applications ${arrow('recordCount')}</th>
            <th data-sort="applicationsPerCapita" style="text-align:right;">Per 10k pop ${arrow('applicationsPerCapita')}</th>
            <th data-sort="medianProcessingDays" style="text-align:right;">Median days ${arrow('medianProcessingDays')}</th>
            <th data-sort="approvalRate" style="text-align:right;">Approval % ${arrow('approvalRate')}</th>
            <th data-sort="rejectionRate" style="text-align:right;">Refusal % ${arrow('rejectionRate')}</th>
            <th data-sort="stalledRate" style="text-align:right;">Stalled % ${arrow('stalledRate')}</th>
          </tr>
        </thead>
        <tbody>
          ${sorted.map((c, i) => `
            <tr class="leaderboard-row" data-slug="${c.slug}" style="cursor:pointer;">
              <td class="col-days">${i + 1}</td>
              <td><strong class="council-link">${c.name}</strong></td>
              <td><span class="pill pill-default">${c.state}</span></td>
              <td class="col-days">${miniBar(c.recordCount, maxRecords, 'var(--accent-primary)')}</td>
              <td class="col-days" style="${c.applicationsPerCapita !== null ? '' : 'opacity:0.3;'}">${c.applicationsPerCapita !== null ? miniBar(c.applicationsPerCapita, maxPerCapita, 'var(--accent-secondary)') : '—'}</td>
              <td class="col-days" style="${metricColor(c.medianProcessingDays, medProcessing, true)}">${c.medianProcessingDays !== null ? miniBar(c.medianProcessingDays, maxProcessing, c.medianProcessingDays > medProcessing * 1.5 ? '#dc2626' : c.medianProcessingDays < medProcessing * 0.7 ? '#16a34a' : '#64748b') : '—'}</td>
              <td class="col-days" style="${metricColor(c.approvalRate, medApproval, false)}">${c.approvalRate !== null ? c.approvalRate + '%' : '—'}</td>
              <td class="col-days" style="${metricColor(c.rejectionRate, medRejection, true)}">${c.rejectionRate !== null ? c.rejectionRate + '%' : '—'}</td>
              <td class="col-days" style="${c.stalledRate !== null && c.stalledRate > 50 ? 'color:var(--status-bad);font-weight:700;' : ''}">${c.stalledRate !== null ? c.stalledRate + '%' : '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  // Sort handlers
  container.querySelectorAll<HTMLElement>('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort as SortKey;
      if (currentSort === key) sortDir = sortDir === 'desc' ? 'asc' : 'desc';
      else { currentSort = key; sortDir = 'desc'; }
      renderLeaderboard(container, councils, onCouncilClick);
    });
  });

  // Row click → drill-down
  container.querySelectorAll<HTMLElement>('.leaderboard-row').forEach(row => {
    row.addEventListener('click', () => {
      const slug = row.dataset.slug;
      if (slug) onCouncilClick(slug);
    });
  });
}

function sortedMedian(arr: number[]): number {
  if (arr.length === 0) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
