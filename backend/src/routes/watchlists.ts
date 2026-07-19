import { Router } from 'express';
import { Signal, Watchlist } from '../models';
import { authRequired } from '../middlewares/auth';
import { asyncHandler } from './helpers';

export const watchlistsRouter = Router();

/** Watchlist personal "Mis pines" — creada al vuelo por usuario. */
async function myWatchlist(userId: string) {
  return Watchlist.findOneAndUpdate(
    { userId, name: 'Mis pines' },
    { $setOnInsert: { items: [] } },
    { new: true, upsert: true }
  );
}

// GET /api/watchlists/me — pines del usuario con sus señales resueltas
watchlistsRouter.get(
  '/me',
  authRequired,
  asyncHandler(async (req, res) => {
    const list = await myWatchlist(req.auth!.userId);
    const slugs = list.items.map((i) => i.slug);
    const signals = await Signal.find({ slug: { $in: slugs } }).sort({ radarScore: -1 });
    res.json({ id: String(list._id), items: list.items, signals });
  })
);

// POST /api/watchlists/me/items — fijar una señal
watchlistsRouter.post(
  '/me/items',
  authRequired,
  asyncHandler(async (req, res) => {
    const { entityType, slug } = req.body as { entityType?: string; slug?: string };
    if (!entityType || !slug) {
      return res.status(400).json({ error: 'Faltan entityType y slug' });
    }
    const list = await myWatchlist(req.auth!.userId);
    if (!list.items.some((i) => i.slug === slug)) {
      list.items.push({ entityType, slug, addedAt: new Date() } as never);
      await list.save();
    }
    res.json({ items: list.items });
  })
);

// DELETE /api/watchlists/me/items/:slug — quitar un pin
watchlistsRouter.delete(
  '/me/items/:slug',
  authRequired,
  asyncHandler(async (req, res) => {
    const list = await Watchlist.findOneAndUpdate(
      { userId: req.auth!.userId, name: 'Mis pines' },
      { $pull: { items: { slug: req.params.slug } } },
      { new: true }
    );
    res.json({ items: list?.items ?? [] });
  })
);

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
