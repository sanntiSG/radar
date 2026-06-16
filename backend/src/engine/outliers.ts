/**
 * Outlier Detection — Detecta anomalías estadísticas.
 * Implementa Z-Score, IQR y percentiles.
 */

export interface OutlierResult {
  isOutlier: boolean;
  zScore: number;
  method: 'zscore' | 'iqr';
  severity: 'none' | 'mild' | 'strong' | 'extreme';
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function stdDev(values: number[], avg?: number): number {
  if (values.length < 2) return 0;
  const m = avg ?? mean(values);
  const variance = values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (index - lower) * (sorted[upper] - sorted[lower]);
}

// ── Z-Score ───────────────────────────────────────────────────────────────────

/**
 * Calcula el Z-Score de un valor dentro de una distribución.
 * Z > 2 = outlier moderado, Z > 3 = outlier fuerte.
 */
export function zScore(value: number, values: number[]): number {
  const m = mean(values);
  const s = stdDev(values, m);
  if (s === 0) return 0;
  return (value - m) / s;
}

export function detectOutlierZScore(
  value: number,
  values: number[],
  threshold = 2.0
): OutlierResult {
  const z = zScore(value, values);
  const absZ = Math.abs(z);
  const isOutlier = absZ >= threshold;

  let severity: OutlierResult['severity'] = 'none';
  if (absZ >= 4) severity = 'extreme';
  else if (absZ >= 3) severity = 'strong';
  else if (absZ >= 2) severity = 'mild';

  return { isOutlier, zScore: z, method: 'zscore', severity };
}

// ── IQR ──────────────────────────────────────────────────────────────────────

/**
 * Detecta outliers usando el rango intercuartil (IQR).
 * Outlier si value < Q1 - 1.5*IQR o value > Q3 + 1.5*IQR.
 */
export function detectOutlierIQR(
  value: number,
  values: number[],
  multiplier = 1.5
): OutlierResult {
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = percentile(sorted, 25);
  const q3 = percentile(sorted, 75);
  const iqr = q3 - q1;

  const lowerFence = q1 - multiplier * iqr;
  const upperFence = q3 + multiplier * iqr;
  const isOutlier = value < lowerFence || value > upperFence;

  const z = zScore(value, values);
  const absZ = Math.abs(z);
  let severity: OutlierResult['severity'] = 'none';
  if (isOutlier) {
    const distance = value > upperFence ? value - upperFence : lowerFence - value;
    if (distance > 3 * iqr) severity = 'extreme';
    else if (distance > 2 * iqr) severity = 'strong';
    else severity = 'mild';
  }

  return { isOutlier, zScore: absZ, method: 'iqr', severity };
}

// ── Percentiles ───────────────────────────────────────────────────────────────

export function getPercentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  return percentile(sorted, p);
}

export function percentileRank(value: number, values: number[]): number {
  const below = values.filter((v) => v < value).length;
  return (below / values.length) * 100;
}

// ── Stats summary ─────────────────────────────────────────────────────────────

export interface StatsSummary {
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

export function statsSummary(values: number[]): StatsSummary {
  if (values.length === 0) {
    return { mean: 0, stdDev: 0, min: 0, max: 0, p25: 0, p50: 0, p75: 0, p90: 0 };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const m = mean(values);
  return {
    mean: m,
    stdDev: stdDev(values, m),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    p25: percentile(sorted, 25),
    p50: percentile(sorted, 50),
    p75: percentile(sorted, 75),
    p90: percentile(sorted, 90),
  };
}
