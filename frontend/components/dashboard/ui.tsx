import type { ConfidenceLevel, SignalStatus } from '@/lib/types';
import { CONFIDENCE_LABELS, STATUS_LABELS } from '@/lib/format';

/** Score 0-100 en mono, coloreado por magnitud. */
export function Score({ value, size = 'md' }: { value: number; size?: 'md' | 'lg' }) {
  const color =
    value >= 70 ? 'text-jade' : value >= 40 ? 'text-amber' : 'text-dim';
  return (
    <span
      className={`font-mono font-medium tabular-nums ${color} ${
        size === 'lg' ? 'text-5xl' : 'text-xl'
      }`}
    >
      {value}
    </span>
  );
}

const STATUS_STYLES: Record<SignalStatus, string> = {
  new: 'bg-soft text-ink',
  rising: 'bg-[var(--jade-dim)] text-jade',
  peaking: 'bg-[var(--jade-dim)] text-jade',
  cooling: 'bg-[var(--amber-dim)] text-amber',
  dormant: 'bg-soft text-faint',
};

export function StatusBadge({ status }: { status: SignalStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {(status === 'rising' || status === 'new') && (
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
      )}
      {STATUS_LABELS[status]}
    </span>
  );
}

export function ConfidenceDots({ level }: { level: ConfidenceLevel }) {
  const filled = level === 'high' ? 3 : level === 'medium' ? 2 : 1;
  return (
    <span className="inline-flex items-center gap-2" title={`Confianza ${CONFIDENCE_LABELS[level]}`}>
      <span className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full ${i <= filled ? 'bg-jade' : 'bg-soft'}`}
          />
        ))}
      </span>
      <span className="text-xs text-dim">{CONFIDENCE_LABELS[level]}</span>
    </span>
  );
}

/** Mini-serie del histórico reciente. Datos reales, no decoración. */
export function Sparkline({ data, width = 96, height = 28 }: { data: number[]; width?: number; height?: number }) {
  if (data.length < 2) return <span className="text-xs text-faint">—</span>;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const points = data
    .map((v, i) => `${(i * step).toFixed(1)},${(height - 3 - ((v - min) / range) * (height - 6)).toFixed(1)}`)
    .join(' ');
  const risingTrend = data[data.length - 1] >= data[0];

  return (
    <svg width={width} height={height} className="shrink-0" aria-hidden>
      <polyline
        points={points}
        fill="none"
        stroke={risingTrend ? 'var(--jade)' : 'var(--amber)'}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-elev ${className}`} />;
}

export function GrowthPct({ value }: { value: number }) {
  const rounded = Math.round(value);
  const color = rounded > 0 ? 'text-jade' : rounded < 0 ? 'text-amber' : 'text-dim';
  return (
    <span className={`font-mono text-sm tabular-nums ${color}`}>
      {rounded > 0 ? '+' : ''}
      {rounded}%
    </span>
  );
}
