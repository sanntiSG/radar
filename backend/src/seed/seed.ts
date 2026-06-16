/**
 * Seed — Datos realistas para el dashboard desde el día 1.
 *
 * Genera señales, tendencias, hashtags y productos con curvas de crecimiento
 * creíbles y snapshots históricos de varios días.
 * Convive con datos reales (flag isFromSeed: true).
 *
 * Uso: npm run seed
 */

import 'dotenv/config';
import { connectDB } from '../config/db';
import { Signal } from '../models/Signal';
import { Trend } from '../models/Trend';
import { Hashtag } from '../models/Hashtag';
import { Product } from '../models/Product';
import { Snapshot } from '../models/Snapshot';

// ── Datos seed ────────────────────────────────────────────────────────────────

interface SeedSignal {
  name: string;
  canonicalName: string;
  category: string;
  radarScore: number;
  growthScore: number;
  confidenceLevel: 'low' | 'medium' | 'high';
  confidenceValue: number;
  status: 'active' | 'fading' | 'exploded';
  velocity: number;
  acceleration: number;
  frequency: number;
  engagement: number;
  momentum: number;
  daysGrowth: number[]; // valores diarios (más antiguo → más reciente)
}

const SEED_SIGNALS: SeedSignal[] = [
  {
    name: 'Mini Impresora Portátil',
    canonicalName: 'mini impresora portatil',
    category: 'Gadgets',
    radarScore: 87,
    growthScore: 82,
    confidenceLevel: 'high',
    confidenceValue: 87,
    status: 'active',
    velocity: 18.4,
    acceleration: 4.2,
    frequency: 287,
    engagement: 42300,
    momentum: 78,
    daysGrowth: [120, 148, 180, 224, 260, 321, 287],
  },
  {
    name: 'Organizador Magnético',
    canonicalName: 'organizador magnetico',
    category: 'Hogar',
    radarScore: 74,
    growthScore: 68,
    confidenceLevel: 'high',
    confidenceValue: 74,
    status: 'active',
    velocity: 12.1,
    acceleration: 2.8,
    frequency: 196,
    engagement: 28700,
    momentum: 65,
    daysGrowth: [80, 102, 124, 148, 167, 184, 196],
  },
  {
    name: 'Botella Térmica Inteligente',
    canonicalName: 'botella termica inteligente',
    category: 'Fitness',
    radarScore: 69,
    growthScore: 61,
    confidenceLevel: 'medium',
    confidenceValue: 69,
    status: 'active',
    velocity: 9.3,
    acceleration: 1.5,
    frequency: 142,
    engagement: 19800,
    momentum: 58,
    daysGrowth: [55, 72, 88, 104, 118, 133, 142],
  },
  {
    name: 'Luces LED Inteligentes',
    canonicalName: 'led inteligente',
    category: 'Hogar',
    radarScore: 91,
    growthScore: 89,
    confidenceLevel: 'high',
    confidenceValue: 91,
    status: 'active',
    velocity: 24.6,
    acceleration: 6.1,
    frequency: 412,
    engagement: 67200,
    momentum: 85,
    daysGrowth: [180, 230, 284, 342, 368, 398, 412],
  },
  {
    name: 'Masaje Eléctrico Percusión',
    canonicalName: 'masaje electrico',
    category: 'Salud y bienestar',
    radarScore: 62,
    growthScore: 55,
    confidenceLevel: 'medium',
    confidenceValue: 62,
    status: 'active',
    velocity: 7.8,
    acceleration: 0.9,
    frequency: 108,
    engagement: 14200,
    momentum: 49,
    daysGrowth: [45, 58, 70, 82, 94, 101, 108],
  },
  {
    name: 'Gadgets de Cocina Virales',
    canonicalName: 'gadget de cocina',
    category: 'Cocina',
    radarScore: 78,
    growthScore: 72,
    confidenceLevel: 'high',
    confidenceValue: 78,
    status: 'active',
    velocity: 14.2,
    acceleration: 3.4,
    frequency: 234,
    engagement: 36100,
    momentum: 70,
    daysGrowth: [98, 124, 152, 178, 204, 220, 234],
  },
  {
    name: 'Cargador Inalámbrico',
    canonicalName: 'cargador inalambrico',
    category: 'Tecnología',
    radarScore: 55,
    growthScore: 48,
    confidenceLevel: 'medium',
    confidenceValue: 55,
    status: 'fading',
    velocity: 4.2,
    acceleration: -1.2,
    frequency: 78,
    engagement: 9800,
    momentum: 38,
    daysGrowth: [92, 101, 108, 112, 89, 82, 78],
  },
  {
    name: 'Auriculares Inalámbricos TWS',
    canonicalName: 'auriculares inalambricos',
    category: 'Tecnología',
    radarScore: 83,
    growthScore: 79,
    confidenceLevel: 'high',
    confidenceValue: 83,
    status: 'active',
    velocity: 19.8,
    acceleration: 5.1,
    frequency: 318,
    engagement: 51400,
    momentum: 76,
    daysGrowth: [140, 178, 214, 256, 284, 302, 318],
  },
];

const SEED_HASHTAGS = [
  { tag: '#amazonfinds', growth: 342, frequency: 8420, momentum: 89, interestLevel: 94 },
  { tag: '#tiktokmademebuyit', growth: 287, frequency: 12340, momentum: 92, interestLevel: 97 },
  { tag: '#viralproducts', growth: 198, frequency: 5680, momentum: 78, interestLevel: 82 },
  { tag: '#musthave', growth: 156, frequency: 4320, momentum: 71, interestLevel: 76 },
  { tag: '#gadgetlover', growth: 134, frequency: 3210, momentum: 65, interestLevel: 69 },
  { tag: '#productreview', growth: 112, frequency: 2890, momentum: 58, interestLevel: 63 },
  { tag: '#dropship', growth: 89, frequency: 1640, momentum: 48, interestLevel: 52 },
  { tag: '#homeoffice', growth: 74, frequency: 2100, momentum: 44, interestLevel: 47 },
  { tag: '#unboxing', growth: 218, frequency: 6780, momentum: 81, interestLevel: 86 },
  { tag: '#ecommercetips', growth: 62, frequency: 980, momentum: 38, interestLevel: 41 },
];

// ── Generación de snapshots históricos ───────────────────────────────────────

function generateSnapshots(
  entityName: string,
  entityType: string,
  values: number[],
  source = 'seed'
): Array<Omit<InstanceType<typeof Snapshot>, '_id' | '__v' | 'createdAt' | 'updatedAt'>> {
  const now = Date.now();
  const intervalMs = 24 * 60 * 60 * 1000; // 1 día

  return values.map((value, i) => ({
    entityType: entityType as any,
    entityName,
    entityId: entityName,
    source,
    metric: 'frequency' as any,
    value,
    capturedAt: new Date(now - (values.length - 1 - i) * intervalMs),
  }));
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function seed(): Promise<void> {
  await connectDB();
  console.log('🌱 Iniciando seed de datos realistas...\n');

  // Limpiar datos seed previos (no los reales)
  await Promise.all([
    Signal.deleteMany({ isFromSeed: true }),
    Trend.deleteMany({ isFromSeed: true }),
    Hashtag.deleteMany({ isFromSeed: true }),
    Product.deleteMany({ isFromSeed: true }),
    Snapshot.deleteMany({ source: 'seed' }),
  ]);
  console.log('🗑️  Datos seed anteriores eliminados\n');

  // Insertar señales
  const signalDocs = [];
  const snapshotDocs: any[] = [];

  for (const s of SEED_SIGNALS) {
    const signal = new Signal({
      name: s.name,
      canonicalName: s.canonicalName,
      category: s.category,
      entityType: 'product',
      radarScore: s.radarScore,
      growthScore: s.growthScore,
      confidenceLevel: s.confidenceLevel,
      confidenceValue: s.confidenceValue,
      status: s.status,
      sources: ['reddit', 'seed'],
      frequency: s.frequency,
      engagement: s.engagement,
      velocity: s.velocity,
      acceleration: s.acceleration,
      momentum: s.momentum,
      detectedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      isFromSeed: true,
    });
    signalDocs.push(signal);

    // Snapshots históricos de 7 días
    const snaps = generateSnapshots(s.canonicalName, 'signal', s.daysGrowth);
    snapshotDocs.push(...snaps);
  }

  await Signal.insertMany(signalDocs);
  console.log(`✅ ${signalDocs.length} señales insertadas`);

  // Insertar tendencias
  const trendDocs = SEED_SIGNALS.map((s) => ({
    name: s.name,
    canonicalName: s.canonicalName,
    category: s.category,
    variationPct: Math.round((s.daysGrowth[s.daysGrowth.length - 1] / s.daysGrowth[0] - 1) * 100),
    frequency: s.frequency,
    interestLevel: s.radarScore,
    radarScore: s.radarScore,
    sources: ['reddit', 'seed'],
    firstSeenAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    lastSeenAt: new Date(),
    isFromSeed: true,
  }));
  await Trend.insertMany(trendDocs);
  console.log(`✅ ${trendDocs.length} tendencias insertadas`);

  // Insertar hashtags
  const hashtagDocs = SEED_HASHTAGS.map((h) => ({
    tag: h.tag,
    growth: h.growth,
    frequency: h.frequency,
    momentum: h.momentum,
    interestLevel: h.interestLevel,
    sources: ['reddit', 'seed'],
    firstSeenAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    lastSeenAt: new Date(),
    isFromSeed: true,
  }));
  await Hashtag.insertMany(hashtagDocs);
  console.log(`✅ ${hashtagDocs.length} hashtags insertados`);

  // Insertar productos
  const productDocs = SEED_SIGNALS.slice(0, 6).map((s) => ({
    name: s.name,
    canonicalName: s.canonicalName,
    category: s.category,
    frequency: s.frequency,
    growth: Math.round((s.daysGrowth[s.daysGrowth.length - 1] / s.daysGrowth[0] - 1) * 100),
    radarScore: s.radarScore,
    sources: ['reddit', 'seed'],
    firstSeenAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    lastSeenAt: new Date(),
    isFromSeed: true,
  }));
  await Product.insertMany(productDocs);
  console.log(`✅ ${productDocs.length} productos insertados`);

  // Insertar snapshots
  await Snapshot.insertMany(snapshotDocs);
  console.log(`✅ ${snapshotDocs.length} snapshots históricos insertados`);

  console.log('\n🎯 Seed completado exitosamente!');
  console.log('💡 El dashboard ya tiene datos realistas para mostrar.\n');

  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Error en seed:', err);
  process.exit(1);
});
