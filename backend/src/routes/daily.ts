import { Router } from 'express';
import { Signal } from '../models';
import { COUNTRIES, SOURCE_IDS, User } from '../models/User';
import { authOptional } from '../middlewares/auth';
import { CATEGORIES } from '../services/taxonomy';
import { asyncHandler } from './helpers';

export const dailyRouter = Router();

const COUNTRY_CODES = new Set(COUNTRIES.map((c) => c.code));

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
 * oportunidad del día (seed por fecha), predicción del día (confianza alta, d7 > actual),
 * mayores movimientos vs ayer, hashtags destacados y productos emergentes.
 * Filtros opcionales ?niche=&platform=&country= (además de las preferencias del usuario
 * si hay sesión). `country` solo afecta el rótulo de ámbito — es honesto: los datos no
 * están geo-segmentados salvo el interés de Google Trends.
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

    // Filtros de query (?niche=&platform=&country=) — tienen prioridad sobre las prefs
    const queryNiche =
      typeof req.query.niche === 'string' && (CATEGORIES as readonly string[]).includes(req.query.niche)
        ? req.query.niche
        : null;
    const queryPlatform =
      typeof req.query.platform === 'string' && (SOURCE_IDS as readonly string[]).includes(req.query.platform)
        ? req.query.platform
        : null;
    const queryCountry =
      typeof req.query.country === 'string' && COUNTRY_CODES.has(req.query.country) ? req.query.country : null;

    const nicheFilter = queryNiche
      ? { category: queryNiche }
      : niches.length > 0
        ? { category: { $in: niches } }
        : {};
    const platformFilter = queryPlatform ? { sources: queryPlatform } : {};
    const baseFilter = { ...nicheFilter, ...platformFilter };

    const [newSignals, risingSignals, movingSignals, allSignals, highConfSignals, hashtagsHighlights, emergingProducts] =
      await Promise.all([
        Signal.find({ ...baseFilter, status: 'new' })
          .select('name slug category entityType radarScore growthScore status metrics sparkline detectedAt')
          .sort({ detectedAt: -1 })
          .limit(4),
        Signal.find({ ...baseFilter, status: 'rising' })
          .select('name slug category entityType radarScore growthScore status confidence metrics sparkline')
          .sort({ radarScore: -1 })
          .limit(4),
        Signal.find({ ...baseFilter, status: { $ne: 'dormant' } })
          .select('name slug category entityType radarScore growthScore status metrics sparkline')
          .sort({ growthScore: -1 })
          .limit(4),
        Signal.find({ ...baseFilter, status: { $ne: 'dormant' } })
          .select('name slug category entityType radarScore growthScore status confidence metrics sparkline')
          .lean(),
        Signal.find({
          ...baseFilter,
          confidence: { $in: ['medium', 'high'] },
          'predictions.d7': { $ne: null },
        })
          .select('name slug category entityType radarScore growthScore status confidence predictions metrics sparkline')
          .sort({ confidenceScore: -1 })
          .limit(3),
        Signal.find({ ...platformFilter, entityType: 'hashtag', status: { $ne: 'dormant' } })
          .select('name slug category entityType radarScore growthScore status metrics sparkline')
          .sort({ radarScore: -1 })
          .limit(3),
        Signal.find({ ...baseFilter, entityType: 'product', status: { $in: ['new', 'rising'] } })
          .select('name slug category entityType radarScore growthScore status metrics sparkline')
          .sort({ radarScore: -1 })
          .limit(6)
          .lean(),
      ]);

    // Productos emergentes: status new/rising con frecuencia todavía baja (señal temprana real)
    const emergingLowFreq = emergingProducts.filter((s: any) => (s.metrics?.frequency ?? 0) <= 25).slice(0, 4);

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

    // Cambios respecto a ayer: growthScore ya representa el % de cambio vs el período previo
    // (calculado por el motor sobre snapshots reales). Elegimos el mayor ascenso y el mayor descenso.
    const withMovement = allSignals.filter((s) => typeof s.growthScore === 'number');
    const up = [...withMovement].filter((s) => s.growthScore > 0).sort((a, b) => b.growthScore - a.growthScore)[0] ?? null;
    const down = [...withMovement].filter((s) => s.growthScore < 0).sort((a, b) => a.growthScore - b.growthScore)[0] ?? null;

    // Rótulo de ámbito — honesto: el país solo afecta el interés de Google Trends
    const effectiveCountryCode = queryCountry;
    const countryLabel = effectiveCountryCode
      ? COUNTRIES.find((c) => c.code === effectiveCountryCode)?.label ?? null
      : null;

    res.json({
      date: today,
      streak,
      scope: {
        niche: queryNiche,
        platform: queryPlatform,
        country: effectiveCountryCode,
        countryLabel,
        note: countryLabel
          ? `"${countryLabel}" solo afecta el interés de Google Trends — el resto de los datos es agregado global.`
          : null,
      },
      sections: {
        new: newSignals,
        rising: risingSignals,
        moving: movingSignals,
        opportunityOfDay,
        predictionOfDay,
        keywordHighlights,
        biggestMovers: { up, down },
        hashtagsHighlights,
        emergingProducts: emergingLowFreq,
      },
    });
  })
);
