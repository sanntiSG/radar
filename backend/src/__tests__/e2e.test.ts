import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import type { Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { seedDatabase } from '../seed/seedData';

/**
 * E2E: MongoDB en memoria → seed real → API real por HTTP.
 * Verifica el flujo completo sin necesitar credenciales de Atlas.
 */

let mongo: MongoMemoryServer;
let server: Server;
let base: string;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri('radar'));
  await seedDatabase();

  const app = createApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, resolve);
  });
  const address = server.address();
  if (typeof address === 'object' && address) base = `http://127.0.0.1:${address.port}`;
}, 120_000);

afterAll(async () => {
  server?.close();
  await mongoose.disconnect();
  await mongo?.stop();
});

const get = async (path: string) => {
  const res = await fetch(`${base}${path}`);
  expect(res.ok, `${path} → HTTP ${res.status}`).toBe(true);
  return res.json() as Promise<any>;
};

describe('Radar end-to-end', () => {
  it('health reporta BD conectada', async () => {
    const health = await get('/health');
    expect(health.status).toBe('ok');
    expect(health.db).toBe('connected');
  });

  it('señales sembradas con score, confianza y sparkline', async () => {
    const { items, total } = await get('/api/signals');
    expect(total).toBeGreaterThanOrEqual(20);
    const top = items[0];
    expect(top.radarScore).toBeGreaterThan(0);
    expect(['low', 'medium', 'high']).toContain(top.confidence);
    expect(top.sparkline.length).toBeGreaterThanOrEqual(10);
    expect(top.explanation.length).toBeGreaterThan(10);
    // Orden por radarScore desc
    expect(top.radarScore).toBeGreaterThanOrEqual(items[1].radarScore);
  });

  it('stats agregadas', async () => {
    const stats = await get('/api/signals/stats');
    expect(stats.total).toBeGreaterThan(0);
    expect(stats.avgRadarScore).toBeGreaterThan(0);
  });

  it('detalle de señal por slug', async () => {
    const signal = await get('/api/signals/mini-impresora-portatil');
    expect(signal.name).toBe('Mini impresora portátil');
    expect(signal.aliases).toContain('portable printer');
  });

  it('filtro por categoría', async () => {
    const { items } = await get('/api/signals?category=Cocina');
    expect(items.length).toBeGreaterThan(0);
    for (const s of items) expect(s.category).toBe('Cocina');
  });

  it('productos, hashtags y tendencias', async () => {
    const products = await get('/api/products');
    expect(products.total).toBe(10);
    const hashtags = await get('/api/hashtags');
    expect(hashtags.total).toBe(6);
    const trends = await get('/api/trends');
    expect(trends.total).toBe(6);
  });

  it('histórico de 14 días por entidad', async () => {
    const history = await get('/api/history/product/mini-impresora-portatil');
    expect(history.points.length).toBe(14);
    expect(history.points[0].mentions).toBeGreaterThan(0);
  });

  it('insights automáticos generados', async () => {
    const { items } = await get('/api/insights');
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].text.length).toBeGreaterThan(20);
  });

  it('alertas disparadas por el motor', async () => {
    const { items } = await get('/api/alerts');
    expect(items.length).toBeGreaterThan(0);
    expect(['radar_score', 'outlier', 'acceleration']).toContain(items[0].type);
  });

  it('la señal exponencial supera a la que se enfría', async () => {
    const rising = await get('/api/signals/mini-impresora-portatil');
    const cooling = await get('/api/signals/corrector-de-postura');
    expect(rising.radarScore).toBeGreaterThan(cooling.radarScore);
  });
});
