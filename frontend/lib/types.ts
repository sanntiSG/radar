// ── Shared Types ─────────────────────────────────────────────────────────────

export type ConfidenceLevel = 'low' | 'medium' | 'high';
export type SignalStatus = 'active' | 'fading' | 'exploded' | 'noise';
export type EntityType = 'product' | 'hashtag' | 'trend' | 'category';

export interface Signal {
  _id: string;
  name: string;
  canonicalName: string;
  category: string;
  entityType: EntityType;
  radarScore: number;
  growthScore: number;
  confidenceLevel: ConfidenceLevel;
  confidenceValue: number;
  status: SignalStatus;
  sources: string[];
  frequency: number;
  engagement: number;
  velocity: number;
  acceleration: number;
  momentum: number;
  detectedAt: string;
  updatedAt: string;
  isFromSeed: boolean;
}

export interface Trend {
  _id: string;
  name: string;
  canonicalName: string;
  category: string;
  variationPct: number;
  frequency: number;
  interestLevel: number;
  radarScore: number;
  sources: string[];
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface Hashtag {
  _id: string;
  tag: string;
  growth: number;
  frequency: number;
  momentum: number;
  interestLevel: number;
  sources: string[];
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface Product {
  _id: string;
  name: string;
  canonicalName: string;
  category: string;
  frequency: number;
  growth: number;
  radarScore: number;
  sources: string[];
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface HistoryPoint {
  date: string;
  value: number;
  source: string;
}

export interface Insight {
  id: string;
  type: string;
  entityName: string;
  text: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}
