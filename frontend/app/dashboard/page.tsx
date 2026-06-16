'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Signal, Trend, Hashtag, Insight } from '@/lib/types';
import { fetchSignals } from '@/lib/api';

// Dynamic imports to keep SSR lightweight
const SignalFeed = dynamic(
  () => import('@/components/dashboard/SignalFeed').then((m) => ({ default: m.SignalFeed })),
  { ssr: false }
);
const SignalDetail = dynamic(
  () => import('@/components/dashboard/SignalDetail').then((m) => ({ default: m.SignalDetail })),
  { ssr: false }
);
const StatsBar = dynamic(
  () => import('@/components/dashboard/StatsBar').then((m) => ({ default: m.StatsBar })),
  { ssr: false }
);
const TrendSection = dynamic(
  () => import('@/components/dashboard/TrendSection').then((m) => ({ default: m.TrendSection })),
  { ssr: false }
);
const HashtagSection = dynamic(
  () => import('@/components/dashboard/HashtagSection').then((m) => ({ default: m.HashtagSection })),
  { ssr: false }
);
const InsightFeed = dynamic(
  () => import('@/components/dashboard/InsightFeed').then((m) => ({ default: m.InsightFeed })),
  { ssr: false }
);

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function apiFetch<T>(path: string): Promise<T[]> {
  try {
    const res = await fetch(`${API}${path}`);
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default function DashboardPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);

  // Load all data
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [sig, tr, ht, ins] = await Promise.allSettled([
          apiFetch<Signal>('/api/signals?limit=30'),
          apiFetch<Trend>('/api/trends?limit=20'),
          apiFetch<Hashtag>('/api/hashtags?limit=20'),
          apiFetch<Insight>('/api/insights'),
        ]);

        const signalData = sig.status === 'fulfilled' ? sig.value : [];
        const trendData  = tr.status === 'fulfilled'  ? tr.value  : [];
        const hashData   = ht.status === 'fulfilled'  ? ht.value  : [];
        const insightData = ins.status === 'fulfilled' ? ins.value : [];

        setSignals(signalData);
        setTrends(trendData);
        setHashtags(hashData);
        setInsights(insightData);

        // Auto-select first signal
        if (signalData.length > 0) {
          setSelectedSignal(signalData[0]);
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };

    load();

    // Refresh every 5 minutes
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter signals by category
  const filteredSignals = activeCategory
    ? signals.filter((s) => s.category === activeCategory)
    : signals;

  const handleCategoryChange = useCallback((cat: string | undefined) => {
    setActiveCategory(cat);
    if (cat) {
      const first = signals.find((s) => s.category === cat);
      if (first) setSelectedSignal(first);
    } else {
      setSelectedSignal(signals[0] ?? null);
    }
  }, [signals]);

  return (
    <div className="flex flex-col">
      {/* Stats bar */}
      <StatsBar signals={signals} loading={loading} />

      {/* Main split layout */}
      <div
        className="flex flex-col lg:flex-row"
        style={{
          minHeight: 'calc(100vh - 14rem)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {/* Left: Signal Feed */}
        <div
          className="w-full lg:w-[55%] xl:w-[50%] flex flex-col"
          style={{
            borderRight: '1px solid var(--border)',
            minHeight: '400px',
            maxHeight: 'calc(100vh - 14rem)',
            overflow: 'hidden',
          }}
        >
          <SignalFeed
            signals={filteredSignals}
            loading={loading}
            selectedId={selectedSignal?._id}
            onSelect={setSelectedSignal}
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
          />
        </div>

        {/* Right: Detail Panel */}
        <div
          className="w-full lg:w-[45%] xl:w-[50%]"
          style={{
            position: 'sticky',
            top: 56, // header height
            maxHeight: 'calc(100vh - 56px)',
            overflowY: 'auto',
          }}
        >
          <SignalDetail signal={selectedSignal} />
        </div>
      </div>

      {/* Below fold sections */}
      <div
        className="grid grid-cols-1 lg:grid-cols-2"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        {/* Trends */}
        <div style={{ borderRight: '1px solid var(--border)' }}>
          <TrendSection trends={trends} loading={loading} />
        </div>

        {/* Hashtags */}
        <div>
          <HashtagSection hashtags={hashtags} loading={loading} />
        </div>
      </div>

      {/* Insights full width */}
      <InsightFeed insights={insights} loading={loading} />
    </div>
  );
}
