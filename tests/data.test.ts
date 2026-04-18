import { describe, expect, it } from 'vitest';
import { filterApplications, defaultFilters } from '../src/data';
import type { DevelopmentApplication } from '../src/types';

function mockApp(overrides: Partial<DevelopmentApplication> = {}): DevelopmentApplication {
  return {
    id: 'casey-PA26-0001',
    council: 'City of Casey',
    councilSlug: 'casey',
    state: 'VIC',
    applicationNumber: 'PA26-0001',
    description: 'Two Lot Subdivision',
    category: 'Subdivision',
    rawCategory: 'Planning Permit',
    address: '10 Test St Berwick 3806',
    suburb: 'Berwick',
    postcode: '3806',
    status: 'Decided',
    decision: 'Approved',
    lodgedDate: '2026-01-15',
    decisionDate: '2026-03-10',
    processingDays: 54,
    lat: null,
    lng: null,
    ...overrides,
  };
}

describe('filterApplications', () => {
  const apps = [
    mockApp({ id: '1', suburb: 'Berwick', category: 'Subdivision', decision: 'Approved', description: 'Two lot subdivision' }),
    mockApp({ id: '2', suburb: 'Clyde North', category: 'Residential', decision: 'Refused', description: 'Construction of a dwelling' }),
    mockApp({ id: '3', suburb: 'Berwick', category: 'Commercial', decision: 'Pending', description: 'Shop fit out', lodgedDate: '2025-06-01' }),
    mockApp({ id: '4', suburb: 'Cranbourne', category: 'Signage', decision: 'Approved', description: 'New business signage' }),
    mockApp({ id: '5', suburb: 'Clyde North', category: 'Vegetation', decision: 'Approved', description: 'Remove three trees' }),
  ];

  it('returns all with default filters', () => {
    const result = filterApplications(apps, defaultFilters());
    expect(result.length).toBe(5);
  });

  it('filters by search text in description', () => {
    const result = filterApplications(apps, { ...defaultFilters(), search: 'subdivision' });
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('1');
  });

  it('filters by search text in address', () => {
    const result = filterApplications(apps, { ...defaultFilters(), search: 'Test St' });
    expect(result.length).toBe(5); // All have same address
  });

  it('filters by search text in suburb', () => {
    const result = filterApplications(apps, { ...defaultFilters(), search: 'Clyde' });
    expect(result.length).toBe(2);
  });

  it('filters by category', () => {
    const result = filterApplications(apps, { ...defaultFilters(), category: 'Subdivision' });
    expect(result.length).toBe(1);
  });

  it('filters by decision', () => {
    const result = filterApplications(apps, { ...defaultFilters(), decision: 'Approved' });
    expect(result.length).toBe(3);
  });

  it('filters by suburb', () => {
    const result = filterApplications(apps, { ...defaultFilters(), suburb: 'Berwick' });
    expect(result.length).toBe(2);
  });

  it('combines multiple filters', () => {
    const result = filterApplications(apps, {
      ...defaultFilters(),
      suburb: 'Berwick',
      decision: 'Approved',
    });
    expect(result.length).toBe(1);
    expect(result[0].category).toBe('Subdivision');
  });

  it('returns empty for impossible filter combination', () => {
    const result = filterApplications(apps, {
      ...defaultFilters(),
      suburb: 'Berwick',
      category: 'Vegetation',
    });
    expect(result.length).toBe(0);
  });

  it('filters by yearFrom', () => {
    const result = filterApplications(apps, { ...defaultFilters(), yearFrom: '2026' });
    expect(result.length).toBe(4); // One app is from 2025
  });

  it('search is case insensitive', () => {
    const result = filterApplications(apps, { ...defaultFilters(), search: 'DWELLING' });
    expect(result.length).toBe(1);
  });

  it('handles empty app array', () => {
    const result = filterApplications([], defaultFilters());
    expect(result.length).toBe(0);
  });

  it('filters by council', () => {
    const mixedApps = [
      mockApp({ id: '1', council: 'City of Casey' }),
      mockApp({ id: '2', council: 'City of Melbourne' }),
      mockApp({ id: '3', council: 'City of Casey' }),
    ];
    const result = filterApplications(mixedApps, { ...defaultFilters(), council: 'City of Melbourne' });
    expect(result.length).toBe(1);
    expect(result[0].council).toBe('City of Melbourne');
  });
});
