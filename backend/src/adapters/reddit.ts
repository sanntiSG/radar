/**
 * Reddit Adapter — Usa snoowrap (OAuth app-only, sin usuario).
 * Monitorea subreddits de producto/ecommerce.
 */

import { BaseAdapter, RawMention } from './baseAdapter';

// Subreddits más relevantes para señales de producto/ecommerce
const TARGET_SUBREDDITS = [
  'shutupandtakemymoney',
  'gadgets',
  'BuyItForLife',
  'dropship',
  'Entrepreneur',
  'ecommerce',
  'AmazonFinds',
  'ProductReviews',
  'technology',
  'lifehacks',
  'mildlyinteresting',
];

type Snoowrap = typeof import('snoowrap');
type SnoowrapInstance = InstanceType<Snoowrap>;

export class RedditAdapter extends BaseAdapter {
  readonly sourceName = 'reddit';
  private client: SnoowrapInstance | null = null;
  private initialized = false;

  private async getClient(): Promise<SnoowrapInstance> {
    if (this.client) return this.client;

    const { default: Snoowrap } = await import('snoowrap');

    const clientId     = process.env.REDDIT_CLIENT_ID;
    const clientSecret = process.env.REDDIT_CLIENT_SECRET;
    const username     = process.env.REDDIT_USERNAME;
    const password     = process.env.REDDIT_PASSWORD;
    const userAgent    = process.env.REDDIT_USER_AGENT ?? 'radar:v0.1.0';

    if (!clientId || !clientSecret || !username || !password) {
      throw new Error(
        'Reddit credentials missing. Set REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, ' +
        'REDDIT_USERNAME and REDDIT_PASSWORD in your .env file.'
      );
    }

    // Script-app OAuth: usa usuario + contraseña para mayor rate limit y estabilidad.
    this.client = new Snoowrap({
      userAgent,
      clientId,
      clientSecret,
      username,
      password,
    }) as SnoowrapInstance;

    this.initialized = true;
    return this.client;
  }

  protected async fetchMentions(query?: string): Promise<RawMention[]> {
    const r = await this.getClient();
    const mentions: RawMention[] = [];

    // Si hay query, buscar directamente
    if (query) {
      const results = await (r as any).search({
        query,
        sort: 'relevance',
        time: 'week',
        limit: 50,
      });

      for (const post of results) {
        mentions.push({
          text: `${post.title} ${post.selftext ?? ''}`.trim(),
          source: 'reddit',
          url: `https://reddit.com${post.permalink}`,
          author: post.author?.name,
          engagement: (post.score ?? 0) + (post.num_comments ?? 0),
          publishedAt: new Date((post.created_utc ?? 0) * 1000),
          subreddit: post.subreddit?.display_name,
        });
      }

      return mentions;
    }

    // Sin query: recorrer subreddits monitoreados
    const fetchSubreddit = async (name: string): Promise<RawMention[]> => {
      try {
        const posts = await (r as any).getSubreddit(name).getHot({ limit: 25 });
        return posts.map((post: any) => ({
          text: `${post.title} ${post.selftext ?? ''}`.trim(),
          source: 'reddit',
          url: `https://reddit.com${post.permalink}`,
          author: post.author?.name,
          engagement: (post.score ?? 0) + (post.num_comments ?? 0),
          publishedAt: new Date((post.created_utc ?? 0) * 1000),
          subreddit: name,
        }));
      } catch (err) {
        console.warn(`[Reddit] Failed to fetch r/${name}:`, err instanceof Error ? err.message : err);
        return [];
      }
    };

    const results = await Promise.allSettled(
      TARGET_SUBREDDITS.map(fetchSubreddit)
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        mentions.push(...result.value);
      }
    }

    return mentions;
  }
}

export const redditAdapter = new RedditAdapter();
