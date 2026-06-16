'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Signal } from '@/lib/types';
import { scoreColor, statusLabel, statusColorClass, timeAgo, formatNumber, cn } from '@/lib/utils';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { SignalRowSkeleton } from '@/components/ui/Skeleton';

interface SignalFeedProps {
  signals: Signal[];
  loading?: boolean;
  selectedId?: string;
  onSelect: (signal: Signal) => void;
  activeCategory?: string;
  onCategoryChange?: (cat: string | undefined) => void;
}

const CATEGORIES = ['Gadgets', 'Hogar', 'Fitness', 'Tecnología', 'Cocina', 'Salud y bienestar'];

export function SignalFeed({
  signals,
  loading,
  selectedId,
  onSelect,
  activeCategory,
  onCategoryChange,
}: SignalFeedProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Stagger on mount / signals change
  useEffect(() => {
    if (loading || signals.length === 0) return;
    const ctx = gsap.context(() => {
      gsap.from('.signal-row-item', {
        opacity: 0,
        y: 10,
        stagger: 0.04,
        duration: 0.45,
        ease: 'power3.out',
      });
    }, listRef);
    return () => ctx.revert();
  }, [signals, loading]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Section Header */}
      <div className="px-5 pt-6 pb-4 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <p className="text-label">Señales Detectadas</p>
          <span className="text-xs" style={{ color: 'var(--text-3)' }}>
            {loading ? '—' : `${signals.length} señales`}
          </span>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => onCategoryChange?.(undefined)}
            className="px-2.5 py-1 rounded text-xs font-medium transition-colors duration-150"
            style={{
              background: !activeCategory ? 'var(--surface-raised)' : 'transparent',
              color: !activeCategory ? 'var(--text-1)' : 'var(--text-3)',
              border: `1px solid ${!activeCategory ? 'var(--border-strong)' : 'transparent'}`,
            }}
          >
            Todas
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange?.(cat === activeCategory ? undefined : cat)}
              className="px-2.5 py-1 rounded text-xs font-medium transition-colors duration-150"
              style={{
                background: activeCategory === cat ? 'var(--surface-raised)' : 'transparent',
                color: activeCategory === cat ? 'var(--text-1)' : 'var(--text-3)',
                border: `1px solid ${activeCategory === cat ? 'var(--border-strong)' : 'transparent'}`,
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto min-h-0"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        {loading && (
          <>
            {Array.from({ length: 8 }).map((_, i) => (
              <SignalRowSkeleton key={i} />
            ))}
          </>
        )}

        {!loading && signals.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-16 px-5 text-center">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
              style={{ background: 'var(--surface)' }}
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" opacity="0.4">
                <circle cx="10" cy="10" r="8" stroke="var(--text-2)" strokeWidth="1.2"/>
                <line x1="10" y1="6" x2="10" y2="11" stroke="var(--text-2)" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="10" cy="13.5" r="0.8" fill="var(--text-2)"/>
              </svg>
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-2)' }}>
              Sin señales detectadas
            </p>
            <p className="text-xs" style={{ color: 'var(--text-3)', maxWidth: '28ch' }}>
              El motor está procesando datos. Vuelve en unos minutos.
            </p>
          </div>
        )}

        {!loading && signals.map((signal, i) => (
          <SignalRow
            key={signal._id}
            signal={signal}
            index={i}
            isActive={signal._id === selectedId}
            onClick={() => onSelect(signal)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Signal Row ────────────────────────────────────────────────────────────────

function SignalRow({
  signal,
  index,
  isActive,
  onClick,
}: {
  signal: Signal;
  index: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const scoreCol = scoreColor(signal.radarScore, signal.status);
  const acceleration = signal.acceleration;

  return (
    <div
      className={cn('signal-row signal-row-item', isActive && 'active')}
      onClick={onClick}
      style={{
        borderBottom: '1px solid var(--border)',
        animationDelay: `${index * 40}ms`,
        background: isActive ? 'var(--surface)' : 'transparent',
      }}
    >
      <div className="flex items-center gap-3 px-5 py-4">
        {/* Rank */}
        <span
          className="shrink-0 tabular-nums"
          style={{
            fontFamily: 'Barlow Condensed',
            fontWeight: 600,
            fontSize: '0.7rem',
            color: 'var(--text-3)',
            width: '18px',
            textAlign: 'right',
          }}
        >
          {String(index + 1).padStart(2, '0')}
        </span>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="text-sm font-medium clip-text"
              style={{ color: 'var(--text-1)' }}
            >
              {signal.name}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <CategoryBadge category={signal.category} size="xs" />
            <span
              className="text-xs"
              style={{ color: signal.status === 'active' ? 'var(--accent)' : 'var(--fading)' }}
            >
              {statusLabel(signal.status)}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>
              {timeAgo(signal.detectedAt)}
            </span>
          </div>
        </div>

        {/* Score + acceleration */}
        <div className="flex flex-col items-end shrink-0 gap-0.5">
          <span
            style={{
              fontFamily: 'Barlow Condensed',
              fontWeight: 700,
              fontSize: '1.4rem',
              color: scoreCol,
              lineHeight: 1,
            }}
          >
            {signal.radarScore}
          </span>
          <span
            className="text-2xs tabular-nums"
            style={{
              color: acceleration > 0 ? 'var(--accent)' : acceleration < 0 ? 'var(--fading)' : 'var(--text-3)',
            }}
          >
            {acceleration > 0 ? '▲' : acceleration < 0 ? '▼' : '—'}{' '}
            {Math.abs(acceleration).toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
}
