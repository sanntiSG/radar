import { Router } from 'express';
import { Signal } from '../models';
import { Watchlist } from '../models/Watchlist';
import { User } from '../models/User';
import { authRequired } from '../middlewares/auth';
import { asyncHandler } from './helpers';

export const achievementsRouter = Router();

interface Achievement {
  key: string;
  title: string;
  description: string;
  unlocked: boolean;
  progress: number; // 0-100
  icon: string;
}

interface Level {
  key: string;
  title: string;
  points: number;
  nextAt: number | null;
  progress: number; // 0-100 hacia el siguiente nivel (100 si es el nivel máximo)
}

/** Niveles de gamificación: crecen con actividad real acumulada, sin límite artificial. */
const LEVELS = [
  { key: 'explorador', title: 'Explorador', minPoints: 0 },
  { key: 'analista', title: 'Analista', minPoints: 100 },
  { key: 'experto', title: 'Experto', minPoints: 250 },
] as const;

function computeLevel(points: number): Level {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) if (points >= LEVELS[i].minPoints) idx = i;
  const current = LEVELS[idx];
  const next = LEVELS[idx + 1] ?? null;
  const progress = next
    ? Math.min(100, Math.round(((points - current.minPoints) / (next.minPoints - current.minPoints)) * 100))
    : 100;
  return { key: current.key, title: current.title, points, nextAt: next?.minPoints ?? null, progress };
}

/**
 * GET /api/achievements — logros y nivel basados en actividad real del usuario.
 * No hay tabla de achievements; todo se computa on-the-fly a partir de la
 * watchlist y la racha, cruzando con Signal para obtener categorías reales
 * (en vez de adivinar por slug).
 */
achievementsRouter.get(
  '/',
  authRequired,
  asyncHandler(async (req, res) => {
    const userId = req.auth!.userId;

    const [watchlist, user] = await Promise.all([
      Watchlist.findOne({ userId, name: 'Mis pines' }).lean(),
      User.findById(userId).select('streak').lean(),
    ]);

    const items = watchlist?.items ?? [];
    const pinCount = items.length;
    const streak = (user as any)?.streak ?? 0;

    const withNotify = items.filter(
      (i: any) =>
        i.notify?.radarScoreAbove != null || i.notify?.onAccelerate || i.notify?.onNewOutlier
    ).length;

    // Categorías reales de los pines — cruce con Signal, no heurística por slug.
    let distinctCategories = 0;
    if (pinCount > 0) {
      const slugs = items.map((i: any) => i.slug);
      const signals = await Signal.find({ slug: { $in: slugs } }).select('category').lean();
      distinctCategories = new Set(signals.map((s: any) => s.category)).size;
    }

    const pinProgress = Math.min(1, pinCount / 5);
    const notifyRatio = pinCount > 0 ? withNotify / pinCount : 0;
    const watchlistCompleteProgress = Math.round((0.5 * pinProgress + 0.5 * notifyRatio) * 100);
    const watchlistComplete = pinCount >= 5 && withNotify === pinCount;

    const achievements: Achievement[] = [
      {
        key: 'primer_pin',
        title: 'Primer pin',
        description: 'Fijaste tu primera señal en el radar.',
        unlocked: pinCount >= 1,
        progress: Math.min(100, pinCount * 100),
        icon: '★',
      },
      {
        key: 'cazador_temprano',
        title: 'Cazador temprano',
        description: 'Configuraste alertas personalizadas en al menos un pin.',
        unlocked: withNotify >= 1,
        progress: Math.min(100, withNotify * 100),
        icon: '🔔',
      },
      {
        key: 'explorador',
        title: 'Explorador',
        description: 'Tienes 5 o más señales en tu watchlist.',
        unlocked: pinCount >= 5,
        progress: Math.min(100, Math.round((pinCount / 5) * 100)),
        icon: '🧭',
      },
      {
        key: 'coleccionista',
        title: 'Coleccionista',
        description: 'Fijaste al menos 3 pines con notify activo.',
        unlocked: withNotify >= 3,
        progress: Math.min(100, Math.round((withNotify / 3) * 100)),
        icon: '📡',
      },
      {
        key: 'explorador_nichos',
        title: 'Explorador de nichos',
        description: 'Tus pines abarcan 3 o más categorías distintas.',
        unlocked: distinctCategories >= 3,
        progress: Math.min(100, Math.round((distinctCategories / 3) * 100)),
        icon: '🗺️',
      },
      {
        key: 'watchlist_completa',
        title: 'Watchlist completa',
        description: '5 o más pines, todos con alertas configuradas.',
        unlocked: watchlistComplete,
        progress: watchlistCompleteProgress,
        icon: '✅',
      },
      {
        key: 'racha_3',
        title: 'Constante',
        description: 'Abriste Radar Diario 3 días seguidos.',
        unlocked: streak >= 3,
        progress: Math.min(100, Math.round((Math.min(streak, 3) / 3) * 100)),
        icon: '🔥',
      },
      {
        key: 'racha_7',
        title: 'Adicto al radar',
        description: 'Racha de 7 días consecutivos en Radar Diario.',
        unlocked: streak >= 7,
        progress: Math.min(100, Math.round((Math.min(streak, 7) / 7) * 100)),
        icon: '⚡',
      },
      {
        key: 'racha_30',
        title: 'Hábito de fundador',
        description: 'Racha de 30 días consecutivos en Radar Diario.',
        unlocked: streak >= 30,
        progress: Math.min(100, Math.round((Math.min(streak, 30) / 30) * 100)),
        icon: '🏆',
      },
    ];

    const unlocked = achievements.filter((a) => a.unlocked).length;

    // Puntos: actividad real acumulada, sin inventar señales de progreso.
    const points =
      pinCount * 10 +
      withNotify * 10 +
      Math.min(streak, 30) * 3 +
      distinctCategories * 15 +
      unlocked * 5;

    res.json({ achievements, unlocked, total: achievements.length, level: computeLevel(points) });
  })
);
