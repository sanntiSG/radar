'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Hashtag } from '@/lib/types';

const HashtagSection = dynamic(
  () => import('@/components/dashboard/HashtagSection').then((m) => ({ default: m.HashtagSection })),
  { ssr: false }
);

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function HashtagsPage() {
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/hashtags?limit=50`)
      .then((r) => r.json())
      .then((j) => { setHashtags(j.data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-[900px] mx-auto px-6 py-8">
      <div className="mb-8">
        <h1
          className="mb-2"
          style={{ fontFamily: 'Barlow Condensed', fontWeight: 900, fontSize: '2.5rem', color: 'var(--text-1)', letterSpacing: '-0.02em' }}
        >
          Hashtags en Crecimiento
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-2)' }}>
          Hashtags detectados con mayor aceleración de frecuencia y momentum.
        </p>
      </div>
      <div style={{ background: 'var(--surface)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
        <HashtagSection hashtags={hashtags} loading={loading} />
      </div>
    </div>
  );
}
