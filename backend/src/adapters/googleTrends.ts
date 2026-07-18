import googleTrends from 'google-trends-api';
import type { Adapter, RawItem } from './baseAdapter';

/**
 * Adaptador Google Trends — interés de búsqueda para keywords canónicas.
 * La librería a veces recibe HTML en vez de JSON (bloqueo blando de Google):
 * en ese caso se loguea y se devuelve [] sin romper el pipeline.
 */

export const TRACKED_KEYWORDS = [
  'mini printer',
  'portable printer',
  'magnetic organizer',
  'smart water bottle',
  'led strip lights',
  'neck massager',
  'pet water fountain',
  'air fryer',
  'posture corrector',
  'car vacuum',
];

function safeParse(raw: string): unknown | null {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export interface TrendPoint {
  keyword: string;
  date: Date;
  value: number; // interés 0-100
}

/** Interés diario de los últimos `days` días para una keyword. */
export async function interestOverTime(
  keyword: string,
  days = 14
): Promise<TrendPoint[]> {
  const startTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const raw = await googleTrends.interestOverTime({ keyword, startTime });
  const parsed = safeParse(raw) as {
    default?: { timelineData?: { time: string; value: number[] }[] };
  } | null;
  if (!parsed?.default?.timelineData) {
    console.warn(`[google-trends] respuesta no JSON para "${keyword}"`);
    return [];
  }
  return parsed.default.timelineData.map((point) => ({
    keyword,
    date: new Date(Number(point.time) * 1000),
    value: point.value?.[0] ?? 0,
  }));
}

export const googleTrendsAdapter: Adapter = {
  name: 'google-trends',
  async fetchItems(): Promise<RawItem[]> {
    const items: RawItem[] = [];
    for (const keyword of TRACKED_KEYWORDS) {
      try {
        const points = await interestOverTime(keyword, 2);
        const latest = points[points.length - 1];
        if (!latest) continue;
        items.push({
          source: 'google-trends',
          originalId: `${keyword}-${latest.date.toISOString().slice(0, 10)}`,
          title: keyword,
          text: '',
          url: `https://trends.google.com/trends/explore?q=${encodeURIComponent(keyword)}`,
          engagement: latest.value,
          hashtags: [],
          createdAt: latest.date,
        });
      } catch (err) {
        console.warn(`[google-trends] "${keyword}" falló:`, (err as Error).message);
      }
      await new Promise((r) => setTimeout(r, 1200));
    }
    return items;
  },
};
