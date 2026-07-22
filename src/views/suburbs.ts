// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Ben Richardson — https://benrichardson.dev
// Additional terms under AGPL-3.0 section 7(b) apply; see ADDITIONAL-TERMS.md.
import type { DevelopmentApplication } from '../types';
import { formatNumber, formatProcessingDays } from '../utils';
import { renderHorizontalBars } from '../charts';

interface SuburbStats {
  total: number;
  approved: number;
  refused: number;
  withdrawn: number;
  pending: number;
  avgProcessingDays: number | null;
  medianProcessingDays: number | null;
  categories: Record<string, number>;
}

function computeSuburbStats(apps: DevelopmentApplication[]): Map<string, SuburbStats> {
  const stats = new Map<string, SuburbStats>();

  for (const a of apps) {
    if (!a.suburb) continue;
    let s = stats.get(a.suburb);
    if (!s) {
      s = { total: 0, approved: 0, refused: 0, withdrawn: 0, pending: 0, avgProcessingDays: null, medianProcessingDays: null, categories: {} };
      stats.set(a.suburb, s);
    }
    s.total++;
    if (a.decision === 'Approved') s.approved++;
    else if (a.decision === 'Refused') s.refused++;
    else if (a.decision === 'Withdrawn') s.withdrawn++;
    else if (a.decision === 'Pending') s.pending++;
    s.categories[a.category] = (s.categories[a.category] || 0) + 1;
  }

  // Compute processing times
  for (const [suburb, s] of stats) {
    const times = apps
      .filter(a => a.suburb === suburb && a.processingDays !== null && a.processingDays >= 0)
      .map(a => a.processingDays as number)
      .sort((a, b) => a - b);

    if (times.length > 0) {
      s.avgProcessingDays = Math.round(times.reduce((sum, t) => sum + t, 0) / times.length);
      s.medianProcessingDays = times[Math.floor(times.length / 2)];
    }
  }

  return stats;
}

export function renderSuburbsView(container: HTMLElement, apps: DevelopmentApplication[]): void {
  const stats = computeSuburbStats(apps);
  const sorted = [...stats.entries()].sort((a, b) => b[1].total - a[1].total);
  const topEntries: [string, number][] = sorted.slice(0, 25).map(([name, s]) => [name, s.total]);

  container.innerHTML = `
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-value">${formatNumber(stats.size)}</div>
        <div class="stat-label">Suburbs</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${sorted.length > 0 ? sorted[0][0] : '—'}</div>
        <div class="stat-label">Most active suburb</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${sorted.length > 0 ? formatNumber(sorted[0][1].total) : '—'}</div>
        <div class="stat-label">Applications in top suburb</div>
      </div>
    </div>
    <div class="chart-grid">
      <div class="chart-card" style="grid-column: 1 / -1;">
        <div class="chart-title">Top 25 Suburbs by Application Volume</div>
        <div class="chart-subtitle">Total development applications lodged per suburb</div>
        <div id="suburb-bars"></div>
      </div>
      <div class="chart-card">
        <div class="chart-title">Suburb Detail</div>
        <div class="chart-subtitle">Approval rates and processing times by suburb</div>
        <div class="suburb-detail-table">
          <table class="da-table">
            <thead>
              <tr>
                <th>Suburb</th>
                <th style="text-align:right">Total</th>
                <th style="text-align:right">Approved</th>
                <th style="text-align:right">Refused</th>
                <th style="text-align:right">Approval %</th>
                <th style="text-align:right">Avg Days</th>
              </tr>
            </thead>
            <tbody>
              ${sorted.slice(0, 30).map(([name, s]) => {
                const decided = s.approved + s.refused + s.withdrawn;
                const rate = decided > 0 ? ((s.approved / decided) * 100).toFixed(1) : '—';
                return `
                  <tr>
                    <td>${name}</td>
                    <td class="col-days">${formatNumber(s.total)}</td>
                    <td class="col-days">${formatNumber(s.approved)}</td>
                    <td class="col-days">${formatNumber(s.refused)}</td>
                    <td class="col-days">${rate}${rate !== '—' ? '%' : ''}</td>
                    <td class="col-days">${s.avgProcessingDays !== null ? formatProcessingDays(s.avgProcessingDays) : '—'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="chart-card">
        <div class="chart-title">Approval Rate by Suburb</div>
        <div class="chart-subtitle">Top suburbs ranked by approval rate (min 20 decided applications)</div>
        <div id="suburb-approval-bars"></div>
      </div>
    </div>
  `;

  const barsEl = document.getElementById('suburb-bars');
  if (barsEl) {
    renderHorizontalBars(barsEl, topEntries, {
      colorFn: () => '#1e3a5f',
      maxBars: 25,
    });
  }

  // Approval rate bars (suburbs with at least 20 decided)
  const approvalData: [string, number][] = sorted
    .filter(([, s]) => s.approved + s.refused + s.withdrawn >= 20)
    .map(([name, s]) => {
      const decided = s.approved + s.refused + s.withdrawn;
      return [name, decided > 0 ? Math.round((s.approved / decided) * 100) : 0] as [string, number];
    })
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  const approvalEl = document.getElementById('suburb-approval-bars');
  if (approvalEl) {
    renderHorizontalBars(approvalEl, approvalData, {
      colorFn: () => '#16a34a',
    });
  }
}
