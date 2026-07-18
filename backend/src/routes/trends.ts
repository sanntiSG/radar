import { Router } from 'express';
import { Trend } from '../models';
import { asyncHandler, categoryFilter, paginate } from './helpers';

export const trendsRouter = Router();

trendsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = paginate(req);
    const filter = categoryFilter(req);
    const [items, total] = await Promise.all([
      Trend.find(filter).sort({ changePct: -1 }).skip(skip).limit(limit),
      Trend.countDocuments(filter),
    ]);
    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  })
);
