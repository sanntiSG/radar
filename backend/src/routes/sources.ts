import { Router } from 'express';
import { AdapterCache } from '../cache/adapterCache';
import { CADENCES } from '../jobs/scheduler';
import { JobRun } from '../models/JobRun';
import { asyncHandler } from './helpers';
import { env } from '../config/env';

export const sourcesRouter = Router();

/** Metadatos estáticos de cada fuente — qué es y qué aporta a Radar. */
const SOURCE_META: Record<
  string,
  { label: string; description: string; provides: string; url: string }
> = {
  reddit: {
    label: 'Reddit',
    description:
      'Comunidades donde las tendencias de producto nacen semanas antes de explotar en otras redes (r/gadgets, r/shutupandtakemymoney, r/BuyItForLife y más).',
    provides: 'Menciones de productos, hashtags y engagement (upvotes + comentarios)',
    url: 'https://www.reddit.com',
  },
  'google-trends': {
    label: 'Google Trends',
    description:
      'Interés de búsqueda global para las keywords canónicas que Radar sigue. Alimenta las tendencias y el backfill histórico.',
    provides: 'Nivel de interés 0-100 por keyword y evolución temporal',
    url: 'https://trends.google.com',
  },
  rss: {
    label: 'Blogs de ecommerce (RSS)',
    description:
      'Trend Hunter, TechCrunch Gadgets, Practical Ecommerce y Gadget Review. Señales editoriales de productos emergentes.',
    provides: 'Artículos y menciones de productos en medios especializados',
    url: '',
  },
};

// GET /api/sources — fuentes activas, cadencias de renovación y últimos runs
sourcesRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const names = Object.keys(SOURCE_META);

    const sources = await Promise.all(
      names.map(async (name) => {
        const [lastRun, cachedItems] = await Promise.all([
          JobRun.findOne({ adapter: name }).sort({ startedAt: -1 }),
          AdapterCache.countDocuments({ source: name }),
        ]);
        const meta = SOURCE_META[name];
        return {
          name,
          label: meta.label,
          description: meta.description,
          provides: meta.provides,
          url: meta.url,
          mode:
            name === 'reddit'
              ? env.reddit.clientId
                ? 'API autenticada (script app)'
                : 'Endpoints públicos, sin credenciales — rate limit conservador'
              : 'API pública gratuita',
          cadence: CADENCES.ingest,
          cachedItems,
          lastRun: lastRun
            ? {
                at: lastRun.startedAt,
                itemsFetched: lastRun.itemsFetched,
                newItems: lastRun.newItems,
                status: lastRun.status,
                error: lastRun.error,
              }
            : null,
        };
      })
    );

    res.json({
      sources,
      schedule: {
        ingest: CADENCES.ingest,
        recompute: CADENCES.recompute,
        dailyPipeline: CADENCES.dailyPipeline,
        cronEnabled: env.enableCron,
      },
    });
  })
);
