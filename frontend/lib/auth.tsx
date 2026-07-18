'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const TOKEN_KEY = 'radar_token';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  plan: 'free' | 'pro';
}

export interface SectionPref {
  id: 'stats' | 'feed' | 'insights' | 'watchlist';
  visible: boolean;
  order: number;
}

export interface Preferences {
  accent: 'jade' | 'amber' | 'azure' | 'violet';
  defaultCategory: string;
  defaultSort: 'radarScore' | 'detectedAt';
  defaultStatus: string;
  sections: SectionPref[];
}

export const DEFAULT_PREFERENCES: Preferences = {
  accent: 'jade',
  defaultCategory: 'Todas',
  defaultSort: 'radarScore',
  defaultStatus: '',
  sections: [
    { id: 'stats', visible: true, order: 0 },
    { id: 'feed', visible: true, order: 1 },
    { id: 'insights', visible: true, order: 2 },
    { id: 'watchlist', visible: true, order: 3 },
  ],
};

interface AuthContextValue {
  user: SessionUser | null;
  preferences: Preferences;
  loading: boolean;
  loginDemo: () => Promise<void>;
  loginGoogle: (credential: string) => Promise<void>;
  logout: () => void;
  updatePreferences: (prefs: Preferences) => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export async function authFetch(path: string, init: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
  return res.json();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback(
    (nextUser: SessionUser | null, prefs: Preferences | null) => {
      setUser(nextUser);
      setPreferences(prefs ?? DEFAULT_PREFERENCES);
      document.documentElement.dataset.accent = prefs?.accent ?? 'jade';
    },
    []
  );

  const refresh = useCallback(async () => {
    if (!getToken()) {
      applySession(null, null);
      setLoading(false);
      return;
    }
    try {
      const data = await authFetch('/api/auth/me');
      applySession(data.user, data.preferences);
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      applySession(null, null);
    } finally {
      setLoading(false);
    }
  }, [applySession]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleLogin = useCallback(
    async (path: string, body?: object) => {
      const data = await authFetch(path, {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      });
      localStorage.setItem(TOKEN_KEY, data.token);
      await refresh();
    },
    [refresh]
  );

  const value: AuthContextValue = {
    user,
    preferences,
    loading,
    loginDemo: () => handleLogin('/api/auth/demo'),
    loginGoogle: (credential) => handleLogin('/api/auth/google', { credential }),
    logout: () => {
      localStorage.removeItem(TOKEN_KEY);
      applySession(null, null);
    },
    updatePreferences: async (prefs) => {
      setPreferences(prefs); // optimista
      document.documentElement.dataset.accent = prefs.accent;
      await authFetch('/api/me', {
        method: 'PUT',
        body: JSON.stringify({ preferences: prefs }),
      });
    },
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
