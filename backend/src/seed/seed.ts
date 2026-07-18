import { connectDb, disconnectDb } from '../config/db';
import { seedDatabase } from './seedData';

async function main() {
  await connectDb();
  await seedDatabase();
  await disconnectDb();
}

main().catch((err) => {
  console.error('[seed] Falló:', err);
  process.exit(1);
});
