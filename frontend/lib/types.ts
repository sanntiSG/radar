export type SignalStatus = 'new' | 'rising' | 'peaking' | 'cooling' | 'dormant';
export type ConfidenceLevel = 'low' | 'medium' | 'high';
export type EntityType = 'product' | 'hashtag' | 'trend' | 'category';

export interface SignalMetrics {
  velocity: number;
  acceleration: number;
  momentum: number;
  frequency: number;
  engagement: number;
  recency: number;
}

export interface SignalFactor {
  key: string;
  label: string;
  detail: string;
  contribution: number; // 0-100
  weight: number | null; // % en Radar Score; null para factores cualitativos
}

export interface Signal {
  _id: string;
  name: string;
  slug: string;
  category: string;
  entityType: EntityType;
  radarScore: number;
  growthScore: number;
  confidence: ConfidenceLevel;
  confidenceScore: number;
  status: SignalStatus;
  detectedAt: string;
  explanation: string;
  factors: SignalFactor[];
  sources: string[];
  aliases: string[];
  metrics: SignalMetrics;
  sparkline: number[];
  predictions: { h24: number | null; h72: number | null; d7: number | null };
  updatedAt?: string;
}

export interface Trend {
  _id: string;
  name: string;
  slug: string;
  category: string;
  changePct: number;
  frequency: number;
  interestLevel: number;
  momentum: number;
  sources: string[];
}

export interface Hashtag {
  _id: string;
  tag: string;
  growthPct: number;
  frequency: number;
  momentum: number;
  interestLevel: number;
  category: string;
  sources: string[];
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  category: string;
  frequency: number;
  growthPct: number;
  radarScore: number;
  aliases: string[];
  sources: string[];
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface Insight {
  text: string;
  slug: string;
  kind: string;
  at: string;
}

export interface HistoryPoint {
  date: string;
  mentions: number;
  engagement: number;
  interest: number;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}

export interface Stats {
  total: number;
  rising: number;
  highConfidence: number;
  avgRadarScore: number;
}

export interface AssistantResponse {
  answer: string;
  kind: string;
  signals?: Signal[];
  suggestions?: string[];
}

export interface Opportunity {
  _id: string;
  name: string;
  slug: string;
  category: string;
  entityType: EntityType;
  radarScore: number;
  growthScore: number;
  status: SignalStatus;
  confidence: ConfidenceLevel;
  metrics: SignalMetrics;
  sparkline: number[];
  opportunityScore: number;
  reason: string;
  detectedAt: string;
  sources: string[];
}

export interface SourceInfo {
  name: string;
  label: string;
  description: string;
  provides: string;
  url: string;
  mode: string;
  cadence: string;
  cachedItems: number;
  lastRun: {
    at: string;
    itemsFetched: number;
    newItems: number;
    status: 'ok' | 'error';
    error: string;
  } | null;
}

export interface SourcesResponse {
  sources: SourceInfo[];
  schedule: {
    ingest: string;
    recompute: string;
    dailyPipeline: string;
    cronEnabled: boolean;
  };
}
