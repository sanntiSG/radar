import type { NextFunction, Request, Response } from 'express';

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Not found' });
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = err instanceof HttpError ? err.status : 500;
  if (status >= 500) console.error('[Radar]', err);
  res.status(status).json({ error: err.message || 'Internal server error' });
}
