import { Router } from 'express';
import { Alert } from '../models';
import { authOptional } from '../middlewares/auth';
import { asyncHandler, paginate } from './helpers';

export const alertsRouter = Router();

/**
 * Build a filter that returns:
 *   - Global alerts (userId: null) always
 *   - Personal alerts (userId: authUser) if authenticated
 */
function alertFilter(userId: string | null) {
  if (userId) {
    return { $or: [{ userId: null }, { userId }] };
  }
  return { userId: null };
}

alertsRouter.get(
  '/',
  authOptional,
  asyncHandler(async (req, res) => {
    const userId = req.auth?.userId ?? null;
    const { page, limit, skip } = paginate(req);
    const filter = alertFilter(userId);
    const [items, total] = await Promise.all([
      Alert.find(filter).sort({ triggeredAt: -1 }).skip(skip).limit(limit),
      Alert.countDocuments(filter),
    ]);
    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  })
);

// GET /api/alerts/unseen — badge count (global + personal when authenticated)
alertsRouter.get(
  '/unseen',
  authOptional,
  asyncHandler(async (req, res) => {
    const userId = req.auth?.userId ?? null;
    const count = await Alert.countDocuments({ ...alertFilter(userId), seen: false });
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
