export interface DevelopmentApplication {
  id: string;
  council: string;
  councilSlug: string;
  state: string;
  applicationNumber: string;
  description: string;
  category: string;
  rawCategory: string;
  address: string;
  suburb: string;
  postcode: string;
  status: string;
  decision: string;
  lodgedDate: string;
  decisionDate: string;
  processingDays: number | null;
}

export interface Aggregates {
  totalRecords: number;
  byCategory: Record<string, number>;
  bySuburb: Record<string, number>;
  byMonth: Record<string, number>;
  byStatus: Record<string, number>;
  byDecision: Record<string, number>;
  flows: Record<string, number>;
  processingTimes: number[];
}

export interface Meta {
  lastUpdated: string;
  councils: {
    name: string;
    slug: string;
    state: string;
    recordCount: number;
    error?: string;
  }[];
}

export type ViewId = 'map' | 'table' | 'categories' | 'timeline' | 'flow' | 'suburbs' | 'processing';
