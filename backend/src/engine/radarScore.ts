/**
 * Radar Score — Score compuesto normalizado 0-100.
 *
 * Pesos del spec:
 *   30% Growth Velocity
 *   25% Growth Acceleration
 *   20% Frequency
 *   15% Engagement
 *   10% Recency
 */

export interface RadarScoreInput {
  velocity: number;      // menciones/hora (Growth Velocity)
  acceleration: number;  // delta velocidad (puede ser negativo)
  frequency: number;     // total de menciones en el período
  engagement: number;    // likes + shares + comments
  recency: number;       // horas desde última mención (menor = mejor)
}

interface NormalizedInputs {
  velocityNorm: number;
  accelerationNorm: number;
  frequencyNorm: number;
  engagementNorm: number;
  recencyNorm: number;
}

// Valores de referencia para normalización (percentil 95 del mercado típico)
const REF = {
  velocity: 50,      // 50 menciones/hora = muy alto
  acceleration: 20,  // aceleración de 20 unidades/h = muy fuerte
  frequency: 500,    // 500 menciones en 24h = viral
  engagement: 50000, // 50k interacciones = muy alto
  recencyMax: 168,   // 168h = 7 días = el umbral donde la recencia ya no importa
} as const;

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeInputs(input: RadarScoreInput): NormalizedInputs {
  return {
    velocityNorm: clamp(input.velocity / REF.velocity),
    // Aceleración puede ser negativa; la normalizamos en [-1, 1] y luego la llevamos a [0, 1]
    accelerationNorm: clamp((input.acceleration / REF.acceleration + 1) / 2),
    frequencyNorm: clamp(input.frequency / REF.frequency),
    engagementNorm: clamp(input.engagement / REF.engagement),
    recencyNorm: clamp(1 - input.recency / REF.recencyMax),
  };
}

/**
 * Calcula el Radar Score según los pesos oficiales del spec.
 * @returns número entre 0 y 100
 */
export function radarScore(input: RadarScoreInput): number {
  const n = normalizeInputs(input);

  const raw =
    n.velocityNorm * 30 +       // 30% velocity
    n.accelerationNorm * 25 +   // 25% acceleration
    n.frequencyNorm * 20 +      // 20% frequency
    n.engagementNorm * 15 +     // 15% engagement
    n.recencyNorm * 10;         // 10% recency

  return Math.round(clamp(raw, 0, 100));
}

/**
 * Normaliza un array de Radar Scores a [0, 100] relativo al máximo del conjunto.
 * Útil para que las señales se comparen entre sí dentro de un mismo feed.
 */
export function normalizeScores(scores: number[]): number[] {
  if (scores.length === 0) return [];
  const max = Math.max(...scores);
  if (max === 0) return scores.map(() => 0);
  return scores.map((s) => Math.round((s / max) * 100));
}

/**
 * Devuelve un breakdown del score para mostrar en el tooltip del dashboard.
 */
export function radarScoreBreakdown(input: RadarScoreInput): Record<string, number> {
  const n = normalizeInputs(input);
  return {
    velocity: Math.round(n.velocityNorm * 30),
    acceleration: Math.round(n.accelerationNorm * 25),
    frequency: Math.round(n.frequencyNorm * 20),
    engagement: Math.round(n.engagementNorm * 15),
    recency: Math.round(n.recencyNorm * 10),
  };
}
