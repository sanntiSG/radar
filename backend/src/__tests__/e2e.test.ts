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

  it('señal incluye factores explicativos (N1)', async () => {
    const signal = await get('/api/signals/mini-impresora-portatil');
    expect(Array.isArray(signal.factors)).toBe(true);
    expect(signal.factors.length).toBeGreaterThanOrEqual(5);
    const velFactor = signal.factors.find((f: { key: string }) => f.key === 'velocity');
    expect(velFactor).toBeDefined();
    expect(velFactor.contribution).toBeGreaterThanOrEqual(0);
    expect(velFactor.weight).toBe(30);
    // Todos los factores del Radar Score tienen contribución 0-100
    for (const f of signal.factors.filter((f: { weight: number | null }) => f.weight !== null)) {
      expect(f.contribution).toBeGreaterThanOrEqual(0);
      expect(f.contribution).toBeLessThanOrEqual(100);
    }
  });
});

describe('Fase 2 end-to-end', () => {
  let token = '';
  const authed = (path: string, init: RequestInit = {}) =>
    fetch(`${base}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(init.headers as Record<string, string>),
      },
    });

  it('fuentes con cadencias y metadatos', async () => {
    const data = await get('/api/sources');
    expect(data.sources.length).toBe(3);
    expect(data.schedule.ingest).toBe('Cada 2 horas');
    const reddit = data.sources.find((s: { name: string }) => s.name === 'reddit');
    expect(reddit.mode).toContain('sin credenciales');
    expect(reddit.cadence).toBeTruthy();
  });

  it('login demo devuelve JWT y /me funciona', async () => {
    const res = await fetch(`${base}/api/auth/demo`, { method: 'POST' });
    expect(res.ok).toBe(true);
    const data = (await res.json()) as any;
    token = data.token;
    expect(token.length).toBeGreaterThan(20);
    expect(data.user.email).toBe('demo@radar.app');

    const me = await authed('/api/auth/me');
    expect(me.ok).toBe(true);
    const meData = (await me.json()) as any;
    expect(meData.preferences.accent).toBe('jade');
    expect(meData.preferences.sections.length).toBe(4);
  });

  it('rutas protegidas rechazan sin token', async () => {
    const res = await fetch(`${base}/api/me`);
    expect(res.status).toBe(401);
  });

  it('preferencias se actualizan y persisten', async () => {
    const put = await authed('/api/me', {
      method: 'PUT',
      body: JSON.stringify({
        preferences: {
          accent: 'azure',
          defaultCategory: 'Gadgets',
          defaultSort: 'detectedAt',
          sections: [
            { id: 'feed', visible: true, order: 0 },
            { id: 'stats', visible: false, order: 1 },
            { id: 'insights', visible: true, order: 2 },
            { id: 'watchlist', visible: true, order: 3 },
          ],
        },
      }),
    });
    expect(put.ok).toBe(true);

    const me = await ((await authed('/api/auth/me')).json() as Promise<any>);
    expect(me.preferences.accent).toBe('azure');
    expect(me.preferences.defaultCategory).toBe('Gadgets');
    const stats = me.preferences.sections.find((s: { id: string }) => s.id === 'stats');
    expect(stats.visible).toBe(false);
  });

  it('acento inválido se ignora', async () => {
    await authed('/api/me', {
      method: 'PUT',
      body: JSON.stringify({ preferences: { accent: 'hotpink' } }),
    });
    const me = await ((await authed('/api/auth/me')).json() as Promise<any>);
    expect(me.preferences.accent).toBe('azure');
  });

  it('watchlist personal: fijar, listar y quitar pines', async () => {
    const add = await authed('/api/watchlists/me/items', {
      method: 'POST',
      body: JSON.stringify({ entityType: 'product', slug: 'mini-impresora-portatil' }),
    });
    expect(add.ok).toBe(true);

    const list = await ((await authed('/api/watchlists/me')).json() as Promise<any>);
    expect(list.items.some((i: { slug: string }) => i.slug === 'mini-impresora-portatil')).toBe(true);
    expect(list.signals[0].name).toBe('Mini impresora portátil');

    const del = await authed('/api/watchlists/me/items/mini-impresora-portatil', {
      method: 'DELETE',
    });
    expect(del.ok).toBe(true);
    const after = await ((await authed('/api/watchlists/me')).json() as Promise<any>);
    expect(after.items.length).toBe(0);
  });

  it('export CSV de señales y productos', async () => {
    const res = await fetch(`${base}/api/export/signals.csv`);
    expect(res.ok).toBe(true);
    expect(res.headers.get('content-type')).toContain('text/csv');
    const csv = await res.text();
    expect(csv).toContain('Radar Score');
    expect(csv.split('\r\n').length).toBeGreaterThan(10);

    const products = await fetch(`${base}/api/export/products.csv`);
    expect(products.ok).toBe(true);
    expect((await products.text())).toContain('Mini impresora portátil');
  });

  it('contador de alertas no vistas', async () => {
    const data = await get('/api/alerts/unseen');
    expect(data.count).toBeGreaterThan(0);
  });

  it('GET /api/meta devuelve categorias, fuentes y paises (N2)', async () => {
    const data = await get('/api/meta');
    expect(Array.isArray(data.categories)).toBe(true);
    expect(data.categories.length).toBeGreaterThan(5);
    expect(data.sources.length).toBe(3);
    expect(data.countries.length).toBeGreaterThan(5);
    expect(data.countries[0].code).toBe('global');
  });

  it('Radar Personal: nichos/plataformas/keywords persisten en /api/me (N2)', async () => {
    const put = await authed('/api/me', {
      method: 'PUT',
      body: JSON.stringify({
        preferences: {
          country: 'AR',
          niches: ['Gadgets', 'Cocina'],
          platforms: ['reddit'],
          keywords: ['impresora', 'gadget'],
        },
      }),
    });
    expect(put.ok).toBe(true);
    const me = await ((await authed('/api/auth/me')).json() as Promise<any>);
    expect(me.preferences.country).toBe('AR');
    expect(me.preferences.niches).toContain('Gadgets');
    expect(me.preferences.platforms).toContain('reddit');
    expect(me.preferences.keywords).toContain('impresora');
  });

  it('Radar Personal: pais invalido se ignora (N2)', async () => {
    await authed('/api/me', {
      method: 'PUT',
      body: JSON.stringify({ preferences: { country: 'ZZZZ' } }),
    });
    const me = await ((await authed('/api/auth/me')).json() as Promise<any>);
    expect(me.preferences.country).toBe('AR'); // previous valid value
  });

  it('POST /api/assistant/query — intencion top, categoria y fuentes (N4)', async () => {
    // Intent: top
    const top = await fetch(`${base}/api/assistant/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: 'qué está creciendo ahora' }),
    });
    expect(top.ok).toBe(true);
    const topData = (await top.json()) as any;
    expect(['top', 'category', 'opportunities']).toContain(topData.kind);
    expect(typeof topData.answer).toBe('string');
    expect(topData.answer.length).toBeGreaterThan(5);

    // Intent: category
    const cat = await fetch(`${base}/api/assistant/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: 'señales de gadgets' }),
    });
    const catData = (await cat.json()) as any;
    expect(catData.kind).toBe('category');
    expect(catData.signals.length).toBeGreaterThan(0);

    // Intent: sources
    const src = await fetch(`${base}/api/assistant/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: 'de dónde vienen los datos' }),
    });
    const srcData = (await src.json()) as any;
    expect(srcData.kind).toBe('sources');

    // Intent: stats
    const stats = await fetch(`${base}/api/assistant/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: 'cuántas señales hay en total' }),
    });
    const statsData = (await stats.json()) as any;
    expect(statsData.kind).toBe('stats');
  });

  it('GET /api/opportunities devuelve senales ordenadas por opportunityScore (N3)', async () => {
    const data = await get('/api/opportunities');
    expect(Array.isArray(data.items)).toBe(true);
    expect(data.items.length).toBeGreaterThan(0);
    const first = data.items[0];
    expect(first.opportunityScore).toBeGreaterThan(0);
    expect(typeof first.reason).toBe('string');
    expect(first.reason.length).toBeGreaterThan(5);
    // ordenadas de mayor a menor
    for (let i = 1; i < data.items.length; i++) {
      expect(data.items[i - 1].opportunityScore).toBeGreaterThanOrEqual(data.items[i].opportunityScore);
    }
  });

  // ─────────────────────────────────────────────────────────────────────
  // N5 — Radar Diario
  // ─────────────────────────────────────────────────────────────────────

  it('GET /api/daily devuelve secciones no vacías (N5)', async () => {
    const data = await get('/api/daily');

    // Estructura base
    expect(typeof data.date).toBe('string');
    expect(data.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(typeof data.streak).toBe('number');

    // Secciones presentes
    expect(data.sections).toBeDefined();
    expect(Array.isArray(data.sections.new)).toBe(true);
    expect(Array.isArray(data.sections.rising)).toBe(true);
    expect(Array.isArray(data.sections.moving)).toBe(true);
    expect(Array.isArray(data.sections.keywordHighlights)).toBe(true);

    // Al menos una sección con datos (entre rising y moving)
    const hasData = data.sections.rising.length > 0 || data.sections.moving.length > 0;
    expect(hasData).toBe(true);
  });

  it('GET /api/daily opportunityOfDay es una señal válida o null (N5)', async () => {
    const data = await get('/api/daily');
    if (data.sections.opportunityOfDay !== null) {
      const signal = data.sections.opportunityOfDay;
      expect(typeof signal.name).toBe('string');
      expect(typeof signal.radarScore).toBe('number');
      expect(typeof signal.slug).toBe('string');
    }
  });

  it('GET /api/daily streak arranca en 0 para usuarios anónimos (N5)', async () => {
    const data = await get('/api/daily');
    // Sin token = anónimo → streak siempre 0
    expect(data.streak).toBe(0);
  });
});
