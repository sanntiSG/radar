/**
 * Trend Momentum — Combina múltiples señales en un score de impulso.
 * Variables: Frecuencia, Engagement, Crecimiento, Aceleración, Recencia.
 */

export interface MomentumInput {
  frequency: number;       // número de menciones/apariciones
  engagement: number;      // likes + comments + shares totales
  growth: number;          // % de crecimiento respecto a período anterior
  acceleration: number;    // derivada de la velocidad (puede ser negativo)
  recency: number;         // horas desde la última mención (menor = más reciente)
}

interface NormalizedMomentum {
  freqNorm: number;
  engNorm: number;
  growthNorm: number;
  accelNorm: number;
  recencyNorm: number;
}

/**
 * Normaliza cada componente a [0, 1] respecto a los valores de referencia.
 * Los valores de referencia son típicos del mercado de ecommerce.
 */
function normalize(input: MomentumInput): NormalizedMomentum {
  // Frecuencia: 0 = 0, 100+ menciones = 1
  const freqNorm = Math.min(1, input.frequency / 100);

  // Engagement: 0 = 0, 10000+ = 1
  const engNorm = Math.min(1, input.engagement / 10000);

  // Crecimiento: puede ser negativo; 200%+ = 1, -100% = -0.5 (capped)
  const growthNorm = Math.max(-0.5, Math.min(1, input.growth / 200));

  // Aceleración: positivo bueno, negativo malo; normalizado entre -1 y 1
  const accelNorm = Math.max(-1, Math.min(1, input.acceleration / 50));

  // Recencia: 0 horas = 1 (muy reciente), 168+ horas (7 días) = 0
  const recencyNorm = Math.max(0, 1 - input.recency / 168);

  return { freqNorm, engNorm, growthNorm, accelNorm, recencyNorm };
}

/**
 * Calcula el Trend Momentum como un score compuesto 0-100.
 * Pesos: frecuencia 30%, engagement 20%, crecimiento 25%, aceleración 15%, recencia 10%.
 */
export function trendMomentum(input: MomentumInput): number {
  const n = normalize(input);

  const raw =
    n.freqNorm * 30 +
    n.engNorm * 20 +
    n.growthNorm * 25 +
    n.accelNorm * 15 +
    n.recencyNorm * 10;

  // raw ya está en [0, 100] (máximo teórico = 100)
  return Math.max(0, Math.min(100, raw));
}
