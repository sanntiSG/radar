import Link from 'next/link';
import type { HistoryPoint, Signal } from '@/lib/types';
import { relativeDate } from '@/lib/format';
import { ConfidenceDots, Score, Skeleton, StatusBadge } from '@/components/dashboard/ui';
import { SignalChart } from '@/components/dashboard/SignalChart';
import { FactorBreakdown } from '@/components/dashboard/FactorBreakdown';

/**
 * Contenido completo del detalle de una señal: score, chart histórico,
 * predicciones, explicación, desglose de factores y variantes agrupadas.
 * Se monta en 3 lugares con el mismo look — el aside sticky de escritorio
 * y los acordeones inline de "Señales" y "Mi watchlist" en móvil — para que
 * la experiencia sea idéntica sin importar dónde aparezca.
 */
export function SignalDetailPanel({
  signal,
  history,
  className = '',
}: {
  signal: Signal;
  history: HistoryPoint[] | null;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-line bg-elev/60 p-6 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold leading-tight">{signal.name}</h2>
          <p className="mt-1 text-xs text-faint">
            {signal.category} · detectada {relativeDate(signal.detectedAt)}
          </p>
        </div>
        <Score value={signal.radarScore} size="lg" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <StatusBadge status={signal.status} />
        <ConfidenceDots level={signal.confidence} />
      </div>

      <div className="mt-5">
        {history === null ? (
          <Skeleton className="h-44" />
        ) : (
          <SignalChart points={history} metric={signal.entityType === 'trend' ? 'interest' : 'mentions'} />
        )}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {[
          ['24 h', signal.predictions.h24],
          ['72 h', signal.predictions.h72],
          ['7 días', signal.predictions.d7],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg bg-soft px-3 py-2.5 text-center">
            <p className="font-mono text-lg font-medium tabular-nums">{value ?? '—'}</p>
            <p className="text-xs text-faint">{label}</p>
          </div>
        ))}
      </div>

      <p className="mt-5 text-sm leading-relaxed text-dim">{signal.explanation}</p>

      {/* Por qué esta señal — desglose de factores */}
      {signal.factors && signal.factors.length > 0 && (
        <div className="mt-5 border-t border-line pt-4">
          <FactorBreakdown factors={signal.factors} />
          <Link
            href={`/dashboard/signal/${signal.slug}`}
            className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-jade transition-colors duration-150 hover:text-ink"
          >
            Ver evidencia completa →
          </Link>
        </div>
      )}

      {signal.aliases.length > 0 && (
        <div className="mt-5 border-t border-line pt-4">
          <p className="text-xs font-medium text-faint">Variantes agrupadas en esta señal</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {signal.aliases.slice(0, 6).map((alias) => (
              <span key={alias} className="rounded-md bg-soft px-2 py-1 text-xs text-dim">
                {alias}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
