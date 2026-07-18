/**
 * Trend Momentum: combinación normalizada de frecuencia, engagement,
 * crecimiento, aceleración y recencia en un valor 0-100.
 */

export interface MomentumInput {
  frequency: number; // menciones en la ventana actual
  engagement: number; // interacciones (upvotes, comentarios…)
  growthPct: number; // crecimiento % reciente
  acceleration: number; // aceleración reciente
  recencyHours: number; // horas desde la última mención
}

/** Normaliza con saturación suave: 0 → 0, cap → 1, y valores mayores quedan en 1. */
export function saturate(value: number, cap: number): number {
  if (cap <= 0) return 0;
  const x = Math.max(0, value) / cap;
  return Math.min(1, (2 * x) / (1 + x));
}

export function recencyScore(hours: number, halfLifeHours = 48): number {
  if (hours <= 0) return 1;
  return Math.pow(0.5, hours / halfLifeHours);
}

export function momentum(input: MomentumInput): number {
  const freq = saturate(input.frequency, 50);
  const eng = saturate(input.engagement, 500);
  const growth = saturate(input.growthPct, 100);
  const accel = saturate(input.acceleration, 20);
  const rec = recencyScore(input.recencyHours);

  const score =
    0.25 * freq + 0.2 * eng + 0.25 * growth + 0.15 * accel + 0.15 * rec;
  return Math.round(score * 100);
}
