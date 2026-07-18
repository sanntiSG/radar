import { Router } from 'express';
import { Product } from '../models';
import { asyncHandler, categoryFilter, paginate } from './helpers';

export const productsRouter = Router();

productsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = paginate(req);
    const filter = categoryFilter(req);
    const [items, total] = await Promise.all([
      Product.find(filter).sort({ radarScore: -1 }).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);
    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  })
);
