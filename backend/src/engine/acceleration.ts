import { velocitySeries } from './growthVelocity';

/**
 * Growth Acceleration = velocidad actual − velocidad anterior.
 * Positiva sostenida ⇒ la tendencia se está acelerando.
 */
export function acceleration(series: number[]): number {
  const v = velocitySeries(series);
  if (v.length < 2) return 0;
  return v[v.length - 1] - v[v.length - 2];
}

/** Serie de aceleraciones (segunda derivada discreta). */
export function accelerationSeries(series: number[]): number[] {
  return velocitySeries(velocitySeries(series));
}

/** Cantidad de períodos consecutivos (desde el final) con aceleración positiva. */
export function positiveAccelerationStreak(series: number[]): number {
  const acc = accelerationSeries(series);
  let streak = 0;
  for (let i = acc.length - 1; i >= 0 && acc[i] > 0; i--) streak++;
  return streak;
}
