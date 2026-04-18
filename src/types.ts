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
  lat: number | null;
  lng: number | null;
}

export interface CouncilStats {
  slug: string;
  name: string;
  state: string;
  lat: number | null;
  lng: number | null;
  recordCount: number;
  population: number | null;
  applicationsPerCapita: number | null;
  medianProcessingDays: number | null;
  avgProcessingDays: number | null;
  approvalRate: number | null;
  rejectionRate: number | null;
  withdrawalRate: number | null;
  stalledCount: number;
  stalledRate: number | null;
  pendingCount: number;
  approvedCount: number;
  refusedCount: number;
  decidedCount: number;
  byCategory: Record<string, number>;
  byDecision: Record<string, number>;
  byMonth: Record<string, number>;
  topSuburbs: [string, number][];
  flows: Record<string, number>;
  processingTimes: number[];
}

export interface Aggregates {
  totalRecords: number;
  councilCount: number;
  byCategory: Record<string, number>;
  bySuburb: Record<string, number>;
  byMonth: Record<string, number>;
  byStatus: Record<string, number>;
  byDecision: Record<string, number>;
  byCouncil: Record<string, number>;
  byState: Record<string, number>;
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
    lat: number | null;
    lng: number | null;
  }[];
}

export type ViewId = 'map' | 'leaderboard' | 'insights' | 'table' | 'categories' | 'timeline' | 'flow' | 'suburbs' | 'processing' | 'states';

export interface Insight {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'alert';
  councilSlug?: string;
  councilName?: string;
  metric?: string;
  value?: number;
  comparison?: number;
}
