'use client';

import { api } from '@/lib/api';
import type { Hashtag } from '@/lib/types';
import { GrowthPct } from '@/components/dashboard/ui';
import { ListPage, Row } from '@/components/dashboard/ListPage';

export default function HashtagsPage() {
  return (
    <ListPage<Hashtag>
      title="Hashtags en crecimiento"
      subtitle="Frecuencia y momentum de hashtags detectados en las fuentes."
      fetcher={(p) => api.hashtags(p)}
      columns={['Hashtag', 'Crecimiento', 'Frecuencia', 'Momentum']}
      emptyHint="Ejecuta el seed o espera a que el pipeline de recolección encuentre hashtags: cd backend && npm run seed"
      renderRow={(h) => (
        <Row columns={4}>
          <div className="min-w-0">
            <p className="truncate font-medium text-jade">{h.tag}</p>
            <p className="mt-0.5 text-xs text-faint">{h.category}</p>
          </div>
          <span className="text-right">
            <GrowthPct value={h.growthPct} />
          </span>
          <span className="text-right font-mono text-sm tabular-nums text-dim">
            {h.frequency}
          </span>
          <div className="flex items-center justify-end gap-2">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-soft">
              <div
                className="h-full rounded-full bg-jade transition-[width] duration-500 ease-out"
                style={{ width: `${Math.min(100, h.momentum)}%` }}
              />
            </div>
            <span className="w-8 text-right font-mono text-sm tabular-nums text-dim">
              {Math.round(h.momentum)}
            </span>
          </div>
        </Row>
      )}
    />
  );
}
