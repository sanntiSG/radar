import { Router } from 'express';
import { Hashtag } from '../models';
import { asyncHandler, categoryFilter, paginate } from './helpers';

export const hashtagsRouter = Router();

hashtagsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = paginate(req);
    const filter = categoryFilter(req);
    const [items, total] = await Promise.all([
      Hashtag.find(filter).sort({ growthPct: -1 }).skip(skip).limit(limit),
      Hashtag.countDocuments(filter),
    ]);
    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  })
);
