import { Router, Request, Response, NextFunction } from 'express';
import { Signal } from '../models/Signal';
import { Snapshot } from '../models/Snapshot';

const router = Router();

// GET /api/insights — observaciones automáticas generadas del histórico
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Top signals by radar score
    const topSignals = await Signal.find({ status: 'active' })
      .sort({ radarScore: -1 })
      .limit(5)
      .lean();

    const insights: Array<{ id: string; text: string; type: string; entityName: string }> = [];

    for (const signal of topSignals) {
      // Count recent snapshots (last 48h)
      const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
      const recentCount = await Snapshot.countDocuments({
        entityName: signal.canonicalName,
        capturedAt: { $gte: cutoff },
      });

      if (recentCount > 0) {
        insights.push({
          id: signal._id.toString(),
          type: 'frequency',
          entityName: signal.name,
          text: `"${signal.name}" aparece en ${signal.frequency} publicaciones con crecimiento superior al promedio durante las últimas 48 horas.`,
        });
      } else {
        insights.push({
          id: signal._id.toString(),
          type: 'radar_score',
          entityName: signal.name,
          text: `"${signal.name}" alcanzó un Radar Score de ${signal.radarScore.toFixed(0)}/100 — señal ${signal.confidenceLevel} confianza.`,
        });
      }

      if (signal.acceleration > 0) {
        insights.push({
          id: signal._id.toString() + '_accel',
          type: 'acceleration',
          entityName: signal.name,
          text: `La categoría "${signal.category}" muestra aceleración positiva. "${signal.name}" lidera con velocidad de crecimiento de ${signal.velocity.toFixed(1)} menciones/hora.`,
        });
      }
    }

    res.json({ success: true, data: insights.slice(0, 10) });
  } catch (err) {
    next(err);
  }
});

export default router;
