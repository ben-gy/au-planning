// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Ben Richardson — https://benrichardson.dev
// Additional terms under AGPL-3.0 section 7(b) apply; see ADDITIONAL-TERMS.md.
import type { Aggregates } from '../types';
import { formatNumber } from '../utils';
import { renderSankey } from '../charts';

export function renderFlowView(container: HTMLElement, agg: Aggregates): void {
  // Compute approval rate
  const approved = agg.byDecision['Approved'] || 0;
  const refused = agg.byDecision['Refused'] || 0;
  const decided = approved + refused + (agg.byDecision['Withdrawn'] || 0);
  const approvalRate = decided > 0 ? ((approved / decided) * 100).toFixed(1) : '—';
  const refusalRate = decided > 0 ? ((refused / decided) * 100).toFixed(1) : '—';

  container.innerHTML = `
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-value" style="color:var(--status-good)">${approvalRate}%</div>
        <div class="stat-label">Approval rate</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:var(--status-bad)">${refusalRate}%</div>
        <div class="stat-label">Refusal rate</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${formatNumber(approved)}</div>
        <div class="stat-label">Approved</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${formatNumber(refused)}</div>
        <div class="stat-label">Refused</div>
      </div>
    </div>
    <div class="chart-card" style="max-width:1200px;">
      <div class="chart-title">Application Flow</div>
      <div class="chart-subtitle">
        How applications flow from category to decision.
        Left: application type. Right: outcome.
        Width represents volume.
        <span class="glossary-link" data-term="Withdrawn" data-def="The applicant has voluntarily pulled their application before a decision was made. This often happens when the applicant is advised the application is likely to be refused.">What does withdrawn mean?</span>
      </div>
      <div class="sankey-wrap" id="flow-chart"></div>
    </div>
  `;

  const flowEl = document.getElementById('flow-chart');
  if (flowEl) {
    renderSankey(flowEl, agg.flows, { width: Math.min(flowEl.clientWidth, 1000), height: 500 });
  }
}
