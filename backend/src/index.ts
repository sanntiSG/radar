import { createApp } from './app';
import { connectDb } from './config/db';
import { env } from './config/env';
import { startScheduler } from './jobs/scheduler';

async function main() {
  await connectDb();
  const app = createApp();
  app.listen(env.port, () => {
    console.log(`[Radar] API escuchando en http://localhost:${env.port}`);
  });
  if (env.enableCron) startScheduler();
}

main().catch((err) => {
  console.error('[Radar] Error fatal al iniciar:', err);
  process.exit(1);
});
