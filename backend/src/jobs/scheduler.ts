/**
 * Scheduler — Tareas programadas con node-cron.
 *
 * Frecuencias:
 *   - Ingesta de menciones: cada 2 horas
 *   - Scoring/agregación: cada 6 horas
 *   - Limpieza de cache: diaria
 */

import cron from 'node-cron';
import { redditAdapter } from '../adapters/reddit';
import { googleTrendsAdapter } from '../adapters/googleTrends';
import { processMentions } from '../signals/signalEngine';
import { AdapterCache } from '../cache/adapterCache';

let isRunning = false;

async function runIngestion(): Promise<void> {
  if (isRunning) {
    console.log('[Scheduler] Ingestion already running, skipping...');
    return;
  }

  isRunning = true;
  const start = Date.now();
  console.log(`[Scheduler] Starting ingestion at ${new Date().toISOString()}`);

  try {
    // Fetch de todas las fuentes en paralelo (tolerantes a fallos)
    const [redditResult, trendsResult] = await Promise.allSettled([
      redditAdapter.fetch(),
      googleTrendsAdapter.fetch(),
    ]);

    const allMentions = [];

    if (redditResult.status === 'fulfilled' && redditResult.value.success) {
      allMentions.push(...redditResult.value.mentions);
      console.log(`[Reddit] ${redditResult.value.mentions.length} menciones obtenidas`);
    } else {
      const reason = redditResult.status === 'rejected'
        ? redditResult.reason
        : redditResult.value.error;
      console.warn('[Reddit] Falló:', reason);
    }

    if (trendsResult.status === 'fulfilled' && trendsResult.value.success) {
      allMentions.push(...trendsResult.value.mentions);
      console.log(`[GoogleTrends] ${trendsResult.value.mentions.length} menciones obtenidas`);
    } else {
      const reason = trendsResult.status === 'rejected'
        ? trendsResult.reason
        : trendsResult.value.error;
      console.warn('[GoogleTrends] Falló:', reason);
    }

    if (allMentions.length > 0) {
      const { signalsDetected, trendsUpdated, hashtagsUpdated } = await processMentions(allMentions);
      console.log(`[Scheduler] Ingestion complete: ${signalsDetected} señales, ${trendsUpdated} tendencias, ${hashtagsUpdated} hashtags — ${Date.now() - start}ms`);
    } else {
      console.log('[Scheduler] No mentions to process this cycle');
    }
  } catch (err) {
    console.error('[Scheduler] Ingestion error:', err instanceof Error ? err.message : err);
  } finally {
    isRunning = false;
  }
}

async function cleanupCache(): Promise<void> {
  try {
    // Eliminar entradas de cache procesadas con más de 30 días
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const result = await AdapterCache.deleteMany({
      status: 'processed',
      processedAt: { $lt: cutoff },
    });
    console.log(`[Scheduler] Cache cleanup: ${result.deletedCount} entradas eliminadas`);
  } catch (err) {
    console.error('[Scheduler] Cache cleanup error:', err);
  }
}

export function startScheduler(): void {
  // Ingesta cada 2 horas
  cron.schedule('0 */2 * * *', runIngestion, {
    name: 'ingestion',
    timezone: 'UTC',
  });

  // Limpieza de cache: todos los días a las 3am UTC
  cron.schedule('0 3 * * *', cleanupCache, {
    name: 'cache-cleanup',
    timezone: 'UTC',
  });

  console.log('📅 Scheduler iniciado: ingesta cada 2h, limpieza diaria a 3am UTC');

  // Ejecutar ingesta inmediatamente al iniciar (sin esperar 2h)
  setTimeout(() => {
    runIngestion().catch(console.error);
  }, 5000); // 5s delay para que MongoDB se conecte primero
}
