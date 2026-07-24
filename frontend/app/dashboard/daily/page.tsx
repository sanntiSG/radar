'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { DailyResponse, Signal } from '@/lib/types';
import { Score, Skeleton, Sparkline, StatusBadge, GrowthPct } from '@/components/dashboard/ui';
import { AchievementStrip } from '@/components/dashboard/AchievementStrip';
import { AccuracyBadge } from '@/components/dashboard/AccuracyBadge';
import { dailySubtitle } from '@/lib/experience';

const NICHES = ['Gadgets', 'Belleza', 'Fitness', 'Mascotas', 'Cocina', 'Hogar', 'Tecnología', 'Moda', 'Automotor', 'Salud y bienestar', 'General'];
const PLATFORMS = [
  { id: 'reddit', label: 'Reddit' },
  { id: 'google-trends', label: 'Google Trends' },
  { id: 'rss', label: 'RSS / Blogs' },
];
const COUNTRIES = [
  { code: 'AR', label: 'Argentina' }, { code: 'MX', label: 'México' }, { code: 'CO', label: 'Colombia' },
  { code: 'CL', label: 'Chile' }, { code: 'PE', label: 'Perú' }, { code: 'ES', label: 'España' },
  { code: 'UY', label: 'Uruguay' }, { code: 'EC', label: 'Ecuador' }, { code: 'US', label: 'Estados Unidos' },
  { code: 'BR', label: 'Brasil' },
];

function SignalRow({ signal }: { signal: Signal }) {
  return (
    <Link
      href={`/dashboard/signal/${signal.slug}`}
      className="flex items-center gap-3 rounded-lg bg-soft/50 px-3 py-2.5 transition-colors duration-150 hover:bg-soft"
    >
      <Score value={signal.radarScore} />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium md:line-clamp-1 md:truncate">{signal.name}</p>
        <p className="text-xs text-faint">{signal.category}</p>
      </div>
      <span className="hidden sm:block">
        <Sparkline data={signal.sparkline} />
      </span>
      <GrowthPct value={signal.growthScore} />
      <StatusBadge status={signal.status} />
    </Link>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-sm font-bold text-dim">{children}</h2>;
}

function formatDate(iso: string): string {
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-line bg-elev px-3 py-1.5 text-xs text-dim outline-none transition-colors duration-150 focus:border-jade"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export default function DailyPage() {
  const { user, preferences, loading: authLoading } = useAuth();
  const [data, setData] = useState<DailyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [niche, setNiche] = useState('');
  const [platform, setPlatform] = useState('');
  const [country, setCountry] = useState('');
  const [primed, setPrimed] = useState(false);

  // Precarga los filtros desde el perfil una sola vez, cuando termina de cargar.
  useEffect(() => {
    if (authLoading || primed) return;
    if (preferences.niches.length === 1) setNiche(preferences.niches[0]);
    if (preferences.platforms.length === 1) setPlatform(preferences.platforms[0]);
    if (preferences.country && preferences.country !== 'global') setCountry(preferences.country);
    setPrimed(true);
  }, [authLoading, primed, preferences]);

  useEffect(() => {
    if (!primed && !authLoading) return;
    setError(null);
    api
      .daily({ niche: niche || undefined, platform: platform || undefined, country: country || undefined })
      .then(setData)
      .catch(() => setError('No se pudo cargar el Radar Diario.'));
  }, [niche, platform, country, primed, authLoading]);

  const greeting = user
    ? `Buenos días, ${(user.name || 'explorador').split(' ')[0]}`
    : 'Tu resumen de hoy';

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <header className="border-b border-line pb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">{greeting}</h1>
            {data && (
              <p className="mt-1 text-sm text-dim capitalize">{formatDate(data.date)}</p>
            )}
            <p className="mt-1 text-sm text-faint">{dailySubtitle(preferences.experienceLevel)}</p>
            <div className="mt-3">
              <AccuracyBadge />
            </div>
          </div>
          {data && data.streak > 0 && (
            <div className="flex flex-col items-center rounded-xl border border-line bg-elev px-4 py-3 text-center">
              <span className="font-display text-2xl font-bold text-jade">{data.streak}</span>
              <span className="mt-0.5 text-[11px] text-faint">
                {data.streak === 1 ? 'día de racha' : 'días seguidos'}
              </span>
            </div>
          )}
        </div>

        {/* Filtros de ámbito */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-faint">Ver:</span>
          <FilterSelect
            value={niche}
            onChange={setNiche}
            options={NICHES.map((n) => ({ value: n, label: n }))}
            placeholder="Todos los nichos"
          />
          <FilterSelect
            value={platform}
            onChange={setPlatform}
            options={PLATFORMS.map((p) => ({ value: p.id, label: p.label }))}
            placeholder="Todas las plataformas"
          />
          <FilterSelect
            value={country}
            onChange={setCountry}
            options={COUNTRIES.map((c) => ({ value: c.code, label: c.label }))}
            placeholder="Global"
          />
          {(niche || platform || country) && (
            <button
              onClick={() => { setNiche(''); setPlatform(''); setCountry(''); }}
              className="pressable text-xs text-faint underline transition-colors duration-150 hover:text-ink"
            >
              Limpiar
            </button>
          )}
        </div>
        {data?.scope.note && (
          <p className="mt-2 text-[11px] leading-relaxed text-faint">{data.scope.note}</p>
        )}
      </header>

      {error && <p className="mt-6 text-sm text-dim">{error}</p>}

      {!data && !error && (
        <div className="mt-6 space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      )}

      {data && (
        <div className="mt-6 space-y-8">
          {/* Oportunidad del día */}
          {data.sections.opportunityOfDay && (
            <section>
              <SectionTitle>Oportunidad del día</SectionTitle>
              <p className="mt-0.5 text-xs text-faint">
                Señal rotativa seleccionada por el motor para hoy — úsala como punto de partida.
              </p>
              <div className="mt-3 rise-in">
                <SignalRow signal={data.sections.opportunityOfDay} />
              </div>
            </section>
          )}

          {/* Cambios respecto a ayer */}
          {(data.sections.biggestMovers.up || data.sections.biggestMovers.down) && (
            <section>
              <SectionTitle>Respecto a ayer</SectionTitle>
              <p className="mt-0.5 text-xs text-faint">
                El mayor ascenso y el mayor descenso en menciones desde el período anterior.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {data.sections.biggestMovers.up && (
                  <div className="rise-in">
                    <p className="mb-1 text-[11px] font-medium text-jade">↑ Mayor ascenso</p>
                    <SignalRow signal={data.sections.biggestMovers.up} />
                  </div>
                )}
                {data.sections.biggestMovers.down && (
                  <div className="rise-in">
                    <p className="mb-1 text-[11px] font-medium text-amber">↓ Mayor descenso</p>
                    <SignalRow signal={data.sections.biggestMovers.down} />
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Keyword highlights */}
          {data.sections.keywordHighlights.length > 0 && (
            <section>
              <SectionTitle>Tus keywords hoy</SectionTitle>
              <p className="mt-0.5 text-xs text-faint">
                Señales que coinciden con tus términos de interés.{' '}
                <Link href="/dashboard/profile" className="text-jade underline">Gestionar keywords</Link>
              </p>
              <div className="mt-3 space-y-2">
                {data.sections.keywordHighlights.map((s) => (
                  <div key={s._id} className="rise-in">
                    <SignalRow signal={s} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* En ascenso */}
          {data.sections.rising.length > 0 && (
            <section>
              <SectionTitle>En ascenso</SectionTitle>
              <div className="mt-3 space-y-2">
                {data.sections.rising.map((s, i) => (
                  <div key={s._id} className="rise-in" style={{ animationDelay: `${i * 50}ms` }}>
                    <SignalRow signal={s} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Mayor movimiento */}
          {data.sections.moving.length > 0 && (
            <section>
              <SectionTitle>Mayor movimiento hoy</SectionTitle>
              <div className="mt-3 space-y-2">
                {data.sections.moving.map((s, i) => (
                  <div key={s._id} className="rise-in" style={{ animationDelay: `${i * 50}ms` }}>
                    <SignalRow signal={s} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Nuevas detecciones */}
          {data.sections.new.length > 0 && (
            <section>
              <SectionTitle>Nuevas detecciones</SectionTitle>
              <div className="mt-3 space-y-2">
                {data.sections.new.map((s, i) => (
                  <div key={s._id} className="rise-in" style={{ animationDelay: `${i * 50}ms` }}>
                    <SignalRow signal={s} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Productos emergentes */}
          {data.sections.emergingProducts.length > 0 && (
            <section>
              <SectionTitle>Productos emergentes</SectionTitle>
              <p className="mt-0.5 text-xs text-faint">
                Nuevos o en ascenso, con volumen todavía bajo — antes de que se vuelvan evidentes.
              </p>
              <div className="mt-3 space-y-2">
                {data.sections.emergingProducts.map((s, i) => (
                  <div key={s._id} className="rise-in" style={{ animationDelay: `${i * 50}ms` }}>
                    <SignalRow signal={s} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Hashtags destacados */}
          {data.sections.hashtagsHighlights.length > 0 && (
            <section>
              <SectionTitle>Hashtags destacados</SectionTitle>
              <div className="mt-3 space-y-2">
                {data.sections.hashtagsHighlights.map((s, i) => (
                  <div key={s._id} className="rise-in" style={{ animationDelay: `${i * 50}ms` }}>
                    <SignalRow signal={s} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Predicción del día */}
          {data.sections.predictionOfDay && (
            <section>
              <SectionTitle>Predicción del motor</SectionTitle>
              <p className="mt-0.5 text-xs text-faint">
                Señal con confianza alta y proyección de crecimiento en 7 días.
              </p>
              <div className="mt-3 rise-in">
                <div className="rounded-xl border border-line bg-elev/60 p-4">
                  <div className="flex items-start gap-4">
                    <Score value={data.sections.predictionOfDay.radarScore} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="font-display font-semibold">{data.sections.predictionOfDay.name}</p>
                      <p className="mt-1 text-xs text-faint">{data.sections.predictionOfDay.category}</p>
                      {data.sections.predictionOfDay.predictions && (
                        <div className="mt-2 flex gap-4 text-xs">
                          {[
                            ['24h', data.sections.predictionOfDay.predictions.h24],
                            ['72h', data.sections.predictionOfDay.predictions.h72],
                            ['7d', data.sections.predictionOfDay.predictions.d7],
                          ].map(([label, val]) => (
                            <span key={String(label)}>
                              <span className="text-faint">{label}: </span>
                              <span className="font-mono font-medium text-dim">{val ?? '—'}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <Sparkline data={data.sections.predictionOfDay.sparkline} />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Logros */}
          <AchievementStrip />

          {/* CTA */}
          <section className="rounded-xl border border-line bg-elev/40 p-5 text-center">
            <p className="text-sm font-medium">
              Explora el dashboard completo o pregúntale al Asistente.
            </p>
            <div className="mt-3 flex justify-center gap-3">
              <Link
                href="/dashboard"
                className="pressable rounded-full border border-line px-4 py-2 text-sm text-dim transition-colors duration-150 hover:border-jade hover:text-ink"
              >
                Ver señales
              </Link>
              <Link
                href="/dashboard/assistant"
                className="pressable rounded-full bg-jade px-4 py-2 text-sm font-semibold text-[oklch(18%_0.02_165)]"
              >
                Preguntar al Asistente
              </Link>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
