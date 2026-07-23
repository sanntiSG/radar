'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Opportunity } from '@/lib/types';
import { Score, Skeleton, Sparkline, StatusBadge } from '@/components/dashboard/ui';
import { relativeDate } from '@/lib/format';

export default function OpportunitiesPage() {
  const [items, setItems] = useState<Opportunity[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .opportunities()
      .then((data) => setItems(data.items))
      .catch(() => setError('No se pudo cargar las oportunidades.'));
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-8">
      <header className="border-b border-line pb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Oportunidades tempranas</h1>
        <p className="mt-1 text-sm leading-relaxed text-dim">
          Señales con alta aceleración y bajo volumen — las que el mercado aún no ha descubierto.
        </p>
      </header>

      <div className="mt-2 rounded-xl border border-line bg-soft/40 px-4 py-3 text-xs leading-relaxed text-faint">
        <strong className="font-medium text-dim">Nota:</strong> Una señal temprana no garantiza el éxito
        de un producto. Indica patrones emergentes basados en datos estadísticos. Úsala como punto
        de partida para tu propio análisis.
      </div>

      <div className="mt-6">
        {error ? (
          <p className="text-sm text-dim">{error}</p>
        ) : !items ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-line bg-elev p-10 text-center">
            <p className="font-display text-lg font-bold">Sin oportunidades detectadas</p>
            <p className="mt-2 text-sm text-dim">
              No hay señales con los criterios de oportunidad temprana en este momento.
              El motor las detecta en tiempo real a medida que los datos se actualizan.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((item, i) => (
              <li
                key={item._id}
                className="rise-in rounded-xl border border-line bg-elev/60 p-5 transition-colors duration-150 hover:bg-elev"
                style={{ animationDelay: `${Math.min(i, 10) * 50}ms` }}
              >
                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex flex-1 items-start gap-4">
                    <Score value={item.radarScore} size="lg" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display font-semibold">{item.name}</span>
                        <StatusBadge status={item.status} />
                        <span className="rounded-full bg-jade/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-jade">
                          oport. {item.opportunityScore}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-faint">
                        {item.category} · detectada {relativeDate(item.detectedAt)}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-dim">{item.reason}</p>
                    </div>
                  </div>
                  <Sparkline data={item.sparkline} />
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-3">
                  <div className="flex flex-wrap gap-4">
                    {[
                      ['Velocidad', item.metrics.velocity.toFixed(1)],
                      ['Aceleración', item.metrics.acceleration.toFixed(1)],
                      ['Frecuencia', item.metrics.frequency],
                      ['Engagement', item.metrics.engagement],
                    ].map(([label, value]) => (
                      <div key={String(label)} className="text-xs">
                        <span className="text-faint">{label}</span>
                        <span className="ml-1.5 font-mono tabular-nums text-dim">{value}</span>
                      </div>
                    ))}
                  </div>
                  <Link
                    href={`/dashboard/signal/${item.slug}`}
                    className="shrink-0 text-xs font-medium text-jade transition-colors duration-150 hover:text-ink"
                  >
                    Ver evidencia →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
