'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { SourcesResponse } from '@/lib/types';
import { relativeDate } from '@/lib/format';
import { Skeleton } from '@/components/dashboard/ui';

export default function SourcesPage() {
  const [data, setData] = useState<SourcesResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.sources().then(setData).catch(() => setError(true));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8">
      <header className="border-b border-line pb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Fuentes de datos</h1>
        <p className="mt-1 max-w-[65ch] text-sm leading-relaxed text-dim">
          De aquí salen las detecciones de Radar. Solo fuentes públicas y
          gratuitas — sin scraping agresivo, sin servicios de pago.
        </p>
      </header>

      {error ? (
        <div className="mt-6 rounded-xl border border-line bg-elev p-8 text-center text-sm text-dim">
          No se pudo conectar con la API. Verifica que el backend esté corriendo.
        </div>
      ) : !data ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : (
        <>
          {/* Ritmo de renovación */}
          <section className="mt-8" aria-label="Ritmo de renovación">
            <h2 className="font-display text-sm font-bold text-dim">
              Ritmo de renovación
              {!data.schedule.cronEnabled && (
                <span className="ml-2 rounded-full bg-[var(--amber-dim)] px-2 py-0.5 text-xs font-medium text-amber">
                  cron desactivado
                </span>
              )}
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {[
                ['Ingesta de fuentes', data.schedule.ingest, 'Se buscan items nuevos en todas las fuentes.'],
                ['Recálculo de señales', data.schedule.recompute, 'Scores, predicciones y alertas se recalculan.'],
                ['Ciclo completo', data.schedule.dailyPipeline, 'Ingesta + recálculo + snapshot diario del histórico.'],
              ].map(([title, cadence, desc]) => (
                <div key={title} className="rounded-xl border border-line bg-elev p-5">
                  <p className="font-mono text-sm font-medium text-jade">{cadence}</p>
                  <p className="mt-1 font-medium">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-faint">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Fuentes */}
          <section className="mt-10 space-y-4" aria-label="Fuentes activas">
            {data.sources.map((source, i) => (
              <article
                key={source.name}
                className="rise-in rounded-2xl border border-line bg-elev p-6"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-bold">{source.label}</h3>
                    <p className="mt-0.5 text-xs text-faint">{source.mode}</p>
                  </div>
                  <div className="text-right">
                    {source.lastRun ? (
                      <>
                        <p className="text-xs text-faint">Última recolección</p>
                        <p className="mt-0.5 text-sm text-dim">
                          {relativeDate(source.lastRun.at)}
                          {source.lastRun.status === 'ok' ? (
                            <span className="ml-2 font-mono text-xs text-jade">
                              {source.lastRun.newItems} nuevos
                            </span>
                          ) : (
                            <span className="ml-2 text-xs text-amber">con errores</span>
                          )}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-faint">
                        Aún sin recolecciones — corre npm run collect
                      </p>
                    )}
                  </div>
                </div>

                <p className="mt-4 max-w-[70ch] text-sm leading-relaxed text-dim">
                  {source.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 border-t border-line pt-4 text-xs">
                  <div>
                    <span className="text-faint">Aporta · </span>
                    <span className="text-dim">{source.provides}</span>
                  </div>
                  <div>
                    <span className="text-faint">Renovación · </span>
                    <span className="font-mono text-dim">{source.cadence}</span>
                  </div>
                  <div>
                    <span className="text-faint">Items procesados · </span>
                    <span className="font-mono tabular-nums text-dim">{source.cachedItems}</span>
                  </div>
                </div>
              </article>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
