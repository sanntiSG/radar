'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth';
import type { RadarLevel } from '@/lib/types';

/** Badge discreto de nivel — junto al avatar del perfil. No es un juego, es una señal de progreso real. */
export function LevelBadge({ className = '' }: { className?: string }) {
  const [level, setLevel] = useState<RadarLevel | null>(null);

  useEffect(() => {
    authFetch('/api/achievements')
      .then((data: any) => setLevel(data.level ?? null))
      .catch(() => undefined);
  }, []);

  if (!level) return null;

  return (
    <span
      title={level.nextAt ? `${level.points} pts · faltan ${level.nextAt - level.points} para el siguiente nivel` : `${level.points} pts · nivel máximo`}
      className={`inline-flex items-center gap-1 rounded-full border border-jade/30 bg-jade/10 px-2 py-0.5 text-[11px] font-medium text-jade ${className}`}
    >
      {level.title}
    </span>
  );
}
