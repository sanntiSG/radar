'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth';
import type { Achievement, RadarLevel } from '@/lib/types';

interface Props {
  className?: string;
}

export function AchievementStrip({ className = '' }: Props) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [level, setLevel] = useState<RadarLevel | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    authFetch('/api/achievements')
      .then((data: any) => {
        setAchievements(data.achievements ?? []);
        setLevel(data.level ?? null);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded || achievements.length === 0) return null;

  const unlocked = achievements.filter((a) => a.unlocked);
  const locked = achievements.filter((a) => !a.unlocked);

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-sm font-bold text-dim">
          Logros{' '}
          <span className="ml-1 font-body text-xs font-normal text-faint">
            {unlocked.length}/{achievements.length}
          </span>
        </h3>
        {level && (
          <span className="text-xs text-faint">
            Nivel <span className="font-medium text-jade">{level.title}</span> · {level.points} pts
          </span>
        )}
      </div>
      {level && level.nextAt !== null && (
        <div className="mt-2">
          <div className="h-1 w-full overflow-hidden rounded-full bg-soft">
            <div
              className="h-full rounded-full bg-jade/60 transition-all duration-500"
              style={{ width: `${level.progress}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-faint">
            {level.nextAt - level.points} pts para el siguiente nivel
          </p>
        </div>
      )}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {[...unlocked, ...locked].map((a) => (
          <div
            key={a.key}
            title={a.description}
            className={`flex items-start gap-2.5 rounded-xl border p-3 transition-opacity duration-150 ${
              a.unlocked
                ? 'border-jade/30 bg-jade/5'
                : 'border-line bg-elev/30 opacity-50'
            }`}
          >
            <span className="mt-0.5 shrink-0 text-base leading-none" aria-hidden>
              {a.icon}
            </span>
            <div className="min-w-0">
              <p className={`truncate text-xs font-semibold ${a.unlocked ? 'text-ink' : 'text-faint'}`}>
                {a.title}
              </p>
              <p className="mt-0.5 line-clamp-2 text-[11px] leading-tight text-faint">
                {a.description}
              </p>
              {!a.unlocked && a.progress > 0 && (
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-soft">
                  <div
                    className="h-full rounded-full bg-jade/40 transition-all duration-500"
                    style={{ width: `${a.progress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
