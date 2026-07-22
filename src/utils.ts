// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Ben Richardson — https://benrichardson.dev
// Additional terms under AGPL-3.0 section 7(b) apply; see ADDITIONAL-TERMS.md.
/** Format a number with locale separators */
export function formatNumber(n: number, decimals = 0): string {
  return n.toLocaleString('en-AU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Format a date string as "14 Apr 2026" */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Format a date as relative time "2d ago", "3mo ago" */
export function formatRelativeDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return formatDate(dateStr);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

/** Format processing days as human string */
export function formatProcessingDays(days: number | null): string {
  if (days === null) return '—';
  if (days === 0) return 'Same day';
  if (days === 1) return '1 day';
  if (days < 7) return `${days} days`;
  if (days < 30) return `${Math.floor(days / 7)} weeks`;
  if (days < 365) return `${Math.floor(days / 30)} months`;
  return `${(days / 365).toFixed(1)} years`;
}

/** Truncate text with ellipsis */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + '…';
}

/** Debounce a function */
export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/** Decision colour */
export function decisionColor(decision: string): string {
  switch (decision) {
    case 'Approved': return 'var(--status-good)';
    case 'Refused': return 'var(--status-bad)';
    case 'Withdrawn': return 'var(--status-warn)';
    case 'Pending': return 'var(--accent-primary)';
    case 'No Permit Required': return 'var(--text-tertiary)';
    default: return 'var(--text-secondary)';
  }
}

/** Category colour — consistent across all views */
const CATEGORY_COLORS: Record<string, string> = {
  Residential: '#2563eb',
  Subdivision: '#0d9488',
  Commercial: '#7c3aed',
  Industrial: '#dc2626',
  'Change of Use': '#ea580c',
  Signage: '#ca8a04',
  Vegetation: '#16a34a',
  Ancillary: '#64748b',
  Community: '#0284c7',
  Infrastructure: '#6d28d9',
  Hospitality: '#db2777',
  'Health/Aged Care': '#059669',
  Other: '#94a3b8',
};

export function categoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] || '#94a3b8';
}

export function allCategoryColors(): Record<string, string> {
  return { ...CATEGORY_COLORS };
}

/** Sort helper for sorted entries */
export function sortedEntries(obj: Record<string, number>, dir: 'asc' | 'desc' = 'desc'): [string, number][] {
  return Object.entries(obj).sort((a, b) => dir === 'desc' ? b[1] - a[1] : a[1] - b[1]);
}

/** Calculate median of sorted array */
export function median(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Calculate percentile of sorted array */
export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}
