import 'dotenv/config';
import app from './app';
import { connectDB } from './config/db';
import { startScheduler } from './jobs/scheduler';

const PORT = parseInt(process.env.PORT ?? '4000', 10);

async function main() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🎯 Radar backend running on port ${PORT}`);
  });

  // Iniciar el scheduler de ingesta (2h) después de que el server esté listo
  startScheduler();
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
