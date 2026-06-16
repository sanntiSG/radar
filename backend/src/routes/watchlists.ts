import { Router, Request, Response, NextFunction } from 'express';
import { Watchlist } from '../models/Watchlist';

const router = Router();

// GET /api/watchlists (public for MVP — no auth yet)
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const watchlists = await Watchlist.find().lean();
    res.json({ success: true, data: watchlists });
  } catch (err) {
    next(err);
  }
});

// POST /api/watchlists
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const watchlist = await Watchlist.create(req.body);
    res.status(201).json({ success: true, data: watchlist });
  } catch (err) {
    next(err);
  }
});

// POST /api/watchlists/:id/items
router.post('/:id/items', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const watchlist = await Watchlist.findById(req.params.id);
    if (!watchlist) {
      res.status(404).json({ success: false, error: 'Watchlist not found' });
      return;
    }
    watchlist.items.push({ ...req.body, addedAt: new Date() });
    await watchlist.save();
    res.json({ success: true, data: watchlist });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/watchlists/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await Watchlist.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Watchlist deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
