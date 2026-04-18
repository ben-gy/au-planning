export function injectStyles(): void {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
}

const CSS = `
:root {
  --bg-base: #f8fafc;
  --bg-surface: #ffffff;
  --bg-elevated: #f1f5f9;
  --bg-panel: #ffffff;
  --bg-hover: #f1f5f9;
  --bg-active: #e2e8f0;

  --border-subtle: #e2e8f0;
  --border-default: #cbd5e1;
  --border-strong: #94a3b8;

  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-tertiary: #94a3b8;
  --text-muted: #cbd5e1;

  --accent-primary: #1e3a5f;
  --accent-primary-hover: #15294a;
  --accent-secondary: #0d9488;
  --accent-secondary-hover: #0f766e;

  --status-good: #16a34a;
  --status-warn: #d97706;
  --status-bad: #dc2626;
  --status-info: #0284c7;

  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Helvetica, Arial, sans-serif;
  --font-mono: 'SF Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  --font-size-xs: 0.6875rem;
  --font-size-sm: 0.75rem;
  --font-size-base: 0.875rem;
  --font-size-lg: 1rem;
  --font-size-xl: 1.125rem;
  --font-size-2xl: 1.5rem;

  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 0.75rem;
  --space-lg: 1rem;
  --space-xl: 1.5rem;
  --space-2xl: 2rem;

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;

  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;

  --header-h: 48px;
  --footer-h: 32px;
}

* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { height: 100%; }
body {
  font-family: var(--font-sans);
  font-size: var(--font-size-base);
  color: var(--text-primary);
  background: var(--bg-base);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ── Header ── */
.site-header {
  height: var(--header-h);
  background: var(--accent-primary);
  color: #fff;
  display: flex;
  align-items: center;
  padding: 0 var(--space-lg);
  gap: var(--space-lg);
  flex-shrink: 0;
  z-index: 100;
}

.site-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.site-title .country-tag {
  font-size: var(--font-size-xs);
  background: rgba(255,255,255,0.2);
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  font-weight: 500;
}

.header-search {
  flex: 1;
  max-width: 400px;
  position: relative;
}

.header-search input {
  width: 100%;
  height: 32px;
  padding: 0 var(--space-md) 0 32px;
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: var(--radius-md);
  background: rgba(255,255,255,0.15);
  color: #fff;
  font-size: var(--font-size-sm);
  outline: none;
  transition: var(--transition-fast);
}
.header-search input::placeholder { color: rgba(255,255,255,0.6); }
.header-search input:focus {
  background: rgba(255,255,255,0.25);
  border-color: rgba(255,255,255,0.5);
}
.header-search .search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0.6;
  pointer-events: none;
  font-size: var(--font-size-sm);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-left: auto;
}

.header-btn {
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.2);
  color: #fff;
  width: 30px;
  height: 30px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  transition: var(--transition-fast);
}
.header-btn:hover { background: rgba(255,255,255,0.25); }

.header-stats {
  font-size: var(--font-size-xs);
  opacity: 0.8;
  white-space: nowrap;
  font-family: var(--font-mono);
}

/* ── Tabs ── */
.view-tabs {
  display: flex;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-subtle);
  padding: 0 var(--space-lg);
  overflow-x: auto;
  flex-shrink: 0;
}

.view-tab {
  padding: var(--space-sm) var(--space-lg);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  border: none;
  background: none;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  transition: var(--transition-fast);
  font-family: var(--font-sans);
}
.view-tab:hover { color: var(--text-primary); background: var(--bg-hover); }
.view-tab.active {
  color: var(--accent-primary);
  border-bottom-color: var(--accent-primary);
  font-weight: 600;
}

/* ── Main content ── */
.main-content {
  flex: 1 0 auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.view-container {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-lg);
}

.view-container.map-active {
  padding: 0;
  overflow: hidden;
  position: relative;
}

/* ── Filter bar ── */
.filter-bar {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-lg);
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-subtle);
  flex-wrap: wrap;
  flex-shrink: 0;
}

.filter-select {
  height: 30px;
  padding: 0 var(--space-md);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  background: var(--bg-surface);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  cursor: pointer;
  font-family: var(--font-sans);
}
.filter-select:focus { outline: 2px solid var(--accent-secondary); outline-offset: -1px; }

.filter-label {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.filter-count {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-left: auto;
  font-family: var(--font-mono);
}

.filter-clear {
  font-size: var(--font-size-xs);
  color: var(--accent-secondary);
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-family: var(--font-sans);
}
.filter-clear:hover { background: var(--bg-hover); }

/* ── Table ── */
.da-table-wrap {
  overflow: auto;
  flex: 1;
}

.da-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.da-table th {
  position: sticky;
  top: 0;
  background: var(--bg-elevated);
  padding: var(--space-sm) var(--space-md);
  text-align: left;
  font-weight: 600;
  color: var(--text-secondary);
  border-bottom: 2px solid var(--border-default);
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.da-table th:hover { background: var(--bg-active); }
.da-table th .sort-arrow { margin-left: 4px; opacity: 0.4; }
.da-table th.sorted .sort-arrow { opacity: 1; }

.da-table td {
  padding: var(--space-xs) var(--space-md);
  border-bottom: 1px solid var(--border-subtle);
  vertical-align: top;
  line-height: 1.4;
}

.da-table tr:nth-child(even) td { background: var(--bg-elevated); }
.da-table tr:hover td { background: var(--bg-hover); }

.da-table .col-date { font-family: var(--font-mono); font-size: var(--font-size-xs); white-space: nowrap; }
.da-table .col-days { font-family: var(--font-mono); font-size: var(--font-size-xs); text-align: right; }
.da-table .col-desc { max-width: 400px; }
.da-table .col-appnum { font-family: var(--font-mono); font-size: var(--font-size-xs); white-space: nowrap; }

/* ── Pills ── */
.pill {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 10px;
  font-size: var(--font-size-xs);
  font-weight: 500;
  white-space: nowrap;
}
.pill-approved { background: #dcfce7; color: #166534; }
.pill-refused { background: #fee2e2; color: #991b1b; }
.pill-withdrawn { background: #fef3c7; color: #92400e; }
.pill-pending { background: #dbeafe; color: #1e40af; }
.pill-default { background: var(--bg-elevated); color: var(--text-secondary); }

/* ── Chart containers ── */
.chart-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: var(--space-lg);
  max-width: 1600px;
}

.chart-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  overflow: hidden;
}

.chart-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
}

.chart-subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-lg);
}

/* ── SVG charts ── */
.bar-label {
  font-size: 12px;
  fill: var(--text-primary);
  font-family: var(--font-sans);
}
.bar-value {
  font-size: 11px;
  fill: var(--text-secondary);
  font-family: var(--font-mono);
}
.bar-rect {
  transition: opacity var(--transition-fast);
  cursor: pointer;
}
.bar-rect:hover { opacity: 0.8; }

/* ── Tooltip ── */
.chart-tooltip {
  position: fixed;
  background: var(--text-primary);
  color: #fff;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  pointer-events: none;
  z-index: 1000;
  max-width: 300px;
  line-height: 1.4;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  display: none;
}
.chart-tooltip.visible { display: block; }

/* ── Glossary tooltip ── */
.glossary-link {
  border-bottom: 1px dotted var(--accent-secondary);
  cursor: help;
  color: inherit;
}
.glossary-tooltip {
  position: fixed;
  background: var(--text-primary);
  color: #fff;
  padding: var(--space-md) var(--space-lg);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  z-index: 1001;
  max-width: 350px;
  line-height: 1.5;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  display: none;
}
.glossary-tooltip.visible { display: block; }
.glossary-tooltip .term-name {
  font-weight: 600;
  margin-bottom: var(--space-xs);
  color: var(--accent-secondary);
}

/* ── Map ── */
.map-container {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.map-legend {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  position: absolute;
  bottom: 20px;
  right: 20px;
  z-index: 400;
  font-size: var(--font-size-xs);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.map-legend-title {
  font-weight: 600;
  margin-bottom: var(--space-xs);
  color: var(--text-secondary);
}

.map-legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 2px 0;
}

.map-legend-swatch {
  width: 16px;
  height: 12px;
  border-radius: 2px;
  flex-shrink: 0;
}

/* ── Sankey / Flow ── */
.sankey-wrap {
  overflow-x: auto;
}

/* ── Modal ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2xl);
}

.modal-panel {
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  padding: var(--space-2xl);
  position: relative;
  box-shadow: 0 16px 48px rgba(0,0,0,0.2);
}

.modal-close {
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
  background: none;
  border: none;
  font-size: var(--font-size-xl);
  cursor: pointer;
  color: var(--text-tertiary);
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
}
.modal-close:hover { background: var(--bg-hover); color: var(--text-primary); }

.modal-title {
  font-size: var(--font-size-2xl);
  font-weight: 600;
  margin-bottom: var(--space-lg);
}

.modal-body p { margin-bottom: var(--space-md); color: var(--text-secondary); line-height: 1.6; }
.modal-body h3 { margin: var(--space-lg) 0 var(--space-sm); font-size: var(--font-size-lg); }
.modal-body a { color: var(--accent-secondary); }

.glossary-list { list-style: none; }
.glossary-list li {
  padding: var(--space-sm) 0;
  border-bottom: 1px solid var(--border-subtle);
}
.glossary-list .term { font-weight: 600; color: var(--accent-primary); }
.glossary-list .abbr { font-family: var(--font-mono); font-size: var(--font-size-xs); color: var(--text-tertiary); margin-left: var(--space-sm); }
.glossary-list .def { color: var(--text-secondary); font-size: var(--font-size-sm); margin-top: 2px; }

/* ── Stats row ── */
.stats-row {
  display: flex;
  gap: var(--space-lg);
  margin-bottom: var(--space-lg);
  flex-wrap: wrap;
}

.stat-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-md) var(--space-lg);
  min-width: 140px;
  flex: 1;
}

.stat-value {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  font-family: var(--font-mono);
  color: var(--text-primary);
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* ── Loading ── */
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: var(--text-tertiary);
  font-size: var(--font-size-lg);
}

.loading-pulse {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

/* ── Error ── */
.error-msg {
  background: #fee2e2;
  border: 1px solid #fca5a5;
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  color: #991b1b;
  text-align: center;
}

.error-msg button {
  margin-top: var(--space-md);
  padding: var(--space-sm) var(--space-lg);
  background: #991b1b;
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-family: var(--font-sans);
}

/* ── Council Panel (slide-in) ── */
.council-panel-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 2000;
  display: flex;
  justify-content: flex-end;
}

.council-panel {
  background: var(--bg-surface);
  width: 55%;
  max-width: 700px;
  height: 100%;
  overflow-y: auto;
  padding: var(--space-2xl);
  box-shadow: -8px 0 32px rgba(0,0,0,0.15);
  position: relative;
}

.council-panel-close {
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
  background: none;
  border: none;
  font-size: var(--font-size-xl);
  cursor: pointer;
  color: var(--text-tertiary);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
}
.council-panel-close:hover { background: var(--bg-hover); color: var(--text-primary); }

.council-panel-header h2 {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  margin-bottom: var(--space-xs);
}

.council-panel-meta {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.council-panel-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}

.council-panel-stats .stat-card {
  padding: var(--space-sm) var(--space-md);
}

.council-panel-stats .stat-value {
  font-size: var(--font-size-lg);
}

.council-panel-section {
  margin-bottom: var(--space-xl);
}

.council-panel-section h3 {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: var(--space-md);
  padding-bottom: var(--space-xs);
  border-bottom: 1px solid var(--border-subtle);
}

/* ── Comparison callouts ── */
.comparison-callout {
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-md);
}
.comparison-bad {
  background: #fee2e2;
  border: 1px solid #fca5a5;
  color: #991b1b;
}
.comparison-good {
  background: #dcfce7;
  border: 1px solid #86efac;
  color: #166534;
}

/* ── Leaderboard ── */
.leaderboard-table .council-link {
  color: var(--accent-secondary);
  cursor: pointer;
}
.leaderboard-table .council-link:hover {
  text-decoration: underline;
}

/* ── Insights ── */
.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: var(--space-md);
}

.insight-card {
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  cursor: default;
}

.insight-header {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.insight-severity {
  font-size: var(--font-size-sm);
  flex-shrink: 0;
}

.insight-title {
  font-weight: 600;
  font-size: var(--font-size-sm);
  line-height: 1.4;
  color: var(--text-primary);
}

.insight-body {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: var(--space-sm);
}

.insight-action {
  margin-top: var(--space-sm);
}

.insight-link {
  background: none;
  border: none;
  color: var(--accent-primary);
  font-size: var(--font-size-xs);
  cursor: pointer;
  padding: 2px 0;
  font-weight: 600;
  font-family: var(--font-sans);
}
.insight-link:hover { text-decoration: underline; }

/* ── Footer ── */
.site-footer {
  flex-shrink: 0;
  height: var(--footer-h);
  background: var(--bg-surface);
  border-top: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-lg);
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

.site-footer a {
  color: var(--accent-secondary);
  text-decoration: none;
}
.site-footer a:hover { text-decoration: underline; }

/* ── Responsive ── */
@media (max-width: 768px) {
  .site-header { padding: 0 var(--space-md); gap: var(--space-sm); }
  .site-title { font-size: var(--font-size-base); }
  .header-search { max-width: none; }
  .header-stats { display: none; }
  .view-tabs { padding: 0 var(--space-sm); }
  .view-tab { padding: var(--space-sm) var(--space-md); font-size: var(--font-size-xs); }
  .filter-bar { padding: var(--space-sm); }
  .view-container { padding: var(--space-md); }
  .view-container.map-active { padding: 0; }
  .council-panel { width: 100%; max-width: none; }
  .insights-grid { grid-template-columns: 1fr; }
  .chart-grid { grid-template-columns: 1fr; }
  .stats-row { gap: var(--space-sm); }
  .stat-card { min-width: 100px; padding: var(--space-sm) var(--space-md); }
  .stat-value { font-size: var(--font-size-xl); }
}

/* ── Scrollbar ── */
.da-table-wrap::-webkit-scrollbar,
.view-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.da-table-wrap::-webkit-scrollbar-track,
.view-container::-webkit-scrollbar-track {
  background: var(--bg-base);
}
.da-table-wrap::-webkit-scrollbar-thumb,
.view-container::-webkit-scrollbar-thumb {
  background: var(--border-default);
  border-radius: 4px;
}
`;
