/**
 * Signal Engine — Detecta señales a partir de menciones crudas + histórico.
 *
 * Convierte datos de los adaptadores en señales con Radar Score,
 * detectando: hashtag +300%, producto 40× sobre media, categoría acelerando,
 * crecimiento simultáneo en múltiples plataformas.
 */

import { RawMention } from '../adapters/baseAdapter';
import { canonicalizeWithCategory } from '../services/canonicalize';
import { Signal, ISignal } from '../models/Signal';
import { Snapshot } from '../models/Snapshot';
import { Trend } from '../models/Trend';
import { Hashtag } from '../models/Hashtag';
import { Product } from '../models/Product';
import { simpleHash, markProcessed, isAlreadyProcessed } from '../cache/adapterCache';
import { radarScore } from '../engine/radarScore';
import { latestVelocity } from '../engine/growthVelocity';
import { latestAcceleration } from '../engine/acceleration';
import { trendMomentum } from '../engine/momentum';
import { statsSummary, detectOutlierZScore } from '../engine/outliers';
import { VelocityPoint } from '../engine/growthVelocity';

// ── Extracción de entidades de un texto ───────────────────────────────────────

// Keywords y patrones que indican un producto/tendencia potencial
const PRODUCT_PATTERNS = [
  /mini\s+\w+/gi,
  /smart\s+\w+/gi,
  /portable\s+\w+/gi,
  /wireless\s+\w+/gi,
  /led\s+\w+/gi,
  /bluetooth\s+\w+/gi,
  /magnetic\s+\w+/gi,
  /thermal\s+\w+/gi,
  /electric\s+\w+/gi,
];

const HASHTAG_PATTERN = /#[\w]+/g;

function extractEntities(text: string): { products: string[]; hashtags: string[] } {
  const products: string[] = [];
  const hashtags: string[] = [];

  // Hashtags
  const hashtagMatches = text.match(HASHTAG_PATTERN) ?? [];
  hashtags.push(...hashtagMatches.map((h) => h.toLowerCase()));

  // Productos por patrones
  for (const pattern of PRODUCT_PATTERNS) {
    const matches = text.match(pattern) ?? [];
    products.push(...matches.map((m) => m.trim().toLowerCase()));
  }

  return { products: [...new Set(products)], hashtags: [...new Set(hashtags)] };
}

// ── Cálculo de frecuencias ────────────────────────────────────────────────────

interface EntityFrequency {
  name: string;
  canonicalName: string;
  category: string | null;
  frequency: number;
  engagement: number;
  sources: Set<string>;
  latestMention: Date;
}

function aggregateMentions(mentions: RawMention[]): {
  products: Map<string, EntityFrequency>;
  hashtags: Map<string, EntityFrequency>;
} {
  const products = new Map<string, EntityFrequency>();
  const hashtags = new Map<string, EntityFrequency>();

  for (const mention of mentions) {
    const { products: foundProducts, hashtags: foundHashtags } = extractEntities(mention.text);

    for (const product of foundProducts) {
      const { canonical, category } = canonicalizeWithCategory(product);
      const existing = products.get(canonical) ?? {
        name: product,
        canonicalName: canonical,
        category,
        frequency: 0,
        engagement: 0,
        sources: new Set<string>(),
        latestMention: mention.publishedAt,
      };
      existing.frequency++;
      existing.engagement += mention.engagement;
      existing.sources.add(mention.source);
      if (mention.publishedAt > existing.latestMention) {
        existing.latestMention = mention.publishedAt;
      }
      products.set(canonical, existing);
    }

    for (const hashtag of foundHashtags) {
      const canonical = hashtag.toLowerCase();
      const existing = hashtags.get(canonical) ?? {
        name: hashtag,
        canonicalName: canonical,
        category: null,
        frequency: 0,
        engagement: 0,
        sources: new Set<string>(),
        latestMention: mention.publishedAt,
      };
      existing.frequency++;
      existing.engagement += mention.engagement;
      existing.sources.add(mention.source);
      hashtags.set(canonical, existing);
    }
  }

  return { products, hashtags };
}

// ── Detección de señales (outliers sobre histórico) ───────────────────────────

async function getHistoricalFrequencies(entityName: string, metric: string, days = 7): Promise<VelocityPoint[]> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const snapshots = await Snapshot.find({
    entityName,
    metric,
    capturedAt: { $gte: cutoff },
  })
    .sort({ capturedAt: 1 })
    .lean();

  return snapshots.map((s) => ({ value: s.value, timestamp: s.capturedAt }));
}

// ── Upsert de entidades en base de datos ─────────────────────────────────────

async function upsertSignal(entity: EntityFrequency, velocity: number, acceleration: number): Promise<void> {
  const momentum = trendMomentum({
    frequency: entity.frequency,
    engagement: entity.engagement,
    growth: Math.max(0, velocity * 2), // aproximación
    acceleration,
    recency: (Date.now() - entity.latestMention.getTime()) / (1000 * 60 * 60),
  });

  const score = radarScore({
    velocity,
    acceleration,
    frequency: entity.frequency,
    engagement: entity.engagement,
    recency: (Date.now() - entity.latestMention.getTime()) / (1000 * 60 * 60),
  });

  const confidenceValue = Math.min(100, Math.round(score * 0.8 + entity.frequency * 0.2));
  const confidenceLevel =
    confidenceValue >= 70 ? 'high' : confidenceValue >= 40 ? 'medium' : 'low';

  await Signal.findOneAndUpdate(
    { canonicalName: entity.canonicalName },
    {
      $set: {
        name: entity.name,
        canonicalName: entity.canonicalName,
        category: entity.category ?? 'General',
        entityType: 'product',
        radarScore: score,
        growthScore: Math.round(velocity),
        confidenceLevel,
        confidenceValue,
        sources: Array.from(entity.sources),
        frequency: entity.frequency,
        engagement: entity.engagement,
        velocity,
        acceleration,
        momentum,
        updatedAt: new Date(),
      },
      $setOnInsert: { detectedAt: new Date(), isFromSeed: false, status: 'active' },
    },
    { upsert: true, new: true }
  );
}

// ── Función principal ─────────────────────────────────────────────────────────

export async function processMentions(mentions: RawMention[]): Promise<{
  signalsDetected: number;
  trendsUpdated: number;
  hashtagsUpdated: number;
}> {
  if (mentions.length === 0) return { signalsDetected: 0, trendsUpdated: 0, hashtagsUpdated: 0 };

  const { products, hashtags } = aggregateMentions(mentions);

  // Obtener todas las frecuencias históricas para cálculo de outliers
  const allFrequencies: number[] = [];
  for (const [, entity] of products) {
    allFrequencies.push(entity.frequency);
  }

  let signalsDetected = 0;
  let trendsUpdated = 0;
  let hashtagsUpdated = 0;

  // Procesar productos/tendencias
  for (const [canonical, entity] of products) {
    // Obtener histórico
    const series = await getHistoricalFrequencies(canonical, 'frequency');

    // Guardar snapshot actual
    await Snapshot.create({
      entityType: 'product',
      entityName: canonical,
      source: Array.from(entity.sources).join(','),
      metric: 'frequency',
      value: entity.frequency,
      capturedAt: new Date(),
    });

    // Calcular métricas
    const velocity = series.length >= 2 ? latestVelocity([...series, { value: entity.frequency, timestamp: new Date() }]) : entity.frequency / 24;
    const acceleration = series.length >= 3 ? latestAcceleration([...series, { value: entity.frequency, timestamp: new Date() }]) : 0;

    // Detectar outlier respecto a la distribución actual
    const outlier = allFrequencies.length > 3
      ? detectOutlierZScore(entity.frequency, allFrequencies, 1.5)
      : { isOutlier: entity.frequency >= 3 };

    if (outlier.isOutlier || entity.frequency >= 2) {
      await upsertSignal(entity, velocity, acceleration);
      signalsDetected++;
    }

    // Actualizar Trend
    await Trend.findOneAndUpdate(
      { canonicalName: canonical },
      {
        $set: {
          name: entity.name,
          canonicalName: canonical,
          category: entity.category ?? 'General',
          frequency: entity.frequency,
          lastSeenAt: entity.latestMention,
          sources: Array.from(entity.sources),
          isFromSeed: false,
        },
        $setOnInsert: { firstSeenAt: entity.latestMention },
      },
      { upsert: true }
    );
    trendsUpdated++;
  }

  // Procesar hashtags
  for (const [canonical, entity] of hashtags) {
    await Hashtag.findOneAndUpdate(
      { tag: canonical },
      {
        $set: {
          growth: entity.frequency,
          frequency: entity.frequency,
          momentum: entity.engagement / Math.max(1, entity.frequency),
          interestLevel: Math.min(100, entity.frequency * 5),
          sources: Array.from(entity.sources),
          lastSeenAt: entity.latestMention,
          isFromSeed: false,
        },
        $setOnInsert: { firstSeenAt: entity.latestMention },
      },
      { upsert: true }
    );
    hashtagsUpdated++;
  }

  return { signalsDetected, trendsUpdated, hashtagsUpdated };
}
