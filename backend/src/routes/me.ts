import { Router } from 'express';
import { authRequired } from '../middlewares/auth';
import { User } from '../models';
import {
  ACCENTS,
  COUNTRIES,
  EXPERIENCE_LEVELS,
  GOALS,
  LANGUAGES,
  MARKETPLACES,
  SECTION_IDS,
  SOURCE_IDS,
} from '../models/User';
import { CATEGORIES } from '../services/taxonomy';
import { asyncHandler } from './helpers';

export const meRouter = Router();

meRouter.use(authRequired);

meRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.auth!.userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({
      user: {
        id: String(user._id),
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        plan: user.plan,
      },
      preferences: user.preferences,
    });
  })
);

// PUT /api/me — actualiza nombre y/o preferencias (validadas campo a campo)
meRouter.put(
  '/',
  asyncHandler(async (req, res) => {
    const { name, preferences } = req.body as {
      name?: string;
      preferences?: {
        accent?: string;
        defaultCategory?: string;
        defaultSort?: string;
        defaultStatus?: string;
        sections?: { id: string; visible: boolean; order: number }[];
        country?: string;
        niches?: string[];
        platforms?: string[];
        keywords?: string[];
        experienceLevel?: string;
        goals?: string[];
        marketplaces?: string[];
        language?: string;
        region?: string;
      };
    };

    const $set: Record<string, unknown> = {};
    if (typeof name === 'string' && name.trim()) $set.name = name.trim().slice(0, 60);

    if (preferences) {
      if (preferences.accent && (ACCENTS as readonly string[]).includes(preferences.accent)) {
        $set['preferences.accent'] = preferences.accent;
      }
      if (typeof preferences.defaultCategory === 'string') {
        $set['preferences.defaultCategory'] = preferences.defaultCategory.slice(0, 40);
      }
      if (preferences.defaultSort === 'radarScore' || preferences.defaultSort === 'detectedAt') {
        $set['preferences.defaultSort'] = preferences.defaultSort;
      }
      if (typeof preferences.defaultStatus === 'string') {
        $set['preferences.defaultStatus'] = preferences.defaultStatus.slice(0, 20);
      }
      if (Array.isArray(preferences.sections)) {
        const valid = preferences.sections.filter((s) =>
          (SECTION_IDS as readonly string[]).includes(s.id)
        );
        if (valid.length === SECTION_IDS.length) {
          $set['preferences.sections'] = valid.map((s, i) => ({
            id: s.id,
            visible: Boolean(s.visible),
            order: Number.isFinite(s.order) ? s.order : i,
          }));
        }
      }
      // Radar Personal
      const validCountryCodes = COUNTRIES.map((c) => c.code);
      if (typeof preferences.country === 'string' && validCountryCodes.includes(preferences.country)) {
        $set['preferences.country'] = preferences.country;
      }
      if (Array.isArray(preferences.niches)) {
        const validNiches = (preferences.niches as string[]).filter((n) =>
          (CATEGORIES as readonly string[]).includes(n)
        );
        $set['preferences.niches'] = validNiches.slice(0, 11);
      }
      if (Array.isArray(preferences.platforms)) {
        const validPlatforms = (preferences.platforms as string[]).filter((p) =>
          (SOURCE_IDS as readonly string[]).includes(p)
        );
        $set['preferences.platforms'] = validPlatforms;
      }
      if (Array.isArray(preferences.keywords)) {
        const cleanKeywords = (preferences.keywords as string[])
          .map((k: string) => String(k).trim().slice(0, 40))
          .filter(Boolean)
          .slice(0, 12);
        $set['preferences.keywords'] = cleanKeywords;
      }

      // Radar Personal enriquecido (N11)
      if (
        typeof preferences.experienceLevel === 'string' &&
        (preferences.experienceLevel === '' ||
          (EXPERIENCE_LEVELS as readonly string[]).includes(preferences.experienceLevel))
      ) {
        $set['preferences.experienceLevel'] = preferences.experienceLevel;
      }
      if (Array.isArray(preferences.goals)) {
        const validGoalIds = GOALS.map((g) => g.id);
        const validGoals = (preferences.goals as string[]).filter((g) => validGoalIds.includes(g));
        $set['preferences.goals'] = validGoals.slice(0, 4);
      }
      if (Array.isArray(preferences.marketplaces)) {
        const validMarketplaceIds = MARKETPLACES.map((m) => m.id);
        const validMarketplaces = (preferences.marketplaces as string[]).filter((m) =>
          validMarketplaceIds.includes(m)
        );
        $set['preferences.marketplaces'] = validMarketplaces;
      }
      if (typeof preferences.language === 'string' && (LANGUAGES as readonly string[]).includes(preferences.language)) {
        $set['preferences.language'] = preferences.language;
      }
      if (typeof preferences.region === 'string') {
        $set['preferences.region'] = preferences.region.trim().slice(0, 40);
      }
    }

    const user = await User.findByIdAndUpdate(req.auth!.userId, { $set }, { new: true });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ preferences: user.preferences });
  })
);
