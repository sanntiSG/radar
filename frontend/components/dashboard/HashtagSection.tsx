'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Hashtag } from '@/lib/types';
import { formatPct, formatNumber } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger);

interface HashtagSectionProps {
  hashtags: Hashtag[];
  loading?: boolean;
}

export function HashtagSection({ hashtags, loading }: HashtagSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading || !sectionRef.current) return;
    const ctx = gsap.context(() => {
      ScrollTrigger.batch('.hashtag-chip', {
        onEnter: (els) => {
          gsap.from(els, {
            opacity: 0,
            scale: 0.9,
            y: 8,
            stagger: 0.05,
            duration: 0.4,
            ease: 'power3.out',
          });
        },
        start: 'top 90%',
        once: true,
      });
    }, sectionRef);
    return () => ctx.revert();
  }, [loading, hashtags]);

  return (
    <section ref={sectionRef} className="px-6 py-6" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-label">Hashtags en Crecimiento</p>
        <span className="text-xs" style={{ color: 'var(--text-3)' }}>
          {loading ? '—' : `${hashtags.length} hashtags`}
        </span>
      </div>

      {loading ? (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-8 rounded-full"
              style={{
                width: `${80 + Math.random() * 60}px`,
                background: 'var(--surface)',
                animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
              }}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {hashtags.map((ht, i) => (
            <HashtagChip key={ht._id} hashtag={ht} rank={i} />
          ))}
        </div>
      )}
    </section>
  );
}

function HashtagChip({ hashtag, rank }: { hashtag: Hashtag; rank: number }) {
  // Color based on momentum
  const intensity = Math.min(1, hashtag.momentum / 100);
  const color = rank < 3
    ? 'var(--amber)'
    : rank < 6
    ? 'var(--accent)'
    : 'var(--text-2)';

  return (
    <div
      className="hashtag-chip flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-150 cursor-default"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)';
        (e.currentTarget as HTMLElement).style.background = 'var(--surface-raised)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
        (e.currentTarget as HTMLElement).style.background = 'var(--surface)';
      }}
    >
      {/* Tag */}
      <span className="text-sm font-medium" style={{ color }}>
        {hashtag.tag}
      </span>

      {/* Growth */}
      <span
        className="text-xs font-semibold tabular-nums"
        style={{ color: 'var(--accent)' }}
      >
        {formatPct(hashtag.growth)}
      </span>

      {/* Momentum bar */}
      <div
        className="rounded-full overflow-hidden"
        style={{ width: 32, height: 3, background: 'var(--border)' }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(100, hashtag.momentum)}%`,
            background: color,
            transition: 'width 800ms var(--ease-out-expo)',
          }}
        />
      </div>
    </div>
  );
}
