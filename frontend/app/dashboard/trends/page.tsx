'use client';

import { api } from '@/lib/api';
import type { Trend } from '@/lib/types';
import { GrowthPct } from '@/components/dashboard/ui';
import { ListPage, Row } from '@/components/dashboard/ListPage';

export default function TrendsPage() {
  return (
    <ListPage<Trend>
      title="Tendencias emergentes"
      subtitle="Interés de búsqueda y variación reciente, vía Google Trends."
      fetcher={(p) => api.trends(p)}
      columns={['Tendencia', 'Variación', 'Interés', 'Momentum']}
      emptyHint="Ejecuta el backfill para traer 14 días de interés real desde Google Trends: cd backend && npm run backfill"
      renderRow={(t) => (
        <Row columns={4}>
          <div className="min-w-0">
            <p className="truncate font-medium">{t.name}</p>
            <p className="mt-0.5 text-xs text-faint">{t.category}</p>
          </div>
          <span className="text-right">
            <GrowthPct value={t.changePct} />
          </span>
          <div className="flex items-center justify-end gap-2">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-soft">
              <div
                className="h-full rounded-full bg-jade transition-[width] duration-500 ease-out"
                style={{ width: `${Math.min(100, t.interestLevel)}%` }}
              />
            </div>
            <span className="w-8 text-right font-mono text-sm tabular-nums text-dim">
              {Math.round(t.interestLevel)}
            </span>
          </div>
          <span className="text-right font-mono text-sm tabular-nums text-dim">
            {Math.round(t.momentum)}
          </span>
        </Row>
      )}
    />
  );
}
