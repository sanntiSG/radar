import { Router, Request, Response, NextFunction } from 'express';
import { Snapshot } from '../models/Snapshot';

const router = Router();

// GET /api/entity/:name/history?metric=frequency&days=7
router.get('/:name/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.params;
    const { metric = 'frequency', days = '7' } = req.query;

    const cutoff = new Date(Date.now() - parseInt(days as string, 10) * 24 * 60 * 60 * 1000);

    const snapshots = await Snapshot.find({
      entityName: name,
      metric: metric as string,
      capturedAt: { $gte: cutoff },
    })
      .sort({ capturedAt: 1 })
      .lean();

    res.json({
      success: true,
      data: snapshots.map((s) => ({
        date: s.capturedAt,
        value: s.value,
        source: s.source,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
