import { Schema, model, Document, Types } from 'mongoose';

export type SnapshotEntityType = 'product' | 'hashtag' | 'trend' | 'signal' | 'category';
export type SnapshotMetric = 'frequency' | 'engagement' | 'growth' | 'radarScore' | 'interest' | 'momentum';

export interface ISnapshot extends Document {
  entityType: SnapshotEntityType;
  entityId: Types.ObjectId | string; // ref to the entity's _id or canonical name
  entityName: string;
  source: string; // 'reddit', 'google_trends', 'seed', 'backfill'
  metric: SnapshotMetric;
  value: number;
  capturedAt: Date;
}

const snapshotSchema = new Schema<ISnapshot>(
  {
    entityType: {
      type: String,
      enum: ['product', 'hashtag', 'trend', 'signal', 'category'],
      required: true,
    },
    entityId: { type: Schema.Types.Mixed, required: true },
    entityName: { type: String, required: true, index: true },
    source: { type: String, required: true },
    metric: {
      type: String,
      enum: ['frequency', 'engagement', 'growth', 'radarScore', 'interest', 'momentum'],
      required: true,
    },
    value: { type: Number, required: true },
    capturedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

// Compound index for time-series queries
snapshotSchema.index({ entityName: 1, metric: 1, capturedAt: 1 });
snapshotSchema.index({ entityType: 1, capturedAt: -1 });

export const Snapshot = model<ISnapshot>('Snapshot', snapshotSchema);
