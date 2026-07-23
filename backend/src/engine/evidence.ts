import { acceleration, accelerationSeries } from './acceleration';
import { growthPct, growthVelocity } from './growthVelocity';
import { radarScore } from './radarScore';

/**
 * Centro de Evidencias: convierte una serie de snapshots en una narrativa
 * verificable — cómo evolucionó el Radar Score día a día, qué momentos
 * marcan la historia de la señal (detección, despegue, pico, hoy) y qué
 * cambió desde ayer. Todo se calcula sobre datos ya existentes; nada se
 * inventa ni se proyecta como garantía.
 */

export interface EvidenceInputPoint {
  date: string; // YYYY-MM-DD
  value: number; // mentions (o interest para trends)
  engagement: number;
}

export interface ScorePoint {
  index: number;
  date: string;
  score: number;
}

/**
 * Reconstruye el Radar Score que habría tenido la señal en cada día de su
 * histórico, tratando ese día como "hoy" (recencyHours = 0). Muestra la
 * FORMA de la evolución del score, no un recálculo bit-exacto del pasado.
 */
export function scoreOverTime(points: EvidenceInputPoint[]): ScorePoint[] {
  const out: ScorePoint[] = [];
  for (let i = 2; i < points.length; i++) {
    const sub = points.slice(0, i + 1).map((p) => p.value);
    const score = radarScore({
      velocity: growthVelocity(sub),
      acceleration: acceleration(sub),
      frequency: sub[sub.length - 1],
      engagement: points[i].engagement,
      recencyHours: 0,
    });
    out.push({ index: i, date: points[i].date, score });
  }
  return out;
}

export type PhaseKind = 'detected' | 'takeoff' | 'peak' | 'now';

export interface Phase {
  index: number;
  date: string;
  kind: PhaseKind;
  label: string;
}

/**
 * Hitos verificables de la historia de una señal: cuándo la detectó Radar,
 * cuándo empezó a acelerar de forma sostenida, su pico hasta ahora y el
 * punto actual. Es la prueba visual de que la señal fue detectada antes
 * de ser evidente.
 */
export function detectPhases(points: EvidenceInputPoint[]): Phase[] {
  if (points.length === 0) return [];
  const series = points.map((p) => p.value);
  const lastIdx = series.length - 1;
  const phases: Phase[] = [
    {
      index: 0,
      date: points[0].date,
      kind: 'detected',
      label: `Radar detectó la señal (${series[0]} menciones)`,
    },
  ];

  // Despegue: primer punto donde la aceleración es positiva dos períodos seguidos.
  // accelSeries[k] corresponde al índice original k+2.
  const accelSeries = accelerationSeries(series);
  let takeoffIdx: number | null = null;
  for (let k = 0; k < accelSeries.length - 1; k++) {
    if (accelSeries[k] > 0 && accelSeries[k + 1] > 0) {
      takeoffIdx = k + 3; // índice original del segundo punto con aceleración positiva
      break;
    }
  }
  if (takeoffIdx !== null && takeoffIdx > 0 && takeoffIdx < lastIdx) {
    phases.push({
      index: takeoffIdx,
      date: points[takeoffIdx].date,
      kind: 'takeoff',
      label: 'Comenzó a acelerar de forma sostenida',
    });
  }

  // Pico: mayor valor de la serie, si no coincide con el punto actual.
  let peakIdx = 0;
  for (let i = 1; i < series.length; i++) if (series[i] > series[peakIdx]) peakIdx = i;
  if (peakIdx > 0 && peakIdx < lastIdx) {
    phases.push({
      index: peakIdx,
      date: points[peakIdx].date,
      kind: 'peak',
      label: `Punto máximo hasta ahora (${series[peakIdx]} menciones)`,
    });
  }

  phases.push({
    index: lastIdx,
    date: points[lastIdx].date,
    kind: 'now',
    label: `Hoy (${series[lastIdx]} menciones)`,
  });

  return phases.sort((a, b) => a.index - b.index);
}

export interface DayDelta {
  mentionsToday: number;
  mentionsYesterday: number;
  deltaPct: number;
  scoreToday: number;
  scoreYesterday: number;
  scoreDelta: number;
}

/** Compara hoy contra ayer: menciones y el Radar Score que habría tenido. */
export function dayDelta(points: EvidenceInputPoint[]): DayDelta | null {
  if (points.length < 2) return null;
  const series = points.map((p) => p.value);
  const today = points[points.length - 1];
  const yesterday = points[points.length - 2];

  const scoreFor = (sub: number[], engagement: number) =>
    radarScore({
      velocity: growthVelocity(sub),
      acceleration: acceleration(sub),
      frequency: sub[sub.length - 1],
      engagement,
      recencyHours: 0,
    });

  const scoreToday = scoreFor(series, today.engagement);
  const scoreYesterday = scoreFor(series.slice(0, -1), yesterday.engagement);

  return {
    mentionsToday: today.value,
    mentionsYesterday: yesterday.value,
    deltaPct: Math.round(growthPct(yesterday.value, today.value)),
    scoreToday,
    scoreYesterday,
    scoreDelta: scoreToday - scoreYesterday,
  };
}
