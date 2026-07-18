import type { Adapter } from './baseAdapter';
import { redditAdapter } from './reddit';
import { googleTrendsAdapter } from './googleTrends';
import { rssAdapter } from './rss';

export const adapters: Adapter[] = [redditAdapter, googleTrendsAdapter, rssAdapter];

export * from './baseAdapter';
export { redditAdapter, extractHashtags } from './reddit';
export { googleTrendsAdapter, interestOverTime, TRACKED_KEYWORDS } from './googleTrends';
export { rssAdapter } from './rss';
