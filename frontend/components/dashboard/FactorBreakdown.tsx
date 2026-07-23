import type { SignalFactor } from '@/lib/types';

/**
 * Desglose de los factores que componen el Radar Score — la prueba de que
 * el número no es una caja negra. Se reutiliza en el panel de detalle del
 * dashboard y en el Centro de Evidencias.
 */
export function FactorBreakdown({
  factors,
  title = 'Por qué existe esta señal',
}: {
  factors: SignalFactor[];
  title?: string;
}) {
  if (!factors || factors.length === 0) return null;

  return (
    <div>
      {title && <p className="mb-3 text-xs font-medium text-faint">{title}</p>}
      <ul className="space-y-2.5">
        {factors.map((factor, i) => (
          <li key={factor.key}>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="text-xs font-medium text-ink">{factor.label}</span>
              <div className="flex shrink-0 items-center gap-1.5">
                {factor.weight !== null && (
                  <span className="rounded bg-soft px-1 py-0.5 font-mono text-[10px] text-faint">
                    {factor.weight}%
                  </span>
                )}
                <span className="font-mono text-xs tabular-nums text-dim">
                  {factor.contribution}
                </span>
              </div>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-soft">
              <div
                className="h-full rounded-full bg-jade transition-all"
                style={{
                  width: `${factor.contribution}%`,
                  transitionDelay: `${i * 60}ms`,
                  transitionDuration: '600ms',
                  transitionTimingFunction: 'cubic-bezier(0.23,1,0.32,1)',
                }}
              />
            </div>
            <p className="mt-0.5 text-[11px] leading-relaxed text-faint">{factor.detail}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
