'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import dynamic from 'next/dynamic';
import { Signal, HistoryPoint } from '@/lib/types';
import {
  scoreColor,
  confidenceLabel,
  confidenceColorClass,
  statusLabel,
  statusColorClass,
  formatNumber,
  formatVelocity,
  timeAgo,
} from '@/lib/utils';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { fetchEntityHistory } from '@/lib/api';

// SSR-safe dynamic import for Recharts
const SignalChart = dynamic(
  () => import('./SignalChart').then((m) => ({ default: m.SignalChart })),
  { ssr: false, loading: () => <div style={{ height: 180, background: 'var(--surface)', borderRadius: 8 }} /> }
);

interface SignalDetailProps {
  signal: Signal | null;
}

export function SignalDetail({ signal }: SignalDetailProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Animate panel and score counter on signal change
  useEffect(() => {
    if (!signal || !panelRef.current) return;

    gsap.from(panelRef.current, {
      opacity: 0,
      y: 8,
      duration: 0.35,
      ease: 'power3.out',
    });

    // Counter animation for radar score
    if (scoreRef.current) {
      const target = signal.radarScore;
      const obj = { val: 0 };
      gsap.to(obj, {
        val: target,
        duration: 0.7,
        ease: 'power2.out',
        onUpdate: () => {
          if (scoreRef.current) {
            scoreRef.current.textContent = Math.round(obj.val).toString();
          }
        },
      });
    }
  }, [signal?._id]);

  // Fetch history when signal changes
  useEffect(() => {
    if (!signal) return;
    let cancelled = false;

    setHistoryLoading(true);
    fetchEntityHistory(signal.canonicalName, 7)
      .then((data) => {
        if (!cancelled) {
          setHistory(data);
          setHistoryLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setHistoryLoading(false);
      });

    return () => { cancelled = true; };
  }, [signal?._id]);

  if (!signal) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full text-center px-8"
        style={{ color: 'var(--text-3)' }}
      >
        <svg width="40" height="40" viewBox="0 0 20 20" fill="none" className="mb-4 opacity-30">
          <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1" />
          <circle cx="10" cy="10" r="5.5" stroke="currentColor" strokeWidth="1" />
          <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1" />
          <circle cx="10" cy="10" r="1" fill="currentColor" />
          <line x1="10" y1="10" x2="16.5" y2="3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>
          Selecciona una señal para ver el detalle
        </p>
      </div>
    );
  }

  const scoreCol = scoreColor(signal.radarScore, signal.status);
  const chartColor = signal.status === 'fading' ? 'var(--fading)' : signal.radarScore >= 80 ? 'var(--amber)' : 'var(--accent)';

  return (
    <div ref={panelRef} className="flex flex-col h-full overflow-y-auto">
      {/* Top: Score hero */}
      <div
        className="px-6 pt-6 pb-5"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        {/* Category + status */}
        <div className="flex items-center gap-2 mb-4">
          <CategoryBadge category={signal.category} />
          <span
            className={`text-xs font-medium ${statusColorClass(signal.status)}`}
          >
            {statusLabel(signal.status)}
          </span>
        </div>

        {/* Signal name */}
        <h2
          className="text-lg font-semibold mb-4 leading-tight"
          style={{ color: 'var(--text-1)', maxWidth: '30ch' }}
        >
          {signal.name}
        </h2>

        {/* Score row */}
        <div className="flex items-end gap-5">
          <div>
            <p className="text-label mb-1">Radar Score</p>
            <div className="flex items-baseline gap-1">
              <span
                ref={scoreRef}
                style={{
                  fontFamily: 'Barlow Condensed',
                  fontWeight: 900,
                  fontSize: '3.5rem',
                  color: scoreCol,
                  lineHeight: 1,
                }}
              >
                {signal.radarScore}
              </span>
              <span style={{ color: 'var(--text-3)', fontSize: '1.25rem', fontFamily: 'Barlow Condensed' }}>/100</span>
            </div>
          </div>

          {/* Confidence */}
          <div className="pb-1">
            <p className="text-label mb-1">Confianza</p>
            <span className={`text-sm font-semibold ${confidenceColorClass(signal.confidenceLevel)}`}>
              {confidenceLabel(signal.confidenceLevel)} · {signal.confidenceValue}%
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="px-6 pt-5 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <p className="text-label mb-3">Evolución histórica (7 días)</p>
        <SignalChart history={history} loading={historyLoading} color={chartColor} />
      </div>

      {/* Metrics grid */}
      <div className="px-6 pt-5 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <p className="text-label mb-4">Métricas del motor</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Growth Score', value: signal.growthScore.toFixed(0) },
            { label: 'Velocidad', value: formatVelocity(signal.velocity) },
            { label: 'Aceleración', value: `${signal.acceleration > 0 ? '+' : ''}${signal.acceleration.toFixed(1)}` },
            { label: 'Frecuencia', value: formatNumber(signal.frequency) },
            { label: 'Engagement', value: formatNumber(signal.engagement) },
            { label: 'Momentum', value: signal.momentum.toFixed(0) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg px-3 py-3" style={{ background: 'var(--surface)' }}>
              <p className="text-label mb-1">{label}</p>
              <p
                style={{
                  fontFamily: 'Barlow Condensed',
                  fontWeight: 700,
                  fontSize: '1.25rem',
                  color: 'var(--text-1)',
                  lineHeight: 1.2,
                }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Sources + detected */}
      <div className="px-6 pt-4 pb-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-label">Fuentes</span>
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              {signal.sources.map((s) => (
                <span
                  key={s}
                  className="text-xs px-2 py-0.5 rounded"
                  style={{ background: 'var(--surface-raised)', color: 'var(--text-2)' }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-label">Detectada</span>
            <span className="text-xs" style={{ color: 'var(--text-2)' }}>
              {timeAgo(signal.detectedAt)}
            </span>
          </div>
          {signal.isFromSeed && (
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className="text-xs px-2 py-0.5 rounded"
                style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
              >
                Datos seed
              </span>
              <span className="text-2xs" style={{ color: 'var(--text-3)' }}>
                Se reemplazarán con datos reales al conectar las fuentes
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
