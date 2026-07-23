'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

/**
 * Widget compacto de transparencia: "Precisión histórica: X%". Enlaza a la
 * página completa de Transparencia. Se apoya en /api/accuracy (backtest
 * sobre el histórico propio) — nunca inventa el número.
 */
export function AccuracyBadge({ className = '' }: { className?: string }) {
  const [pct, setPct] = useState<number | null>(null);
  const [n, setN] = useState(0);

  useEffect(() => {
    api
      .accuracy()
      .then((data) => {
        setPct(data.overall.continuedGrowingPct);
        setN(data.overall.predictionsEvaluated);
      })
      .catch(() => undefined);
  }, []);

  if (pct === null || n === 0) return null;

  return (
    <Link
      href="/dashboard/transparencia"
      title="Ver el Índice de Precisión completo"
      className={`pressable group flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs transition-colors duration-150 hover:border-jade/50 ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-jade" />
      <span className="text-faint">Precisión histórica</span>
      <span className="font-mono font-semibold text-ink group-hover:text-jade">{pct}%</span>
    </Link>
  );
}
