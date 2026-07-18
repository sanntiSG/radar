import { Schema, model } from 'mongoose';

/**
 * Cache inteligente: evita reprocesar items ya vistos.
 * Reduce tráfico, costos y riesgo de bloqueos.
 */
const adapterCacheSchema = new Schema(
  {
    source: { type: String, required: true },
    originalId: { type: String, required: true },
    fetchedAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['pending', 'processed', 'failed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

adapterCacheSchema.index({ source: 1, originalId: 1 }, { unique: true });

export const AdapterCache = model('AdapterCache', adapterCacheSchema);

/** Filtra los items cuyo originalId ya fue procesado; registra los nuevos. */
export async function filterNew<T extends { source: string; originalId: string }>(
  items: T[]
): Promise<T[]> {
  if (items.length === 0) return [];

  const ids = items.map((i) => i.originalId);
  const source = items[0].source;

  const seen = await AdapterCache.find({
    source,
    originalId: { $in: ids },
  }).select('originalId');
  const seenSet = new Set(seen.map((s) => s.originalId));

  await AdapterCache.updateMany(
    { source, originalId: { $in: [...seenSet] } },
    { $set: { lastSeenAt: new Date() } }
  );

  const fresh = items.filter((i) => !seenSet.has(i.originalId));
  if (fresh.length) {
    await AdapterCache.insertMany(
      fresh.map((i) => ({ source: i.source, originalId: i.originalId })),
      { ordered: false }
    ).catch(() => undefined); // carreras de duplicados no son fatales
  }
  return fresh;
}

export async function markProcessed(
  source: string,
  originalIds: string[]
): Promise<void> {
  if (originalIds.length === 0) return;
  await AdapterCache.updateMany(
    { source, originalId: { $in: originalIds } },
    { $set: { status: 'processed' } }
  );
}
