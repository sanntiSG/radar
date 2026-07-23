'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { AccuracyResponse } from '@/lib/types';
import { Skeleton } from '@/components/dashboard/ui';

function StatTile({ label, value, suffix = '' }: { label: string; value: string | number; suffix?: string }) {
  return (
    <div className="rounded-xl border border-line bg-elev/60 p-5">
      <p className="font-mono text-3xl font-bold tabular-nums text-ink">
        {value}
        <span className="text-lg text-faint">{suffix}</span>
      </p>
      <p className="mt-1 text-xs text-faint">{label}</p>
    </div>
  );
}

function PrecisionBar({ pct }: { pct: number }) {
  const color = pct >= 65 ? 'bg-jade' : pct >= 45 ? 'bg-amber' : 'bg-faint';
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-soft">
      <div
        className={`h-full rounded-full ${color} transition-all duration-500`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function TransparenciaPage() {
  const [data, setData] = useState<AccuracyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .accuracy()
      .then(setData)
      .catch(() => setError('No se pudo cargar el Índice de Precisión.'));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <header className="border-b border-line pb-6">
        <p className="text-xs font-medium text-jade">Transparencia</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">Índice de Precisión de Radar</h1>
        <p className="mt-1 text-sm leading-relaxed text-dim">
          Radar no pide confianza — la demuestra. Este número se calcula con un backtest sobre
          el histórico propio: en cada punto del pasado, medimos si la dirección que el modelo
          habría proyectado se cumplió {'>'}3 días después.
        </p>
      </header>

      {error && <p className="mt-6 text-sm text-dim">{error}</p>}

      {!data && !error && (
        <div className="mt-6 space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-52" />
        </div>
      )}

      {data && (
        <div className="mt-6 space-y-8">
          {/* Disclaimer prominente */}
          <div className="rounded-xl border border-line bg-soft/40 px-4 py-3 text-xs leading-relaxed text-faint">
            <strong className="font-medium text-dim">Metodología:</strong> {data.disclaimer}
          </div>

          {/* Números grandes */}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Direcciones acertadas" value={data.overall.continuedGrowingPct} suffix="%" />
            <StatTile
              label="Anticipación promedio"
              value={data.overall.avgAnticipationDays ?? '—'}
              suffix={data.overall.avgAnticipationDays !== null ? ' días' : ''}
            />
            <StatTile label="Señales analizadas" value={data.overall.signalsAnalyzed} />
            <StatTile label="Predicciones evaluadas" value={data.overall.predictionsEvaluated} />
          </section>

          {/* Por categoría */}
          {data.byCategory.length > 0 && (
            <section>
              <h2 className="font-display text-sm font-bold text-dim">Precisión por categoría</h2>
              <ul className="mt-3 space-y-3 rounded-xl border border-line bg-elev/60 p-4">
                {data.byCategory.map((c) => (
                  <li key={c.category}>
                    <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                      <span className="font-medium text-ink">{c.category}</span>
                      <span className="font-mono text-xs text-dim">
                        {c.precisionPct}% · {c.count} predicciones
                      </span>
                    </div>
                    <PrecisionBar pct={c.precisionPct} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Por fuente */}
          {data.bySource.length > 0 && (
            <section>
              <h2 className="font-display text-sm font-bold text-dim">Precisión por fuente</h2>
              <ul className="mt-3 space-y-3 rounded-xl border border-line bg-elev/60 p-4">
                {data.bySource.map((s) => (
                  <li key={s.source}>
                    <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                      <span className="font-medium text-ink capitalize">{s.source.replace('-', ' ')}</span>
                      <span className="font-mono text-xs text-dim">
                        {s.precisionPct}% · {s.count} predicciones
                      </span>
                    </div>
                    <PrecisionBar pct={s.precisionPct} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Muestra de predicciones */}
          {data.overall.samplePredictions.length > 0 && (
            <section className="pb-10">
              <h2 className="font-display text-sm font-bold text-dim">Muestra de señales evaluadas</h2>
              <p className="mt-0.5 text-xs text-faint">
                Un vistazo directo a algunas de las señales incluidas en este cálculo.
              </p>
              <ul className="mt-3 divide-y divide-[var(--border)] rounded-xl border border-line bg-elev/60">
                {data.overall.samplePredictions.map((s) => (
                  <li key={s.slug} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="truncate text-dim">{s.slug}</span>
                    <span className="font-mono text-xs tabular-nums text-faint">
                      {s.precisionPct}% ({s.predictions})
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
