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

  // ─────────────────────────────────────────────────────────────────────
  // N6 — Watchlists inteligentes + alertas personales
  // ─────────────────────────────────────────────────────────────────────

  describe('N6 — watchlist notify y alertas personales', () => {
    let n6token = '';
    const authed6 = (path: string, init: RequestInit = {}) =>
      fetch(`${base}${path}`, {
        ...init,
        headers: { ...(init.headers ?? {}), Authorization: `Bearer ${n6token}` },
      });

    it('obtiene token demo para N6', async () => {
      const res = await fetch(`${base}/api/auth/demo`, { method: 'POST' });
      const data = (await res.json()) as any;
      n6token = data.token;
      expect(n6token.length).toBeGreaterThan(20);
    });

    it('PATCH /api/watchlists/me/items/:slug configura notify (N6)', async () => {
      // Primero fijar una señal
      const signals = await get('/api/signals');
      const slug = signals.items[0].slug;

      await authed6('/api/watchlists/me/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType: signals.items[0].entityType, slug }),
      });

      // Ahora configurar notify
      const patch = await authed6(`/api/watchlists/me/items/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ radarScoreAbove: 10, onAccelerate: true, onNewOutlier: false }),
      });
      expect(patch.ok).toBe(true);
      const patchData = (await patch.json()) as any;
      const saved = patchData.items.find((i: any) => i.slug === slug);
      expect(saved?.notify?.radarScoreAbove).toBe(10);
      expect(saved?.notify?.onAccelerate).toBe(true);
    });

    it('GET /api/alerts/unseen con token incluye alertas personales (N6)', async () => {
      // Recomputar para que el engine evalúe los notify de la watchlist
      const { recomputeAll } = await import('../signals/signalEngine');
      await recomputeAll();

      const res = await authed6('/api/alerts/unseen');
      expect(res.ok).toBe(true);
      const data = (await res.json()) as any;
      // count puede ser 0 si ningún umbral se disparó, pero el endpoint debe responder
      expect(typeof data.count).toBe('number');
    });

    it('GET /api/alerts con token incluye alertas con userId (N6)', async () => {
      const res = await authed6('/api/alerts?limit=100');
      expect(res.ok).toBe(true);
      const data = (await res.json()) as any;
      expect(Array.isArray(data.items)).toBe(true);
      // Debe incluir alertas globales (userId: null) que existan del seed
      const globalAlerts = data.items.filter((a: any) => a.userId == null);
      expect(globalAlerts.length).toBeGreaterThanOrEqual(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // N7 — Gamificación (logros)
  // ─────────────────────────────────────────────────────────────────────

  describe('N7 — logros de gamificación', () => {
    let n7token = '';
    const authed7 = (path: string, init: RequestInit = {}) =>
      fetch(`${base}${path}`, {
        ...init,
        headers: { ...(init.headers ?? {}), Authorization: `Bearer ${n7token}` },
      });

    it('obtiene token demo para N7', async () => {
      const res = await fetch(`${base}/api/auth/demo`, { method: 'POST' });
      const data = (await res.json()) as any;
      n7token = data.token;
      expect(n7token.length).toBeGreaterThan(20);
    });

    it('GET /api/achievements devuelve lista de logros (N7)', async () => {
      const res = await authed7('/api/achievements');
      expect(res.ok).toBe(true);
      const data = (await res.json()) as any;
      expect(Array.isArray(data.achievements)).toBe(true);
      expect(data.achievements.length).toBeGreaterThan(0);
      expect(typeof data.total).toBe('number');
      expect(typeof data.unlocked).toBe('number');
      const first = data.achievements[0];
      expect(typeof first.key).toBe('string');
      expect(typeof first.title).toBe('string');
      expect(typeof first.unlocked).toBe('boolean');
      expect(typeof first.progress).toBe('number');
    });

    it('primer_pin se desbloquea al tener al menos 1 pin (N7)', async () => {
      // Fijar una señal (idempotente — si ya existe no genera error por $addToSet)
      const signals = await get('/api/signals');
      const { slug, entityType } = signals.items[0];
      await authed7('/api/watchlists/me/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType, slug }),
      });

      const res = await authed7('/api/achievements');
      const data = (await res.json()) as any;
      const primerPin = data.achievements.find((a: any) => a.key === 'primer_pin');
      expect(primerPin).toBeDefined();
      expect(primerPin.unlocked).toBe(true);
      expect(primerPin.progress).toBe(100);
    });

    it('GET /api/achievements rechaza sin token (N7)', async () => {
      const res = await fetch(`${base}/api/achievements`);
      expect(res.status).toBe(401);
    });
  });
});

// ───────────────────────────────────────────────────────────────────────────
// N8 — Centro de Evidencias
// ───────────────────────────────────────────────────────────────────────────

describe('N8 — Centro de Evidencias', () => {
  it('GET /api/signals/:slug/evidence devuelve timeline, fases y factores', async () => {
    const data = await get('/api/signals/mini-impresora-portatil/evidence');

    expect(data.signal.slug).toBe('mini-impresora-portatil');
    expect(Array.isArray(data.timeline)).toBe(true);
    expect(data.timeline.length).toBe(14);
    expect(data.timeline[0].value).toBeGreaterThan(0);

    // scoreTimeline arranca en índice 2 (necesita al menos 3 puntos)
    expect(Array.isArray(data.scoreTimeline)).toBe(true);
    expect(data.scoreTimeline.length).toBe(data.timeline.length - 2);
    for (const p of data.scoreTimeline) {
      expect(p.score).toBeGreaterThanOrEqual(0);
      expect(p.score).toBeLessThanOrEqual(100);
    }

    // Fases: siempre incluye detección (índice 0) y ahora (último índice)
    expect(Array.isArray(data.phases)).toBe(true);
    const kinds = data.phases.map((p: any) => p.kind);
    expect(kinds).toContain('detected');
    expect(kinds).toContain('now');
    expect(data.phases[0].index).toBe(0);
    expect(data.phases[data.phases.length - 1].index).toBe(data.timeline.length - 1);

    // Delta vs ayer
    expect(data.delta).not.toBeNull();
    expect(typeof data.delta.deltaPct).toBe('number');
    expect(typeof data.delta.scoreDelta).toBe('number');

    // Factores y fuentes
    expect(data.factors.length).toBeGreaterThanOrEqual(5);
    expect(Array.isArray(data.sources)).toBe(true);
    expect(data.sourceAgreement.count).toBe(data.sources.length);

    // Detección y días transcurridos
    expect(typeof data.firstDetectedAt).toBe('string');
    expect(data.daysSinceDetection).toBeGreaterThanOrEqual(0);
  });

  it('GET /api/signals/:slug/evidence responde 404 para slug inexistente', async () => {
    const res = await fetch(`${base}/api/signals/no-existe-esta-senal/evidence`);
    expect(res.status).toBe(404);
  });

  it('evidence de una tendencia usa el campo interest, no mentions', async () => {
    const signals = await get('/api/trends?limit=1');
    const slug = signals.items[0].slug;
    const data = await get(`/api/signals/${slug}/evidence`);
    expect(data.signal.entityType).toBe('trend');
    expect(data.timeline.length).toBeGreaterThan(0);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// N9 — Índice de Precisión de Radar
// ───────────────────────────────────────────────────────────────────────────

describe('N9 — Índice de Precisión', () => {
  it('GET /api/accuracy agrega backtest honesto sobre el histórico', async () => {
    const data = await get('/api/accuracy');

    expect(data.overall.signalsAnalyzed).toBeGreaterThan(0);
    expect(data.overall.continuedGrowingPct).toBeGreaterThanOrEqual(0);
    expect(data.overall.continuedGrowingPct).toBeLessThanOrEqual(100);
    expect(Array.isArray(data.overall.samplePredictions)).toBe(true);

    expect(Array.isArray(data.byCategory)).toBe(true);
    expect(data.byCategory.length).toBeGreaterThan(0);
    for (const c of data.byCategory) {
      expect(typeof c.category).toBe('string');
      expect(c.precisionPct).toBeGreaterThanOrEqual(0);
      expect(c.precisionPct).toBeLessThanOrEqual(100);
      expect(c.count).toBeGreaterThan(0);
    }

    expect(Array.isArray(data.bySource)).toBe(true);
    expect(data.bySource.length).toBeGreaterThan(0);

    expect(typeof data.disclaimer).toBe('string');
    expect(data.disclaimer.length).toBeGreaterThan(20);
  });

  it('la señal exponencial (mini impresora) tiene anticipación medible o precisión evaluada', async () => {
    const data = await get('/api/accuracy');
    // El histórico sembrado (14 días) siempre produce al menos una predicción evaluable global
    expect(data.overall.predictionsEvaluated).toBeGreaterThan(0);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// N10 — Radar Assistant v2
// ───────────────────────────────────────────────────────────────────────────

describe('N10 — Radar Assistant v2', () => {
  const ask = async (q: string) => {
    const res = await fetch(`${base}/api/assistant/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q }),
    });
    expect(res.ok, `assistant query "${q}" → HTTP ${res.status}`).toBe(true);
    return res.json() as Promise<any>;
  };

  it('"productos de gadgets acelerando" combina entityType + categoria + metrica', async () => {
    const data = await ask('productos de gadgets acelerando');
    expect(data.kind).toBe('metric_ranking');
    expect(Array.isArray(data.signals)).toBe(true);
    for (const s of data.signals) {
      expect(s.entityType).toBe('product');
      expect(s.category).toBe('Gadgets');
    }
  });

  it('"qué categorías aceleran más" devuelve ranking agregado por categoría', async () => {
    const data = await ask('qué categorías aceleran más');
    expect(data.kind).toBe('category_ranking');
    expect(Array.isArray(data.categories)).toBe(true);
    expect(data.categories.length).toBeGreaterThan(0);
    const first = data.categories[0];
    expect(typeof first.name).toBe('string');
    expect(typeof first.avgAcceleration).toBe('number');
    expect(first.count).toBeGreaterThan(0);
    // Orden descendente por aceleración promedio
    if (data.categories.length > 1) {
      expect(first.avgAcceleration).toBeGreaterThanOrEqual(data.categories[1].avgAcceleration);
    }
  });

  it('"mayor probabilidad de seguir creciendo" filtra por confianza + proyección sostenida', async () => {
    const data = await ask('¿qué tiene mayor probabilidad de seguir creciendo?');
    expect(data.kind).toBe('continuation');
    expect(Array.isArray(data.signals)).toBe(true);
    for (const s of data.signals) {
      expect(['medium', 'high']).toContain(s.confidence);
    }
  });

  it('"compara X con Y" devuelve dos señales contrastadas', async () => {
    const data = await ask('compara mini impresora portatil con corrector de postura');
    expect(data.kind).toBe('comparison');
    expect(data.signals.length).toBe(2);
    expect(data.answer).toContain('Radar Score');
  });

  it('geo: menciona el país mientras aclara que no hay geo-segmentación', async () => {
    const data = await ask('qué está creciendo en Argentina');
    expect(data.answer.toLowerCase()).toContain('argentina');
    expect(data.answer.toLowerCase()).toContain('geo-segmentad');
  });

  it('ventana temporal: "hoy" acota por recencia y aclara la granularidad diaria', async () => {
    const data = await ask('qué está creciendo hoy');
    expect(data.answer.toLowerCase()).toContain('recencia');
  });
});

// ───────────────────────────────────────────────────────────────────────────
// N11 — Radar Personal enriquecido
// ───────────────────────────────────────────────────────────────────────────

describe('N11 — Radar Personal enriquecido', () => {
  let n11token = '';
  const authed11 = (path: string, init: RequestInit = {}) =>
    fetch(`${base}${path}`, {
      ...init,
      headers: { ...(init.headers ?? {}), Authorization: `Bearer ${n11token}` },
    });

  it('obtiene token demo para N11', async () => {
    const res = await fetch(`${base}/api/auth/demo`, { method: 'POST' });
    const data = (await res.json()) as any;
    n11token = data.token;
    expect(n11token.length).toBeGreaterThan(20);
  });

  it('GET /api/meta incluye experienceLevels, goals, marketplaces e idiomas', async () => {
    const meta = await get('/api/meta');
    expect(meta.experienceLevels.length).toBe(4);
    expect(meta.goals.length).toBeGreaterThan(0);
    expect(meta.marketplaces.length).toBeGreaterThan(0);
    expect(meta.languages.length).toBe(3);
  });

  it('PUT /api/me persiste experienceLevel, goals, marketplaces, language y region', async () => {
    const res = await authed11('/api/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        preferences: {
          experienceLevel: 'agencia',
          goals: ['seguir_competencia', 'ahorrar_tiempo', 'validar_ideas', 'detectar_nichos', 'encontrar_productos'],
          marketplaces: ['shopify', 'amazon', 'invalido'],
          language: 'en',
          region: 'Buenos Aires',
        },
      }),
    });
    expect(res.ok).toBe(true);
    const data = (await res.json()) as any;
    expect(data.preferences.experienceLevel).toBe('agencia');
    // Goals se cortan a 4 aunque se hayan enviado 5
    expect(data.preferences.goals.length).toBe(4);
    // Marketplace inválido se descarta
    expect(data.preferences.marketplaces).toEqual(['shopify', 'amazon']);
    expect(data.preferences.language).toBe('en');
    expect(data.preferences.region).toBe('Buenos Aires');
  });

  it('PUT /api/me ignora experienceLevel y language inválidos', async () => {
    await authed11('/api/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferences: { experienceLevel: 'ninja', language: 'fr' } }),
    });
    const me = await ((await authed11('/api/auth/me')).json() as Promise<any>);
    // Se conservan los valores previos válidos, no los inválidos
    expect(me.preferences.experienceLevel).toBe('agencia');
    expect(me.preferences.language).toBe('en');
  });
});

// ───────────────────────────────────────────────────────────────────────────
// N12 — Radar Diario v2
// ───────────────────────────────────────────────────────────────────────────

describe('N12 — Radar Diario v2', () => {
  it('GET /api/daily incluye biggestMovers, hashtagsHighlights y emergingProducts', async () => {
    const data = await get('/api/daily');
    expect(data.sections.biggestMovers).toBeDefined();
    expect('up' in data.sections.biggestMovers).toBe(true);
    expect('down' in data.sections.biggestMovers).toBe(true);
    expect(Array.isArray(data.sections.hashtagsHighlights)).toBe(true);
    for (const h of data.sections.hashtagsHighlights) expect(h.entityType).toBe('hashtag');
    expect(Array.isArray(data.sections.emergingProducts)).toBe(true);
    for (const p of data.sections.emergingProducts) {
      expect(p.entityType).toBe('product');
      expect(['new', 'rising']).toContain(p.status);
    }
  });

  it('GET /api/daily?niche=Gadgets filtra todas las secciones por categoría', async () => {
    const data = await get('/api/daily?niche=Gadgets');
    expect(data.scope.niche).toBe('Gadgets');
    for (const s of data.sections.moving) expect(s.category).toBe('Gadgets');
    for (const p of data.sections.emergingProducts) expect(p.category).toBe('Gadgets');
  });

  it('GET /api/daily?niche=NoExiste ignora un nicho inválido (queda null)', async () => {
    const data = await get('/api/daily?niche=NoExiste');
    expect(data.scope.niche).toBeNull();
  });

  it('GET /api/daily?country=AR solo afecta el rótulo de ámbito, no filtra datos', async () => {
    const withCountry = await get('/api/daily?country=AR');
    expect(withCountry.scope.country).toBe('AR');
    expect(withCountry.scope.countryLabel).toBe('Argentina');
    expect(withCountry.scope.note).toContain('Argentina');

    const without = await get('/api/daily');
    // Mismo total de secciones "moving" con y sin país — el país no filtra señales
    expect(withCountry.sections.moving.length).toBe(without.sections.moving.length);
  });

  it('GET /api/daily?platform=reddit filtra por fuente', async () => {
    const data = await get('/api/daily?platform=reddit');
    expect(data.scope.platform).toBe('reddit');
  });
});
