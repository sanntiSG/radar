import { env } from '../config/env';
import type { Adapter, RawItem } from './baseAdapter';

/**
 * Adaptador Reddit — funciona SIN credenciales usando los endpoints
 * públicos .json (rate limit conservador). Si hay credenciales de una
 * app "script" en .env, usa OAuth para mayor límite.
 */

const SUBREDDITS = [
  'gadgets',
  'shutupandtakemymoney',
  'BuyItForLife',
  'ProductPorn',
  'INEEEEDIT',
  'Aliexpress',
  'dropship',
  'ecommerce',
];

const USER_AGENT = 'radar-signals/0.1 (deteccion de senales de mercado)';
const PAUSE_MS = 1500; // pausa entre subreddits para no golpear el rate limit

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface RedditPost {
  data: {
    id: string;
    title: string;
    selftext: string;
    permalink: string;
    ups: number;
    num_comments: number;
    created_utc: number;
  };
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getOAuthToken(): Promise<string | null> {
  const { clientId, clientSecret, username, password } = env.reddit;
  if (!clientId || !clientSecret || !username || !password) return null;
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.token;

  try {
    const res = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': USER_AGENT,
      },
      body: new URLSearchParams({ grant_type: 'password', username, password }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!json.access_token) return null;
    cachedToken = {
      token: json.access_token,
      expiresAt: Date.now() + ((json.expires_in ?? 3600) - 60) * 1000,
    };
    return cachedToken.token;
  } catch {
    return null;
  }
}

async function fetchSubreddit(sub: string, token: string | null): Promise<RawItem[]> {
  const base = token ? 'https://oauth.reddit.com' : 'https://www.reddit.com';
  const url = `${base}/r/${sub}/hot.json?limit=40&raw_json=1`;
  const headers: Record<string, string> = { 'User-Agent': USER_AGENT };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    console.warn(`[reddit] r/${sub} → HTTP ${res.status}`);
    return [];
  }
  const json = (await res.json()) as { data?: { children?: RedditPost[] } };
  const posts = json.data?.children ?? [];

  return posts.map((p) => ({
    source: 'reddit',
    originalId: p.data.id,
    title: p.data.title,
    text: p.data.selftext?.slice(0, 500) ?? '',
    url: `https://www.reddit.com${p.data.permalink}`,
    engagement: (p.data.ups ?? 0) + (p.data.num_comments ?? 0),
    hashtags: extractHashtags(`${p.data.title} ${p.data.selftext ?? ''}`),
    createdAt: new Date(p.data.created_utc * 1000),
  }));
}

export function extractHashtags(text: string): string[] {
  const matches = text.match(/#[a-zA-Z0-9_]{3,30}/g) ?? [];
  return [...new Set(matches.map((h) => h.toLowerCase()))];
}

export const redditAdapter: Adapter = {
  name: 'reddit',
  async fetchItems(): Promise<RawItem[]> {
    const items: RawItem[] = [];
    const token = await getOAuthToken();
    for (const sub of SUBREDDITS) {
      try {
        items.push(...(await fetchSubreddit(sub, token)));
      } catch (err) {
        console.warn(`[reddit] r/${sub} falló:`, (err as Error).message);
      }
      await sleep(PAUSE_MS);
    }
    return items;
  },
};
