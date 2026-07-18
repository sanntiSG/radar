import { Schema, model, type InferSchemaType } from 'mongoose';

const trendSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    category: { type: String, required: true, index: true },
    changePct: { type: Number, default: 0 },
    frequency: { type: Number, default: 0 },
    interestLevel: { type: Number, min: 0, max: 100, default: 0 },
    momentum: { type: Number, default: 0 },
    sources: { type: [String], default: [] },
    aliases: { type: [String], default: [] },
    firstSeenAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

trendSchema.index({ changePct: -1 });

export type TrendDoc = InferSchemaType<typeof trendSchema>;
export const Trend = model('Trend', trendSchema);
