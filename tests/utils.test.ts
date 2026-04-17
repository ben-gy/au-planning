import { describe, expect, it } from 'vitest';
import {
  formatNumber,
  formatDate,
  formatRelativeDate,
  formatProcessingDays,
  truncate,
  decisionColor,
  categoryColor,
  sortedEntries,
  median,
  percentile,
} from '../src/utils';

describe('formatNumber', () => {
  it('formats thousands with commas', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });
  it('handles zero', () => {
    expect(formatNumber(0)).toBe('0');
  });
  it('handles negative numbers', () => {
    expect(formatNumber(-1234)).toBe('-1,234');
  });
  it('handles decimals', () => {
    expect(formatNumber(1234.56, 2)).toBe('1,234.56');
  });
  it('handles small numbers', () => {
    expect(formatNumber(42)).toBe('42');
  });
});

describe('formatDate', () => {
  it('formats a date string', () => {
    const result = formatDate('2026-04-14');
    expect(result).toContain('14');
    expect(result).toContain('Apr');
    expect(result).toContain('2026');
  });
  it('returns dash for empty string', () => {
    expect(formatDate('')).toBe('—');
  });
  it('returns original for invalid date', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });
});

describe('formatRelativeDate', () => {
  it('returns Today for today', () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(formatRelativeDate(today)).toBe('Today');
  });
  it('returns dash for empty string', () => {
    expect(formatRelativeDate('')).toBe('—');
  });
  it('returns years for old dates', () => {
    expect(formatRelativeDate('2020-01-01')).toMatch(/\d+y ago/);
  });
});

describe('formatProcessingDays', () => {
  it('handles null', () => {
    expect(formatProcessingDays(null)).toBe('—');
  });
  it('handles same day', () => {
    expect(formatProcessingDays(0)).toBe('Same day');
  });
  it('handles 1 day', () => {
    expect(formatProcessingDays(1)).toBe('1 day');
  });
  it('handles days', () => {
    expect(formatProcessingDays(5)).toBe('5 days');
  });
  it('handles weeks', () => {
    expect(formatProcessingDays(14)).toBe('2 weeks');
  });
  it('handles months', () => {
    expect(formatProcessingDays(60)).toBe('2 months');
  });
  it('handles years', () => {
    expect(formatProcessingDays(730)).toBe('2.0 years');
  });
});

describe('truncate', () => {
  it('returns short strings unchanged', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });
  it('truncates long strings with ellipsis', () => {
    expect(truncate('hello world', 8)).toBe('hello w…');
  });
  it('handles exact length', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });
});

describe('decisionColor', () => {
  it('returns green for Approved', () => {
    expect(decisionColor('Approved')).toBe('var(--status-good)');
  });
  it('returns red for Refused', () => {
    expect(decisionColor('Refused')).toBe('var(--status-bad)');
  });
  it('returns warn for Withdrawn', () => {
    expect(decisionColor('Withdrawn')).toBe('var(--status-warn)');
  });
  it('returns accent for Pending', () => {
    expect(decisionColor('Pending')).toBe('var(--accent-primary)');
  });
  it('returns secondary for unknown', () => {
    expect(decisionColor('Something else')).toBe('var(--text-secondary)');
  });
});

describe('categoryColor', () => {
  it('returns blue for Residential', () => {
    expect(categoryColor('Residential')).toBe('#2563eb');
  });
  it('returns teal for Subdivision', () => {
    expect(categoryColor('Subdivision')).toBe('#0d9488');
  });
  it('returns grey fallback for unknown', () => {
    expect(categoryColor('Unknown Category')).toBe('#94a3b8');
  });
});

describe('sortedEntries', () => {
  it('sorts descending by default', () => {
    const result = sortedEntries({ a: 1, b: 3, c: 2 });
    expect(result).toEqual([['b', 3], ['c', 2], ['a', 1]]);
  });
  it('sorts ascending', () => {
    const result = sortedEntries({ a: 1, b: 3, c: 2 }, 'asc');
    expect(result).toEqual([['a', 1], ['c', 2], ['b', 3]]);
  });
  it('handles empty object', () => {
    expect(sortedEntries({})).toEqual([]);
  });
});

describe('median', () => {
  it('returns middle value for odd length', () => {
    expect(median([1, 3, 5])).toBe(3);
  });
  it('returns average of middle two for even length', () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });
  it('returns 0 for empty array', () => {
    expect(median([])).toBe(0);
  });
  it('returns single value', () => {
    expect(median([42])).toBe(42);
  });
});

describe('percentile', () => {
  it('returns 0th percentile (min)', () => {
    expect(percentile([1, 2, 3, 4, 5], 0)).toBe(1);
  });
  it('returns 100th percentile (max)', () => {
    expect(percentile([1, 2, 3, 4, 5], 100)).toBe(5);
  });
  it('returns 50th percentile (median)', () => {
    expect(percentile([1, 2, 3, 4, 5], 50)).toBe(3);
  });
  it('returns 0 for empty array', () => {
    expect(percentile([], 50)).toBe(0);
  });
});
