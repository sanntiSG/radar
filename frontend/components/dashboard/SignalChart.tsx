'use client';

import type { HistoryPoint } from '@/lib/types';

/**
 * Gráfico de evolución: línea suavizada + área, sin ejes ruidosos.
 * El punto final se marca con un blip — el lenguaje visual del radar.
 */
export function SignalChart({
  points,
  metric = 'mentions',
}: {
  points: HistoryPoint[];
  metric?: 'mentions' | 'interest';
}) {
  const values = points.map((p) => (metric === 'interest' ? p.interest : p.mentions));
  if (values.length < 2) {
    return (
      <div className="flex h-44 items-center justify-center rounded-xl border border-line bg-elev text-sm text-faint">
        Aún no hay histórico suficiente para esta señal.
      </div>
    );
  }

  const W = 560;
  const H = 176;
  const PAD = 12;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = (W - PAD * 2) / (values.length - 1);
  const x = (i: number) => PAD + i * step;
  const y = (v: number) => H - PAD - ((v - min) / range) * (H - PAD * 2 - 16);

  // Curva Catmull-Rom → Bézier para suavizado natural
  let path = `M ${x(0)} ${y(values[0])}`;
  for (let i = 0; i < values.length - 1; i++) {
    const p0 = values[Math.max(0, i - 1)];
    const p1 = values[i];
    const p2 = values[i + 1];
    const p3 = values[Math.min(values.length - 1, i + 2)];
    const cp1x = x(i) + step / 6 * 2;
    const cp1y = y(p1) + (y(p2) - y(p0)) / 6;
    const cp2x = x(i + 1) - step / 6 * 2;
    const cp2y = y(p2) - (y(p3) - y(p1)) / 6;
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x(i + 1)} ${y(p2)}`;
  }
  const area = `${path} L ${x(values.length - 1)} ${H - PAD} L ${x(0)} ${H - PAD} Z`;

  const lastX = x(values.length - 1);
  const lastY = y(values[values.length - 1]);
  const firstDate = new Date(points[0].date);
  const lastDate = new Date(points[points.length - 1].date);
  const fmt = (d: Date) => d.toLocaleDateString('es', { day: 'numeric', month: 'short' });

  return (
    <div className="rounded-xl border border-line bg-elev p-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Evolución histórica">
        <defs>
          <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(78% 0.14 168 / 0.25)" />
            <stop offset="100%" stopColor="oklch(78% 0.14 168 / 0)" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#chart-fill)" />
        <path d={path} fill="none" stroke="var(--jade)" strokeWidth="2" strokeLinecap="round" />
        <circle cx={lastX} cy={lastY} r="4" fill="var(--jade)" />
        <circle cx={lastX} cy={lastY} r="8" fill="none" stroke="var(--jade)" strokeWidth="1" opacity="0.4" />
        <text x={PAD} y={H - 2} fill="var(--text-faint)" fontSize="10">{fmt(firstDate)}</text>
        <text x={W - PAD} y={H - 2} fill="var(--text-faint)" fontSize="10" textAnchor="end">{fmt(lastDate)}</text>
        <text x={lastX - 12} y={lastY - 10} fill="var(--text)" fontSize="12" fontFamily="var(--font-mono)" textAnchor="end">
          {values[values.length - 1]}
        </text>
      </svg>
    </div>
  );
}
