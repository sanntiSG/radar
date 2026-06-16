/**
 * Trend Prediction — Modelos de predicción probabilística.
 * Implementa: Regresión Lineal, Moving Average Forecast, Exponential Smoothing.
 * Horizontes: 24h, 72h, 7d (168h).
 */

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export interface PredictionResult {
  horizon: '24h' | '72h' | '7d';
  predictedValue: number;
  confidence: ConfidenceLevel;
  confidenceValue: number; // 0-100
  explanation: string;
  method: 'linear' | 'moving_average' | 'exp_smoothing';
}

export interface SeriesPoint {
  value: number;
  timestamp: Date; // ms since epoch
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function toHours(ts: Date): number {
  return ts.getTime() / (1000 * 60 * 60);
}

function rSquared(actual: number[], predicted: number[]): number {
  const mean = actual.reduce((s, v) => s + v, 0) / actual.length;
  const ssTot = actual.reduce((s, v) => s + (v - mean) ** 2, 0);
  const ssRes = actual.reduce((s, v, i) => s + (v - predicted[i]) ** 2, 0);
  if (ssTot === 0) return 1;
  return Math.max(0, 1 - ssRes / ssTot);
}

function confidenceFromR2(r2: number): { level: ConfidenceLevel; value: number } {
  const value = Math.round(r2 * 100);
  if (r2 >= 0.75) return { level: 'high', value };
  if (r2 >= 0.45) return { level: 'medium', value };
  return { level: 'low', value };
}

// ── Regresión Lineal ─────────────────────────────────────────────────────────

export function linearRegression(series: SeriesPoint[]): {
  slope: number;
  intercept: number;
  r2: number;
} {
  if (series.length < 2) return { slope: 0, intercept: series[0]?.value ?? 0, r2: 0 };

  const xs = series.map((p) => toHours(p.timestamp));
  const ys = series.map((p) => p.value);

  const n = xs.length;
  const sumX = xs.reduce((s, x) => s + x, 0);
  const sumY = ys.reduce((s, y) => s + y, 0);
  const sumXY = xs.reduce((s, x, i) => s + x * ys[i], 0);
  const sumX2 = xs.reduce((s, x) => s + x * x, 0);

  const denom = n * sumX2 - sumX ** 2;
  if (denom === 0) return { slope: 0, intercept: sumY / n, r2: 0 };

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  const predicted = xs.map((x) => slope * x + intercept);
  const r2 = rSquared(ys, predicted);

  return { slope, intercept, r2 };
}

function predictLinear(series: SeriesPoint[], futureHours: number): PredictionResult & { method: 'linear' } {
  const { slope, intercept, r2 } = linearRegression(series);
  const lastTs = toHours(series[series.length - 1].timestamp);
  const predictedValue = Math.max(0, slope * (lastTs + futureHours) + intercept);
  const { level, value } = confidenceFromR2(r2);

  const trend = slope > 0 ? 'creciente' : slope < 0 ? 'decreciente' : 'estable';
  const horizon = futureHours === 24 ? '24h' : futureHours === 72 ? '72h' : '7d';

  return {
    horizon,
    predictedValue: Math.round(predictedValue),
    confidence: level,
    confidenceValue: value,
    explanation: `Regresión lineal sobre ${series.length} puntos (R²=${r2.toFixed(2)}). Tendencia ${trend} con pendiente ${slope.toFixed(2)}/h. Predicción para las próximas ${futureHours}h: ${Math.round(predictedValue)} unidades.`,
    method: 'linear',
  };
}

// ── Moving Average Forecast ───────────────────────────────────────────────────

function predictMovingAverage(series: SeriesPoint[], futureHours: number): PredictionResult & { method: 'moving_average' } {
  const window = Math.min(7, series.length);
  const recent = series.slice(-window).map((p) => p.value);
  const avg = recent.reduce((s, v) => s + v, 0) / recent.length;
  const horizon = futureHours === 24 ? '24h' : futureHours === 72 ? '72h' : '7d';

  // Estimar confianza por varianza
  const variance = recent.reduce((s, v) => s + (v - avg) ** 2, 0) / recent.length;
  const cv = avg > 0 ? Math.sqrt(variance) / avg : 1; // coef. de variación
  const r2Approx = Math.max(0, 1 - cv);
  const { level, value } = confidenceFromR2(r2Approx);

  return {
    horizon,
    predictedValue: Math.round(avg),
    confidence: level,
    confidenceValue: value,
    explanation: `Media móvil de ${window} períodos. Valor promedio reciente: ${avg.toFixed(1)}. Variabilidad ${(cv * 100).toFixed(0)}%. Proyección para ${futureHours}h: mantiene ~${Math.round(avg)} unidades.`,
    method: 'moving_average',
  };
}

// ── Exponential Smoothing ─────────────────────────────────────────────────────

function predictExpSmoothing(series: SeriesPoint[], futureHours: number, alpha = 0.3): PredictionResult & { method: 'exp_smoothing' } {
  const values = series.map((p) => p.value);
  let smoothed = values[0];
  for (let i = 1; i < values.length; i++) {
    smoothed = alpha * values[i] + (1 - alpha) * smoothed;
  }
  const horizon = futureHours === 24 ? '24h' : futureHours === 72 ? '72h' : '7d';

  // Confianza basada en número de puntos
  const r2Approx = Math.min(0.9, series.length / 20);
  const { level, value } = confidenceFromR2(r2Approx);

  return {
    horizon,
    predictedValue: Math.round(smoothed),
    confidence: level,
    confidenceValue: value,
    explanation: `Suavizado exponencial (α=${alpha}) sobre ${series.length} puntos. El modelo da mayor peso a observaciones recientes. Valor suavizado: ${smoothed.toFixed(1)}. Proyección para ${futureHours}h: ~${Math.round(smoothed)} unidades.`,
    method: 'exp_smoothing',
  };
}

// ── Predicción ensemble (mejor de los tres) ───────────────────────────────────

/**
 * Genera predicciones para los 3 horizontes usando los 3 modelos.
 * Retorna el resultado del modelo con mayor R² / confianza por horizonte.
 */
export function predict(series: SeriesPoint[]): PredictionResult[] {
  if (series.length < 2) {
    return [];
  }

  const horizons: Array<[number, '24h' | '72h' | '7d']> = [
    [24, '24h'],
    [72, '72h'],
    [168, '7d'],
  ];

  return horizons.map(([hours]) => {
    const linear = predictLinear(series, hours);
    const ma = predictMovingAverage(series, hours);
    const exp = predictExpSmoothing(series, hours);

    // Seleccionar el modelo con mayor confianza
    const candidates = [linear, ma, exp];
    return candidates.reduce((best, current) =>
      current.confidenceValue > best.confidenceValue ? current : best
    );
  });
}
