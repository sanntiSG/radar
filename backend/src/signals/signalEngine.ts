import { adapters } from '../adapters';
import type { RawItem } from '../adapters/baseAdapter';
import { filterNew, markProcessed } from '../cache/adapterCache';
import {
  acceleration,
  confidence,
  explainSignal,
  growthPct,
  growthVelocity,
  isZScoreOutlier,
  linearRegression,
  momentum,
  positiveAccelerationStreak,
  predict,
  radarScore,
} from '../engine';
import { Alert, Hashtag, Product, Signal, Snapshot, Trend } from '../models';
import { JobRun } from '../models/JobRun';
import { canonicalize, type KnownEntity } from '../services/canonicalize';
import { aggregateHashtags, extractCandidates } from './extract';

/**
 * Signal Engine: convierte items crudos en entidades canónicas,
 * snapshots históricos y señales con Radar Score.
 */

function today(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

async function upsertSnapshot(
  entityType: 'product' | 'hashtag' | 'trend',
  slug: string,
  mentions: number,
  engagement: number,
  interest = 0,
  date = today()
): Promise<void> {
  await Snapshot.updateOne(
    { entityType, slug, date },
    {
      $inc: { mentions, engagement },
      $max: { interest },
      $setOnInsert: { source: 'aggregate' },
    },
    { upsert: true }
  );
}

/** Fase 1 — Ingesta: adapters → cache → extracción → entidades + snapshots. */
export async function ingest(): Promise<{ items: number; products: number; hashtags: number }> {
  let allNew: RawItem[] = [];
  for (const adapter of adapters) {
    const startedAt = new Date();
    try {
      const items = await adapter.fetchItems();
      const fresh = await filterNew(items);
      console.log(`[ingest] ${adapter.name}: ${items.length} items, ${fresh.length} nuevos`);
      allNew = allNew.concat(fresh);
      await JobRun.create({
        adapter: adapter.name,
        startedAt,
        finishedAt: new Date(),
        itemsFetched: items.length,
        newItems: fresh.length,
        status: 'ok',
      });
    } catch (err) {
      console.warn(`[ingest] adaptador ${adapter.name} falló:`, (err as Error).message);
      await JobRun.create({
        adapter: adapter.name,
        startedAt,
        finishedAt: new Date(),
        status: 'error',
        error: (err as Error).message,
      }).catch(() => undefined);
    }
  }

  // Google Trends alimenta interés de entidades ya trackeadas, no candidatos
  const contentItems = allNew.filter((i) => i.source !== 'google-trends');
  const trendItems = allNew.filter((i) => i.source === 'google-trends');

  // --- Productos: candidatos n-gram → canonicalización → upsert ---
  const known: KnownEntity[] = (await Product.find().select('name slug aliases')).map((p) => ({
    name: p.name,
    slug: p.slug,
    aliases: p.aliases,
  }));

  const candidates = extractCandidates(contentItems);
  let productCount = 0;
  for (const cand of candidates.slice(0, 60)) {
    const match = canonicalize(cand.phrase, known);
    const update = {
      $set: { lastSeenAt: new Date(), category: match.category },
      $inc: { frequency: cand.count },
      $addToSet: {
        aliases: cand.phrase,
        sources: { $each: [...cand.sources] },
      },
      $setOnInsert: { name: match.canonicalName, firstSeenAt: new Date() },
    };
    await Product.updateOne({ slug: match.slug }, update, { upsert: true });
    if (!match.matchedExisting) {
      known.push({ name: match.canonicalName, slug: match.slug, aliases: [cand.phrase] });
    }
    await upsertSnapshot('product', match.slug, cand.count, cand.engagement);
    productCount++;
  }

  // --- Hashtags ---
  const hashtagMap = aggregateHashtags(contentItems);
  for (const [tag, data] of hashtagMap) {
    await Hashtag.updateOne(
      { tag },
      {
        $set: { lastSeenAt: new Date() },
        $inc: { frequency: data.count },
        $addToSet: { sources: { $each: [...data.sources] } },
        $setOnInsert: { firstSeenAt: new Date() },
      },
      { upsert: true }
    );
    await upsertSnapshot('hashtag', tag.replace(/^#/, ''), data.count, data.engagement);
  }

  // --- Tendencias (interés de Google Trends sobre keywords trackeadas) ---
  for (const item of trendItems) {
    const match = canonicalize(item.title, known);
    await Trend.updateOne(
      { slug: match.slug },
      {
        $set: {
          lastSeenAt: new Date(),
          category: match.category,
          interestLevel: item.engagement,
        },
        $addToSet: { aliases: item.title, sources: 'google-trends' },
        $setOnInsert: { name: match.canonicalName, firstSeenAt: new Date() },
      },
      { upsert: true }
    );
    await upsertSnapshot('trend', match.slug, 0, 0, item.engagement);
  }

  for (const adapter of adapters) {
    await markProcessed(
      adapter.name,
      allNew.filter((i) => i.source === adapter.name).map((i) => i.originalId)
    );
  }

  return { items: allNew.length, products: productCount, hashtags: hashtagMap.size };
}

interface SeriesMetrics {
  series: number[];
  engagementLast: number;
  velocity: number;
  accel: number;
  freq: number;
  recencyHours: number;
}

async function loadSeries(
  entityType: 'product' | 'hashtag' | 'trend',
  slug: string,
  lastSeenAt: Date,
  field: 'mentions' | 'interest' = 'mentions'
): Promise<SeriesMetrics> {
  const snaps = await Snapshot.find({ entityType, slug }).sort({ date: 1 }).limit(60);
  const series = snaps.map((s) => (field === 'interest' ? s.interest : s.mentions));
  const engagementLast = snaps.length ? snaps[snaps.length - 1].engagement : 0;
  return {
    series,
    engagementLast,
    velocity: growthVelocity(series),
    accel: acceleration(series),
    freq: series.length ? series[series.length - 1] : 0,
    recencyHours: (Date.now() - lastSeenAt.getTime()) / 36e5,
  };
}

function statusFor(m: SeriesMetrics): 'new' | 'rising' | 'peaking' | 'cooling' | 'dormant' {
  if (m.recencyHours > 24 * 7) return 'dormant';
  if (m.series.length < 3) return 'new';
  if (m.velocity > 0 && m.accel > 0) return 'rising';
  if (m.velocity > 0) return 'peaking';
  return 'cooling';
}


/** Fase 2 — Recalcular métricas, señales y alertas desde los snapshots. */
export async function recomputeAll(): Promise<number> {
  let signals = 0;

  const entities: {
    entityType: 'product' | 'hashtag' | 'trend';
    name: string;
    slug: string;
    category: string;
    aliases: string[];
    sources: string[];
    lastSeenAt: Date;
    field: 'mentions' | 'interest';
  }[] = [];

  for (const p of await Product.find()) {
    entities.push({
      entityType: 'product', name: p.name, slug: p.slug, category: p.category,
      aliases: p.aliases, sources: p.sources, lastSeenAt: p.lastSeenAt, field: 'mentions',
    });
  }
  for (const h of await Hashtag.find()) {
    entities.push({
      entityType: 'hashtag', name: h.tag, slug: h.tag.replace(/^#/, ''), category: h.category,
      aliases: [], sources: h.sources, lastSeenAt: h.lastSeenAt, field: 'mentions',
    });
  }
  for (const t of await Trend.find()) {
    entities.push({
      entityType: 'trend', name: t.name, slug: t.slug, category: t.category,
      aliases: t.aliases, sources: t.sources, lastSeenAt: t.lastSeenAt, field: 'interest',
    });
  }

  for (const entity of entities) {
    const m = await loadSeries(entity.entityType, entity.slug, entity.lastSeenAt, entity.field);
    if (m.series.length === 0) continue;

    const score = radarScore({
      velocity: m.velocity,
      acceleration: m.accel,
      frequency: m.freq,
      engagement: m.engagementLast,
      recencyHours: m.recencyHours,
    });
    const last = m.series[m.series.length - 1] ?? 0;
    const prev = m.series[m.series.length - 2] ?? 0;
    const changePct = growthPct(prev, last);
    const mom = momentum({
      frequency: m.freq,
      engagement: m.engagementLast,
      growthPct: changePct,
      acceleration: m.accel,
      recencyHours: m.recencyHours,
    });
    const forecast = predict(m.series);
    const conf = confidence(m.series, linearRegression(m.series));
    const streak = positiveAccelerationStreak(m.series);
    const outlier = isZScoreOutlier(m.series);
    const explained = explainSignal({
      name: entity.name,
      velocity: m.velocity,
      acceleration: m.accel,
      frequency: m.freq,
      engagement: m.engagementLast,
      recencyHours: m.recencyHours,
      changePct,
      streak,
      outlier,
      prev,
      last,
    });

    // Actualizar métricas en la colección de la entidad
    if (entity.entityType === 'product') {
      await Product.updateOne(
        { slug: entity.slug },
        { $set: { growthPct: changePct, radarScore: score } }
      );
    } else if (entity.entityType === 'hashtag') {
      await Hashtag.updateOne(
        { tag: entity.name },
        { $set: { growthPct: changePct, momentum: mom, interestLevel: Math.min(100, m.freq * 2) } }
      );
    } else {
      await Trend.updateOne(
        { slug: entity.slug },
        { $set: { changePct, momentum: mom, frequency: m.freq, interestLevel: last } }
      );
    }

    // Upsert de la señal
    await Signal.updateOne(
      { slug: entity.slug },
      {
        $set: {
          name: entity.name,
          category: entity.category,
          entityType: entity.entityType,
          radarScore: score,
          growthScore: Math.round(Math.max(-100, Math.min(999, changePct))),
          confidence: conf.level,
          confidenceScore: conf.score,
          status: statusFor(m),
          explanation: explained.sentence,
          factors: explained.factors,
          sources: entity.sources,
          aliases: entity.aliases,
          metrics: {
            velocity: Math.round(m.velocity * 100) / 100,
            acceleration: Math.round(m.accel * 100) / 100,
            momentum: mom,
            frequency: m.freq,
            engagement: m.engagementLast,
            recency: Math.round(m.recencyHours),
          },
          sparkline: m.series.slice(-14),
          predictions: { h24: forecast.h24, h72: forecast.h72, d7: forecast.d7 },
        },
        $setOnInsert: { detectedAt: new Date() },
      },
      { upsert: true }
    );
    signals++;

    // Alertas
    const alertBase = { entityType: entity.entityType, slug: entity.slug } as const;
    if (score >= 75) {
      await Alert.updateOne(
        { ...alertBase, type: 'radar_score' },
        {
          $set: {
            message: `${entity.name} alcanzó un Radar Score de ${score}`,
            value: score, threshold: 75, triggeredAt: new Date(),
          },
        },
        { upsert: true }
      );
    }
    if (outlier) {
      await Alert.updateOne(
        { ...alertBase, type: 'outlier' },
        {
          $set: {
            message: `${entity.name} muestra un volumen anómalo (outlier Z-Score)`,
            value: last, triggeredAt: new Date(),
          },
        },
        { upsert: true }
      );
    }
    if (streak >= 3) {
      await Alert.updateOne(
        { ...alertBase, type: 'acceleration' },
        {
          $set: {
            message: `${entity.name} acelera por ${streak} períodos consecutivos`,
            value: streak, threshold: 3, triggeredAt: new Date(),
          },
        },
        { upsert: true }
      );
    }
  }

  console.log(`[recompute] ${signals} señales actualizadas`);
  return signals;
}

/** Ciclo completo: ingesta + recálculo. */
export async function runPipeline(): Promise<void> {
  const stats = await ingest();
  console.log(`[pipeline] ingesta: ${stats.items} items → ${stats.products} productos, ${stats.hashtags} hashtags`);
  await recomputeAll();
}
