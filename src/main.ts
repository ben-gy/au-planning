import { injectStyles } from './styles';
import { loadApplications, loadAggregates, loadMeta, loadCouncilStats, filterApplications, defaultFilters, type FilterState } from './data';
import type { DevelopmentApplication, Aggregates, Meta, CouncilStats, ViewId } from './types';
import { formatNumber, debounce, sortedEntries, allCategoryColors } from './utils';
import { getAllTerms } from './glossary';
import { initGlossaryLinks } from './tooltip';
import { renderTable } from './views/table';
import { renderCategories } from './views/categories';
import { renderTimelineView } from './views/timeline';
import { renderFlowView } from './views/flow';
import { renderSuburbsView } from './views/suburbs';
import { renderProcessingView } from './views/processing';
import { renderMapView, destroyMap } from './views/map';
import { renderLeaderboard } from './views/leaderboard';
import { renderInsightsView } from './views/insights';
import { renderStatesView } from './views/states';
import { openCouncilPanel } from './views/council-detail';

// State
let apps: DevelopmentApplication[] = [];
let aggregates: Aggregates | null = null;
let meta: Meta | null = null;
let councilStats: CouncilStats[] = [];
let currentView: ViewId = 'leaderboard';
let filters: FilterState = defaultFilters();

// Restore view from localStorage
const savedView = localStorage.getItem('au-planning-view');
if (savedView) currentView = savedView as ViewId;

async function init(): Promise<void> {
  injectStyles();
  renderShell();
  initGlossaryLinks();

  const viewContainer = document.getElementById('view-container');
  if (viewContainer) viewContainer.innerHTML = '<div class="loading"><span class="loading-pulse">Loading development applications…</span></div>';

  try {
    [apps, aggregates, meta, councilStats] = await Promise.all([
      loadApplications(),
      loadAggregates(),
      loadMeta(),
      loadCouncilStats(),
    ]);

    updateStats();
    populateFilters();
    renderCurrentView();

    // Check for council hash on load
    const hash = window.location.hash;
    if (hash.startsWith('#council=')) {
      const slug = hash.replace('#council=', '');
      handleCouncilClick(slug);
    }
  } catch (err) {
    if (viewContainer) {
      viewContainer.innerHTML = `
        <div class="error-msg">
          <p>Failed to load data: ${(err as Error).message}</p>
          <button onclick="location.reload()">Retry</button>
        </div>
      `;
    }
  }
}

function renderShell(): void {
  const app = document.getElementById('app');
  if (!app) return;

  const views: { id: ViewId; label: string }[] = [
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'insights', label: 'Insights' },
    { id: 'map', label: 'Map' },
    { id: 'table', label: 'Table' },
    { id: 'categories', label: 'Categories' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'flow', label: 'Flow' },
    { id: 'suburbs', label: 'Suburbs' },
    { id: 'processing', label: 'Processing' },
    { id: 'states', label: 'States' },
  ];

  app.innerHTML = `
    <header class="site-header">
      <div class="site-title">
        Development Applications <span class="country-tag">AU</span>
      </div>
      <div class="header-search">
        <span class="search-icon">⌕</span>
        <input type="text" id="search-input" placeholder="Search by address, suburb, description…" />
      </div>
      <div class="header-stats" id="header-stats"></div>
      <div class="header-actions">
        <button class="header-btn" id="glossary-btn" title="Glossary">?</button>
        <button class="header-btn" id="about-btn" title="About">ℹ</button>
      </div>
    </header>
    <nav class="view-tabs" id="view-tabs">
      ${views.map(v => `<button class="view-tab${v.id === currentView ? ' active' : ''}" data-view="${v.id}">${v.label}</button>`).join('')}
    </nav>
    <div class="filter-bar" id="filter-bar">
      <span class="filter-label">Filter:</span>
      <select class="filter-select" id="filter-council" style="display:none;"><option value="">All councils</option></select>
      <select class="filter-select" id="filter-category"><option value="">All categories</option></select>
      <select class="filter-select" id="filter-decision"><option value="">All decisions</option></select>
      <select class="filter-select" id="filter-suburb"><option value="">All suburbs</option></select>
      <span class="filter-count" id="filter-count"></span>
      <button class="filter-clear" id="filter-clear" style="display:none;">Clear filters</button>
    </div>
    <main class="main-content">
      <div class="view-container" id="view-container"></div>
    </main>
    <footer class="site-footer">
      <span id="footer-sources">Data loading…</span>
      <span>Built by <a href="https://benrichardson.dev/">benrichardson.dev</a> · <a href="https://hub.benrichardson.dev" target="_blank" rel="noopener">more tools &amp; sites</a></span>
    </footer>
  `;

  // Tab click handlers
  document.getElementById('view-tabs')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.view-tab') as HTMLElement | null;
    if (!btn) return;
    const view = btn.dataset.view as ViewId;
    switchView(view);
  });

  // Search handler
  const searchInput = document.getElementById('search-input') as HTMLInputElement;
  searchInput?.addEventListener('input', debounce(() => {
    filters.search = searchInput.value.trim();
    renderCurrentView();
    updateFilterCount();
  }, 300));

  // Filter handlers
  for (const id of ['filter-category', 'filter-decision', 'filter-suburb', 'filter-council']) {
    document.getElementById(id)?.addEventListener('change', (e) => {
      const select = e.target as HTMLSelectElement;
      const key = id.replace('filter-', '') as keyof FilterState;
      filters[key] = select.value;
      renderCurrentView();
      updateFilterCount();
    });
  }

  // Clear filters
  document.getElementById('filter-clear')?.addEventListener('click', () => {
    filters = defaultFilters();
    const searchInput = document.getElementById('search-input') as HTMLInputElement;
    if (searchInput) searchInput.value = '';
    populateFilters();
    renderCurrentView();
    updateFilterCount();
  });

  // Glossary button
  document.getElementById('glossary-btn')?.addEventListener('click', openGlossaryModal);
  document.getElementById('about-btn')?.addEventListener('click', openAboutModal);
}

function switchView(view: ViewId): void {
  if (view === currentView) return;
  if (currentView === 'map') destroyMap();
  currentView = view;
  localStorage.setItem('au-planning-view', view);

  document.querySelectorAll('.view-tab').forEach(tab => {
    tab.classList.toggle('active', (tab as HTMLElement).dataset.view === view);
  });

  // Toggle map-active class for full-bleed map
  const viewContainer = document.getElementById('view-container');
  if (viewContainer) viewContainer.classList.toggle('map-active', view === 'map');

  renderCurrentView();
}

function handleCouncilClick(slug: string): void {
  const council = councilStats.find(c => c.slug === slug);
  if (!council) return;

  // Compute global medians for comparison
  const processingVals = councilStats.filter(c => c.medianProcessingDays !== null).map(c => c.medianProcessingDays!);
  const approvalVals = councilStats.filter(c => c.approvalRate !== null).map(c => c.approvalRate!);
  const globalMedianProcessing = sortedMedian(processingVals);
  const globalMedianApproval = sortedMedian(approvalVals);

  openCouncilPanel(council, globalMedianProcessing, globalMedianApproval);
}

function sortedMedian(arr: number[]): number {
  if (arr.length === 0) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function renderCurrentView(): void {
  const container = document.getElementById('view-container');
  if (!container) return;

  // Toggle map-active class
  container.classList.toggle('map-active', currentView === 'map');

  const filtered = filterApplications(apps, filters);

  switch (currentView) {
    case 'leaderboard':
      renderLeaderboard(container, councilStats, handleCouncilClick);
      break;
    case 'insights':
      renderInsightsView(container, councilStats, handleCouncilClick);
      break;
    case 'map':
      renderMapView(container, councilStats, handleCouncilClick);
      break;
    case 'table':
      renderTable(container, filtered);
      break;
    case 'categories':
      if (aggregates) {
        if (hasActiveFilters()) {
          renderCategories(container, computeAggregatesFromApps(filtered));
        } else {
          renderCategories(container, aggregates);
        }
      }
      break;
    case 'timeline':
      if (aggregates) {
        if (hasActiveFilters()) {
          renderTimelineView(container, computeAggregatesFromApps(filtered));
        } else {
          renderTimelineView(container, aggregates);
        }
      }
      break;
    case 'flow':
      if (aggregates) {
        if (hasActiveFilters()) {
          renderFlowView(container, computeAggregatesFromApps(filtered));
        } else {
          renderFlowView(container, aggregates);
        }
      }
      break;
    case 'suburbs':
      renderSuburbsView(container, filtered);
      break;
    case 'processing':
      if (aggregates) {
        if (hasActiveFilters()) {
          renderProcessingView(container, computeAggregatesFromApps(filtered));
        } else {
          renderProcessingView(container, aggregates);
        }
      }
      break;
    case 'states':
      renderStatesView(container, councilStats, handleCouncilClick);
      break;
  }
}

function hasActiveFilters(): boolean {
  return !!(filters.search || filters.category || filters.decision || filters.suburb || filters.council || filters.yearFrom || filters.yearTo);
}

function computeAggregatesFromApps(filtered: DevelopmentApplication[]): Aggregates {
  const byCategory: Record<string, number> = {};
  const bySuburb: Record<string, number> = {};
  const byMonth: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const byDecision: Record<string, number> = {};
  const byCouncil: Record<string, number> = {};
  const byState: Record<string, number> = {};
  const flows: Record<string, number> = {};
  const processingTimes: number[] = [];

  for (const a of filtered) {
    byCategory[a.category] = (byCategory[a.category] || 0) + 1;
    bySuburb[a.suburb] = (bySuburb[a.suburb] || 0) + 1;
    byStatus[a.status] = (byStatus[a.status] || 0) + 1;
    byDecision[a.decision] = (byDecision[a.decision] || 0) + 1;
    byCouncil[a.council] = (byCouncil[a.council] || 0) + 1;
    byState[a.state] = (byState[a.state] || 0) + 1;
    if (a.lodgedDate) {
      const month = a.lodgedDate.slice(0, 7);
      byMonth[month] = (byMonth[month] || 0) + 1;
    }
    const key = `${a.category}→${a.decision}`;
    flows[key] = (flows[key] || 0) + 1;
    if (a.processingDays !== null && a.processingDays >= 0 && a.processingDays < 3650) {
      processingTimes.push(a.processingDays);
    }
  }

  return {
    totalRecords: filtered.length,
    councilCount: Object.keys(byCouncil).length,
    byCategory,
    bySuburb,
    byMonth,
    byStatus,
    byDecision,
    byCouncil,
    byState,
    flows,
    processingTimes: processingTimes.sort((a, b) => a - b),
  };
}

function updateStats(): void {
  const statsEl = document.getElementById('header-stats');
  if (!statsEl || !aggregates) return;

  const lastUpdated = meta?.lastUpdated
    ? new Date(meta.lastUpdated).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  const councilCount = councilStats.length;
  statsEl.textContent = `${formatNumber(aggregates.totalRecords)} applications · ${councilCount} council${councilCount !== 1 ? 's' : ''} · Updated ${lastUpdated}`;

  // Update footer
  const footerEl = document.getElementById('footer-sources');
  if (footerEl && meta) {
    const sources = meta.councils.filter(c => c.recordCount > 0).map(c => `${c.name} (${c.state})`).join(', ');
    footerEl.textContent = `Data: ${sources || 'Loading…'}`;
  }
}

function populateFilters(): void {
  if (!aggregates) return;

  // Council filter (only show if multiple councils)
  const councilSelect = document.getElementById('filter-council') as HTMLSelectElement;
  if (councilSelect) {
    if (councilStats.length > 1) {
      councilSelect.style.display = '';
      const councilEntries = sortedEntries(aggregates.byCouncil || {});
      councilSelect.innerHTML = '<option value="">All councils</option>' +
        councilEntries.map(([name, count]) => `<option value="${name}" ${filters.council === name ? 'selected' : ''}>${name} (${formatNumber(count)})</option>`).join('');
    } else {
      councilSelect.style.display = 'none';
    }
  }

  const catSelect = document.getElementById('filter-category') as HTMLSelectElement;
  if (catSelect) {
    const cats = sortedEntries(aggregates.byCategory);
    catSelect.innerHTML = '<option value="">All categories</option>' +
      cats.map(([cat, count]) => `<option value="${cat}" ${filters.category === cat ? 'selected' : ''}>${cat} (${formatNumber(count)})</option>`).join('');
  }

  const decSelect = document.getElementById('filter-decision') as HTMLSelectElement;
  if (decSelect) {
    const decs = sortedEntries(aggregates.byDecision);
    decSelect.innerHTML = '<option value="">All decisions</option>' +
      decs.map(([dec, count]) => `<option value="${dec}" ${filters.decision === dec ? 'selected' : ''}>${dec} (${formatNumber(count)})</option>`).join('');
  }

  const subSelect = document.getElementById('filter-suburb') as HTMLSelectElement;
  if (subSelect) {
    const subs = sortedEntries(aggregates.bySuburb);
    subSelect.innerHTML = '<option value="">All suburbs</option>' +
      subs.map(([sub, count]) => `<option value="${sub}" ${filters.suburb === sub ? 'selected' : ''}>${sub} (${formatNumber(count)})</option>`).join('');
  }

  updateFilterCount();
}

function updateFilterCount(): void {
  const countEl = document.getElementById('filter-count');
  const clearBtn = document.getElementById('filter-clear');
  const active = hasActiveFilters();

  if (countEl) {
    const filtered = filterApplications(apps, filters);
    countEl.textContent = active
      ? `${formatNumber(filtered.length)} of ${formatNumber(apps.length)}`
      : `${formatNumber(apps.length)} applications`;
  }

  if (clearBtn) {
    (clearBtn as HTMLElement).style.display = active ? 'inline-block' : 'none';
  }
}

function openGlossaryModal(): void {
  const terms = getAllTerms();
  openModal(
    'Planning Glossary',
    `
      <p>Key terms used in Australian planning and development applications.</p>
      <ul class="glossary-list">
        ${terms.map(t => `
          <li>
            <div class="term">${t.term}${t.abbr ? `<span class="abbr">(${t.abbr})</span>` : ''}</div>
            <div class="def">${t.definition}</div>
          </li>
        `).join('')}
      </ul>
    `
  );
}

function openAboutModal(): void {
  const councils = meta?.councils || [];
  const councilList = councils.map(c =>
    `<li><strong>${c.name}</strong> (${c.state}) — ${formatNumber(c.recordCount)} records${c.error ? ` <span style="color:var(--status-bad)">Error: ${c.error}</span>` : ''}</li>`
  ).join('');

  const colors = allCategoryColors();
  const legend = Object.entries(colors).map(([cat, color]) =>
    `<span style="display:inline-flex;align-items:center;gap:4px;margin:2px 8px 2px 0;">
      <span style="width:10px;height:10px;border-radius:3px;background:${color};display:inline-block;"></span>
      <span style="font-size:12px;">${cat}</span>
    </span>`
  ).join('');

  openModal(
    'About Development Applications (AU)',
    `
      <p>This site provides a unified view of planning and development applications across Australian councils with actionable insights — leaderboards, anomaly detection, and comparative analysis.</p>

      <h3>What is a Development Application?</h3>
      <p>A development application (DA) — or "planning permit application" in Victoria — is a formal request to a local council for permission to build, demolish, or change how land or buildings are used.</p>

      <h3>Data Sources</h3>
      <ul>${councilList}</ul>
      <p>Data is fetched via a GitHub Actions pipeline that runs every 6 hours. Adding a PlanningAlerts API key extends coverage to 212+ councils across 89% of Australia.</p>

      <h3>Insights</h3>
      <p>The site automatically detects anomalies: councils with processing times &gt;2x the median, unusually high rejection rates, stalled applications, and year-over-year volume spikes. These insights help journalists, researchers, and citizens identify dysfunctional processes.</p>

      <h3>Category Legend</h3>
      <div style="margin:8px 0;display:flex;flex-wrap:wrap;">${legend}</div>

      <h3>Privacy</h3>
      <p>No cookies, no fingerprinting, no cross-site tracking. The only analytics is Cloudflare Web Analytics — anonymous, cookie-less page-view counts; no personal data. All data is from publicly available government open data portals.</p>
    `
  );
}

function openModal(title: string, bodyHtml: string): void {
  document.querySelector('.modal-overlay')?.remove();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-panel">
      <button class="modal-close" aria-label="Close">×</button>
      <h2 class="modal-title">${title}</h2>
      <div class="modal-body">${bodyHtml}</div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('.modal-close')?.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  document.addEventListener('keydown', function handler(e) {
    if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', handler); }
  });
}

init();
