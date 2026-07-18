import { Router } from 'express';
import { Snapshot } from '../models';
import { asyncHandler } from './helpers';

export const historyRouter = Router();

// GET /api/history/:entityType/:slug — evolución temporal (snapshots)
historyRouter.get(
  '/:entityType/:slug',
  asyncHandler(async (req, res) => {
    const { entityType, slug } = req.params;
    const snapshots = await Snapshot.find({ entityType, slug })
      .sort({ date: 1 })
      .limit(90)
      .select('date mentions engagement interest');
    res.json({
      entityType,
      slug,
      points: snapshots.map((s) => ({
        date: s.date,
        mentions: s.mentions,
        engagement: s.engagement,
        interest: s.interest,
      })),
    });
  })
);
