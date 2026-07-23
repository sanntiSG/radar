'use client';

import type { EvidenceTimelinePoint, Phase, PhaseKind } from '@/lib/types';

const PHASE_STYLE: Record<PhaseKind, { color: string; dot: string }> = {
  detected: { color: 'var(--text-faint)', dot: 'bg-faint' },
  takeoff: { color: 'var(--amber)', dot: 'bg-amber' },
  peak: { color: 'var(--jade-deep)', dot: 'bg-jade-deep' },
  now: { color: 'var(--jade)', dot: 'bg-jade' },
};

/**
 * Timeline anotado: el mismo lenguaje visual de SignalChart, pero con hitos
 * marcados sobre la curva — la prueba visual de que Radar detectó la señal
 * antes de que fuera evidente para el resto del mercado.
 */
export function EvidenceChart({
  timeline,
  phases,
}: {
  timeline: EvidenceTimelinePoint[];
  phases: Phase[];
}) {
  const values = timeline.map((p) => p.value);
  if (values.length < 2) {
    return (
      <div className="flex h-56 items-center justify-center rounded-xl border border-line bg-elev text-sm text-faint">
        Aún no hay histórico suficiente para esta señal.
      </div>
    );
  }

  const W = 640;
  const H = 220;
  const PAD = 14;
  const TOP_PAD = 36; // espacio para etiquetas de fase arriba de la curva
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = (W - PAD * 2) / (values.length - 1);
  const x = (i: number) => PAD + i * step;
  const y = (v: number) => H - PAD - ((v - min) / range) * (H - PAD - TOP_PAD);

  let path = `M ${x(0)} ${y(values[0])}`;
  for (let i = 0; i < values.length - 1; i++) {
    const p0 = values[Math.max(0, i - 1)];
    const p1 = values[i];
    const p2 = values[i + 1];
    const p3 = values[Math.min(values.length - 1, i + 2)];
    const cp1x = x(i) + (step / 6) * 2;
    const cp1y = y(p1) + (y(p2) - y(p0)) / 6;
    const cp2x = x(i + 1) - (step / 6) * 2;
    const cp2y = y(p2) - (y(p3) - y(p1)) / 6;
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x(i + 1)} ${y(p2)}`;
  }
  const area = `${path} L ${x(values.length - 1)} ${H - PAD} L ${x(0)} ${H - PAD} Z`;

  const fmt = (iso: string) =>
    new Date(iso + 'T12:00:00Z').toLocaleDateString('es', { day: 'numeric', month: 'short' });

  return (
    <div className="rounded-xl border border-line bg-elev p-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Timeline anotado de la señal">
        <defs>
          <linearGradient id="evidence-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(78% 0.14 168 / 0.22)" />
            <stop offset="100%" stopColor="oklch(78% 0.14 168 / 0)" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#evidence-fill)" />
        <path d={path} fill="none" stroke="var(--jade)" strokeWidth="2" strokeLinecap="round" />

        {phases.map((phase, i) => {
          const style = PHASE_STYLE[phase.kind];
          const px = x(phase.index);
          const py = y(values[phase.index]);
          // Alterna arriba/abajo para reducir solapes en fases consecutivas.
          const labelAbove = i % 2 === 0;
          return (
            <g key={phase.kind} className="rise-in" style={{ animationDelay: `${i * 90}ms` }}>
              <circle cx={px} cy={py} r="4.5" fill={style.color} />
              <circle cx={px} cy={py} r="9" fill="none" stroke={style.color} strokeWidth="1" opacity="0.35" />
              <text
                x={px}
                y={labelAbove ? py - 14 : py + 22}
                fill={style.color}
                fontSize="10"
                fontFamily="var(--font-mono)"
                textAnchor={phase.index === 0 ? 'start' : phase.index === values.length - 1 ? 'end' : 'middle'}
              >
                {fmt(phase.date)}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Leyenda */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-line pt-3">
        {phases.map((phase) => (
          <div key={phase.kind} className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${PHASE_STYLE[phase.kind].dot}`} />
            <span className="text-[11px] text-faint">{phase.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
