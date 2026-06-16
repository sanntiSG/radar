import { Schema, model, Document } from 'mongoose';

export interface ITrend extends Document {
  name: string;
  canonicalName: string;
  category: string;
  variationPct: number;
  frequency: number;
  interestLevel: number; // 0-100
  radarScore: number;
  sources: string[];
  firstSeenAt: Date;
  lastSeenAt: Date;
  isFromSeed: boolean;
}

const trendSchema = new Schema<ITrend>(
  {
    name: { type: String, required: true, index: true },
    canonicalName: { type: String, required: true, index: true },
    category: { type: String, required: true, index: true },
    variationPct: { type: Number, default: 0 },
    frequency: { type: Number, default: 0 },
    interestLevel: { type: Number, default: 0, min: 0, max: 100 },
    radarScore: { type: Number, default: 0, min: 0, max: 100 },
    sources: [{ type: String }],
    firstSeenAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
    isFromSeed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

trendSchema.index({ radarScore: -1 });

export const Trend = model<ITrend>('Trend', trendSchema);
