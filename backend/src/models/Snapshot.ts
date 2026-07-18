import { Schema, model, type InferSchemaType } from 'mongoose';

// El histórico es el activo principal de Radar: cada snapshot guarda la
// evolución temporal de una entidad (tendencia, hashtag, producto o categoría).
const snapshotSchema = new Schema(
  {
    entityType: {
      type: String,
      enum: ['trend', 'hashtag', 'product', 'category', 'signal'],
      required: true,
    },
    slug: { type: String, required: true },
    date: { type: Date, required: true },
    mentions: { type: Number, default: 0 },
    engagement: { type: Number, default: 0 },
    interest: { type: Number, min: 0, max: 100, default: 0 },
    source: { type: String, default: 'aggregate' },
  },
  { timestamps: true }
);

snapshotSchema.index({ entityType: 1, slug: 1, date: 1 }, { unique: true });

export type SnapshotDoc = InferSchemaType<typeof snapshotSchema>;
export const Snapshot = model('Snapshot', snapshotSchema);
