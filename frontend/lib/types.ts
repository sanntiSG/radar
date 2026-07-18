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
