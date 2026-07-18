import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthPayload {
  userId: string;
  email: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    auth?: AuthPayload;
  }
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: '7d' });
}

function readToken(req: Request): AuthPayload | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(header.slice(7), env.jwtSecret) as AuthPayload;
  } catch {
    return null;
  }
}

/** Adjunta req.auth si hay token válido; nunca bloquea. */
export function authOptional(req: Request, _res: Response, next: NextFunction): void {
  const payload = readToken(req);
  if (payload) req.auth = payload;
  next();
}

/** Exige sesión válida. */
export function authRequired(req: Request, res: Response, next: NextFunction): void {
  const payload = readToken(req);
  if (!payload) {
    res.status(401).json({ error: 'Sesión requerida' });
    return;
  }
  req.auth = payload;
  next();
}
