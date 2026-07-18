import { connectDb, disconnectDb } from '../config/db';
import { Alert, Hashtag, Product, Signal, Snapshot, Trend, Watchlist } from '../models';
import { slugify } from '../services/canonicalize';
import { recomputeAll } from '../signals/signalEngine';

/**
 * Seed realista: entidades canónicas con 14 días de snapshots que siguen
 * curvas de mercado reales (despegue exponencial, spike viral, meseta,
 * enfriamiento). Las señales se generan con el MISMO recomputeAll() del
 * pipeline, así el dashboard nunca arranca vacío y los datos son coherentes.
 */

type Curve = 'exponential' | 'linear' | 'spike' | 'flat' | 'cooling';

interface SeedEntity {
  name: string;
  category: string;
  aliases: string[];
  curve: Curve;
  base: number; // menciones iniciales
  engagementFactor: number;
}

const PRODUCTS: SeedEntity[] = [
  { name: 'Mini impresora portátil', category: 'Gadgets', curve: 'exponential', base: 15, engagementFactor: 14, aliases: ['portable printer', 'mini printer', 'impresora termica'] },
  { name: 'Organizador magnético', category: 'Hogar', curve: 'linear', base: 10, engagementFactor: 8, aliases: ['magnetic organizer'] },
  { name: 'Botella térmica inteligente', category: 'Cocina', curve: 'exponential', base: 8, engagementFactor: 11, aliases: ['smart water bottle', 'smart bottle'] },
  { name: 'Luces LED inteligentes', category: 'Gadgets', curve: 'spike', base: 25, engagementFactor: 16, aliases: ['led strip lights', 'smart led'] },
  { name: 'Masajeador de cuello', category: 'Salud y bienestar', curve: 'linear', base: 12, engagementFactor: 9, aliases: ['neck massager'] },
  { name: 'Fuente de agua para mascotas', category: 'Mascotas', curve: 'exponential', base: 6, engagementFactor: 10, aliases: ['pet water fountain', 'cat fountain'] },
  { name: 'Freidora de aire compacta', category: 'Cocina', curve: 'flat', base: 40, engagementFactor: 6, aliases: ['air fryer', 'compact air fryer'] },
  { name: 'Corrector de postura', category: 'Fitness', curve: 'cooling', base: 30, engagementFactor: 5, aliases: ['posture corrector'] },
  { name: 'Aspiradora portátil para auto', category: 'Automotor', curve: 'linear', base: 9, engagementFactor: 7, aliases: ['car vacuum', 'portable car vacuum'] },
  { name: 'Proyector portátil HD', category: 'Tecnología', curve: 'spike', base: 14, engagementFactor: 13, aliases: ['mini projector', 'portable projector'] },
];

const HASHTAGS: SeedEntity[] = [
  { name: '#amazonfinds', category: 'General', curve: 'exponential', base: 30, engagementFactor: 20, aliases: [] },
  { name: '#tiktokmademebuyit', category: 'General', curve: 'exponential', base: 26, engagementFactor: 24, aliases: [] },
  { name: '#viralproducts', category: 'General', curve: 'linear', base: 18, engagementFactor: 15, aliases: [] },
  { name: '#musthave', category: 'General', curve: 'flat', base: 35, engagementFactor: 10, aliases: [] },
  { name: '#gadgets2026', category: 'Gadgets', curve: 'spike', base: 8, engagementFactor: 18, aliases: [] },
  { name: '#homeorganization', category: 'Hogar', curve: 'linear', base: 14, engagementFactor: 9, aliases: [] },
];

const TRENDS: SeedEntity[] = [
  { name: 'Impresión portátil', category: 'Gadgets', curve: 'exponential', base: 35, engagementFactor: 0, aliases: ['mini printer'] },
  { name: 'Organización magnética del hogar', category: 'Hogar', curve: 'linear', base: 28, engagementFactor: 0, aliases: ['magnetic organizer'] },
  { name: 'Hidratación inteligente', category: 'Salud y bienestar', curve: 'exponential', base: 22, engagementFactor: 0, aliases: ['smart water bottle'] },
  { name: 'Iluminación ambiental LED', category: 'Gadgets', curve: 'spike', base: 45, engagementFactor: 0, aliases: ['led lights'] },
  { name: 'Bienestar para mascotas', category: 'Mascotas', curve: 'linear', base: 30, engagementFactor: 0, aliases: ['pet wellness'] },
  { name: 'Cocina saludable exprés', category: 'Cocina', curve: 'flat', base: 55, engagementFactor: 0, aliases: ['air fryer recipes'] },
];

/** Genera 14 valores según la forma de la curva, con ruido determinista. */
function generateSeries(curve: Curve, base: number): number[] {
  const days = 14;
  const out: number[] = [];
  for (let i = 0; i < days; i++) {
    const noise = 1 + 0.12 * Math.sin(i * 2.7) + 0.06 * Math.cos(i * 5.3);
    let value: number;
    switch (curve) {
      case 'exponential':
        value = base * Math.pow(1.22, i) * noise;
        break;
      case 'linear':
        value = (base + i * base * 0.18) * noise;
        break;
      case 'spike':
        value = base * (i === days - 2 ? 4.5 : i === days - 1 ? 3.8 : 1) * noise;
        break;
      case 'flat':
        value = base * noise;
        break;
      case 'cooling':
        value = base * Math.pow(0.88, i) * noise;
        break;
    }
    out.push(Math.max(1, Math.round(value)));
  }
  return out;
}

function dayOffset(daysAgo: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d;
}

async function seedEntity(
  entityType: 'product' | 'hashtag' | 'trend',
  entity: SeedEntity
): Promise<void> {
  const series = generateSeries(entity.curve, entity.base);
  const slug = entityType === 'hashtag'
    ? entity.name.replace(/^#/, '')
    : slugify(entity.name);
  const lastSeenAt = new Date(Date.now() - 2 * 36e5); // hace 2 horas
  const firstSeenAt = dayOffset(13);

  if (entityType === 'product') {
    await Product.updateOne(
      { slug },
      {
        $set: {
          name: entity.name, category: entity.category, aliases: entity.aliases,
          frequency: series[series.length - 1], sources: ['reddit', 'rss'],
          firstSeenAt, lastSeenAt,
        },
      },
      { upsert: true }
    );
  } else if (entityType === 'hashtag') {
    await Hashtag.updateOne(
      { tag: entity.name },
      {
        $set: {
          category: entity.category, frequency: series[series.length - 1],
          sources: ['reddit'], firstSeenAt, lastSeenAt,
        },
      },
      { upsert: true }
    );
  } else {
    await Trend.updateOne(
      { slug },
      {
        $set: {
          name: entity.name, category: entity.category, aliases: entity.aliases,
          frequency: series[series.length - 1], sources: ['google-trends'],
          firstSeenAt, lastSeenAt,
        },
      },
      { upsert: true }
    );
  }

  for (let i = 0; i < series.length; i++) {
    const date = dayOffset(series.length - 1 - i);
    const interest = entityType === 'trend' ? Math.min(100, series[i]) : 0;
    await Snapshot.updateOne(
      { entityType, slug, date },
      {
        $set: {
          mentions: entityType === 'trend' ? 0 : series[i],
          engagement: Math.round(series[i] * entity.engagementFactor),
          interest,
          source: 'seed',
        },
      },
      { upsert: true }
    );
  }
}

async function main() {
  await connectDb();

  console.log('[seed] Limpiando colecciones…');
  await Promise.all([
    Signal.deleteMany({}), Product.deleteMany({}), Hashtag.deleteMany({}),
    Trend.deleteMany({}), Snapshot.deleteMany({}), Alert.deleteMany({}),
  ]);

  console.log('[seed] Creando entidades y snapshots (14 días)…');
  for (const p of PRODUCTS) await seedEntity('product', p);
  for (const h of HASHTAGS) await seedEntity('hashtag', h);
  for (const t of TRENDS) await seedEntity('trend', t);

  console.log('[seed] Generando señales con el pipeline real…');
  const signals = await recomputeAll();

  await Watchlist.updateOne(
    { name: 'Mi watchlist' },
    {
      $set: {
        items: [
          { entityType: 'product', slug: 'mini-impresora-portatil', addedAt: new Date() },
          { entityType: 'hashtag', slug: 'tiktokmademebuyit', addedAt: new Date() },
          { entityType: 'trend', slug: slugify('Hidratación inteligente'), addedAt: new Date() },
        ],
      },
    },
    { upsert: true }
  );

  console.log(`[seed] Listo: ${PRODUCTS.length} productos, ${HASHTAGS.length} hashtags, ${TRENDS.length} tendencias, ${signals} señales`);
  await disconnectDb();
}

main().catch((err) => {
  console.error('[seed] Falló:', err);
  process.exit(1);
});
