import { Router } from 'express';
import { CATEGORIES } from '../services/taxonomy';
import {
  COUNTRIES,
  EXPERIENCE_LEVELS,
  GOALS,
  LANGUAGES,
  MARKETPLACES,
  SOURCE_IDS,
} from '../models/User';

export const metaRouter = Router();

const EXPERIENCE_LABELS: Record<string, string> = {
  principiante: 'Principiante',
  vendedor: 'Vendedor / Emprendedor',
  agencia: 'Agencia',
  empresa: 'Empresa',
};

const LANGUAGE_LABELS: Record<string, string> = {
  es: 'Español',
  en: 'English',
  pt: 'Português',
};

/**
 * GET /api/meta — listas estáticas de opciones para selectores del frontend.
 * Único punto de verdad para categorías, plataformas, países, nivel de
 * experiencia, objetivos, marketplaces e idiomas soportados.
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
    experienceLevels: EXPERIENCE_LEVELS.map((id) => ({ id, label: EXPERIENCE_LABELS[id] })),
    goals: GOALS,
    marketplaces: MARKETPLACES,
    languages: LANGUAGES.map((id) => ({ id, label: LANGUAGE_LABELS[id] })),
  });
});
