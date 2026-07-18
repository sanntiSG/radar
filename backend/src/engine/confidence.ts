import type { LinearFit } from './prediction';

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export interface Confidence {
  score: number; // 0-100
  level: ConfidenceLevel;
  explanation: string;
}

/**
 * Confianza de una predicción según ajuste del modelo (r2),
 * cantidad de histórico y consistencia de la dirección.
 */
export function confidence(series: number[], fit: LinearFit): Confidence {
  const dataFactor = Math.min(1, series.length / 14); // 14 días = histórico pleno
  const fitFactor = fit.r2;

  let directionFactor = 0.5;
  if (series.length >= 3) {
    const last = series.slice(-3);
    const rising = last[2] > last[1] && last[1] > last[0];
    const falling = last[2] < last[1] && last[1] < last[0];
    directionFactor = rising || falling ? 1 : 0.5;
  }

  const score = Math.round(
    (0.45 * fitFactor + 0.35 * dataFactor + 0.2 * directionFactor) * 100
  );

  const level: ConfidenceLevel =
    score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';

  const parts: string[] = [];
  parts.push(
    fitFactor >= 0.7
      ? 'la serie sigue un patrón claro'
      : fitFactor >= 0.4
        ? 'la serie muestra un patrón moderado'
        : 'la serie es ruidosa'
  );
  parts.push(
    dataFactor >= 1
      ? 'con histórico completo de 14+ días'
      : `con ${series.length} días de histórico`
  );
  if (directionFactor === 1) parts.push('y dirección consistente');

  return { score, level, explanation: parts.join(', ') + '.' };
}
