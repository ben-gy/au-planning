import type { DevelopmentApplication } from '../types';
import { formatDate, formatRelativeDate, formatProcessingDays, truncate } from '../utils';

type SortKey = 'lodgedDate' | 'suburb' | 'category' | 'decision' | 'processingDays' | 'description';

let currentSort: SortKey = 'lodgedDate';
let sortDir: 'asc' | 'desc' = 'desc';

function pillClass(decision: string): string {
  switch (decision) {
    case 'Approved': return 'pill pill-approved';
    case 'Refused': return 'pill pill-refused';
    case 'Withdrawn': return 'pill pill-withdrawn';
    case 'Pending': return 'pill pill-pending';
    default: return 'pill pill-default';
  }
}

function sortApps(apps: DevelopmentApplication[]): DevelopmentApplication[] {
  return [...apps].sort((a, b) => {
    let cmp = 0;
    switch (currentSort) {
      case 'lodgedDate':
        cmp = (a.lodgedDate || '').localeCompare(b.lodgedDate || '');
        break;
      case 'suburb':
        cmp = a.suburb.localeCompare(b.suburb);
        break;
      case 'category':
        cmp = a.category.localeCompare(b.category);
        break;
      case 'decision':
        cmp = a.decision.localeCompare(b.decision);
        break;
      case 'processingDays':
        cmp = (a.processingDays ?? 9999) - (b.processingDays ?? 9999);
        break;
      case 'description':
        cmp = a.description.localeCompare(b.description);
        break;
    }
    return sortDir === 'desc' ? -cmp : cmp;
  });
}

export function renderTable(container: HTMLElement, apps: DevelopmentApplication[]): void {
  const sorted = sortApps(apps);
  const PAGE_SIZE = 100;
  const displayApps = sorted.slice(0, PAGE_SIZE);

  const arrow = (key: SortKey) => {
    const isActive = currentSort === key;
    const symbol = isActive ? (sortDir === 'desc' ? '▼' : '▲') : '▽';
    return `<span class="sort-arrow">${symbol}</span>`;
  };

  const sortedClass = (key: SortKey) => currentSort === key ? 'sorted' : '';

  container.innerHTML = `
    <div class="da-table-wrap">
      <table class="da-table">
        <thead>
          <tr>
            <th data-sort="lodgedDate" class="${sortedClass('lodgedDate')}">Lodged ${arrow('lodgedDate')}</th>
            <th>App #</th>
            <th data-sort="description" class="${sortedClass('description')}">Description ${arrow('description')}</th>
            <th data-sort="category" class="${sortedClass('category')}">Category ${arrow('category')}</th>
            <th data-sort="suburb" class="${sortedClass('suburb')}">Suburb ${arrow('suburb')}</th>
            <th data-sort="decision" class="${sortedClass('decision')}">Decision ${arrow('decision')}</th>
            <th data-sort="processingDays" class="${sortedClass('processingDays')}">Processing ${arrow('processingDays')}</th>
          </tr>
        </thead>
        <tbody>
          ${displayApps.map(a => `
            <tr>
              <td class="col-date" data-tip="Lodged ${formatDate(a.lodgedDate)}" aria-label="Lodged ${formatDate(a.lodgedDate)}">${formatRelativeDate(a.lodgedDate)}</td>
              <td class="col-appnum">${a.applicationNumber}</td>
              <td class="col-desc" data-tip="${a.description.replace(/"/g, '&quot;')}" aria-label="${a.description.replace(/"/g, '&quot;')}">${truncate(a.description, 60)}</td>
              <td><span class="pill pill-default">${a.category}</span></td>
              <td>${a.suburb}</td>
              <td><span class="${pillClass(a.decision)}">${a.decision}</span></td>
              <td class="col-days">${formatProcessingDays(a.processingDays)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ${sorted.length > PAGE_SIZE ? `<div style="padding:var(--space-md);text-align:center;color:var(--text-tertiary);font-size:var(--font-size-sm);">Showing ${PAGE_SIZE} of ${sorted.length.toLocaleString()} results</div>` : ''}
    </div>
  `;

  // Sort handlers
  container.querySelectorAll<HTMLElement>('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort as SortKey;
      if (currentSort === key) {
        sortDir = sortDir === 'desc' ? 'asc' : 'desc';
      } else {
        currentSort = key;
        sortDir = 'desc';
      }
      renderTable(container, apps);
    });
  });
}
