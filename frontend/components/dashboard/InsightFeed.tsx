'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Insight } from '@/lib/types';

gsap.registerPlugin(ScrollTrigger);

interface InsightFeedProps {
  insights: Insight[];
  loading?: boolean;
}

const INSIGHT_ICONS: Record<string, JSX.Element> = {
  frequency: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M1 10L4 6l3 2 3-4 3 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  radar_score: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" opacity="0.5"/>
      <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="7" cy="7" r="1" fill="currentColor"/>
    </svg>
  ),
  acceleration: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 10l5-7 5 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

export function InsightFeed({ insights, loading }: InsightFeedProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading || !ref.current) return;
    const ctx = gsap.context(() => {
      ScrollTrigger.batch('.insight-item', {
        onEnter: (els) => {
          gsap.from(els, {
            opacity: 0,
            y: 10,
            stagger: 0.08,
            duration: 0.45,
            ease: 'power3.out',
          });
        },
        start: 'top 90%',
        once: true,
      });
    }, ref);
    return () => ctx.revert();
  }, [loading, insights]);

  return (
    <section ref={ref} className="px-6 py-6">
      <div className="flex items-center justify-between mb-5">
        <p className="text-label">Insights Automáticos</p>
        <span
          className="text-xs px-2 py-0.5 rounded"
          style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
        >
          Generados por el motor
        </span>
      </div>

      <div className="space-y-3">
        {loading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-14 rounded-lg"
              style={{ background: 'var(--surface)' }}
            />
          ))}

        {!loading && insights.length === 0 && (
          <div
            className="py-8 text-center rounded-lg"
            style={{ background: 'var(--surface)' }}
          >
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>
              El motor aún no tiene suficientes datos para generar insights.
            </p>
          </div>
        )}

        {!loading &&
          insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
      </div>
    </section>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  const icon = INSIGHT_ICONS[insight.type] ?? INSIGHT_ICONS['frequency'];
  const accentColor =
    insight.type === 'acceleration'
      ? 'var(--amber)'
      : insight.type === 'radar_score'
      ? 'var(--accent)'
      : 'var(--text-2)';

  return (
    <div
      className="insight-item flex items-start gap-3 p-4 rounded-lg transition-colors duration-150"
      style={{ background: 'var(--surface)' }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'var(--surface-raised)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'var(--surface)';
      }}
    >
      {/* Icon */}
      <div
        className="flex items-center justify-center w-7 h-7 rounded-full shrink-0 mt-0.5"
        style={{ background: `color-mix(in oklch, ${accentColor} 15%, transparent)`, color: accentColor }}
      >
        {icon}
      </div>

      {/* Text */}
      <p
        className="text-sm leading-relaxed"
        style={{ color: 'var(--text-2)', lineHeight: 1.6 }}
      >
        {insight.text}
      </p>
    </div>
  );
}
