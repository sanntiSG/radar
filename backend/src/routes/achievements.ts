import { Router } from 'express';
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

/**
 * GET /api/achievements — logros basados en actividad real del usuario.
 * No hay tabla de achievements; se computan on-the-fly.
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

    // Cuenta categorías distintas de los pines (sería mejor cruzar con Signal, pero
    // en el MVP usamos una heurística sobre slugs)
    const slugSet = new Set(items.map((i: any) => i.slug));

    // Logros con notify activo (cazador temprano)
    const withNotify = items.filter(
      (i: any) =>
        i.notify?.radarScoreAbove != null || i.notify?.onAccelerate || i.notify?.onNewOutlier
    ).length;

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
    ];

    const unlocked = achievements.filter((a) => a.unlocked).length;
    res.json({ achievements, unlocked, total: achievements.length });
  })
);
