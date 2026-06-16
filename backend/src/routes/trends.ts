import { Router, Request, Response, NextFunction } from 'express';
import { Trend } from '../models/Trend';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, limit = '20', page = '1' } = req.query;
    const filter: Record<string, unknown> = {};
    if (category) filter.category = category;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, parseInt(limit as string, 10));
    const skip = (pageNum - 1) * limitNum;

    const [trends, total] = await Promise.all([
      Trend.find(filter).sort({ radarScore: -1 }).skip(skip).limit(limitNum).lean(),
      Trend.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: trends,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
