'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
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
  const [signals, setSignals] = useState<Signal[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [selected, setSelected] = useState<Signal | null>(null);
  const [history, setHistory] = useState<HistoryPoint[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.signals(), api.stats(), api.insights()])
      .then(([s, st, ins]) => {
        setSignals(s.items);
        setStats(st);
        setInsights(ins.items);
        if (s.items.length) setSelected(s.items[0]);
      })
      .catch(() =>
        setError(
          'No se pudo conectar con la API. Verifica que el backend esté corriendo en el puerto 4000 y que MONGODB_URI esté configurado.'
        )
      );
  }, []);

  useEffect(() => {
    if (!selected) return;
    setHistory(null);
    api
      .history(selected.entityType, selected.slug)
      .then((h) => setHistory(h.points))
      .catch(() => setHistory([]));
  }, [selected]);

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

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-8 md:py-8">
      {/* Encabezado con métricas inline — sin tarjetas de hero metric */}
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Señales detectadas</h1>
          <p className="mt-1 text-sm text-dim">
            Lo que el mercado murmura, ordenado por Radar Score.
          </p>
        </div>
        {stats && (
          <dl className="flex gap-8 text-sm">
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
        )}
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px]">
        {/* ───── Feed de señales ───── */}
        <section aria-label="Feed de señales">
          {!signals ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : signals.length === 0 ? (
            <div className="rounded-xl border border-line bg-elev p-10 text-center">
              <p className="font-display text-lg font-bold">El radar está en silencio</p>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-dim">
                Aún no hay señales en la base. Ejecuta el seed para cargar datos
                realistas y el backfill para traer histórico de Google Trends.
              </p>
              <p className="mt-4 inline-block rounded-lg bg-soft px-4 py-2 font-mono text-xs text-dim">
                cd backend && npm run seed && npm run backfill
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {signals.map((signal, i) => (
                <li key={signal._id} className="rise-in" style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}>
                  <button
                    onClick={() => setSelected(signal)}
                    className={`flex w-full items-center gap-4 px-3 py-3.5 text-left transition-colors duration-150 hover:bg-elev md:gap-6 ${
                      selected?.slug === signal.slug ? 'bg-elev' : ''
                    }`}
                  >
                    <Score value={signal.radarScore} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{signal.name}</p>
                      <p className="mt-0.5 flex items-center gap-2 text-xs text-faint">
                        <span>{ENTITY_LABELS[signal.entityType]}</span>
                        <span aria-hidden>·</span>
                        <span>{signal.category}</span>
                      </p>
                    </div>
                    <div className="hidden sm:block">
                      <Sparkline data={signal.sparkline} />
                    </div>
                    <GrowthPct value={signal.growthScore} />
                    <div className="hidden md:block">
                      <StatusBadge status={signal.status} />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ───── Panel de detalle ───── */}
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

              {/* Predicciones con confianza explícita */}
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
                  <p className="text-xs font-medium text-faint">
                    Variantes agrupadas en esta señal
                  </p>
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

          {/* Insights automáticos */}
          {insights.length > 0 && (
            <div className="mt-6">
              <h3 className="font-display text-sm font-bold text-dim">Observaciones del motor</h3>
              <ul className="mt-3 space-y-3">
                {insights.slice(0, 4).map((insight, i) => (
                  <li key={i} className="text-sm leading-relaxed text-dim">
                    <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-jade align-middle" />
                    {insight.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
