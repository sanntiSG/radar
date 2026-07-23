'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  DEFAULT_PREFERENCES,
  useAuth,
  type Preferences,
  type SectionPref,
} from '@/lib/auth';
import { AchievementStrip } from '@/components/dashboard/AchievementStrip';
import { EXPERIENCE_LEVELS, GOALS, LANGUAGES, MARKETPLACES, MAX_GOALS } from '@/lib/experience';

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

const NICHES = ['Gadgets', 'Belleza', 'Fitness', 'Mascotas', 'Cocina', 'Hogar', 'Tecnología', 'Moda', 'Automotor', 'Salud y bienestar', 'General'];

const PLATFORMS = [
  { id: 'reddit', label: 'Reddit' },
  { id: 'google-trends', label: 'Google Trends' },
  { id: 'rss', label: 'RSS / Blogs' },
];

const COUNTRIES = [
  { code: 'global', label: 'Global' },
  { code: 'AR', label: 'Argentina' },
  { code: 'MX', label: 'México' },
  { code: 'CO', label: 'Colombia' },
  { code: 'CL', label: 'Chile' },
  { code: 'PE', label: 'Perú' },
  { code: 'ES', label: 'España' },
  { code: 'UY', label: 'Uruguay' },
  { code: 'EC', label: 'Ecuador' },
  { code: 'US', label: 'Estados Unidos' },
  { code: 'BR', label: 'Brasil' },
];

export default function ProfilePage() {
  const { user, preferences, loading, updatePreferences, logout } = useAuth();
  const [draft, setDraft] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [saved, setSaved] = useState<'idle' | 'saving' | 'ok' | 'error'>('idle');
  const [kwInput, setKwInput] = useState('');
  const kwRef = useRef<HTMLInputElement>(null);

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
      <section className="mt-10" aria-label="Filtros por defecto">
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

      {/* Radar Personal */}
      <section className="mt-10" aria-label="Radar Personal">
        <h2 className="font-display text-sm font-bold text-dim">Radar Personal</h2>
        <p className="mt-1 text-xs leading-relaxed text-faint">
          Ajusta Radar a tu mercado. Los nichos y keywords priorizan señales relevantes para ti.
          El país afecta las tendencias de Google Trends.
        </p>

        {/* País */}
        <div className="mt-4">
          <label className="block">
            <span className="text-xs text-faint">País / Mercado</span>
            <select
              value={draft.country ?? 'global'}
              onChange={(e) => save({ ...draft, country: e.target.value })}
              className="mt-1 w-full max-w-xs rounded-lg border border-line bg-elev px-3 py-2.5 text-sm text-ink outline-none transition-colors duration-150 focus:border-jade"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </label>
        </div>

        {/* Nichos de interés */}
        <div className="mt-5">
          <span className="text-xs text-faint">Nichos de interés</span>
          <p className="mt-0.5 text-[11px] text-faint">
            Selecciona las categorías que sigues — el feed las priorizará.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {NICHES.map((niche) => {
              const active = (draft.niches ?? []).includes(niche);
              return (
                <button
                  key={niche}
                  onClick={() => {
                    const current = draft.niches ?? [];
                    const next = active ? current.filter((n) => n !== niche) : [...current, niche];
                    save({ ...draft, niches: next });
                  }}
                  className={`pressable rounded-full border px-3 py-1.5 text-xs transition-colors duration-150 ${
                    active
                      ? 'border-jade bg-jade/10 font-medium text-jade'
                      : 'border-line text-dim hover:border-line-strong hover:text-ink'
                  }`}
                >
                  {niche}
                </button>
              );
            })}
          </div>
        </div>

        {/* Plataformas */}
        <div className="mt-5">
          <span className="text-xs text-faint">Plataformas de datos</span>
          <p className="mt-0.5 text-[11px] text-faint">
            Filtra el feed por origen de datos. Sin selección = todas las plataformas.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {PLATFORMS.map((plat) => {
              const active = (draft.platforms ?? []).includes(plat.id);
              return (
                <button
                  key={plat.id}
                  onClick={() => {
                    const current = draft.platforms ?? [];
                    const next = active ? current.filter((p) => p !== plat.id) : [...current, plat.id];
                    save({ ...draft, platforms: next });
                  }}
                  className={`pressable rounded-full border px-3 py-1.5 text-xs transition-colors duration-150 ${
                    active
                      ? 'border-jade bg-jade/10 font-medium text-jade'
                      : 'border-line text-dim hover:border-line-strong hover:text-ink'
                  }`}
                >
                  {plat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Keywords */}
        <div className="mt-5">
          <span className="text-xs text-faint">Keywords de interés</span>
          <p className="mt-0.5 text-[11px] text-faint">
            Términos, productos o nichos que quieres seguir (máx. 12).
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(draft.keywords ?? []).map((kw) => (
              <span key={kw} className="flex items-center gap-1 rounded-md bg-soft px-2.5 py-1 text-xs text-dim">
                {kw}
                <button
                  onClick={() => save({ ...draft, keywords: (draft.keywords ?? []).filter((k) => k !== kw) })}
                  className="pressable ml-0.5 text-faint hover:text-ink"
                  aria-label={`Quitar ${kw}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          {(draft.keywords ?? []).length < 12 && (
            <div className="mt-2 flex gap-2">
              <input
                ref={kwRef}
                type="text"
                value={kwInput}
                onChange={(e) => setKwInput(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ',') && kwInput.trim()) {
                    e.preventDefault();
                    const kw = kwInput.trim().toLowerCase();
                    if (kw && !(draft.keywords ?? []).includes(kw)) {
                      save({ ...draft, keywords: [...(draft.keywords ?? []), kw] });
                    }
                    setKwInput('');
                  }
                }}
                placeholder="Ej: impresora, fitness tracker…"
                className="flex-1 rounded-lg border border-line bg-elev px-3 py-2 text-sm text-ink outline-none transition-colors duration-150 placeholder:text-faint focus:border-jade"
              />
              <button
                onClick={() => {
                  const kw = kwInput.trim().toLowerCase();
                  if (kw && !(draft.keywords ?? []).includes(kw)) {
                    save({ ...draft, keywords: [...(draft.keywords ?? []), kw] });
                  }
                  setKwInput('');
                  kwRef.current?.focus();
                }}
                disabled={!kwInput.trim()}
                className="pressable rounded-lg border border-line px-3 py-2 text-sm text-dim transition-colors duration-150 hover:border-jade hover:text-ink disabled:opacity-40"
              >
                Añadir
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Sobre ti — adapta el tono de toda la plataforma */}
      <section className="mt-10 pb-10" aria-label="Sobre ti">
        <h2 className="font-display text-sm font-bold text-dim">Sobre ti</h2>
        <p className="mt-1 text-xs leading-relaxed text-faint">
          Esto adapta el tono de Radar Diario, el dashboard y el Asistente a tu nivel y objetivos reales.
        </p>

        {/* Nivel de experiencia */}
        <div className="mt-4">
          <span className="text-xs text-faint">Nivel de experiencia</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {EXPERIENCE_LEVELS.map((lvl) => {
              const active = draft.experienceLevel === lvl.id;
              return (
                <button
                  key={lvl.id}
                  onClick={() => save({ ...draft, experienceLevel: active ? '' : lvl.id })}
                  className={`pressable rounded-full border px-3 py-1.5 text-xs transition-colors duration-150 ${
                    active
                      ? 'border-jade bg-jade/10 font-medium text-jade'
                      : 'border-line text-dim hover:border-line-strong hover:text-ink'
                  }`}
                >
                  {lvl.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Objetivos */}
        <div className="mt-5">
          <span className="text-xs text-faint">Tus objetivos en Radar</span>
          <p className="mt-0.5 text-[11px] text-faint">Elige hasta {MAX_GOALS}.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {GOALS.map((goal) => {
              const active = draft.goals.includes(goal.id);
              const disabled = !active && draft.goals.length >= MAX_GOALS;
              return (
                <button
                  key={goal.id}
                  disabled={disabled}
                  onClick={() => {
                    const next = active
                      ? draft.goals.filter((g) => g !== goal.id)
                      : [...draft.goals, goal.id];
                    save({ ...draft, goals: next });
                  }}
                  className={`pressable rounded-full border px-3 py-1.5 text-xs transition-colors duration-150 ${
                    active
                      ? 'border-jade bg-jade/10 font-medium text-jade'
                      : disabled
                        ? 'cursor-not-allowed border-line text-faint opacity-40'
                        : 'border-line text-dim hover:border-line-strong hover:text-ink'
                  }`}
                >
                  {goal.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Marketplaces */}
        <div className="mt-5">
          <span className="text-xs text-faint">Marketplaces que usas</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {MARKETPLACES.map((m) => {
              const active = draft.marketplaces.includes(m.id);
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    const next = active
                      ? draft.marketplaces.filter((x) => x !== m.id)
                      : [...draft.marketplaces, m.id];
                    save({ ...draft, marketplaces: next });
                  }}
                  className={`pressable rounded-full border px-3 py-1.5 text-xs transition-colors duration-150 ${
                    active
                      ? 'border-jade bg-jade/10 font-medium text-jade'
                      : 'border-line text-dim hover:border-line-strong hover:text-ink'
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Idioma y región */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs text-faint">Idioma</span>
            <select
              value={draft.language}
              onChange={(e) => save({ ...draft, language: e.target.value as Preferences['language'] })}
              className="mt-1 w-full rounded-lg border border-line bg-elev px-3 py-2.5 text-sm text-ink outline-none transition-colors duration-150 focus:border-jade"
            >
              {LANGUAGES.map((l) => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-faint">Región (opcional)</span>
            <input
              type="text"
              value={draft.region}
              onChange={(e) => setDraft({ ...draft, region: e.target.value })}
              onBlur={() => save(draft)}
              placeholder="Ej: Buenos Aires, CDMX…"
              className="mt-1 w-full rounded-lg border border-line bg-elev px-3 py-2.5 text-sm text-ink outline-none transition-colors duration-150 placeholder:text-faint focus:border-jade"
            />
          </label>
        </div>
      </section>

      {/* Logros */}
      <AchievementStrip className="pt-2" />
    </div>
  );
}
