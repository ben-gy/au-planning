import type { DevelopmentApplication, Aggregates, Meta } from './types';

let cachedApplications: DevelopmentApplication[] | null = null;
let cachedAggregates: Aggregates | null = null;
let cachedMeta: Meta | null = null;

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function loadApplications(): Promise<DevelopmentApplication[]> {
  if (cachedApplications) return cachedApplications;
  cachedApplications = await fetchJSON<DevelopmentApplication[]>('/data/applications.json');
  return cachedApplications;
}

export async function loadAggregates(): Promise<Aggregates> {
  if (cachedAggregates) return cachedAggregates;
  cachedAggregates = await fetchJSON<Aggregates>('/data/aggregates.json');
  return cachedAggregates;
}

export async function loadMeta(): Promise<Meta> {
  if (cachedMeta) return cachedMeta;
  cachedMeta = await fetchJSON<Meta>('/data/meta.json');
  return cachedMeta;
}

export interface FilterState {
  search: string;
  category: string;
  decision: string;
  suburb: string;
  yearFrom: string;
  yearTo: string;
}

export function defaultFilters(): FilterState {
  return { search: '', category: '', decision: '', suburb: '', yearFrom: '', yearTo: '' };
}

export function filterApplications(
  apps: DevelopmentApplication[],
  f: FilterState
): DevelopmentApplication[] {
  return apps.filter(a => {
    if (f.search) {
      const q = f.search.toLowerCase();
      if (
        !a.description.toLowerCase().includes(q) &&
        !a.address.toLowerCase().includes(q) &&
        !a.applicationNumber.toLowerCase().includes(q) &&
        !a.suburb.toLowerCase().includes(q)
      ) return false;
    }
    if (f.category && a.category !== f.category) return false;
    if (f.decision && a.decision !== f.decision) return false;
    if (f.suburb && a.suburb !== f.suburb) return false;
    if (f.yearFrom && a.lodgedDate < f.yearFrom) return false;
    if (f.yearTo && a.lodgedDate > f.yearTo + '-12-31') return false;
    return true;
  });
}
