import { createApp } from './app';
import { connectDb } from './config/db';
import { env } from './config/env';

async function main() {
  await connectDb();
  const app = createApp();
  app.listen(env.port, () => {
    console.log(`[Radar] API escuchando en http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  console.error('[Radar] Error fatal al iniciar:', err);
  process.exit(1);
});
