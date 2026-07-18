/**
 * Growth Velocity = interacciones / tiempo.
 * Mide qué tan rápido crece una serie de menciones/interés.
 */

/** Velocidad media entre el primer y último punto (unidades por período). */
export function growthVelocity(series: number[]): number {
  if (series.length < 2) return 0;
  return (series[series.length - 1] - series[0]) / (series.length - 1);
}

/** Velocidades punto a punto (primera derivada discreta). */
export function velocitySeries(series: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < series.length; i++) out.push(series[i] - series[i - 1]);
  return out;
}

/** Crecimiento porcentual entre dos valores. */
export function growthPct(previous: number, current: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}
