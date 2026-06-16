/**
 * Growth Velocity = Interacciones / Tiempo (horas)
 * Mide qué tan rápido está creciendo una entidad.
 */

export interface VelocityPoint {
  value: number;
  timestamp: Date;
}

/**
 * Calcula la velocidad de crecimiento entre dos puntos.
 * @returns menciones/hora
 */
export function growthVelocity(
  current: VelocityPoint,
  previous: VelocityPoint
): number {
  const deltaValue = current.value - previous.value;
  const deltaHours =
    (current.timestamp.getTime() - previous.timestamp.getTime()) / (1000 * 60 * 60);

  if (deltaHours <= 0) return 0;
  return deltaValue / deltaHours;
}

/**
 * Calcula la velocidad promedio de una serie temporal.
 * @param series - puntos ordenados cronológicamente
 * @returns velocidad promedio (menciones/hora)
 */
export function averageVelocity(series: VelocityPoint[]): number {
  if (series.length < 2) return 0;

  let totalVelocity = 0;
  let count = 0;

  for (let i = 1; i < series.length; i++) {
    const v = growthVelocity(series[i], series[i - 1]);
    totalVelocity += v;
    count++;
  }

  return count > 0 ? totalVelocity / count : 0;
}

/**
 * Velocidad más reciente (último intervalo de la serie).
 */
export function latestVelocity(series: VelocityPoint[]): number {
  if (series.length < 2) return 0;
  return growthVelocity(series[series.length - 1], series[series.length - 2]);
}
