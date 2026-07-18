import { Router } from 'express';
import { Signal } from '../models';
import { asyncHandler } from './helpers';

export const insightsRouter = Router();

/**
 * Insights automáticos: observaciones generadas desde las señales
 * (sin IA — plantillas sobre métricas reales).
 */
insightsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const insights: { text: string; slug: string; kind: string; at: Date }[] = [];

    const risers = await Signal.find({ status: 'rising' })
      .sort({ radarScore: -1 })
      .limit(5);
    for (const s of risers) {
      insights.push({
        text: `${s.name} muestra crecimiento acelerado con Radar Score ${s.radarScore} y confianza ${
          s.confidence === 'high' ? 'alta' : s.confidence === 'medium' ? 'media' : 'baja'
        }. ${s.explanation}`,
        slug: s.slug,
        kind: 'rising',
        at: s.updatedAt ?? new Date(),
      });
    }

    const streaks = await Signal.find({ 'metrics.acceleration': { $gt: 0 } })
      .sort({ 'metrics.acceleration': -1 })
      .limit(3);
    for (const s of streaks) {
      insights.push({
        text: `La categoría ${s.category} muestra aceleración positiva impulsada por ${s.name} (aceleración ${s.metrics?.acceleration}).`,
        slug: s.slug,
        kind: 'acceleration',
        at: s.updatedAt ?? new Date(),
      });
    }

    const predicted = await Signal.find({ confidence: 'high', 'predictions.d7': { $ne: null } })
      .sort({ radarScore: -1 })
      .limit(3);
    for (const s of predicted) {
      const current = s.metrics?.frequency ?? 0;
      const d7 = s.predictions?.d7 ?? 0;
      if (d7 > current) {
        insights.push({
          text: `Si la trayectoria se mantiene, ${s.name} pasaría de ${current} a ~${d7} menciones en 7 días (confianza ${s.confidenceScore}%).`,
          slug: s.slug,
          kind: 'prediction',
          at: s.updatedAt ?? new Date(),
        });
      }
    }

    res.json({ items: insights.slice(0, 10) });
  })
);
