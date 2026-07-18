import cron from 'node-cron';
import { ingest, recomputeAll, runPipeline } from '../signals/signalEngine';

/**
 * Frecuencias:
 *  - cada 2 horas: ingesta de fuentes
 *  - cada 6 horas: recálculo de señales
 *  - diario 03:15 UTC: ciclo completo (garantiza snapshot diario)
 */
export function startScheduler(): void {
  cron.schedule('0 */2 * * *', () => {
    ingest().catch((err) => console.error('[cron] ingesta falló:', err));
  });

  cron.schedule('30 */6 * * *', () => {
    recomputeAll().catch((err) => console.error('[cron] recálculo falló:', err));
  });

  cron.schedule('15 3 * * *', () => {
    runPipeline().catch((err) => console.error('[cron] pipeline diario falló:', err));
  });

  console.log('[Radar] Cron jobs activos (2h ingesta / 6h recálculo / diario pipeline)');
}
