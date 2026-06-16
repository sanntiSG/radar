import { Schema, model, Document } from 'mongoose';

export type SignalStatus = 'active' | 'fading' | 'exploded' | 'noise';
export type ConfidenceLevel = 'low' | 'medium' | 'high';
export type EntityType = 'product' | 'hashtag' | 'trend' | 'category';

export interface ISignal extends Document {
  name: string;
  canonicalName: string;
  category: string;
  entityType: EntityType;
  radarScore: number;
  growthScore: number;
  confidenceLevel: ConfidenceLevel;
  confidenceValue: number; // 0-100
  status: SignalStatus;
  sources: string[];
  frequency: number;
  engagement: number;
  velocity: number;
  acceleration: number;
  momentum: number;
  detectedAt: Date;
  updatedAt: Date;
  isFromSeed: boolean;
}

const signalSchema = new Schema<ISignal>(
  {
    name: { type: String, required: true, index: true },
    canonicalName: { type: String, required: true, index: true },
    category: { type: String, required: true, index: true },
    entityType: {
      type: String,
      enum: ['product', 'hashtag', 'trend', 'category'],
      required: true,
    },
    radarScore: { type: Number, default: 0, min: 0, max: 100 },
    growthScore: { type: Number, default: 0 },
    confidenceLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low',
    },
    confidenceValue: { type: Number, default: 0, min: 0, max: 100 },
    status: {
      type: String,
      enum: ['active', 'fading', 'exploded', 'noise'],
      default: 'active',
    },
    sources: [{ type: String }],
    frequency: { type: Number, default: 0 },
    engagement: { type: Number, default: 0 },
    velocity: { type: Number, default: 0 },
    acceleration: { type: Number, default: 0 },
    momentum: { type: Number, default: 0 },
    detectedAt: { type: Date, default: Date.now },
    isFromSeed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

signalSchema.index({ radarScore: -1 });
signalSchema.index({ category: 1, radarScore: -1 });

export const Signal = model<ISignal>('Signal', signalSchema);
