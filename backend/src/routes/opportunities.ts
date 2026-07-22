import { Router } from 'express';
import { Signal } from '../models';
import { authOptional } from '../middlewares/auth';
import { asyncHandler } from './helpers';

export const opportunitiesRouter = Router();

/**
 * GET /api/opportunities — señales tempranas con alta aceleración/velocidad
 * pero frecuencia todavía baja (antes de que el mercado las descubra).
 *
 * opportunityScore = 0.35*norm(accel) + 0.30*norm(velocity) + 0.25*(1-norm(freq)) + 0.10*norm(recency)
 * donde norm(x) = Math.min(1, x / cap)
 *
 * Excluye señales dormant. Si el usuario está logueado y tiene niches/platforms
 * configurados, aplica los filtros.
 */

const CAP_ACCEL = 15;
const CAP_VEL = 30;
const CAP_FREQ = 60;
const CAP_RECENCY = 168; // 7 días en horas; más reciente = mejor

function norm(value: number, cap: number): number {
  return Math.min(1, Math.max(0, value) / cap);
}

function opportunityScore(metrics: {
  velocity: number;
  acceleration: number;
  frequency: number;
  recency: number;
}): number {
  const accel = norm(metrics.acceleration, CAP_ACCEL);
  const vel = norm(metrics.velocity, CAP_VEL);
  const freqInverse = 1 - norm(metrics.frequency, CAP_FREQ);
  const rec = 1 - norm(metrics.recency, CAP_RECENCY);

  return Math.round((0.35 * accel + 0.30 * vel + 0.25 * freqInverse + 0.10 * rec) * 100);
}

function buildReason(metrics: {
  velocity: number;
  acceleration: number;
  frequency: number;
  recency: number;
}): string {
  const parts: string[] = [];
  if (metrics.acceleration > 5) parts.push('aceleración alta');
  else if (metrics.acceleration > 0) parts.push('aceleración positiva');
  if (metrics.velocity > 10) parts.push('crecimiento rápido');
  else if (metrics.velocity > 3) parts.push('crecimiento moderado');
  if (metrics.frequency < 15) parts.push('volumen aún bajo');
  if (metrics.recency < 48) parts.push('señal muy reciente');
  if (parts.length === 0) parts.push('patrón emergente detectado');
  return parts.join(', ') + ' — señal temprana antes de que el mercado la descubra.';
}

opportunitiesRouter.get(
  '/',
  authOptional,
  asyncHandler(async (req, res) => {
    const { auth } = req;
    const niches: string[] = [];
    const platforms: string[] = [];

    if (auth) {
      // Pull user preferences from the request if they were injected, else ignore
      const { User } = await import('../models/User');
      const user = await User.findById(auth.userId).select('preferences').lean();
      if (user?.preferences?.niches) niches.push(...user.preferences.niches);
      if (user?.preferences?.platforms) platforms.push(...user.preferences.platforms);
    }

    const filter: Record<string, unknown> = {
      status: { $ne: 'dormant' },
    };

    if (niches.length > 0) filter.category = { $in: niches };
    if (platforms.length > 0) filter.sources = { $elemMatch: { $in: platforms } };

    const signals = await Signal.find(filter)
      .select('name slug category entityType radarScore growthScore status confidence metrics sparkline detectedAt sources')
      .lean();

    const scored = signals
      .map((s) => ({
        ...s,
        opportunityScore: opportunityScore({
          velocity: s.metrics?.velocity ?? 0,
          acceleration: s.metrics?.acceleration ?? 0,
          frequency: s.metrics?.frequency ?? 0,
          recency: s.metrics?.recency ?? 0,
        }),
        reason: buildReason({
          velocity: s.metrics?.velocity ?? 0,
          acceleration: s.metrics?.acceleration ?? 0,
          frequency: s.metrics?.frequency ?? 0,
          recency: s.metrics?.recency ?? 0,
        }),
      }))
      .filter((s) => s.opportunityScore >= 10)
      .sort((a, b) => b.opportunityScore - a.opportunityScore)
      .slice(0, 20);

    res.json({ items: scored, total: scored.length });
  })
);
