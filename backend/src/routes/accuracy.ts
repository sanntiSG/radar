import { Router } from 'express';
import { Signal, Snapshot } from '../models';
import { anticipationDays, backtestSignal } from '../engine';
import { asyncHandler } from './helpers';

export const accuracyRouter = Router();

const DISCLAIMER =
  'Backtest sobre el histórico disponible en Radar — mide si las direcciones que el modelo ' +
  'habría proyectado en el pasado se cumplieron. No garantiza resultados futuros; cuantos más ' +
  'días de histórico se acumulen, más robusto será este índice.';

interface Bucket {
  hits: number;
  total: number;
}

function bump(map: Map<string, Bucket>, key: string, hits: number, total: number): void {
  const cur = map.get(key) ?? { hits: 0, total: 0 };
  cur.hits += hits;
  cur.total += total;
  map.set(key, cur);
}

function toRanked(map: Map<string, Bucket>): { precisionPct: number; count: number; name: string }[] {
  return [...map.entries()]
    .filter(([, v]) => v.total > 0)
    .map(([name, v]) => ({ name, precisionPct: Math.round((v.hits / v.total) * 100), count: v.total }))
    .sort((a, b) => b.precisionPct - a.precisionPct);
}

/**
 * GET /api/accuracy — Índice de Precisión de Radar.
 * Agrega el backtest de todas las señales con histórico suficiente y expone
 * un resumen honesto: qué % de las predicciones direccionales se cumplieron,
 * cuánta anticipación promedio hubo entre detección y pico, y el desglose
 * por categoría y por fuente. Público — es la prueba de transparencia.
 */
accuracyRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const signals = await Signal.find().select('slug entityType category sources').lean();

    let totalHits = 0;
    let totalPredictions = 0;
    const anticipations: number[] = [];
    const byCategory = new Map<string, Bucket>();
    const bySource = new Map<string, Bucket>();
    const samplePredictions: { slug: string; precisionPct: number; predictions: number }[] = [];
    let analyzed = 0;

    for (const s of signals) {
      const field = s.entityType === 'trend' ? 'interest' : 'mentions';
      const snapshots = await Snapshot.find({ entityType: s.entityType, slug: s.slug })
        .sort({ date: 1 })
        .limit(90)
        .select('mentions interest')
        .lean();
      const series = snapshots.map((sn) => (field === 'interest' ? sn.interest : sn.mentions));
      if (series.length < 7) continue; // histórico insuficiente para un backtest con sentido

      analyzed++;
      const bt = backtestSignal(series);
      totalHits += bt.hits;
      totalPredictions += bt.total;

      if (bt.total > 0) {
        bump(byCategory, s.category, bt.hits, bt.total);
        for (const src of s.sources ?? []) bump(bySource, src, bt.hits, bt.total);
        if (samplePredictions.length < 5) {
          samplePredictions.push({ slug: s.slug, precisionPct: bt.precisionPct, predictions: bt.total });
        }
      }

      const ant = anticipationDays(series);
      if (ant !== null) anticipations.push(ant);
    }

    const continuedGrowingPct =
      totalPredictions > 0 ? Math.round((totalHits / totalPredictions) * 100) : 0;
    const avgAnticipationDays =
      anticipations.length > 0
        ? Math.round((anticipations.reduce((a, b) => a + b, 0) / anticipations.length) * 10) / 10
        : null;

    res.json({
      overall: {
        signalsAnalyzed: analyzed,
        predictionsEvaluated: totalPredictions,
        continuedGrowingPct,
        avgAnticipationDays,
        samplePredictions,
      },
      byCategory: toRanked(byCategory).map((r) => ({ category: r.name, precisionPct: r.precisionPct, count: r.count })),
      bySource: toRanked(bySource).map((r) => ({ source: r.name, precisionPct: r.precisionPct, count: r.count })),
      disclaimer: DISCLAIMER,
    });
  })
);
