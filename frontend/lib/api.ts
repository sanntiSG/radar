import type {
  Signal,
  Trend,
  Hashtag,
  Product,
  HistoryPoint,
  Insight,
  PaginatedResponse,
  ApiResponse,
} from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    next: { revalidate: 120 }, // 2 min cache for Next.js fetch
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${path}`);
  }
  return res.json();
}

// ── Signals ──────────────────────────────────────────────────────────────────

export async function getSignals(params?: {
  category?: string;
  status?: string;
  minScore?: number;
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<Signal>> {
  const q = new URLSearchParams();
  if (params?.category) q.set('category', params.category);
  if (params?.status)   q.set('status',   params.status);
  if (params?.minScore) q.set('minScore', String(params.minScore));
  if (params?.limit)    q.set('limit',    String(params.limit ?? 20));
  if (params?.page)     q.set('page',     String(params.page ?? 1));
  const qs = q.toString() ? `?${q.toString()}` : '';
  return get<PaginatedResponse<Signal>>(`/api/signals${qs}`);
}

// ── Trends ────────────────────────────────────────────────────────────────────

export async function getTrends(params?: {
  category?: string;
  limit?: number;
}): Promise<PaginatedResponse<Trend>> {
  const q = new URLSearchParams();
  if (params?.category) q.set('category', params.category);
  if (params?.limit)    q.set('limit',    String(params.limit ?? 20));
  const qs = q.toString() ? `?${q.toString()}` : '';
  return get<PaginatedResponse<Trend>>(`/api/trends${qs}`);
}

// ── Hashtags ──────────────────────────────────────────────────────────────────

export async function getHashtags(params?: { limit?: number }): Promise<PaginatedResponse<Hashtag>> {
  const q = new URLSearchParams();
  if (params?.limit) q.set('limit', String(params.limit ?? 20));
  const qs = q.toString() ? `?${q.toString()}` : '';
  return get<PaginatedResponse<Hashtag>>(`/api/hashtags${qs}`);
}

// ── Products ──────────────────────────────────────────────────────────────────

export async function getProducts(params?: {
  category?: string;
  limit?: number;
}): Promise<PaginatedResponse<Product>> {
  const q = new URLSearchParams();
  if (params?.category) q.set('category', params.category);
  if (params?.limit)    q.set('limit',    String(params.limit ?? 20));
  const qs = q.toString() ? `?${q.toString()}` : '';
  return get<PaginatedResponse<Product>>(`/api/products${qs}`);
}

// ── History ───────────────────────────────────────────────────────────────────

export async function getEntityHistory(
  name: string,
  metric = 'frequency',
  days = 7
): Promise<ApiResponse<HistoryPoint[]>> {
  return get<ApiResponse<HistoryPoint[]>>(
    `/api/entity/${encodeURIComponent(name)}/history?metric=${metric}&days=${days}`
  );
}

// ── Insights ──────────────────────────────────────────────────────────────────

export async function getInsights(): Promise<ApiResponse<Insight[]>> {
  return get<ApiResponse<Insight[]>>('/api/insights');
}

// ── Client-side fetch (no cache) for interactive components ──────────────────

export async function fetchSignals(params?: Parameters<typeof getSignals>[0]): Promise<Signal[]> {
  const q = new URLSearchParams();
  if (params?.category) q.set('category', params.category);
  if (params?.status)   q.set('status',   params.status);
  if (params?.minScore) q.set('minScore', String(params.minScore));
  q.set('limit', String(params?.limit ?? 20));
  const qs = q.toString() ? `?${q.toString()}` : '';

  const res = await fetch(`${BASE_URL}/api/signals${qs}`);
  const json: PaginatedResponse<Signal> = await res.json();
  return json.data ?? [];
}

export async function fetchEntityHistory(name: string, days = 7): Promise<HistoryPoint[]> {
  const res = await fetch(
    `${BASE_URL}/api/entity/${encodeURIComponent(name)}/history?metric=frequency&days=${days}`
  );
  const json: ApiResponse<HistoryPoint[]> = await res.json();
  return json.data ?? [];
}
