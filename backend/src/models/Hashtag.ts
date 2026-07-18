import { Schema, model, type InferSchemaType } from 'mongoose';

const hashtagSchema = new Schema(
  {
    tag: { type: String, required: true, unique: true },
    growthPct: { type: Number, default: 0 },
    frequency: { type: Number, default: 0 },
    momentum: { type: Number, default: 0 },
    interestLevel: { type: Number, min: 0, max: 100, default: 0 },
    category: { type: String, default: 'General', index: true },
    sources: { type: [String], default: [] },
    firstSeenAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

hashtagSchema.index({ growthPct: -1 });

export type HashtagDoc = InferSchemaType<typeof hashtagSchema>;
export const Hashtag = model('Hashtag', hashtagSchema);
