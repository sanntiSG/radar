import type { Signal, ConfidenceLevel, SignalStatus } from './types';

// ── Score Helpers ─────────────────────────────────────────────────────────────

export function scoreColorClass(score: number, status: SignalStatus): string {
  if (status === 'fading') return 'score-fade';
  if (status === 'noise') return 'score-low';
  if (score >= 80) return 'score-high';
  if (score >= 50) return 'score-mid';
  return 'score-low';
}

export function scoreColor(score: number, status: SignalStatus): string {
  if (status === 'fading') return 'var(--fading)';
  if (status === 'noise') return 'var(--text-3)';
  if (score >= 80) return 'var(--amber)';
  if (score >= 50) return 'var(--accent)';
  return 'var(--text-2)';
}

// ── Confidence ────────────────────────────────────────────────────────────────

export function confidenceLabel(level: ConfidenceLevel): string {
  return { low: 'Baja', medium: 'Media', high: 'Alta' }[level];
}

export function confidenceColorClass(level: ConfidenceLevel): string {
  return {
    low:    'text-[var(--text-3)]',
    medium: 'text-[var(--accent)]',
    high:   'text-[var(--amber)]',
  }[level];
}

// ── Status ────────────────────────────────────────────────────────────────────

export function statusLabel(status: SignalStatus): string {
  return {
    active:   'Activa',
    fading:   'Fading',
    exploded: 'Viral',
    noise:    'Ruido',
  }[status];
}

export function statusColorClass(status: SignalStatus): string {
  return {
    active:   'text-[var(--accent)]',
    fading:   'text-[var(--fading)]',
    exploded: 'text-[var(--amber)]',
    noise:    'text-[var(--text-3)]',
  }[status];
}

// ── Numbers ───────────────────────────────────────────────────────────────────

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}

export function formatPct(n: number, signed = true): string {
  const prefix = signed && n > 0 ? '+' : '';
  return `${prefix}${n.toFixed(0)}%`;
}

export function formatVelocity(v: number): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(1)}/h`;
}

// ── Time ──────────────────────────────────────────────────────────────────────

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `Hace ${minutes}m`;
  if (hours < 24) return `Hace ${hours}h`;
  return `Hace ${days}d`;
}

// ── Category badge ────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  Gadgets:          'var(--accent)',
  Hogar:            '#8b8cf8',
  Fitness:          '#5bc4a2',
  Tecnología:       '#60a5fa',
  Cocina:           '#f59e0b',
  'Salud y bienestar': '#a78bfa',
  Moda:             '#f472b6',
  Mascotas:         '#fb923c',
  Belleza:          '#e879f9',
  Automotor:        '#94a3b8',
  General:          'var(--text-3)',
};

export function categoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? 'var(--text-3)';
}

// ── Chart data helpers ────────────────────────────────────────────────────────

export interface ChartPoint {
  date: string;
  value: number;
  label: string;
}

export function formatHistoryForChart(
  points: Array<{ date: string; value: number }>
): ChartPoint[] {
  return points.map((p) => ({
    date: p.date,
    value: p.value,
    label: new Date(p.date).toLocaleDateString('es', {
      month: 'short',
      day: 'numeric',
    }),
  }));
}

// ── Clsx utility ──────────────────────────────────────────────────────────────

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
