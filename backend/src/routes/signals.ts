import { Router } from 'express';
import { Signal } from '../models';
import { asyncHandler, categoryFilter, paginate } from './helpers';

export const signalsRouter = Router();

// GET /api/signals?category=&status=&sort=radarScore&page=&limit=
signalsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = paginate(req);
    const filter: Record<string, unknown> = { ...categoryFilter(req) };
    if (typeof req.query.status === 'string' && req.query.status) {
      filter.status = req.query.status;
    }
    const sortField = req.query.sort === 'detectedAt' ? 'detectedAt' : 'radarScore';

    const [items, total] = await Promise.all([
      Signal.find(filter).sort({ [sortField]: -1 }).skip(skip).limit(limit),
      Signal.countDocuments(filter),
    ]);
    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  })
);

// GET /api/signals/stats — números agregados para el dashboard
signalsRouter.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const [total, rising, highConfidence, avg] = await Promise.all([
      Signal.countDocuments(),
      Signal.countDocuments({ status: 'rising' }),
      Signal.countDocuments({ confidence: 'high' }),
      Signal.aggregate([{ $group: { _id: null, avgScore: { $avg: '$radarScore' } } }]),
    ]);
    res.json({
      total,
      rising,
      highConfidence,
      avgRadarScore: Math.round(avg[0]?.avgScore ?? 0),
    });
  })
);

// GET /api/signals/:slug
signalsRouter.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const signal = await Signal.findOne({ slug: req.params.slug });
    if (!signal) return res.status(404).json({ error: 'Señal no encontrada' });
    res.json(signal);
  })
);
