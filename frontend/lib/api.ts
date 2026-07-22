import type {
  DailyResponse,
  Hashtag,
  HistoryPoint,
  Insight,
  Opportunity,
  Paged,
  Product,
  Signal,
  SourcesResponse,
  Stats,
  Trend,
} from './types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`API ${path} → HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  signals: (params = '') => get<Paged<Signal>>(`/api/signals?limit=50${params}`),
  signal: (slug: string) => get<Signal>(`/api/signals/${slug}`),
  stats: () => get<Stats>('/api/signals/stats'),
  trends: (params = '') => get<Paged<Trend>>(`/api/trends?limit=50${params}`),
  hashtags: (params = '') => get<Paged<Hashtag>>(`/api/hashtags?limit=50${params}`),
  products: (params = '') => get<Paged<Product>>(`/api/products?limit=50${params}`),
  insights: () => get<{ items: Insight[] }>('/api/insights'),
  history: (entityType: string, slug: string) =>
    get<{ points: HistoryPoint[] }>(`/api/history/${entityType}/${slug}`),
  sources: () => get<SourcesResponse>('/api/sources'),
  opportunities: () => get<{ items: Opportunity[]; total: number }>('/api/opportunities'),
  daily: () => get<DailyResponse>('/api/daily'),
};
