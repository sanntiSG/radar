import { connectDb, disconnectDb } from '../config/db';
import { runPipeline } from '../signals/signalEngine';

/** Ejecución manual del ciclo completo: `npm run collect`. */
async function main() {
  await connectDb();
  await runPipeline();
  await disconnectDb();
  console.log('[Radar] Recolección manual completa');
}

main().catch((err) => {
  console.error('[Radar] Recolección falló:', err);
  process.exit(1);
});
