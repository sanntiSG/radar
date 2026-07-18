import { describe, expect, it } from 'vitest';
import {
  growthVelocity,
  velocitySeries,
  growthPct,
  acceleration,
  accelerationSeries,
  positiveAccelerationStreak,
  mean,
  stdDev,
  zScore,
  isZScoreOutlier,
  percentile,
  isIqrOutlier,
  sma,
  ema,
  smaLast,
  saturate,
  recencyScore,
  momentum,
  linearRegression,
  forecastLinear,
  movingAverageForecast,
  exponentialSmoothingForecast,
  predict,
  confidence,
  radarScore,
} from '../index';

describe('growthVelocity', () => {
  it('calcula velocidad media de la serie', () => {
    expect(growthVelocity([120, 180, 260, 410])).toBeCloseTo((410 - 120) / 3);
  });
  it('devuelve 0 con menos de 2 puntos', () => {
    expect(growthVelocity([5])).toBe(0);
    expect(growthVelocity([])).toBe(0);
  });
  it('serie de velocidades punto a punto', () => {
    expect(velocitySeries([10, 15, 25])).toEqual([5, 10]);
  });
  it('crecimiento porcentual', () => {
    expect(growthPct(100, 150)).toBe(50);
    expect(growthPct(0, 10)).toBe(100);
    expect(growthPct(0, 0)).toBe(0);
    expect(growthPct(200, 100)).toBe(-50);
  });
});

describe('acceleration', () => {
  it('detecta aceleración positiva', () => {
    // velocidades: 60, 80, 150 → aceleración final: 70
    expect(acceleration([120, 180, 260, 410])).toBe(70);
  });
  it('serie de aceleraciones', () => {
    expect(accelerationSeries([120, 180, 260, 410])).toEqual([20, 70]);
  });
  it('racha de aceleración positiva', () => {
    expect(positiveAccelerationStreak([100, 110, 130, 170, 250])).toBe(3);
    expect(positiveAccelerationStreak([100, 200, 250, 260])).toBe(0);
  });
  it('devuelve 0 con serie corta', () => {
    expect(acceleration([1, 2])).toBe(0);
  });
});

describe('outliers', () => {
  it('media y desviación', () => {
    expect(mean([2, 4, 6])).toBe(4);
    expect(stdDev([2, 4, 6])).toBeCloseTo(2);
  });
  it('z-score', () => {
    expect(zScore(8, [2, 4, 6])).toBeCloseTo(2);
    expect(zScore(4, [4, 4, 4])).toBe(0);
  });
  it('detecta outlier por z-score', () => {
    expect(isZScoreOutlier([10, 11, 9, 10, 12, 10, 45])).toBe(true);
    expect(isZScoreOutlier([10, 11, 9, 10, 12, 10, 11])).toBe(false);
  });
  it('percentiles', () => {
    expect(percentile([1, 2, 3, 4, 5], 50)).toBe(3);
    expect(percentile([1, 2, 3, 4], 25)).toBeCloseTo(1.75);
  });
  it('detecta outlier por IQR', () => {
    expect(isIqrOutlier([10, 12, 11, 13, 12, 11, 60])).toBe(true);
    expect(isIqrOutlier([10, 12, 11, 13, 12, 11, 13])).toBe(false);
  });
});

describe('moving averages', () => {
  it('SMA con ventana', () => {
    expect(sma([1, 2, 3, 4], 2)).toEqual([1, 1.5, 2.5, 3.5]);
    expect(smaLast([1, 2, 3, 4], 2)).toBe(3.5);
  });
  it('EMA arranca en el primer valor y suaviza', () => {
    const result = ema([10, 20, 30], 3);
    expect(result[0]).toBe(10);
    expect(result[1]).toBeCloseTo(15);
    expect(result[2]).toBeCloseTo(22.5);
  });
  it('series vacías', () => {
    expect(sma([], 3)).toEqual([]);
    expect(ema([], 3)).toEqual([]);
  });
});

describe('momentum', () => {
  it('saturate normaliza entre 0 y 1', () => {
    expect(saturate(0, 50)).toBe(0);
    expect(saturate(50, 50)).toBe(1);
    expect(saturate(5000, 50)).toBe(1);
    expect(saturate(25, 50)).toBeGreaterThan(0.5);
  });
  it('recency decae con half-life', () => {
    expect(recencyScore(0)).toBe(1);
    expect(recencyScore(48)).toBeCloseTo(0.5);
    expect(recencyScore(96)).toBeCloseTo(0.25);
  });
  it('momentum alto para señal caliente', () => {
    const hot = momentum({
      frequency: 60,
      engagement: 700,
      growthPct: 150,
      acceleration: 25,
      recencyHours: 2,
    });
    const cold = momentum({
      frequency: 2,
      engagement: 5,
      growthPct: 0,
      acceleration: 0,
      recencyHours: 200,
    });
    expect(hot).toBeGreaterThan(80);
    expect(cold).toBeLessThan(15);
  });
});

describe('prediction', () => {
  it('regresión lineal perfecta', () => {
    const fit = linearRegression([2, 4, 6, 8]);
    expect(fit.slope).toBeCloseTo(2);
    expect(fit.intercept).toBeCloseTo(2);
    expect(fit.r2).toBeCloseTo(1);
  });
  it('forecast lineal extrapola', () => {
    expect(forecastLinear([2, 4, 6, 8], 1)).toBeCloseTo(10);
    expect(forecastLinear([2, 4, 6, 8], 3)).toBeCloseTo(14);
  });
  it('forecast nunca es negativo', () => {
    expect(forecastLinear([10, 7, 4, 1], 5)).toBe(0);
  });
  it('moving average forecast', () => {
    expect(movingAverageForecast([1, 2, 3, 4, 5], 3)).toBe(4);
  });
  it('suavizado exponencial', () => {
    expect(exponentialSmoothingForecast([10], 0.5)).toBe(10);
    expect(exponentialSmoothingForecast([10, 20], 0.5)).toBe(15);
  });
  it('predict combina modelos según r2', () => {
    const p = predict([100, 140, 180, 220, 260]);
    expect(p.h24).toBeGreaterThan(260);
    expect(p.d7).toBeGreaterThan(p.h24);
    expect(p.r2).toBeCloseTo(1);
  });
});

describe('confidence', () => {
  it('alta con serie limpia y larga', () => {
    const series = Array.from({ length: 14 }, (_, i) => 100 + i * 20);
    const c = confidence(series, linearRegression(series));
    expect(c.level).toBe('high');
    expect(c.score).toBeGreaterThanOrEqual(70);
    expect(c.explanation.length).toBeGreaterThan(10);
  });
  it('baja con serie corta y ruidosa', () => {
    const series = [5, 90, 3, 80];
    const c = confidence(series, linearRegression(series));
    expect(c.level).toBe('low');
  });
});

describe('radarScore', () => {
  it('señal explosiva cerca de 100', () => {
    const score = radarScore({
      velocity: 40,
      acceleration: 20,
      frequency: 80,
      engagement: 1000,
      recencyHours: 1,
    });
    expect(score).toBeGreaterThan(90);
  });
  it('señal muerta cerca de 0', () => {
    const score = radarScore({
      velocity: 0,
      acceleration: 0,
      frequency: 0,
      engagement: 0,
      recencyHours: 500,
    });
    expect(score).toBeLessThan(5);
  });
  it('siempre entre 0 y 100', () => {
    const score = radarScore({
      velocity: 1e6,
      acceleration: 1e6,
      frequency: 1e6,
      engagement: 1e6,
      recencyHours: 0,
    });
    expect(score).toBeLessThanOrEqual(100);
  });
});
