/** Detección de anomalías estadísticas: Z-Score, IQR y percentiles. */

export function mean(series: number[]): number {
  if (series.length === 0) return 0;
  return series.reduce((a, b) => a + b, 0) / series.length;
}

export function stdDev(series: number[]): number {
  if (series.length < 2) return 0;
  const m = mean(series);
  const variance =
    series.reduce((acc, x) => acc + (x - m) ** 2, 0) / (series.length - 1);
  return Math.sqrt(variance);
}

/** Z-Score de un valor respecto a una serie de referencia. */
export function zScore(value: number, reference: number[]): number {
  const sd = stdDev(reference);
  if (sd === 0) return 0;
  return (value - mean(reference)) / sd;
}

/** ¿El último valor de la serie es un outlier por Z-Score? */
export function isZScoreOutlier(series: number[], threshold = 2): boolean {
  if (series.length < 4) return false;
  const reference = series.slice(0, -1);
  return zScore(series[series.length - 1], reference) >= threshold;
}

/** Percentil p (0-100) por interpolación lineal. */
export function percentile(series: number[], p: number): number {
  if (series.length === 0) return 0;
  const sorted = [...series].sort((a, b) => a - b);
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

/** ¿El último valor supera el límite superior IQR (Q3 + k·IQR)? */
export function isIqrOutlier(series: number[], k = 1.5): boolean {
  if (series.length < 4) return false;
  const reference = series.slice(0, -1);
  const q1 = percentile(reference, 25);
  const q3 = percentile(reference, 75);
  const iqr = q3 - q1;
  return series[series.length - 1] > q3 + k * iqr;
}
