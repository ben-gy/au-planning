import { injectStyles } from './styles';
import { loadApplications, loadAggregates, loadMeta, filterApplications, defaultFilters, type FilterState } from './data';
import type { DevelopmentApplication, Aggregates, Meta, ViewId } from './types';
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

// State
let apps: DevelopmentApplication[] = [];
let aggregates: Aggregates | null = null;
let meta: Meta | null = null;
let currentView: ViewId = 'map';
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
    [apps, aggregates, meta] = await Promise.all([
      loadApplications(),
      loadAggregates(),
      loadMeta(),
    ]);

    updateStats();
    populateFilters();
    renderCurrentView();
  } catch (err) {
    const viewContainer = document.getElementById('view-container');
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
    { id: 'map', label: 'Map' },
    { id: 'table', label: 'Table' },
    { id: 'categories', label: 'Categories' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'flow', label: 'Flow' },
    { id: 'suburbs', label: 'Suburbs' },
    { id: 'processing', label: 'Processing' },
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
      <span>Data: City of Casey (VIC) via Open Data API</span>
      <span>Built by <a href="https://benrichardson.dev/">benrichardson.dev</a></span>
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
  for (const id of ['filter-category', 'filter-decision', 'filter-suburb']) {
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

  // About button
  document.getElementById('about-btn')?.addEventListener('click', openAboutModal);
}

function switchView(view: ViewId): void {
  if (view === currentView) return;
  if (currentView === 'map') destroyMap();
  currentView = view;
  localStorage.setItem('au-planning-view', view);

  // Update active tab
  document.querySelectorAll('.view-tab').forEach(tab => {
    tab.classList.toggle('active', (tab as HTMLElement).dataset.view === view);
  });

  renderCurrentView();
}

function renderCurrentView(): void {
  const container = document.getElementById('view-container');
  if (!container) return;

  const filtered = filterApplications(apps, filters);

  switch (currentView) {
    case 'map':
      renderMapView(container, filtered);
      break;
    case 'table':
      renderTable(container, filtered);
      break;
    case 'categories':
      if (aggregates) {
        // If filters active, recompute aggregates from filtered data
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
  }
}

function hasActiveFilters(): boolean {
  return !!(filters.search || filters.category || filters.decision || filters.suburb || filters.yearFrom || filters.yearTo);
}

function computeAggregatesFromApps(filtered: DevelopmentApplication[]): Aggregates {
  const byCategory: Record<string, number> = {};
  const bySuburb: Record<string, number> = {};
  const byMonth: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const byDecision: Record<string, number> = {};
  const flows: Record<string, number> = {};
  const processingTimes: number[] = [];

  for (const a of filtered) {
    byCategory[a.category] = (byCategory[a.category] || 0) + 1;
    bySuburb[a.suburb] = (bySuburb[a.suburb] || 0) + 1;
    byStatus[a.status] = (byStatus[a.status] || 0) + 1;
    byDecision[a.decision] = (byDecision[a.decision] || 0) + 1;
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
    byCategory,
    bySuburb,
    byMonth,
    byStatus,
    byDecision,
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

  statsEl.textContent = `${formatNumber(aggregates.totalRecords)} applications · Updated ${lastUpdated}`;
}

function populateFilters(): void {
  if (!aggregates) return;

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

  // Get category colors for legend
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
      <p>This site provides a unified view of planning and development applications across Australian councils. Currently focused on the City of Casey in Victoria, with more councils coming soon.</p>

      <h3>What is a Development Application?</h3>
      <p>A development application (DA) — or "planning permit application" in Victoria — is a formal request to a local council for permission to build, demolish, or change how land or buildings are used. Every significant change to the built environment goes through this process.</p>

      <h3>Data Sources</h3>
      <ul>${councilList}</ul>
      <p>Data is fetched via a GitHub Actions pipeline that runs every 6 hours. The pipeline normalises data from different councils into a consistent format.</p>

      <h3>How to add more councils</h3>
      <p>The pipeline is designed to be extended. Any Australian council that publishes their DA data as an open data feed can be added. The site currently supports OpenDataSoft-based council portals (like City of Casey) and PlanningAlerts API (requires an API key).</p>

      <h3>Category Legend</h3>
      <div style="margin:8px 0;display:flex;flex-wrap:wrap;">${legend}</div>

      <h3>Limitations</h3>
      <p>Processing times shown are calendar days, not statutory days. Statutory timelines pause during advertising and information request periods, so the calendar days shown may be longer than the statutory processing time.</p>
      <p>Category classification is approximate — it uses keyword matching on application descriptions, which varies by council.</p>

      <h3>Privacy</h3>
      <p>This site uses no cookies, no analytics, and no tracking. All data comes from publicly available government open data portals. Filter preferences are saved in your browser's local storage.</p>
    `
  );
}

function openModal(title: string, bodyHtml: string): void {
  // Remove existing modal
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

  // Close handlers
  overlay.querySelector('.modal-close')?.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
  document.addEventListener('keydown', function handler(e) {
    if (e.key === 'Escape') {
      overlay.remove();
      document.removeEventListener('keydown', handler);
    }
  });
}

init();
