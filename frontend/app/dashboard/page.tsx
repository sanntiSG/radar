'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { authFetch, useAuth, type SectionPref } from '@/lib/auth';
import type { HistoryPoint, Insight, Signal, Stats } from '@/lib/types';
import { ENTITY_LABELS, relativeDate } from '@/lib/format';
import {
  ConfidenceDots,
  GrowthPct,
  Score,
  Skeleton,
  Sparkline,
  StatusBadge,
} from '@/components/dashboard/ui';
import { SignalChart } from '@/components/dashboard/SignalChart';

export default function DashboardPage() {
  const { user, preferences, loading: authLoading } = useAuth();
  const [signals, setSignals] = useState<Signal[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [selected, setSelected] = useState<Signal | null>(null);
  const [history, setHistory] = useState<HistoryPoint[] | null>(null);
  const [pinned, setPinned] = useState<Signal[]>([]);
  const [pinnedSlugs, setPinnedSlugs] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Filtros por defecto del usuario
  const signalParams = useMemo(() => {
    if (authLoading) return null;
    let params = `&sort=${preferences.defaultSort}`;
    if (preferences.defaultCategory && preferences.defaultCategory !== 'Todas') {
      params += `&category=${encodeURIComponent(preferences.defaultCategory)}`;
    }
    if (preferences.defaultStatus) params += `&status=${preferences.defaultStatus}`;
    return params;
  }, [authLoading, preferences]);

  useEffect(() => {
    if (signalParams === null) return;
    Promise.all([api.signals(signalParams), api.stats(), api.insights()])
      .then(([s, st, ins]) => {
        setSignals(s.items);
        setStats(st);
        setInsights(ins.items);
        setSelected((prev) => prev ?? s.items[0] ?? null);
      })
      .catch(() =>
        setError(
          'No se pudo conectar con la API. Verifica que el backend esté corriendo en el puerto 4000 y que MONGODB_URI esté configurado.'
        )
      );
  }, [signalParams]);

  useEffect(() => {
    if (!selected) return;
    setHistory(null);
    api
      .history(selected.entityType, selected.slug)
      .then((h) => setHistory(h.points))
      .catch(() => setHistory([]));
  }, [selected]);

  const loadPins = useCallback(async () => {
    if (!user) return;
    try {
      const data = await authFetch('/api/watchlists/me');
      setPinned(data.signals);
      setPinnedSlugs(new Set(data.items.map((i: { slug: string }) => i.slug)));
    } catch {
      /* pines no críticos */
    }
  }, [user]);

  useEffect(() => {
    loadPins();
  }, [loadPins]);

  const togglePin = async (signal: Signal) => {
    if (!user) return;
    const isPinned = pinnedSlugs.has(signal.slug);
    // Optimista
    setPinnedSlugs((prev) => {
      const next = new Set(prev);
      if (isPinned) next.delete(signal.slug);
      else next.add(signal.slug);
      return next;
    });
    try {
      if (isPinned) {
        await authFetch(`/api/watchlists/me/items/${signal.slug}`, { method: 'DELETE' });
      } else {
        await authFetch('/api/watchlists/me/items', {
          method: 'POST',
          body: JSON.stringify({ entityType: signal.entityType, slug: signal.slug }),
        });
      }
      await loadPins();
    } catch {
      await loadPins(); // revertir al estado real
    }
  };

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="max-w-md rounded-xl border border-line bg-elev p-8 text-center">
          <p className="font-display text-xl font-bold">Sin conexión con Radar</p>
          <p className="mt-3 text-sm leading-relaxed text-dim">{error}</p>
          <p className="mt-4 rounded-lg bg-soft px-4 py-2 font-mono text-xs text-dim">
            cd backend && npm run dev
          </p>
        </div>
      </div>
    );
  }

  const visibleSections = [...preferences.sections]
    .sort((a, b) => a.order - b.order)
    .filter((s) => s.visible);

  const sectionRender: Record<SectionPref['id'], React.ReactNode> = {
    stats: stats && (
      <dl key="stats" className="flex flex-wrap gap-8 border-b border-line pb-6 text-sm">
        {[
          ['Activas', stats.total],
          ['En ascenso', stats.rising],
          ['Confianza alta', stats.highConfidence],
          ['Score medio', stats.avgRadarScore],
        ].map(([label, value]) => (
          <div key={label}>
            <dd className="font-mono text-xl font-medium tabular-nums">{value}</dd>
            <dt className="text-xs text-faint">{label}</dt>
          </div>
        ))}
      </dl>
    ),

    watchlist: user ? (
      <section key="watchlist" aria-label="Mi watchlist">
        <h2 className="font-display text-sm font-bold text-dim">Mi watchlist</h2>
        {pinned.length === 0 ? (
          <p className="mt-2 text-sm leading-relaxed text-faint">
            Fija señales con la estrella del feed y aparecerán aquí.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-[var(--border)] rounded-xl border border-line bg-elev/60">
            {pinned.map((signal) => (
              <li key={signal.slug}>
                <button
                  onClick={() => setSelected(signal)}
                  className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors duration-150 hover:bg-elev"
                >
                  <Score value={signal.radarScore} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{signal.name}</span>
                  <GrowthPct value={signal.growthScore} />
                  <StatusBadge status={signal.status} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    ) : null,

    feed: (
      <section key="feed" aria-label="Feed de señales">
        <h2 className="font-display text-sm font-bold text-dim">
          Señales
          {preferences.defaultCategory !== 'Todas' && (
            <span className="ml-2 font-body text-xs font-normal text-faint">
              filtrado: {preferences.defaultCategory} ·{' '}
              <Link href="/dashboard/profile" className="underline hover:text-ink">cambiar</Link>
            </span>
          )}
        </h2>
        {!signals ? (
          <div className="mt-2 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : signals.length === 0 ? (
          <div className="mt-2 rounded-xl border border-line bg-elev p-10 text-center">
            <p className="font-display text-lg font-bold">El radar está en silencio</p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-dim">
              No hay señales con estos filtros. Prueba otra categoría o ejecuta
              el seed para cargar datos.
            </p>
          </div>
        ) : (
          <ul className="mt-2 divide-y divide-[var(--border)]">
            {signals.map((signal, i) => (
              <li key={signal._id} className="rise-in" style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}>
                <div
                  className={`flex w-full items-center gap-3 px-3 py-3.5 transition-colors duration-150 hover:bg-elev md:gap-5 ${
                    selected?.slug === signal.slug ? 'bg-elev' : ''
                  }`}
                >
                  {user && (
                    <button
                      onClick={() => togglePin(signal)}
                      className={`pressable shrink-0 text-base leading-none transition-colors duration-150 ${
                        pinnedSlugs.has(signal.slug) ? 'text-jade' : 'text-faint hover:text-dim'
                      }`}
                      title={pinnedSlugs.has(signal.slug) ? 'Quitar de mi watchlist' : 'Fijar en mi watchlist'}
                      aria-pressed={pinnedSlugs.has(signal.slug)}
                    >
                      {pinnedSlugs.has(signal.slug) ? '★' : '☆'}
                    </button>
                  )}
                  <button
                    onClick={() => setSelected(signal)}
                    className="flex min-w-0 flex-1 items-center gap-4 text-left md:gap-6"
                  >
                    <Score value={signal.radarScore} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{signal.name}</span>
                      <span className="mt-0.5 flex items-center gap-2 text-xs text-faint">
                        <span>{ENTITY_LABELS[signal.entityType]}</span>
                        <span aria-hidden>·</span>
                        <span>{signal.category}</span>
                      </span>
                    </span>
                    <span className="hidden sm:block">
                      <Sparkline data={signal.sparkline} />
                    </span>
                    <GrowthPct value={signal.growthScore} />
                    <span className="hidden md:block">
                      <StatusBadge status={signal.status} />
                    </span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    ),

    insights: insights.length > 0 && (
      <section key="insights" aria-label="Observaciones del motor">
        <h2 className="font-display text-sm font-bold text-dim">Observaciones del motor</h2>
        <ul className="mt-3 space-y-3">
          {insights.slice(0, 4).map((insight, i) => (
            <li key={i} className="text-sm leading-relaxed text-dim">
              <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-jade align-middle" />
              {insight.text}
            </li>
          ))}
        </ul>
      </section>
    ),
  };

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-8 md:py-8">
      <header className="flex flex-wrap items-end justify-between gap-4 pb-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {user ? `Tu radar, ${(user.name || 'explorador').split(' ')[0]}` : 'Señales detectadas'}
          </h1>
          <p className="mt-1 text-sm text-dim">
            Lo que el mercado murmura, ordenado a tu manera.
          </p>
        </div>
        {!user && !authLoading && (
          <Link
            href="/login"
            className="pressable rounded-full border border-line-strong px-4 py-2 text-sm text-dim transition-colors duration-150 hover:border-jade hover:text-ink"
          >
            Inicia sesión para personalizar
          </Link>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <div className="min-w-0 space-y-8">
          {visibleSections.map((section) => sectionRender[section.id])}
          {visibleSections.length === 0 && (
            <div className="rounded-xl border border-line bg-elev p-10 text-center text-sm text-dim">
              Ocultaste todas las secciones.{' '}
              <Link href="/dashboard/profile" className="text-jade underline">
                Reactívalas desde tu perfil
              </Link>
              .
            </div>
          )}
        </div>

        {/* Panel de detalle — siempre presente, es el corazón del dashboard */}
        <aside className="lg:sticky lg:top-6 lg:self-start" aria-label="Detalle de señal">
          {selected ? (
            <div className="rounded-2xl border border-line bg-elev/60 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-bold leading-tight">{selected.name}</h2>
                  <p className="mt-1 text-xs text-faint">
                    {selected.category} · detectada {relativeDate(selected.detectedAt)}
                  </p>
                </div>
                <Score value={selected.radarScore} size="lg" />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <StatusBadge status={selected.status} />
                <ConfidenceDots level={selected.confidence} />
              </div>

              <div className="mt-5">
                {history === null ? (
                  <Skeleton className="h-44" />
                ) : (
                  <SignalChart
                    points={history}
                    metric={selected.entityType === 'trend' ? 'interest' : 'mentions'}
                  />
                )}
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                {[
                  ['24 h', selected.predictions.h24],
                  ['72 h', selected.predictions.h72],
                  ['7 días', selected.predictions.d7],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-soft px-3 py-2.5 text-center">
                    <p className="font-mono text-lg font-medium tabular-nums">{value ?? '—'}</p>
                    <p className="text-xs text-faint">{label}</p>
                  </div>
                ))}
              </div>

              <p className="mt-5 text-sm leading-relaxed text-dim">{selected.explanation}</p>

              {selected.aliases.length > 0 && (
                <div className="mt-5 border-t border-line pt-4">
                  <p className="text-xs font-medium text-faint">Variantes agrupadas en esta señal</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selected.aliases.slice(0, 6).map((alias) => (
                      <span key={alias} className="rounded-md bg-soft px-2 py-1 text-xs text-dim">
                        {alias}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 grid grid-cols-3 gap-x-4 gap-y-2 border-t border-line pt-4 text-xs">
                {[
                  ['Velocidad', selected.metrics.velocity],
                  ['Aceleración', selected.metrics.acceleration],
                  ['Momentum', selected.metrics.momentum],
                  ['Frecuencia', selected.metrics.frequency],
                  ['Engagement', selected.metrics.engagement],
                  ['Recencia', `${selected.metrics.recency}h`],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-2">
                    <span className="text-faint">{label}</span>
                    <span className="font-mono tabular-nums text-dim">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Skeleton className="h-96" />
          )}
        </aside>
      </div>
    </div>
  );
}
