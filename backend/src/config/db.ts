import mongoose from 'mongoose';
import { env, assertDbConfigured } from './env';

export async function connectDb(): Promise<void> {
  assertDbConfigured();
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongodbUri);
  console.log('[Radar] MongoDB conectado');
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
