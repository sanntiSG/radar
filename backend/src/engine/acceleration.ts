/**
 * Growth Acceleration = Velocidad Actual - Velocidad Anterior
 * Detecta si el crecimiento está acelerando o frenando.
 */

import { VelocityPoint, growthVelocity } from './growthVelocity';

/**
 * Calcula la aceleración entre tres puntos consecutivos.
 * Positivo = acelerando, Negativo = desacelerando.
 */
export function growthAcceleration(
  pointA: VelocityPoint, // más antiguo
  pointB: VelocityPoint, // intermedio
  pointC: VelocityPoint  // más reciente
): number {
  const v1 = growthVelocity(pointB, pointA); // velocidad anterior
  const v2 = growthVelocity(pointC, pointB); // velocidad actual
  return v2 - v1;
}

/**
 * Calcula la aceleración promedio de una serie temporal.
 * @param series - puntos ordenados cronológicamente (mínimo 3)
 */
export function seriesAcceleration(series: VelocityPoint[]): number {
  if (series.length < 3) return 0;

  let totalAccel = 0;
  let count = 0;

  for (let i = 2; i < series.length; i++) {
    const a = growthAcceleration(series[i - 2], series[i - 1], series[i]);
    totalAccel += a;
    count++;
  }

  return count > 0 ? totalAccel / count : 0;
}

/**
 * Aceleración más reciente (últimos 3 puntos de la serie).
 */
export function latestAcceleration(series: VelocityPoint[]): number {
  if (series.length < 3) return 0;
  const n = series.length;
  return growthAcceleration(series[n - 3], series[n - 2], series[n - 1]);
}
