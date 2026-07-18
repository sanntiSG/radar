import { Router } from 'express';
import { Watchlist } from '../models';
import { asyncHandler } from './helpers';

export const watchlistsRouter = Router();

watchlistsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await Watchlist.find().sort({ updatedAt: -1 });
    res.json({ items });
  })
);

watchlistsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name } = req.body as { name?: string };
    if (!name) return res.status(400).json({ error: 'Falta el nombre' });
    const list = await Watchlist.create({ name, items: [] });
    res.status(201).json(list);
  })
);

watchlistsRouter.post(
  '/:id/items',
  asyncHandler(async (req, res) => {
    const { entityType, slug } = req.body as { entityType?: string; slug?: string };
    if (!entityType || !slug) {
      return res.status(400).json({ error: 'Faltan entityType y slug' });
    }
    const list = await Watchlist.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { items: { entityType, slug, addedAt: new Date() } } },
      { new: true }
    );
    if (!list) return res.status(404).json({ error: 'Watchlist no encontrada' });
    res.json(list);
  })
);

watchlistsRouter.delete(
  '/:id/items/:slug',
  asyncHandler(async (req, res) => {
    const list = await Watchlist.findByIdAndUpdate(
      req.params.id,
      { $pull: { items: { slug: req.params.slug } } },
      { new: true }
    );
    if (!list) return res.status(404).json({ error: 'Watchlist no encontrada' });
    res.json(list);
  })
);
