import { Router } from 'express';
import { env } from '../config/env';
import { authRequired, signToken } from '../middlewares/auth';
import { User } from '../models';
import { asyncHandler } from './helpers';

export const authRouter = Router();

function publicUser(user: {
  _id: unknown;
  email: string;
  name: string;
  avatarUrl: string;
  plan: string;
}) {
  return {
    id: String(user._id),
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    plan: user.plan,
  };
}

/**
 * POST /api/auth/google — recibe el ID token del botón de Google Identity
 * Services y lo verifica contra el endpoint público tokeninfo (sin libs).
 */
authRouter.post(
  '/google',
  asyncHandler(async (req, res) => {
    const { credential } = req.body as { credential?: string };
    if (!credential) return res.status(400).json({ error: 'Falta credential' });
    if (!env.googleClientId) {
      return res.status(503).json({
        error: 'GOOGLE_CLIENT_ID no configurado en backend/.env',
      });
    }

    const infoRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    );
    if (!infoRes.ok) return res.status(401).json({ error: 'Token de Google inválido' });
    const info = (await infoRes.json()) as {
      aud?: string;
      email?: string;
      email_verified?: string;
      name?: string;
      picture?: string;
      sub?: string;
    };

    if (info.aud !== env.googleClientId || info.email_verified !== 'true' || !info.email) {
      return res.status(401).json({ error: 'Token de Google no válido para esta app' });
    }

    const user = await User.findOneAndUpdate(
      { email: info.email },
      {
        $set: {
          name: info.name ?? info.email.split('@')[0],
          googleId: info.sub ?? '',
          avatarUrl: info.picture ?? '',
        },
      },
      { new: true, upsert: true }
    );

    res.json({
      token: signToken({ userId: String(user._id), email: user.email }),
      user: publicUser(user),
    });
  })
);

/**
 * POST /api/auth/demo — cuenta compartida de demostración.
 * Permite probar perfil, preferencias y watchlist sin credenciales de Google.
 */
authRouter.post(
  '/demo',
  asyncHandler(async (_req, res) => {
    const user = await User.findOneAndUpdate(
      { email: 'demo@radar.app' },
      { $setOnInsert: { name: 'Cuenta demo', plan: 'pro' } },
      { new: true, upsert: true }
    );
    res.json({
      token: signToken({ userId: String(user._id), email: user.email }),
      user: publicUser(user),
    });
  })
);

// GET /api/auth/me — usuario de la sesión actual
authRouter.get(
  '/me',
  authRequired,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.auth!.userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ user: publicUser(user), preferences: user.preferences ?? null });
  })
);
