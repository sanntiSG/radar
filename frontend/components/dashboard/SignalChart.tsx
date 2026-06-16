'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { HistoryPoint } from '@/lib/types';
import { formatHistoryForChart } from '@/lib/utils';

interface SignalChartProps {
  history: HistoryPoint[];
  loading?: boolean;
  color?: string;
}

// Custom tooltip
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 rounded-lg text-xs"
      style={{
        background: 'var(--surface-raised)',
        border: '1px solid var(--border-strong)',
        color: 'var(--text-1)',
        boxShadow: '0 4px 12px oklch(0 0 0 / 0.4)',
      }}
    >
      <div style={{ color: 'var(--text-3)', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: '1rem' }}>
        {payload[0]?.value}
      </div>
    </div>
  );
}

export function SignalChart({ history, loading, color = 'var(--accent)' }: SignalChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    // Re-trigger animation when data changes
    setAnimated(false);
    const t = setTimeout(() => setAnimated(true), 50);
    return () => clearTimeout(t);
  }, [history]);

  if (loading) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ height: 180, background: 'var(--surface)' }}
      >
        <span className="text-xs" style={{ color: 'var(--text-3)' }}>Cargando histórico…</span>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2"
        style={{ height: 180, background: 'var(--surface)', borderRadius: '8px' }}
      >
        <span className="text-xs" style={{ color: 'var(--text-3)' }}>Sin datos históricos aún</span>
        <span className="text-2xs" style={{ color: 'var(--text-3)', opacity: 0.6 }}>
          Los snapshots se acumulan cada 2h
        </span>
      </div>
    );
  }

  const chartData = formatHistoryForChart(history);
  const values = chartData.map((d) => d.value);
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  const max = Math.max(...values);
  const min = Math.min(...values);
  // Pad domain
  const yMin = Math.max(0, min * 0.85);
  const yMax = max * 1.15;

  return (
    <div ref={chartRef} style={{ width: '100%', height: 180 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--text-3)', fontSize: 10, fontFamily: 'Barlow' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[yMin, yMax]}
            tick={{ fill: 'var(--text-3)', fontSize: 10, fontFamily: 'Barlow Condensed' }}
            axisLine={false}
            tickLine={false}
            width={40}
            tickFormatter={(v) => String(Math.round(v))}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1 }} />
          <ReferenceLine
            y={avg}
            stroke="var(--border-strong)"
            strokeDasharray="3 3"
            strokeWidth={1}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{
              r: 4,
              fill: color,
              stroke: 'var(--bg)',
              strokeWidth: 2,
            }}
            isAnimationActive={animated}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
