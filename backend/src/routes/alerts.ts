import { Router } from 'express';
import { Alert } from '../models';
import { asyncHandler, paginate } from './helpers';

export const alertsRouter = Router();

alertsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = paginate(req);
    const [items, total] = await Promise.all([
      Alert.find().sort({ triggeredAt: -1 }).skip(skip).limit(limit),
      Alert.countDocuments(),
    ]);
    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  })
);

// GET /api/alerts/unseen — contador para el badge del nav
alertsRouter.get(
  '/unseen',
  asyncHandler(async (_req, res) => {
    const count = await Alert.countDocuments({ seen: false });
    res.json({ count });
  })
);

alertsRouter.patch(
  '/:id/seen',
  asyncHandler(async (req, res) => {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { $set: { seen: true } },
      { new: true }
    );
    if (!alert) return res.status(404).json({ error: 'Alerta no encontrada' });
    res.json(alert);
  })
);
