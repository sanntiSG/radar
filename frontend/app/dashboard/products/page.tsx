'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Product } from '@/lib/types';
import { categoryColor, formatNumber, formatPct, scoreColor } from '@/lib/utils';
import { CategoryBadge } from '@/components/ui/CategoryBadge';

gsap.registerPlugin(ScrollTrigger);

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API}/api/products?limit=50`)
      .then((r) => r.json())
      .then((j) => {
        setProducts(j.data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading || !gridRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from('.product-card', {
        opacity: 0,
        y: 16,
        stagger: 0.06,
        duration: 0.5,
        ease: 'power3.out',
      });
    }, gridRef);
    return () => ctx.revert();
  }, [loading]);

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <div className="mb-8">
        <h1
          className="mb-2"
          style={{ fontFamily: 'Barlow Condensed', fontWeight: 900, fontSize: '2.5rem', color: 'var(--text-1)', letterSpacing: '-0.02em' }}
        >
          Productos Detectados
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-2)' }}>
          Productos con mayor frecuencia de mención y Radar Score calculado.
        </p>
      </div>

      <div
        ref={gridRef}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {loading &&
          Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="h-36 rounded-xl"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            />
          ))}

        {!loading && products.length === 0 && (
          <div className="col-span-full py-16 text-center" style={{ color: 'var(--text-3)' }}>
            <p className="text-sm">No hay productos detectados aún.</p>
            <p className="text-xs mt-1">Ejecuta el seed o espera que el motor procese menciones.</p>
          </div>
        )}

        {!loading &&
          products.map((product, i) => {
            const catColor = categoryColor(product.category);
            const sColor = scoreColor(product.radarScore, 'active');
            return (
              <div
                key={product._id}
                className="product-card rounded-xl p-5 transition-colors duration-150"
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
                {/* Rank + Category */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    style={{
                      fontFamily: 'Barlow Condensed',
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      color: 'var(--text-3)',
                    }}
                  >
                    #{String(i + 1).padStart(2, '0')}
                  </span>
                  <CategoryBadge category={product.category} size="xs" />
                </div>

                {/* Name */}
                <h3
                  className="text-sm font-semibold mb-4 leading-tight"
                  style={{ color: 'var(--text-1)' }}
                >
                  {product.name}
                </h3>

                {/* Metrics row */}
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-label mb-1">Frecuencia</p>
                    <p style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-1)' }}>
                      {formatNumber(product.frequency)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-label mb-1">Growth</p>
                    <p style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: '1.25rem', color: 'var(--accent)' }}>
                      {formatPct(product.growth)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-label mb-1">Score</p>
                    <p
                      style={{
                        fontFamily: 'Barlow Condensed',
                        fontWeight: 700,
                        fontSize: '1.5rem',
                        color: sColor,
                        lineHeight: 1,
                      }}
                    >
                      {product.radarScore}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
