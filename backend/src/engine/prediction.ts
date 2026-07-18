/**
 * Predicciones probabilísticas sobre series diarias:
 * regresión lineal, moving average forecast y suavizado exponencial.
 * Horizontes: 24h (1 paso), 72h (3 pasos), 7 días (7 pasos).
 */

export interface LinearFit {
  slope: number;
  intercept: number;
  r2: number;
}

export function linearRegression(series: number[]): LinearFit {
  const n = series.length;
  if (n < 2) return { slope: 0, intercept: series[0] ?? 0, r2: 0 };

  const xs = series.map((_, i) => i);
  const meanX = (n - 1) / 2;
  const meanY = series.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (series[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = meanY - slope * meanX;

  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    const pred = slope * i + intercept;
    ssRes += (series[i] - pred) ** 2;
    ssTot += (series[i] - meanY) ** 2;
  }
  const r2 = ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot);

  return { slope, intercept, r2 };
}

export function forecastLinear(series: number[], steps: number): number {
  const { slope, intercept } = linearRegression(series);
  return Math.max(0, slope * (series.length - 1 + steps) + intercept);
}

export function movingAverageForecast(series: number[], window = 3): number {
  if (series.length === 0) return 0;
  const slice = series.slice(-window);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

export function exponentialSmoothingForecast(
  series: number[],
  alpha = 0.5
): number {
  if (series.length === 0) return 0;
  let level = series[0];
  for (let i = 1; i < series.length; i++) {
    level = alpha * series[i] + (1 - alpha) * level;
  }
  return Math.max(0, level);
}

export interface Forecast {
  h24: number;
  h72: number;
  d7: number;
  r2: number;
}

/**
 * Combina regresión lineal (peso según r2) con suavizado exponencial:
 * cuando la serie es ruidosa (r2 bajo) domina el suavizado conservador.
 */
export function predict(series: number[]): Forecast {
  const fit = linearRegression(series);
  const smooth = exponentialSmoothingForecast(series);

  const blend = (steps: number) => {
    const linear = forecastLinear(series, steps);
    return Math.round(fit.r2 * linear + (1 - fit.r2) * smooth);
  };

  return { h24: blend(1), h72: blend(3), d7: blend(7), r2: fit.r2 };
}
