import { recencyScore, saturate } from './momentum';

export interface SignalFactor {
  key: 'velocity' | 'acceleration' | 'frequency' | 'engagement' | 'recency' | 'streak' | 'outlier';
  label: string;
  detail: string;
  /** 0-100: intensidad de este factor (para barras en UI) */
  contribution: number;
  /** Peso en el Radar Score (%); null para factores cualitativos adicionales */
  weight: number | null;
}

export interface SignalExplanation {
  sentence: string;
  factors: SignalFactor[];
}

export interface ExplainInput {
  name: string;
  velocity: number;
  acceleration: number;
  frequency: number;
  engagement: number;
  recencyHours: number;
  changePct: number;
  streak: number;
  outlier: boolean;
  prev?: number;
  last?: number;
}

/**
 * Genera el desglose explicativo de por qué existe esta señal:
 * una frase legible + factores individuales con contribución normalizada.
 * Usa los mismos caps que radarScore.ts para coherencia.
 */
export function explainSignal(input: ExplainInput): SignalExplanation {
  const {
    name,
    velocity,
    acceleration,
    frequency,
    engagement,
    recencyHours,
    changePct,
    streak,
    outlier,
    prev = 0,
    last = 0,
  } = input;

  // Sub-scores 0-100, mismos caps que radarScore
  const velScore = Math.round(saturate(velocity, 30) * 100);
  const accelScore = Math.round(saturate(Math.max(0, acceleration), 15) * 100);
  const freqScore = Math.round(saturate(frequency, 60) * 100);
  const engScore = Math.round(saturate(engagement, 800) * 100);
  const recScore = Math.round(recencyScore(recencyHours) * 100);

  const factors: SignalFactor[] = [
    {
      key: 'velocity',
      label: 'Velocidad de crecimiento',
      detail:
        velocity >= 20
          ? 'Crecimiento muy rápido en el período reciente'
          : velocity >= 8
            ? 'Crecimiento moderado y sostenido'
            : velocity >= 2
              ? 'Crecimiento lento pero presente'
              : 'Volumen estático o descendente',
      contribution: velScore,
      weight: 30,
    },
    {
      key: 'acceleration',
      label: 'Aceleración',
      detail:
        acceleration > 5
          ? 'La velocidad de crecimiento está acelerando significativamente'
          : acceleration > 0
            ? 'Leve aceleración positiva detectada'
            : acceleration < -5
              ? 'La señal está desacelerando — el crecimiento pierde fuerza'
              : 'Velocidad de crecimiento estable (sin aceleración notable)',
      contribution: accelScore,
      weight: 25,
    },
    {
      key: 'frequency',
      label: 'Frecuencia de menciones',
      detail:
        frequency >= 40
          ? `Alta: ${frequency} menciones en el período actual`
          : frequency >= 12
            ? `Moderada: ${frequency} menciones en el período actual`
            : `Baja: ${frequency} menciones — señal emergente`,
      contribution: freqScore,
      weight: 20,
    },
    {
      key: 'engagement',
      label: 'Engagement',
      detail:
        engagement >= 500
          ? `Muy alto: ${engagement} interacciones`
          : engagement >= 100
            ? `Moderado: ${engagement} interacciones`
            : `Bajo: ${engagement} interacciones`,
      contribution: engScore,
      weight: 15,
    },
    {
      key: 'recency',
      label: 'Recencia',
      detail:
        recencyHours <= 6
          ? 'Detectado hace menos de 6 horas — muy reciente'
          : recencyHours <= 24
            ? 'Activo en las últimas 24 horas'
            : recencyHours <= 72
              ? 'Activo en los últimos 3 días'
              : 'No ha aparecido recientemente — señal enfriándose',
      contribution: recScore,
      weight: 10,
    },
  ];

  if (streak >= 2) {
    factors.push({
      key: 'streak',
      label: 'Racha de aceleración',
      detail: `${streak} períodos consecutivos con aceleración positiva — patrón de despegue`,
      contribution: Math.min(100, streak * 20),
      weight: null,
    });
  }

  if (outlier) {
    factors.push({
      key: 'outlier',
      label: 'Anomalía estadística',
      detail: 'El volumen actual es inusual respecto al histórico (Z-Score > 2σ)',
      contribution: 100,
      weight: null,
    });
  }

  // Frase principal
  const parts: string[] = [];
  const pct = Math.round(changePct);
  if (pct > 0) {
    parts.push(`${name} creció ${pct}% en el último período (${prev} → ${last} menciones)`);
  } else if (pct < 0) {
    parts.push(`${name} bajó ${Math.abs(pct)}% en el último período (${prev} → ${last} menciones)`);
  } else {
    parts.push(`${name} registra ${last} menciones en el período actual`);
  }
  if (streak >= 2) parts.push(`acelera por ${streak} períodos consecutivos`);
  if (outlier) parts.push('volumen fuera de lo normal para su histórico (outlier estadístico)');

  return { sentence: parts.join('; ') + '.', factors };
}
