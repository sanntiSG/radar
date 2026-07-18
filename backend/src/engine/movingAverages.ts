/** Medias móviles para reducir ruido y detectar tendencias reales. */

/** Simple Moving Average de los últimos `window` puntos, por posición. */
export function sma(series: number[], window: number): number[] {
  if (window <= 0 || series.length === 0) return [];
  const out: number[] = [];
  for (let i = 0; i < series.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = series.slice(start, i + 1);
    out.push(slice.reduce((a, b) => a + b, 0) / slice.length);
  }
  return out;
}

/** Exponential Moving Average con factor 2/(window+1). */
export function ema(series: number[], window: number): number[] {
  if (window <= 0 || series.length === 0) return [];
  const alpha = 2 / (window + 1);
  const out: number[] = [series[0]];
  for (let i = 1; i < series.length; i++) {
    out.push(alpha * series[i] + (1 - alpha) * out[i - 1]);
  }
  return out;
}

/** Último valor de la SMA (atajo frecuente). */
export function smaLast(series: number[], window: number): number {
  const s = sma(series, window);
  return s.length ? s[s.length - 1] : 0;
}
