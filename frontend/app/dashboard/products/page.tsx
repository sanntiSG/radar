'use client';

import { api } from '@/lib/api';
import type { Product } from '@/lib/types';
import { GrowthPct, Score } from '@/components/dashboard/ui';
import { ListPage, Row } from '@/components/dashboard/ListPage';
import { relativeDate } from '@/lib/format';

export default function ProductsPage() {
  return (
    <ListPage<Product>
      title="Productos detectados"
      subtitle="Entidades canónicas: cada producto agrupa todas sus variantes de nombre."
      fetcher={(p) => api.products(p)}
      columns={['Producto', 'Score', 'Crecimiento', 'Frecuencia']}
      emptyHint="Ejecuta el seed para cargar productos de ejemplo o el recolector para detectar reales: cd backend && npm run seed"
      actions={
        <a
          href={`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/export/products.csv`}
          download
          className="pressable rounded-full border border-line-strong px-4 py-2 text-sm text-dim transition-colors duration-150 hover:border-jade hover:text-ink"
        >
          Exportar CSV
        </a>
      }
      renderRow={(p) => (
        <Row columns={4}>
          <div className="min-w-0">
            <p className="line-clamp-2 font-medium md:line-clamp-1 md:truncate">{p.name}</p>
            <p className="mt-0.5 truncate text-xs text-faint">
              {p.category}
              {p.aliases.length > 0 && (
                <span> · {p.aliases.length} variantes agrupadas</span>
              )}
              <span> · visto {relativeDate(p.lastSeenAt)}</span>
            </p>
          </div>
          <span className="text-right">
            <Score value={p.radarScore} />
          </span>
          <span className="text-right">
            <GrowthPct value={p.growthPct} />
          </span>
          <span className="text-right font-mono text-sm tabular-nums text-dim">
            {p.frequency}
          </span>
        </Row>
      )}
    />
  );
}
