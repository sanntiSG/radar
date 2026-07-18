import { Router } from 'express';
import { authRequired } from '../middlewares/auth';
import { User } from '../models';
import { ACCENTS, SECTION_IDS } from '../models/User';
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
    }

    const user = await User.findByIdAndUpdate(req.auth!.userId, { $set }, { new: true });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ preferences: user.preferences });
  })
);
