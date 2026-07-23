import { linearRegression } from './prediction';

/**
 * Índice de Precisión de Radar: mide, mediante backtest sobre el histórico
 * propio, si las direcciones que el modelo habría proyectado en el pasado
 * se cumplieron. Es transparencia, no una promesa — cada resultado se
 * etiqueta explícitamente como backtest.
 */

export type Direction = 'up' | 'down' | 'flat';

/** Umbral mínimo de pendiente para considerar una predicción direccional (no ruido). */
const SLOPE_THRESHOLD = 0.3;

function directionOf(delta: number): Direction {
  if (delta > SLOPE_THRESHOLD) return 'up';
  if (delta < -SLOPE_THRESHOLD) return 'down';
  return 'flat';
}

export interface BacktestPrediction {
  atIndex: number;
  predictedDirection: Direction;
  actualDirection: Direction;
  hit: boolean;
}

export interface BacktestResult {
  predictions: BacktestPrediction[];
  hits: number;
  total: number; // predicciones direccionales evaluadas (excluye 'flat')
  precisionPct: number; // 0-100
}

/**
 * En cada punto t del histórico (con contexto mínimo de 4 días), calcula la
 * dirección que el modelo habría proyectado usando SOLO los datos
 * disponibles hasta ese momento (regresión lineal), y verifica si
 * `horizon` días después la serie efectivamente se movió en esa dirección.
 */
export function backtestSignal(series: number[], horizon = 3): BacktestResult {
  const predictions: BacktestPrediction[] = [];
  for (let t = 3; t + horizon < series.length; t++) {
    const sub = series.slice(0, t + 1);
    const fit = linearRegression(sub);
    const predictedDirection = directionOf(fit.slope);
    const actualDirection = directionOf(series[t + horizon] - series[t]);
    predictions.push({
      atIndex: t,
      predictedDirection,
      actualDirection,
      hit: predictedDirection !== 'flat' && predictedDirection === actualDirection,
    });
  }
  const directional = predictions.filter((p) => p.predictedDirection !== 'flat');
  const hits = directional.filter((p) => p.hit).length;
  return {
    predictions,
    hits,
    total: directional.length,
    precisionPct: directional.length > 0 ? Math.round((hits / directional.length) * 100) : 0,
  };
}

/**
 * Días entre la detección (índice 0) y el pico de la serie — solo si el
 * pico ya quedó atrás (si el último punto es el máximo, la señal podría
 * seguir subiendo y no hay anticipación que medir todavía).
 */
export function anticipationDays(series: number[]): number | null {
  if (series.length < 4) return null;
  let peakIdx = 0;
  for (let i = 1; i < series.length; i++) if (series[i] > series[peakIdx]) peakIdx = i;
  if (peakIdx === 0 || peakIdx >= series.length - 1) return null;
  return peakIdx;
}
