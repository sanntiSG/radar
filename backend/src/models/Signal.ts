import { Schema, model, type InferSchemaType } from 'mongoose';

export const SIGNAL_STATUSES = ['new', 'rising', 'peaking', 'cooling', 'dormant'] as const;
export const CONFIDENCE_LEVELS = ['low', 'medium', 'high'] as const;

const signalSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    category: { type: String, required: true, index: true },
    entityType: {
      type: String,
      enum: ['product', 'hashtag', 'trend', 'category'],
      required: true,
    },
    radarScore: { type: Number, min: 0, max: 100, default: 0 },
    growthScore: { type: Number, default: 0 },
    confidence: { type: String, enum: CONFIDENCE_LEVELS, default: 'low' },
    confidenceScore: { type: Number, min: 0, max: 100, default: 0 },
    status: { type: String, enum: SIGNAL_STATUSES, default: 'new', index: true },
    detectedAt: { type: Date, default: Date.now },
    explanation: { type: String, default: '' },
    sources: { type: [String], default: [] },
    aliases: { type: [String], default: [] },
    metrics: {
      velocity: { type: Number, default: 0 },
      acceleration: { type: Number, default: 0 },
      momentum: { type: Number, default: 0 },
      frequency: { type: Number, default: 0 },
      engagement: { type: Number, default: 0 },
      recency: { type: Number, default: 0 },
    },
    sparkline: { type: [Number], default: [] },
    predictions: {
      h24: { type: Number, default: null },
      h72: { type: Number, default: null },
      d7: { type: Number, default: null },
    },
    factors: {
      type: [
        {
          key: { type: String, required: true },
          label: { type: String, required: true },
          detail: { type: String, default: '' },
          contribution: { type: Number, default: 0 },
          weight: { type: Number, default: null },
          _id: false,
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

signalSchema.index({ radarScore: -1 });

export type SignalDoc = InferSchemaType<typeof signalSchema>;
export const Signal = model('Signal', signalSchema);
