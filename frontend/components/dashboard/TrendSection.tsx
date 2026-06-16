'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Trend } from '@/lib/types';
import { formatPct, formatNumber, categoryColor } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger);

interface TrendSectionProps {
  trends: Trend[];
  loading?: boolean;
}

export function TrendSection({ trends, loading }: TrendSectionProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading || !ref.current) return;
    const ctx = gsap.context(() => {
      ScrollTrigger.batch('.trend-row', {
        onEnter: (els) => {
          gsap.from(els, {
            opacity: 0,
            x: -12,
            stagger: 0.06,
            duration: 0.45,
            ease: 'power3.out',
          });
        },
        start: 'top 88%',
        once: true,
      });
    }, ref);
    return () => ctx.revert();
  }, [loading, trends]);

  return (
    <section ref={ref} className="px-6 py-6" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-5">
        <p className="text-label">Tendencias Emergentes</p>
        <span className="text-xs" style={{ color: 'var(--text-3)' }}>
          {loading ? '—' : `${trends.length} tendencias`}
        </span>
      </div>

      <div className="space-y-0" style={{ borderTop: '1px solid var(--border)' }}>
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 py-3.5"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <div className="h-3 rounded flex-1" style={{ background: 'var(--surface)' }} />
                <div className="h-3 rounded w-12" style={{ background: 'var(--surface)' }} />
              </div>
            ))
          : trends.slice(0, 10).map((trend, i) => (
              <TrendRow key={trend._id} trend={trend} rank={i} />
            ))}
      </div>
    </section>
  );
}

function TrendRow({ trend, rank }: { trend: Trend; rank: number }) {
  const catColor = categoryColor(trend.category);
  const isPositive = trend.variationPct > 0;

  return (
    <div
      className="trend-row flex items-center gap-4 py-3.5 cursor-default group"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      {/* Rank */}
      <span
        style={{
          fontFamily: 'Barlow Condensed',
          fontWeight: 600,
          fontSize: '0.7rem',
          color: 'var(--text-3)',
          width: 20,
          textAlign: 'right',
          flexShrink: 0,
        }}
      >
        {String(rank + 1).padStart(2, '0')}
      </span>

      {/* Name + category */}
      <div className="flex-1 min-w-0">
        <span
          className="text-sm font-medium group-hover:text-white transition-colors duration-150"
          style={{ color: 'var(--text-1)' }}
        >
          {trend.name}
        </span>
      </div>

      {/* Category dot */}
      <span
        className="text-xs shrink-0"
        style={{ color: catColor, opacity: 0.8 }}
      >
        {trend.category}
      </span>

      {/* Frequency */}
      <span
        className="text-xs tabular-nums shrink-0"
        style={{ color: 'var(--text-3)', width: 40, textAlign: 'right' }}
      >
        {formatNumber(trend.frequency)}
      </span>

      {/* Variation */}
      <span
        className="text-xs font-semibold tabular-nums shrink-0"
        style={{
          color: isPositive ? 'var(--accent)' : 'var(--fading)',
          width: 52,
          textAlign: 'right',
        }}
      >
        {formatPct(trend.variationPct)}
      </span>

      {/* Interest bar */}
      <div
        className="rounded-full overflow-hidden shrink-0"
        style={{ width: 60, height: 3, background: 'var(--border)' }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(100, trend.interestLevel)}%`,
            background: catColor,
          }}
        />
      </div>
    </div>
  );
}
