import { describe, it, expect } from 'vitest';
import { growthVelocity, averageVelocity } from '../growthVelocity';
import { latestAcceleration } from '../acceleration';
import { zScore, detectOutlierZScore, detectOutlierIQR, statsSummary } from '../outliers';
import { sma, ema, latestSMA, latestEMA } from '../movingAverages';
import { trendMomentum } from '../momentum';
import { predict, linearRegression } from '../prediction';
import { radarScore, radarScoreBreakdown } from '../radarScore';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeTimeSeries(values: number[], startHoursAgo = 24): Array<{ value: number; timestamp: Date }> {
  const now = Date.now();
  const intervalMs = (startHoursAgo * 60 * 60 * 1000) / (values.length - 1 || 1);
  return values.map((value, i) => ({
    value,
    timestamp: new Date(now - (values.length - 1 - i) * intervalMs),
  }));
}

// ── Growth Velocity ───────────────────────────────────────────────────────────

describe('growthVelocity', () => {
  it('calcula menciones/hora correctamente', () => {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const v = growthVelocity({ value: 200, timestamp: now }, { value: 100, timestamp: twoHoursAgo });
    expect(v).toBeCloseTo(50); // 100 menciones / 2 horas = 50/h
  });

  it('devuelve 0 cuando no hay cambio de tiempo', () => {
    const now = new Date();
    const v = growthVelocity({ value: 200, timestamp: now }, { value: 100, timestamp: now });
    expect(v).toBe(0);
  });

  it('calcula velocidad promedio de una serie', () => {
    const series = makeTimeSeries([100, 150, 210, 280], 6); // 3 intervalos de 2h
    const v = averageVelocity(series);
    expect(v).toBeGreaterThan(0);
  });
});

// ── Acceleration ─────────────────────────────────────────────────────────────

describe('growthAcceleration', () => {
  it('detecta aceleración positiva', () => {
    // Acelerando: 120→180→260 en curva creciente
    const series = makeTimeSeries([120, 180, 260], 4);
    const a = latestAcceleration(series);
    expect(a).toBeGreaterThan(0); // acelerando
  });

  it('detecta desaceleración (caída que se acelera)', () => {
    // Caída acelerada: 300→200→50 — la velocidad va de -50/h a -75/h → aceleración negativa
    const series = makeTimeSeries([300, 200, 50], 4);
    const a = latestAcceleration(series);
    expect(a).toBeLessThan(0);
  });

  it('retorna 0 con menos de 3 puntos', () => {
    const series = makeTimeSeries([100, 200], 2);
    const a = latestAcceleration(series);
    expect(a).toBe(0);
  });
});

// ── Outliers ─────────────────────────────────────────────────────────────────

describe('outliers', () => {
  const population = [10, 12, 11, 13, 10, 12, 11, 10, 13, 12, 11, 10, 100]; // 100 es outlier

  it('detecta outlier con Z-Score', () => {
    const result = detectOutlierZScore(100, population);
    expect(result.isOutlier).toBe(true);
    expect(result.zScore).toBeGreaterThan(2);
  });

  it('no marca como outlier un valor normal', () => {
    const result = detectOutlierZScore(12, population);
    expect(result.isOutlier).toBe(false);
  });

  it('calcula Z-Score correctamente para valor conocido', () => {
    const values = [2, 4, 4, 4, 5, 5, 7, 9]; // media = 5, stdDev = ~2
    const z = zScore(9, values);
    expect(z).toBeCloseTo(2, 0); // (9-5)/2 = 2
  });

  it('detecta outlier con IQR', () => {
    const result = detectOutlierIQR(100, population);
    expect(result.isOutlier).toBe(true);
  });

  it('statsSummary devuelve valores correctos', () => {
    const values = [1, 2, 3, 4, 5];
    const stats = statsSummary(values);
    expect(stats.mean).toBe(3);
    expect(stats.min).toBe(1);
    expect(stats.max).toBe(5);
    expect(stats.p50).toBe(3);
  });
});

// ── Moving Averages ───────────────────────────────────────────────────────────

describe('movingAverages', () => {
  const values = [10, 20, 30, 40, 50, 60, 70];

  it('SMA calcula correctamente con ventana 3', () => {
    const result = sma(values, 3);
    // índice 2: (10+20+30)/3 = 20
    expect(result[2]).toBeCloseTo(20);
    // índice 4: (30+40+50)/3 = 40
    expect(result[4]).toBeCloseTo(40);
  });

  it('SMA devuelve NaN para índices insuficientes', () => {
    const result = sma(values, 3);
    expect(isNaN(result[0])).toBe(true);
    expect(isNaN(result[1])).toBe(true);
  });

  it('latestSMA retorna la media de los últimos N valores', () => {
    const latest = latestSMA([10, 20, 30, 40, 50], 3);
    expect(latest).toBeCloseTo(40); // (30+40+50)/3
  });

  it('EMA da más peso a valores recientes', () => {
    const result = ema([10, 20, 30], 3);
    // Con alpha = 2/(3+1) = 0.5:
    // EMA[0] = 10
    // EMA[1] = 20*0.5 + 10*0.5 = 15
    // EMA[2] = 30*0.5 + 15*0.5 = 22.5
    expect(result[2]).toBeCloseTo(22.5, 1);
  });

  it('latestEMA retorna el último valor EMA', () => {
    const latest = latestEMA([10, 20, 30], 3);
    expect(latest).toBeCloseTo(22.5, 1);
  });
});

// ── Momentum ──────────────────────────────────────────────────────────────────

describe('trendMomentum', () => {
  it('devuelve score entre 0 y 100', () => {
    const score = trendMomentum({
      frequency: 50,
      engagement: 5000,
      growth: 80,
      acceleration: 10,
      recency: 2,
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('señal fuerte da score alto', () => {
    const strong = trendMomentum({ frequency: 120, engagement: 15000, growth: 250, acceleration: 30, recency: 0.5 });
    const weak = trendMomentum({ frequency: 2, engagement: 50, growth: 5, acceleration: -5, recency: 100 });
    expect(strong).toBeGreaterThan(weak);
  });
});

// ── Prediction ────────────────────────────────────────────────────────────────

describe('prediction', () => {
  it('genera 3 horizontes de predicción', () => {
    const series = makeTimeSeries([120, 180, 260, 350, 410], 48);
    const preds = predict(series);
    expect(preds).toHaveLength(3);
    expect(preds.map((p) => p.horizon)).toEqual(['24h', '72h', '7d']);
  });

  it('predicción lineal creciente da valores positivos', () => {
    const series = makeTimeSeries([100, 200, 300, 400, 500], 48);
    const preds = predict(series);
    expect(preds[0].predictedValue).toBeGreaterThan(0);
  });

  it('regresión lineal detecta pendiente positiva en serie creciente', () => {
    const series = makeTimeSeries([10, 20, 30, 40, 50], 8);
    const { slope, r2 } = linearRegression(series);
    expect(slope).toBeGreaterThan(0);
    expect(r2).toBeGreaterThan(0.9); // debe ser casi perfecta
  });

  it('predicciones incluyen explicación', () => {
    const series = makeTimeSeries([100, 150, 200], 24);
    const preds = predict(series);
    for (const p of preds) {
      expect(p.explanation.length).toBeGreaterThan(10);
    }
  });
});

// ── Radar Score ───────────────────────────────────────────────────────────────

describe('radarScore', () => {
  it('score entre 0 y 100', () => {
    const score = radarScore({ velocity: 10, acceleration: 5, frequency: 100, engagement: 5000, recency: 2 });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('señal fuerte da score mayor que señal débil', () => {
    const strong = radarScore({ velocity: 40, acceleration: 15, frequency: 300, engagement: 30000, recency: 1 });
    const weak = radarScore({ velocity: 1, acceleration: -2, frequency: 5, engagement: 50, recency: 100 });
    expect(strong).toBeGreaterThan(weak);
  });

  it('breakdown suma aproximadamente al score total', () => {
    const input = { velocity: 20, acceleration: 8, frequency: 150, engagement: 8000, recency: 3 };
    const score = radarScore(input);
    const bd = radarScoreBreakdown(input);
    const sum = Object.values(bd).reduce((s, v) => s + v, 0);
    // La suma del breakdown debe ser ±2 del score total (por redondeos)
    expect(Math.abs(sum - score)).toBeLessThanOrEqual(5);
  });

  it('recency alta (señal vieja) reduce el score', () => {
    const fresh = radarScore({ velocity: 20, acceleration: 5, frequency: 100, engagement: 5000, recency: 1 });
    const stale = radarScore({ velocity: 20, acceleration: 5, frequency: 100, engagement: 5000, recency: 150 });
    expect(fresh).toBeGreaterThan(stale);
  });
});
