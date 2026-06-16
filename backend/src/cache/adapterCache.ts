/**
 * Cache Inteligente para adaptadores.
 * Evita reprocesar datos ya obtenidos.
 * Almacena en MongoDB: {source, originalId, fetchedAt, updatedAt, status}
 */

import mongoose, { Schema, model, Document } from 'mongoose';

export type CacheStatus = 'fresh' | 'processing' | 'processed' | 'error';

export interface IAdapterCache extends Document {
  source: string;
  originalId: string;      // hash del contenido o ID de la fuente
  contentHash: string;     // hash MD5/sha del contenido para dedup
  fetchedAt: Date;
  updatedAt: Date;
  status: CacheStatus;
  processedAt?: Date;
  errorMessage?: string;
}

const adapterCacheSchema = new Schema<IAdapterCache>(
  {
    source: { type: String, required: true, index: true },
    originalId: { type: String, required: true },
    contentHash: { type: String, required: true },
    fetchedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['fresh', 'processing', 'processed', 'error'],
      default: 'fresh',
    },
    processedAt: { type: Date },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

adapterCacheSchema.index({ source: 1, originalId: 1 }, { unique: true });
adapterCacheSchema.index({ status: 1, fetchedAt: -1 });

export const AdapterCache = model<IAdapterCache>('AdapterCache', adapterCacheSchema);

// ── Cache en memoria (TTL simple) para evitar llamadas redundantes en el mismo proceso ──

interface MemCacheEntry {
  data: unknown;
  expiresAt: number;
}

const memCache = new Map<string, MemCacheEntry>();

export function memGet<T>(key: string): T | null {
  const entry = memCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memCache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function memSet<T>(key: string, data: T, ttlMs = 2 * 60 * 60 * 1000): void {
  memCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

/**
 * Hash simple para deduplicación (no criptográfico).
 */
export function simpleHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit int
  }
  return Math.abs(hash).toString(36);
}

/**
 * Verifica si un item ya fue procesado recientemente.
 */
export async function isAlreadyProcessed(
  source: string,
  originalId: string
): Promise<boolean> {
  const entry = await AdapterCache.findOne({ source, originalId, status: 'processed' }).lean();
  return !!entry;
}

/**
 * Marca un item como procesado.
 */
export async function markProcessed(
  source: string,
  originalId: string,
  contentHash: string
): Promise<void> {
  await AdapterCache.findOneAndUpdate(
    { source, originalId },
    { contentHash, status: 'processed', processedAt: new Date() },
    { upsert: true, new: true }
  );
}
