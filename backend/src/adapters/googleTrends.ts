/**
 * Google Trends Adapter
 * Usa google-trends-api (sin auth) para:
 * - interestOverTime: serie histórica de una keyword (backfill)
 * - dailyTrends: tendencias calientes del día en tiempo real
 */

import googleTrends from 'google-trends-api';
import { BaseAdapter, RawMention } from './baseAdapter';

// Keywords de seguimiento por defecto (productos/ecommerce)
const DEFAULT_KEYWORDS = [
  'mini portable printer',
  'smart led lights',
  'wireless charger',
  'massage gun',
  'smart water bottle',
  'magnetic organizer',
  'kitchen gadgets',
  'pet accessories',
  'bluetooth earbuds',
  'fitness tracker',
];

export interface TrendPoint {
  keyword: string;
  date: Date;
  value: number; // 0-100 (Google Trends normalization)
}

export class GoogleTrendsAdapter extends BaseAdapter {
  readonly sourceName = 'google_trends';

  protected async fetchMentions(query?: string): Promise<RawMention[]> {
    const keywords = query ? [query] : DEFAULT_KEYWORDS.slice(0, 5); // cap 5 para no spamear
    const mentions: RawMention[] = [];

    for (const keyword of keywords) {
      try {
        const result = await googleTrends.interestOverTime({
          keyword,
          startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // últimos 7 días
          endTime: new Date(),
          granularTimeResolution: true,
        });

        const parsed = JSON.parse(result);
        const timelineData = parsed?.default?.timelineData ?? [];

        for (const point of timelineData) {
          const value = point.value?.[0] ?? 0;
          if (value > 0) {
            mentions.push({
              text: keyword,
              source: 'google_trends',
              engagement: value * 10, // normalizar a unidades de engagement
              publishedAt: new Date(parseInt(point.time, 10) * 1000),
              tags: [keyword],
            });
          }
        }

        // Pequeña pausa para no hacer rate-limit
        await sleep(500);
      } catch (err) {
        console.warn(`[GoogleTrends] Error fetching "${keyword}":`, err instanceof Error ? err.message : err);
      }
    }

    return mentions;
  }

  /**
   * Obtiene la serie histórica completa de una keyword para backfill.
   * Puede pedir hasta 90 días atrás.
   */
  async getHistoricalSeries(keyword: string, daysBack = 14): Promise<TrendPoint[]> {
    try {
      const result = await googleTrends.interestOverTime({
        keyword,
        startTime: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000),
        endTime: new Date(),
        granularTimeResolution: true,
      });

      const parsed = JSON.parse(result);
      const timelineData = parsed?.default?.timelineData ?? [];

      return timelineData.map((point: any) => ({
        keyword,
        date: new Date(parseInt(point.time, 10) * 1000),
        value: point.value?.[0] ?? 0,
      }));
    } catch (err) {
      console.warn(`[GoogleTrends] Historical series error for "${keyword}":`, err instanceof Error ? err.message : err);
      return [];
    }
  }

  /**
   * Obtiene las tendencias calientes del día (no requiere keyword).
   */
  async getDailyTrends(geo = 'US'): Promise<string[]> {
    try {
      const result = await googleTrends.dailyTrends({ geo });
      const parsed = JSON.parse(result);
      const trendingStories = parsed?.default?.trendingSearchesDays?.[0]?.trendingSearches ?? [];
      return trendingStories.map((s: any) => s?.title?.query as string).filter(Boolean);
    } catch (err) {
      console.warn('[GoogleTrends] Daily trends error:', err instanceof Error ? err.message : err);
      return [];
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const googleTrendsAdapter = new GoogleTrendsAdapter();
export { DEFAULT_KEYWORDS as TRENDS_KEYWORDS };
