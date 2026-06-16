import { Router, Request, Response, NextFunction } from 'express';
import { Signal } from '../models/Signal';

const router = Router();

// GET /api/signals?category=&status=&minScore=&limit=&page=
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, status, minScore, limit = '20', page = '1' } = req.query;

    const filter: Record<string, unknown> = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (minScore) filter.radarScore = { $gte: Number(minScore) };

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, parseInt(limit as string, 10));
    const skip = (pageNum - 1) * limitNum;

    const [signals, total] = await Promise.all([
      Signal.find(filter).sort({ radarScore: -1 }).skip(skip).limit(limitNum).lean(),
      Signal.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: signals,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/signals/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signal = await Signal.findById(req.params.id).lean();
    if (!signal) {
      res.status(404).json({ success: false, error: 'Signal not found' });
      return;
    }
    res.json({ success: true, data: signal });
  } catch (err) {
    next(err);
  }
});

export default router;
