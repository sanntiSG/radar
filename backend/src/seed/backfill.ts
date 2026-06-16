/**
 * Backfill — Rellena el histórico de snapshots usando Google Trends.
 *
 * Ejecuta una vez al arrancar o manualmente para tener histórico inmediato
 * sin esperar días reales de operación.
 *
 * Uso: npm run backfill
 */

import 'dotenv/config';
import { connectDB } from '../config/db';
import { googleTrendsAdapter, TRENDS_KEYWORDS } from '../adapters/googleTrends';
import { Snapshot } from '../models/Snapshot';
import { Signal } from '../models/Signal';
import { Trend } from '../models/Trend';
import { radarScore } from '../engine/radarScore';
import { latestVelocity, averageVelocity } from '../engine/growthVelocity';
import { latestAcceleration } from '../engine/acceleration';
import { canonicalizeWithCategory } from '../services/canonicalize';

const DAYS_BACK = 14; // 2 semanas de histórico

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function backfill(): Promise<void> {
  await connectDB();
  console.log(`🔄 Iniciando backfill de ${DAYS_BACK} días de histórico...\n`);

  // Eliminar snapshots de backfill anteriores para no duplicar
  await Snapshot.deleteMany({ source: 'backfill' });
  console.log('🗑️  Snapshots de backfill anteriores eliminados\n');

  let totalSnapshots = 0;
  let keywordsProcessed = 0;

  for (const keyword of TRENDS_KEYWORDS) {
    console.log(`📈 Backfillando: "${keyword}"...`);

    try {
      const series = await googleTrendsAdapter.getHistoricalSeries(keyword, DAYS_BACK);

      if (series.length === 0) {
        console.log(`  ⚠️  Sin datos para "${keyword}"\n`);
        continue;
      }

      const { canonical, category } = canonicalizeWithCategory(keyword);

      // Insertar snapshots históricos
      const snapshots = series
        .filter((p) => p.value > 0)
        .map((p) => ({
          entityType: 'trend' as const,
          entityName: canonical,
          entityId: canonical,
          source: 'backfill',
          metric: 'interest' as const,
          value: p.value,
          capturedAt: p.date,
        }));

      if (snapshots.length > 0) {
        await Snapshot.insertMany(snapshots);
        totalSnapshots += snapshots.length;
        console.log(`  ✅ ${snapshots.length} snapshots insertados`);

        // Calcular métricas sobre el histórico
        const velocityPoints = snapshots.map((s) => ({ value: s.value, timestamp: s.capturedAt }));
        const avgVel = averageVelocity(velocityPoints);
        const lastVel = latestVelocity(velocityPoints);
        const accel = latestAcceleration(velocityPoints);

        const latestValue = snapshots[snapshots.length - 1].value;
        const firstValue = snapshots[0].value;
        const variationPct = firstValue > 0 ? Math.round((latestValue / firstValue - 1) * 100) : 0;

        const score = radarScore({
          velocity: lastVel,
          acceleration: accel,
          frequency: latestValue,
          engagement: latestValue * 100,
          recency: 0.5, // dato muy reciente
        });

        // Upsert de Trend con los datos del backfill
        await Trend.findOneAndUpdate(
          { canonicalName: canonical },
          {
            $set: {
              name: keyword,
              canonicalName: canonical,
              category: category ?? 'General',
              variationPct,
              frequency: latestValue,
              interestLevel: latestValue,
              radarScore: score,
              sources: ['google_trends', 'backfill'],
              lastSeenAt: new Date(),
            },
            $setOnInsert: {
              firstSeenAt: snapshots[0].capturedAt,
              isFromSeed: false,
            },
          },
          { upsert: true }
        );

        // Si la variación es significativa, upsert en Signal también
        if (variationPct > 20 || score > 50) {
          await Signal.findOneAndUpdate(
            { canonicalName: canonical },
            {
              $set: {
                name: keyword,
                canonicalName: canonical,
                category: category ?? 'General',
                entityType: 'trend',
                radarScore: score,
                growthScore: Math.round(lastVel),
                confidenceLevel: score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low',
                confidenceValue: score,
                sources: ['google_trends', 'backfill'],
                frequency: latestValue,
                engagement: latestValue * 100,
                velocity: lastVel,
                acceleration: accel,
                updatedAt: new Date(),
              },
              $setOnInsert: {
                detectedAt: new Date(),
                isFromSeed: false,
                status: 'active',
                momentum: 0,
              },
            },
            { upsert: true }
          );
        }

        console.log(`  📊 Score: ${score} | Variación: ${variationPct}% | Velocidad: ${lastVel.toFixed(2)}\n`);
      }

      keywordsProcessed++;
    } catch (err) {
      console.warn(`  ❌ Error en "${keyword}":`, err instanceof Error ? err.message : err, '\n');
    }

    // Pausa entre keywords para no hacer rate-limit
    await sleep(1200);
  }

  console.log(`\n🎯 Backfill completado!`);
  console.log(`  Keywords procesadas: ${keywordsProcessed}/${TRENDS_KEYWORDS.length}`);
  console.log(`  Snapshots insertados: ${totalSnapshots}`);
  console.log('\n💡 El motor ya tiene histórico para calcular predicciones con confianza.\n');

  process.exit(0);
}

backfill().catch((err) => {
  console.error('❌ Error en backfill:', err);
  process.exit(1);
});
