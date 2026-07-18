import Parser from 'rss-parser';
import type { Adapter, RawItem } from './baseAdapter';
import { extractHashtags } from './reddit';

/** Blogs de ecommerce, gadgets y tendencias con RSS público. */
const FEEDS = [
  'https://www.trendhunter.com/rss/category/Gadgets-And-Electronics',
  'https://techcrunch.com/category/gadgets/feed/',
  'https://www.practicalecommerce.com/feed',
  'https://www.gadgetreview.com/feed',
];

const parser = new Parser({ timeout: 15000 });

export const rssAdapter: Adapter = {
  name: 'rss',
  async fetchItems(): Promise<RawItem[]> {
    const items: RawItem[] = [];
    for (const feedUrl of FEEDS) {
      try {
        const feed = await parser.parseURL(feedUrl);
        for (const entry of feed.items.slice(0, 20)) {
          const id = entry.guid ?? entry.link ?? entry.title;
          if (!id) continue;
          items.push({
            source: 'rss',
            originalId: id,
            title: entry.title ?? '',
            text: (entry.contentSnippet ?? '').slice(0, 500),
            url: entry.link ?? feedUrl,
            engagement: 0,
            hashtags: extractHashtags(`${entry.title} ${entry.contentSnippet ?? ''}`),
            createdAt: entry.isoDate ? new Date(entry.isoDate) : new Date(),
          });
        }
      } catch (err) {
        console.warn(`[rss] ${feedUrl} falló:`, (err as Error).message);
      }
    }
    return items;
  },
};
