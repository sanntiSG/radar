import { Router } from 'express';
import { Signal } from '../models';
import { User } from '../models/User';
import { authOptional } from '../middlewares/auth';
import { asyncHandler } from './helpers';

export const dailyRouter = Router();

/** YYYY-MM-DD for today in UTC */
function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Selects a "signal of the day" using a date-seeded index rotation (deterministic). */
function pickDaylight(signals: any[], dateStr: string): any | null {
  if (!signals.length) return null;
  // Seed: sum char codes of date string
  const seed = dateStr.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return signals[seed % signals.length];
}

/**
 * Update streak for authenticated user.
 * Returns { streak, isNew } where isNew = true if today is a new check-in.
 */
async function checkInStreak(userId: string): Promise<{ streak: number; isNew: boolean }> {
  const today = todayISO();
  const user = await User.findById(userId).select('streak lastActiveDate');
  if (!user) return { streak: 0, isNew: false };

  if (user.lastActiveDate === today) {
    // Already checked in today
    return { streak: user.streak ?? 0, isNew: false };
  }

  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayISO = yesterday.toISOString().slice(0, 10);

  let newStreak: number;
  if (user.lastActiveDate === yesterdayISO) {
    // Consecutive day
    newStreak = (user.streak ?? 0) + 1;
  } else {
    // Streak broken or first check-in
    newStreak = 1;
  }

  await User.updateOne({ _id: userId }, { streak: newStreak, lastActiveDate: today });
  return { streak: newStreak, isNew: true };
}

/**
 * GET /api/daily — resumen personalizado del día.
 * Secciones: nuevas detecciones, en ascenso (rising), mayor movimiento (growthScore),
 * oportunidad del día (seed por fecha) y predicción del día (confianza alta, d7 > actual).
 * Autenticado: incrementa racha si es un día nuevo consecutivo.
 */
dailyRouter.get(
  '/',
  authOptional,
  asyncHandler(async (req, res) => {
    const { auth } = req;
    const today = todayISO();

    // Streak
    let streak = 0;
    if (auth) {
      const result = await checkInStreak(auth.userId);
      streak = result.streak;
    }

    // User preferences for personalization
    let niches: string[] = [];
    let keywords: string[] = [];
    if (auth) {
      const user = await User.findById(auth.userId).select('preferences').lean();
      if (user?.preferences?.niches) niches = user.preferences.niches;
      if (user?.preferences?.keywords) keywords = user.preferences.keywords;
    }

    const nicheFilter = niches.length > 0 ? { category: { $in: niches } } : {};

    const [newSignals, risingSignals, movingSignals, allSignals, highConfSignals] = await Promise.all([
      Signal.find({ ...nicheFilter, status: 'new' })
        .select('name slug category entityType radarScore growthScore status metrics sparkline detectedAt')
        .sort({ detectedAt: -1 })
        .limit(4),
      Signal.find({ ...nicheFilter, status: 'rising' })
        .select('name slug category entityType radarScore growthScore status confidence metrics sparkline')
        .sort({ radarScore: -1 })
        .limit(4),
      Signal.find({ ...nicheFilter, status: { $ne: 'dormant' } })
        .select('name slug category entityType radarScore growthScore status metrics sparkline')
        .sort({ growthScore: -1 })
        .limit(4),
      Signal.find({ ...nicheFilter, status: { $ne: 'dormant' } })
        .select('name slug category entityType radarScore growthScore status confidence metrics sparkline')
        .lean(),
      Signal.find({
        ...nicheFilter,
        confidence: { $in: ['medium', 'high'] },
        'predictions.d7': { $ne: null },
      })
        .select('name slug category entityType radarScore growthScore status confidence predictions metrics sparkline')
        .sort({ confidenceScore: -1 })
        .limit(3),
    ]);

    // Opportunity of the day: seed by date
    const opportunityOfDay = pickDaylight(allSignals.filter((s) => s.status !== 'dormant'), today);

    // Prediction of the day: high confidence, d7 > current frequency
    const predictionOfDay = highConfSignals.find((s) => {
      const d7 = s.predictions?.d7 ?? 0;
      const current = s.metrics?.frequency ?? 0;
      return d7 > current * 1.1; // at least 10% growth predicted
    }) ?? null;

    // Keyword highlights: signals that match user keywords
    const keywordHighlights = keywords.length > 0
      ? allSignals.filter((s) => {
          const haystack = s.name.toLowerCase();
          return keywords.some((kw: string) => haystack.includes(kw.toLowerCase()));
        }).slice(0, 3)
      : [];

    res.json({
      date: today,
      streak,
      sections: {
        new: newSignals,
        rising: risingSignals,
        moving: movingSignals,
        opportunityOfDay,
        predictionOfDay,
        keywordHighlights,
      },
    });
  })
);
