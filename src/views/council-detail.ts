// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Ben Richardson — https://benrichardson.dev
// Additional terms under AGPL-3.0 section 7(b) apply; see ADDITIONAL-TERMS.md.
import type { CouncilStats } from '../types';
import { formatNumber, categoryColor, median, percentile } from '../utils';
import { renderHorizontalBars, renderTimeline, renderHistogram } from '../charts';

export function openCouncilPanel(
  council: CouncilStats,
  globalMedianProcessing: number,
  globalMedianApproval: number
): void {
  // Remove existing panel
  document.querySelector('.council-panel-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.className = 'council-panel-overlay';

  const panel = document.createElement('div');
  panel.className = 'council-panel';

  // Comparison callouts
  const processingComparison = council.medianProcessingDays !== null && globalMedianProcessing > 0
    ? council.medianProcessingDays > globalMedianProcessing
      ? `<div class="comparison-callout comparison-bad">⚠ Processing time is ${(council.medianProcessingDays / globalMedianProcessing).toFixed(1)}x the national median of ${Math.round(globalMedianProcessing)} days</div>`
      : `<div class="comparison-callout comparison-good">✓ Processing time is ${(council.medianProcessingDays / globalMedianProcessing).toFixed(1)}x the national median (faster)</div>`
    : '';

  const approvalComparison = council.approvalRate !== null && globalMedianApproval > 0
    ? council.approvalRate < globalMedianApproval * 0.9
      ? `<div class="comparison-callout comparison-bad">⚠ Approval rate (${council.approvalRate}%) is below the national median of ${globalMedianApproval.toFixed(1)}%</div>`
      : `<div class="comparison-callout comparison-good">✓ Approval rate (${council.approvalRate}%) is at or above the national median</div>`
    : '';

  // Processing percentiles
  const sorted = [...council.processingTimes].sort((a, b) => a - b);
  const p25 = Math.round(percentile(sorted, 25));
  const p50 = Math.round(median(sorted));
  const p75 = Math.round(percentile(sorted, 75));
  const p95 = Math.round(percentile(sorted, 95));

  // Category entries
  const catEntries: [string, number][] = Object.entries(council.byCategory).sort((a, b) => b[1] - a[1]);
  const decEntries: [string, number][] = Object.entries(council.byDecision).sort((a, b) => b[1] - a[1]);
  const monthEntries = Object.entries(council.byMonth).sort((a, b) => a[0].localeCompare(b[0]));

  panel.innerHTML = `
    <button class="council-panel-close" aria-label="Close">×</button>
    <div class="council-panel-header">
      <h2>${council.name}</h2>
      <div class="council-panel-meta">
        <span class="pill pill-default">${council.state}</span>
        ${council.population ? `<span style="color:var(--text-secondary);font-size:var(--font-size-sm);">Pop. ${formatNumber(council.population)}</span>` : ''}
      </div>
    </div>

    <div class="council-panel-stats">
      <div class="stat-card">
        <div class="stat-value">${formatNumber(council.recordCount)}</div>
        <div class="stat-label">Applications</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${council.applicationsPerCapita !== null ? council.applicationsPerCapita : '—'}</div>
        <div class="stat-label">Per 10k pop</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${council.medianProcessingDays !== null ? council.medianProcessingDays + 'd' : '—'}</div>
        <div class="stat-label">Median processing</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:var(--status-good)">${council.approvalRate !== null ? council.approvalRate + '%' : '—'}</div>
        <div class="stat-label">Approval rate</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:var(--status-bad)">${council.rejectionRate !== null ? council.rejectionRate + '%' : '—'}</div>
        <div class="stat-label">Refusal rate</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${formatNumber(council.pendingCount)}</div>
        <div class="stat-label">Pending</div>
      </div>
    </div>

    ${processingComparison}
    ${approvalComparison}

    <div class="council-panel-section">
      <h3>Categories</h3>
      <div id="council-cat-bars"></div>
    </div>

    <div class="council-panel-section">
      <h3>Decisions</h3>
      <div id="council-dec-bars"></div>
    </div>

    <div class="council-panel-section">
      <h3>Processing Time Distribution</h3>
      <div style="display:flex;gap:var(--space-lg);flex-wrap:wrap;margin-bottom:var(--space-md);">
        <span style="font-family:var(--font-mono);font-size:var(--font-size-xs);">25th: ${p25}d</span>
        <span style="font-family:var(--font-mono);font-size:var(--font-size-xs);">Median: ${p50}d</span>
        <span style="font-family:var(--font-mono);font-size:var(--font-size-xs);">75th: ${p75}d</span>
        <span style="font-family:var(--font-mono);font-size:var(--font-size-xs);">95th: ${p95}d</span>
      </div>
      <div id="council-histogram"></div>
    </div>

    <div class="council-panel-section">
      <h3>Monthly Volume</h3>
      <div id="council-timeline"></div>
    </div>

    <div class="council-panel-section">
      <h3>Top Suburbs</h3>
      <div class="council-suburbs-list">
        ${council.topSuburbs.map(([suburb, count], i) =>
          `<div style="display:flex;align-items:center;gap:var(--space-md);padding:var(--space-xs) 0;border-bottom:1px solid var(--border-subtle);">
            <span style="font-size:var(--font-size-xs);color:var(--text-tertiary);width:20px;text-align:right;">${i + 1}</span>
            <span style="flex:1;font-size:var(--font-size-sm);">${suburb}</span>
            <span style="font-family:var(--font-mono);font-size:var(--font-size-sm);">${formatNumber(count)}</span>
          </div>`
        ).join('')}
      </div>
    </div>
  `;

  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  // Render charts after DOM insertion
  requestAnimationFrame(() => {
    const catEl = document.getElementById('council-cat-bars');
    if (catEl) renderHorizontalBars(catEl, catEntries, { colorFn: categoryColor, width: Math.min(catEl.clientWidth, 500) });

    const decisionColors: Record<string, string> = {
      'Approved': '#16a34a', 'Refused': '#dc2626', 'Withdrawn': '#d97706',
      'Pending': '#0284c7', 'No Permit Required': '#94a3b8', 'Deferred': '#6d28d9',
    };
    const decEl = document.getElementById('council-dec-bars');
    if (decEl) renderHorizontalBars(decEl, decEntries, { colorFn: (l) => decisionColors[l] || '#94a3b8', width: Math.min(decEl.clientWidth, 500) });

    const histEl = document.getElementById('council-histogram');
    if (histEl && council.processingTimes.length > 0) {
      renderHistogram(histEl, council.processingTimes, { width: Math.min(histEl.clientWidth, 500), height: 200, bins: 20, color: '#0d9488' });
    }

    const timeEl = document.getElementById('council-timeline');
    if (timeEl && monthEntries.length > 0) {
      renderTimeline(timeEl, monthEntries, { width: Math.min(timeEl.clientWidth, 500), height: 180 });
    }
  });

  // Close handlers
  panel.querySelector('.council-panel-close')?.addEventListener('click', () => closeCouncilPanel());
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeCouncilPanel();
  });
  document.addEventListener('keydown', function handler(e) {
    if (e.key === 'Escape') {
      closeCouncilPanel();
      document.removeEventListener('keydown', handler);
    }
  });

  // Set URL hash
  history.replaceState(null, '', `#council=${council.slug}`);
}

export function closeCouncilPanel(): void {
  document.querySelector('.council-panel-overlay')?.remove();
  history.replaceState(null, '', window.location.pathname);
}
