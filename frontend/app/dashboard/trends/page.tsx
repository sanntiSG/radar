'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Trend } from '@/lib/types';

const TrendSection = dynamic(
  () => import('@/components/dashboard/TrendSection').then((m) => ({ default: m.TrendSection })),
  { ssr: false }
);

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function TrendsPage() {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/trends?limit=50`)
      .then((r) => r.json())
      .then((j) => { setTrends(j.data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-[900px] mx-auto px-6 py-8">
      <div className="mb-8">
        <h1
          className="mb-2"
          style={{ fontFamily: 'Barlow Condensed', fontWeight: 900, fontSize: '2.5rem', color: 'var(--text-1)', letterSpacing: '-0.02em' }}
        >
          Tendencias Emergentes
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-2)' }}>
          Tendencias detectadas por el motor ordenadas por variación y score.
        </p>
      </div>
      <div style={{ background: 'var(--surface)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
        <TrendSection trends={trends} loading={loading} />
      </div>
    </div>
  );
}
