import { saturate, recencyScore } from './momentum';

/**
 * Radar Score (0-100):
 *   30% Growth Velocity + 25% Growth Acceleration + 20% Frequency
 *   + 15% Engagement + 10% Recency
 */

export interface RadarScoreInput {
  velocity: number; // unidades/día
  acceleration: number; // unidades/día²
  frequency: number; // menciones ventana actual
  engagement: number; // interacciones ventana actual
  recencyHours: number; // horas desde última mención
}

export const RADAR_WEIGHTS = {
  velocity: 0.3,
  acceleration: 0.25,
  frequency: 0.2,
  engagement: 0.15,
  recency: 0.1,
} as const;

export function radarScore(input: RadarScoreInput): number {
  const v = saturate(input.velocity, 30);
  const a = saturate(input.acceleration, 15);
  const f = saturate(input.frequency, 60);
  const e = saturate(input.engagement, 800);
  const r = recencyScore(input.recencyHours);

  const score =
    RADAR_WEIGHTS.velocity * v +
    RADAR_WEIGHTS.acceleration * a +
    RADAR_WEIGHTS.frequency * f +
    RADAR_WEIGHTS.engagement * e +
    RADAR_WEIGHTS.recency * r;

  return Math.round(score * 100);
}
