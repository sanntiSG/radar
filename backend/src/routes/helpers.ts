import type { NextFunction, Request, RequestHandler, Response } from 'express';

/** Envuelve handlers async para que los errores lleguen al errorHandler. */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

export interface Pagination {
  page: number;
  limit: number;
  skip: number;
}

export function paginate(req: Request, defaultLimit = 20, maxLimit = 100): Pagination {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number(req.query.limit) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

/** Filtro opcional por categoría (?category=Gadgets). */
export function categoryFilter(req: Request): Record<string, unknown> {
  const category = req.query.category;
  return typeof category === 'string' && category && category !== 'Todas'
    ? { category }
    : {};
}
