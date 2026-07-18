import { Schema, model, type InferSchemaType } from 'mongoose';

const productSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    category: { type: String, required: true, index: true },
    frequency: { type: Number, default: 0 },
    growthPct: { type: Number, default: 0 },
    radarScore: { type: Number, min: 0, max: 100, default: 0 },
    // Canonicalización: variantes agrupadas bajo esta entidad canónica
    aliases: { type: [String], default: [] },
    mergedFrom: { type: [String], default: [] },
    sources: { type: [String], default: [] },
    firstSeenAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

productSchema.index({ radarScore: -1 });

export type ProductDoc = InferSchemaType<typeof productSchema>;
export const Product = model('Product', productSchema);
