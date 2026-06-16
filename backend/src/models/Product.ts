import { Schema, model, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  canonicalName: string;
  category: string;
  frequency: number;
  growth: number;
  radarScore: number;
  sources: string[];
  firstSeenAt: Date;
  lastSeenAt: Date;
  isFromSeed: boolean;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, index: true },
    canonicalName: { type: String, required: true, index: true },
    category: { type: String, required: true, index: true },
    frequency: { type: Number, default: 0 },
    growth: { type: Number, default: 0 },
    radarScore: { type: Number, default: 0, min: 0, max: 100 },
    sources: [{ type: String }],
    firstSeenAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
    isFromSeed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

productSchema.index({ radarScore: -1 });

export const Product = model<IProduct>('Product', productSchema);
