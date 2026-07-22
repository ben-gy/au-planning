// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Ben Richardson — https://benrichardson.dev
// Additional terms under AGPL-3.0 section 7(b) apply; see ADDITIONAL-TERMS.md.
import type { Aggregates } from '../types';
import { formatNumber, median, percentile } from '../utils';
import { renderHistogram, renderHorizontalBars } from '../charts';

export function renderProcessingView(container: HTMLElement, agg: Aggregates): void {
  const times = agg.processingTimes;
  const sorted = [...times].sort((a, b) => a - b);

  const avg = sorted.length > 0
    ? Math.round(sorted.reduce((s, t) => s + t, 0) / sorted.length)
    : 0;
  const med = median(sorted);
  const p25 = percentile(sorted, 25);
  const p75 = percentile(sorted, 75);
  const p95 = percentile(sorted, 95);

  const sameDay = sorted.filter(d => d <= 0).length;
  const within10 = sorted.filter(d => d <= 10).length;
  const within60 = sorted.filter(d => d <= 60).length;
  const within10Pct = sorted.length > 0 ? ((within10 / sorted.length) * 100).toFixed(1) : '—';
  const within60Pct = sorted.length > 0 ? ((within60 / sorted.length) * 100).toFixed(1) : '—';

  container.innerHTML = `
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-value">${formatNumber(sorted.length)}</div>
        <div class="stat-label">Decided applications</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${formatNumber(avg)}d</div>
        <div class="stat-label">Average processing</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${formatNumber(Math.round(med))}d</div>
        <div class="stat-label">Median processing</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${within60Pct}%</div>
        <div class="stat-label">
          Within 60 days
          <span class="glossary-link" data-term="Processing Time" data-def="The number of calendar days between when an application is lodged and when a decision is made. Victorian planning law requires standard applications to be decided within 60 statutory days.">ℹ</span>
        </div>
      </div>
    </div>
    <div class="chart-grid">
      <div class="chart-card" style="grid-column: 1 / -1;">
        <div class="chart-title">Processing Time Distribution</div>
        <div class="chart-subtitle">
          Number of applications by processing time (calendar days from lodged to decision).
          Capped at 95th percentile for display.
          <span class="glossary-link" data-term="VicSmart" data-def="A fast-track planning permit process in Victoria for straightforward applications. Must be decided within 10 business days.">VicSmart</span> applications should be decided within 10 business days.
        </div>
        <div id="processing-histogram"></div>
      </div>
      <div class="chart-card">
        <div class="chart-title">Processing Percentiles</div>
        <div class="chart-subtitle">Distribution breakdown</div>
        <table class="da-table" style="max-width:400px;">
          <tbody>
            <tr><td>Same day</td><td class="col-days">${formatNumber(sameDay)}</td></tr>
            <tr><td>Within 10 days</td><td class="col-days">${formatNumber(within10)} (${within10Pct}%)</td></tr>
            <tr><td>Within 60 days</td><td class="col-days">${formatNumber(within60)} (${within60Pct}%)</td></tr>
            <tr><td>25th percentile</td><td class="col-days">${formatNumber(Math.round(p25))} days</td></tr>
            <tr><td>Median (50th)</td><td class="col-days">${formatNumber(Math.round(med))} days</td></tr>
            <tr><td>75th percentile</td><td class="col-days">${formatNumber(Math.round(p75))} days</td></tr>
            <tr><td>95th percentile</td><td class="col-days">${formatNumber(Math.round(p95))} days</td></tr>
          </tbody>
        </table>
      </div>
      <div class="chart-card">
        <div class="chart-title">Quick vs Slow</div>
        <div class="chart-subtitle">Applications grouped by processing speed</div>
        <div id="speed-bars"></div>
      </div>
    </div>
  `;

  const histEl = document.getElementById('processing-histogram');
  if (histEl) {
    renderHistogram(histEl, sorted, {
      bins: 25,
      color: '#0d9488',
      xLabel: 'Calendar days',
    });
  }

  const allBuckets: [string, number][] = [
    ['Same day (0)', sameDay],
    ['1–10 days', sorted.filter(d => d >= 1 && d <= 10).length],
    ['11–30 days', sorted.filter(d => d >= 11 && d <= 30).length],
    ['31–60 days', sorted.filter(d => d >= 31 && d <= 60).length],
    ['61–90 days', sorted.filter(d => d >= 61 && d <= 90).length],
    ['91–180 days', sorted.filter(d => d >= 91 && d <= 180).length],
    ['181–365 days', sorted.filter(d => d >= 181 && d <= 365).length],
    ['Over 1 year', sorted.filter(d => d > 365).length],
  ];
  const buckets = allBuckets.filter(d => d[1] > 0);

  const speedEl = document.getElementById('speed-bars');
  if (speedEl) {
    renderHorizontalBars(speedEl, buckets, {
      colorFn: (label: string) => {
        if (label.includes('Same') || label.includes('1–10')) return '#16a34a';
        if (label.includes('11–30') || label.includes('31–60')) return '#0d9488';
        if (label.includes('61–90') || label.includes('91–180')) return '#d97706';
        return '#dc2626';
      },
    });
  }
}
