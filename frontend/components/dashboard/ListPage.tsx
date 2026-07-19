'use client';

import { useEffect, useState } from 'react';
import { Skeleton } from './ui';

const CATEGORIES = [
  'Todas', 'Gadgets', 'Belleza', 'Fitness', 'Mascotas', 'Cocina',
  'Hogar', 'Tecnología', 'Moda', 'Automotor', 'Salud y bienestar', 'General',
];

interface ListPageProps<T> {
  title: string;
  subtitle: string;
  fetcher: (params: string) => Promise<{ items: T[] }>;
  /** Cabeceras de columna; la primera es el nombre y ocupa el espacio flexible. */
  columns: string[];
  renderRow: (item: T, index: number) => React.ReactNode;
  emptyHint: string;
  filterByCategory?: boolean;
  /** Acciones extra en el encabezado (ej. botón de exportar). */
  actions?: React.ReactNode;
}

export function ListPage<T>({
  title,
  subtitle,
  fetcher,
  columns,
  renderRow,
  emptyHint,
  filterByCategory = true,
  actions,
}: ListPageProps<T>) {
  const [items, setItems] = useState<T[] | null>(null);
  const [category, setCategory] = useState('Todas');
  const [error, setError] = useState(false);

  useEffect(() => {
    setItems(null);
    setError(false);
    const params = category !== 'Todas' ? `&category=${encodeURIComponent(category)}` : '';
    fetcher(params)
      .then((r) => setItems(r.items))
      .catch(() => setError(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <header className="border-b border-line pb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
            <p className="mt-1 text-sm text-dim">{subtitle}</p>
          </div>
          {actions}
        </div>

        {filterByCategory && (
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`pressable whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs transition-colors duration-150 ${
                  category === cat
                    ? 'bg-jade font-medium text-[oklch(18%_0.02_165)]'
                    : 'bg-elev text-dim hover:bg-soft hover:text-ink'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </header>

      {error ? (
        <div className="mt-6 rounded-xl border border-line bg-elev p-8 text-center text-sm text-dim">
          No se pudo conectar con la API. Verifica que el backend esté corriendo.
        </div>
      ) : !items ? (
        <div className="mt-6 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-6 rounded-xl border border-line bg-elev p-10 text-center">
          <p className="font-display text-lg font-bold">Nada por aquí todavía</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-dim">{emptyHint}</p>
        </div>
      ) : (
        <div className="mt-2">
          <div
            className="hidden gap-4 px-3 py-3 text-xs font-medium text-faint md:grid"
            style={{ gridTemplateColumns: `1fr repeat(${columns.length - 1}, minmax(90px, auto))` }}
          >
            {columns.map((col) => (
              <span key={col} className={col === columns[0] ? '' : 'text-right'}>
                {col}
              </span>
            ))}
          </div>
          <ul className="divide-y divide-[var(--border)]">
            {items.map((item, i) => (
              <li key={i} className="rise-in" style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}>
                {renderRow(item, i)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function Row({
  children,
  columns,
}: {
  children: React.ReactNode;
  columns: number;
}) {
  return (
    <div
      className="grid items-center gap-4 px-3 py-3.5 transition-colors duration-150 hover:bg-elev md:grid-flow-col"
      style={{ gridTemplateColumns: `1fr repeat(${columns - 1}, minmax(90px, auto))` }}
    >
      {children}
    </div>
  );
}
