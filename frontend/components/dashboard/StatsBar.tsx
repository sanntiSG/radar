'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Signal } from '@/lib/types';
import { formatNumber } from '@/lib/utils';

interface StatsBarProps {
  signals: Signal[];
  loading?: boolean;
}

export function StatsBar({ signals, loading }: StatsBarProps) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading || !barRef.current) return;
    gsap.from(barRef.current.querySelectorAll('.stat-item'), {
      opacity: 0,
      y: -6,
      stagger: 0.06,
      duration: 0.4,
      ease: 'power3.out',
      delay: 0.2,
    });
  }, [loading]);

  const activeCount = signals.filter((s) => s.status === 'active').length;
  const avgScore =
    signals.length > 0
      ? Math.round(signals.reduce((s, sig) => s + sig.radarScore, 0) / signals.length)
      : 0;
  const totalEngagement = signals.reduce((s, sig) => s + sig.engagement, 0);
  const highConfidence = signals.filter((s) => s.confidenceLevel === 'high').length;

  const stats = [
    { label: 'Señales Activas', value: loading ? '—' : String(activeCount) },
    { label: 'Score Promedio', value: loading ? '—' : String(avgScore) },
    { label: 'Engagement Total', value: loading ? '—' : formatNumber(totalEngagement) },
    { label: 'Alta Confianza', value: loading ? '—' : String(highConfidence) },
  ];

  return (
    <div
      ref={barRef}
      className="grid grid-cols-2 md:grid-cols-4"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className="stat-item px-6 py-4"
          style={{
            borderRight: i < stats.length - 1 ? '1px solid var(--border)' : 'none',
          }}
        >
          <p className="text-label mb-1">{stat.label}</p>
          <p
            style={{
              fontFamily: 'Barlow Condensed',
              fontWeight: 700,
              fontSize: '1.75rem',
              color: 'var(--text-1)',
              lineHeight: 1,
            }}
          >
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
