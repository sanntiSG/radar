'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  DEFAULT_PREFERENCES,
  useAuth,
  type Preferences,
  type SectionPref,
} from '@/lib/auth';

const SECTION_LABELS: Record<SectionPref['id'], string> = {
  stats: 'Métricas generales',
  feed: 'Feed de señales',
  insights: 'Observaciones del motor',
  watchlist: 'Mi watchlist',
};

const ACCENTS: { id: Preferences['accent']; label: string; color: string }[] = [
  { id: 'jade', label: 'Jade', color: 'oklch(78% 0.14 168)' },
  { id: 'amber', label: 'Ámbar', color: 'oklch(80% 0.12 80)' },
  { id: 'azure', label: 'Azur', color: 'oklch(75% 0.12 230)' },
  { id: 'violet', label: 'Violeta', color: 'oklch(74% 0.13 300)' },
];

const CATEGORIES = [
  'Todas', 'Gadgets', 'Belleza', 'Fitness', 'Mascotas', 'Cocina',
  'Hogar', 'Tecnología', 'Moda', 'Automotor', 'Salud y bienestar',
];

export default function ProfilePage() {
  const { user, preferences, loading, updatePreferences, logout } = useAuth();
  const [draft, setDraft] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [saved, setSaved] = useState<'idle' | 'saving' | 'ok' | 'error'>('idle');

  useEffect(() => {
    setDraft(preferences);
  }, [preferences]);

  if (!loading && !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <p className="font-display text-xl font-bold">Necesitas una cuenta</p>
          <p className="mt-2 text-sm leading-relaxed text-dim">
            El perfil y la personalización del dashboard requieren sesión.
          </p>
          <Link
            href="/login"
            className="pressable mt-6 inline-block rounded-full bg-jade px-8 py-3 font-semibold text-[oklch(18%_0.02_165)]"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  const save = async (next: Preferences) => {
    setDraft(next);
    setSaved('saving');
    try {
      await updatePreferences(next);
      setSaved('ok');
      setTimeout(() => setSaved('idle'), 1500);
    } catch {
      setSaved('error');
    }
  };

  const moveSection = (id: SectionPref['id'], dir: -1 | 1) => {
    const ordered = [...draft.sections].sort((a, b) => a.order - b.order);
    const idx = ordered.findIndex((s) => s.id === id);
    const swap = idx + dir;
    if (swap < 0 || swap >= ordered.length) return;
    [ordered[idx], ordered[swap]] = [ordered[swap], ordered[idx]];
    save({ ...draft, sections: ordered.map((s, i) => ({ ...s, order: i })) });
  };

  const toggleSection = (id: SectionPref['id']) => {
    save({
      ...draft,
      sections: draft.sections.map((s) =>
        s.id === id ? { ...s, visible: !s.visible } : s
      ),
    });
  };

  const orderedSections = [...draft.sections].sort((a, b) => a.order - b.order);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Perfil y preferencias</h1>
          <p className="mt-1 text-sm text-dim">
            Tu dashboard, a tu manera — los cambios se guardan al instante.
          </p>
        </div>
        <span className="text-xs text-faint" role="status">
          {saved === 'saving' && 'Guardando…'}
          {saved === 'ok' && 'Guardado ✓'}
          {saved === 'error' && <span className="text-danger">Error al guardar</span>}
        </span>
      </header>

      {user && (
        <section className="mt-8 flex items-center gap-4" aria-label="Cuenta">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt="" className="h-14 w-14 rounded-full" />
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-jade font-display text-xl font-bold text-[oklch(18%_0.02_165)]">
              {(user.name || user.email).charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-lg font-bold">{user.name || 'Mi cuenta'}</p>
            <p className="truncate text-sm text-faint">
              {user.email} · {user.plan === 'pro' ? 'Plan Pro' : 'Plan Free'}
            </p>
          </div>
          <button
            onClick={logout}
            className="pressable rounded-full border border-line-strong px-4 py-2 text-sm text-dim transition-colors duration-150 hover:border-jade hover:text-ink"
          >
            Cerrar sesión
          </button>
        </section>
      )}

      {/* Acento */}
      <section className="mt-10" aria-label="Color de acento">
        <h2 className="font-display text-sm font-bold text-dim">Color de acento</h2>
        <div className="mt-3 flex gap-3">
          {ACCENTS.map((accent) => (
            <button
              key={accent.id}
              onClick={() => save({ ...draft, accent: accent.id })}
              className={`pressable flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors duration-150 ${
                draft.accent === accent.id
                  ? 'border-jade text-ink'
                  : 'border-line text-dim hover:border-line-strong'
              }`}
            >
              <span
                className="h-3.5 w-3.5 rounded-full"
                style={{ background: accent.color }}
              />
              {accent.label}
            </button>
          ))}
        </div>
      </section>

      {/* Secciones del dashboard */}
      <section className="mt-10" aria-label="Secciones del dashboard">
        <h2 className="font-display text-sm font-bold text-dim">Secciones del dashboard</h2>
        <p className="mt-1 text-xs text-faint">
          Elige qué bloques ves y en qué orden aparecen.
        </p>
        <ul className="mt-3 divide-y divide-[var(--border)] rounded-xl border border-line bg-elev">
          {orderedSections.map((section, i) => (
            <li key={section.id} className="flex items-center gap-3 px-4 py-3">
              <button
                onClick={() => toggleSection(section.id)}
                role="switch"
                aria-checked={section.visible}
                className={`pressable relative h-5 w-9 rounded-full transition-colors duration-200 ${
                  section.visible ? 'bg-jade' : 'bg-soft'
                }`}
                title={section.visible ? 'Ocultar' : 'Mostrar'}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-bg transition-transform duration-200 ease-out ${
                    section.visible ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
              <span className={`flex-1 text-sm ${section.visible ? '' : 'text-faint'}`}>
                {SECTION_LABELS[section.id]}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => moveSection(section.id, -1)}
                  disabled={i === 0}
                  className="pressable rounded-md px-2 py-1 text-xs text-dim transition-colors duration-150 hover:bg-soft disabled:opacity-30"
                  title="Subir"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveSection(section.id, 1)}
                  disabled={i === orderedSections.length - 1}
                  className="pressable rounded-md px-2 py-1 text-xs text-dim transition-colors duration-150 hover:bg-soft disabled:opacity-30"
                  title="Bajar"
                >
                  ↓
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Filtros por defecto */}
      <section className="mt-10 pb-10" aria-label="Filtros por defecto">
        <h2 className="font-display text-sm font-bold text-dim">Filtros por defecto del feed</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs text-faint">Categoría</span>
            <select
              value={draft.defaultCategory}
              onChange={(e) => save({ ...draft, defaultCategory: e.target.value })}
              className="mt-1 w-full rounded-lg border border-line bg-elev px-3 py-2.5 text-sm text-ink outline-none transition-colors duration-150 focus:border-jade"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-faint">Ordenar por</span>
            <select
              value={draft.defaultSort}
              onChange={(e) =>
                save({ ...draft, defaultSort: e.target.value as Preferences['defaultSort'] })
              }
              className="mt-1 w-full rounded-lg border border-line bg-elev px-3 py-2.5 text-sm text-ink outline-none transition-colors duration-150 focus:border-jade"
            >
              <option value="radarScore">Radar Score</option>
              <option value="detectedAt">Más recientes</option>
            </select>
          </label>
        </div>
      </section>
    </div>
  );
}
