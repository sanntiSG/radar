/**
 * Moving Averages — Reduce ruido y detecta tendencias reales.
 * Implementa SMA (Simple) y EMA (Exponential).
 */

// ── SMA ───────────────────────────────────────────────────────────────────────

/**
 * Simple Moving Average de ventana `window`.
 * @returns array del mismo largo que `values`, con NaN donde no hay suficientes datos.
 */
export function sma(values: number[], window: number): number[] {
  if (window <= 0 || window > values.length) return values.map(() => NaN);

  return values.map((_, i) => {
    if (i < window - 1) return NaN;
    const slice = values.slice(i - window + 1, i + 1);
    return slice.reduce((sum, v) => sum + v, 0) / window;
  });
}

/**
 * Último valor SMA calculable.
 */
export function latestSMA(values: number[], window: number): number {
  if (values.length < window) return NaN;
  const slice = values.slice(values.length - window);
  return slice.reduce((sum, v) => sum + v, 0) / window;
}

// ── EMA ───────────────────────────────────────────────────────────────────────

/**
 * Exponential Moving Average.
 * Da más peso a los valores recientes.
 * alpha = 2 / (window + 1) por defecto (estándar de mercados financieros).
 */
export function ema(values: number[], window: number, alpha?: number): number[] {
  if (values.length === 0) return [];

  const k = alpha ?? 2 / (window + 1);
  const result: number[] = [];

  // El primer EMA es el primer valor
  result.push(values[0]);

  for (let i = 1; i < values.length; i++) {
    result.push(values[i] * k + result[i - 1] * (1 - k));
  }

  return result;
}

/**
 * Último valor EMA.
 */
export function latestEMA(values: number[], window: number): number {
  const emaValues = ema(values, window);
  if (emaValues.length === 0) return NaN;
  return emaValues[emaValues.length - 1];
}

/**
 * Diferencia EMA rápida vs EMA lenta (cruce de medias).
 * Positivo = momentum alcista.
 */
export function emaSignal(
  values: number[],
  fastWindow: number,
  slowWindow: number
): number {
  if (values.length < slowWindow) return 0;
  const fast = latestEMA(values, fastWindow);
  const slow = latestEMA(values, slowWindow);
  return fast - slow;
}
