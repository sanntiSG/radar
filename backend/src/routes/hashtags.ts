import { Router, Request, Response, NextFunction } from 'express';
import { Hashtag } from '../models/Hashtag';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = '20', page = '1' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, parseInt(limit as string, 10));
    const skip = (pageNum - 1) * limitNum;

    const [hashtags, total] = await Promise.all([
      Hashtag.find().sort({ growth: -1 }).skip(skip).limit(limitNum).lean(),
      Hashtag.countDocuments(),
    ]);

    res.json({
      success: true,
      data: hashtags,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
