import type { CouncilStats } from '../types';
import { formatNumber } from '../utils';
import { renderHorizontalBars } from '../charts';

interface StateStats {
  state: string;
  councils: number;
  totalApps: number;
  totalPopulation: number | null;
  perCapita: number | null;
  avgProcessingDays: number | null;
  avgApprovalRate: number | null;
  avgRejectionRate: number | null;
}

export function renderStatesView(
  container: HTMLElement,
  councils: CouncilStats[],
  onCouncilClick: (slug: string) => void
): void {
  // Group by state
  const stateMap = new Map<string, CouncilStats[]>();
  for (const c of councils) {
    const state = c.state || 'Unknown';
    if (!stateMap.has(state)) stateMap.set(state, []);
    stateMap.get(state)!.push(c);
  }

  const stateStats: StateStats[] = [];
  for (const [state, stateCouncils] of stateMap) {
    const totalApps = stateCouncils.reduce((s, c) => s + c.recordCount, 0);
    const withPop = stateCouncils.filter(c => c.population !== null);
    const totalPop = withPop.length > 0 ? withPop.reduce((s, c) => s + c.population!, 0) : null;

    const withProcessing = stateCouncils.filter(c => c.medianProcessingDays !== null);
    const avgProcessing = withProcessing.length > 0
      ? Math.round(withProcessing.reduce((s, c) => s + c.medianProcessingDays!, 0) / withProcessing.length)
      : null;

    const withApproval = stateCouncils.filter(c => c.approvalRate !== null);
    const avgApproval = withApproval.length > 0
      ? Math.round(withApproval.reduce((s, c) => s + c.approvalRate!, 0) / withApproval.length * 10) / 10
      : null;

    const withRejection = stateCouncils.filter(c => c.rejectionRate !== null);
    const avgRejection = withRejection.length > 0
      ? Math.round(withRejection.reduce((s, c) => s + c.rejectionRate!, 0) / withRejection.length * 10) / 10
      : null;

    stateStats.push({
      state,
      councils: stateCouncils.length,
      totalApps,
      totalPopulation: totalPop,
      perCapita: totalPop ? Math.round((totalApps / totalPop) * 10000) / 10 : null,
      avgProcessingDays: avgProcessing,
      avgApprovalRate: avgApproval,
      avgRejectionRate: avgRejection,
    });
  }

  stateStats.sort((a, b) => b.totalApps - a.totalApps);

  const appsByState: [string, number][] = stateStats.map(s => [s.state, s.totalApps] as [string, number]);
  const processingByState: [string, number][] = stateStats
    .filter(s => s.avgProcessingDays !== null)
    .map(s => [s.state, s.avgProcessingDays!] as [string, number])
    .sort((a, b) => b[1] - a[1]);
  const approvalByState: [string, number][] = stateStats
    .filter(s => s.avgApprovalRate !== null)
    .map(s => [s.state, s.avgApprovalRate!] as [string, number])
    .sort((a, b) => b[1] - a[1]);

  const stateColors: Record<string, string> = {
    VIC: '#1e3a5f', NSW: '#0d9488', QLD: '#7c3aed', SA: '#dc2626',
    WA: '#ea580c', TAS: '#16a34a', ACT: '#0284c7', NT: '#ca8a04', Unknown: '#94a3b8',
  };

  container.innerHTML = `
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-value">${stateStats.length}</div>
        <div class="stat-label">States / Territories</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${formatNumber(stateStats.reduce((s, st) => s + st.councils, 0))}</div>
        <div class="stat-label">Total councils</div>
      </div>
    </div>

    <div class="chart-grid">
      <div class="chart-card">
        <div class="chart-title">Applications by State</div>
        <div class="chart-subtitle">Total development applications by state/territory</div>
        <div id="state-apps-bars"></div>
      </div>
      <div class="chart-card">
        <div class="chart-title">Avg Processing Time by State</div>
        <div class="chart-subtitle">Average median processing days across councils in each state</div>
        <div id="state-processing-bars"></div>
      </div>
      <div class="chart-card">
        <div class="chart-title">Avg Approval Rate by State</div>
        <div class="chart-subtitle">Average approval rate across councils in each state</div>
        <div id="state-approval-bars"></div>
      </div>
      <div class="chart-card">
        <div class="chart-title">State Detail</div>
        <div class="chart-subtitle">Councils and key metrics per state</div>
        <table class="da-table">
          <thead>
            <tr><th>State</th><th style="text-align:right">Councils</th><th style="text-align:right">Apps</th><th style="text-align:right">Per 10k</th><th style="text-align:right">Avg Days</th><th style="text-align:right">Approval</th></tr>
          </thead>
          <tbody>
            ${stateStats.map(s => `
              <tr>
                <td><span class="pill" style="background:${stateColors[s.state] || '#94a3b8'}20;color:${stateColors[s.state] || '#94a3b8'};">${s.state}</span></td>
                <td class="col-days">${s.councils}</td>
                <td class="col-days">${formatNumber(s.totalApps)}</td>
                <td class="col-days">${s.perCapita !== null ? s.perCapita : '—'}</td>
                <td class="col-days">${s.avgProcessingDays !== null ? s.avgProcessingDays + 'd' : '—'}</td>
                <td class="col-days">${s.avgApprovalRate !== null ? s.avgApprovalRate + '%' : '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${stateStats.length === 1 ? '<div style="margin-top:var(--space-lg);color:var(--text-tertiary);font-size:var(--font-size-sm);">Add more council data sources or a PlanningAlerts API key to enable multi-state comparison.</div>' : ''}
      </div>
    </div>
  `;

  const appsEl = document.getElementById('state-apps-bars');
  if (appsEl) renderHorizontalBars(appsEl, appsByState, { colorFn: (s) => stateColors[s] || '#94a3b8' });

  const processEl = document.getElementById('state-processing-bars');
  if (processEl && processingByState.length > 0) renderHorizontalBars(processEl, processingByState, { colorFn: (s) => stateColors[s] || '#94a3b8' });

  const approvalEl = document.getElementById('state-approval-bars');
  if (approvalEl && approvalByState.length > 0) renderHorizontalBars(approvalEl, approvalByState, { colorFn: (s) => stateColors[s] || '#94a3b8' });

  // Suppress unused parameter warning
  void onCouncilClick;
}
