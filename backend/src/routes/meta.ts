import { Router } from 'express';
import { CATEGORIES } from '../services/taxonomy';
import { COUNTRIES, SOURCE_IDS } from '../models/User';

export const metaRouter = Router();

/**
 * GET /api/meta — listas estáticas de opciones para selectores del frontend.
 * Único punto de verdad para categorías, plataformas y países soportados.
 */
metaRouter.get('/', (_req, res) => {
  res.json({
    categories: [...CATEGORIES],
    sources: [...SOURCE_IDS].map((id) => ({
      id,
      label:
        id === 'reddit' ? 'Reddit'
        : id === 'google-trends' ? 'Google Trends'
        : 'RSS / Blogs',
    })),
    countries: COUNTRIES,
  });
});
