import { Schema, model, Document } from 'mongoose';

export interface IHashtag extends Document {
  tag: string; // with #
  growth: number; // % growth
  frequency: number;
  momentum: number;
  interestLevel: number; // 0-100
  sources: string[];
  firstSeenAt: Date;
  lastSeenAt: Date;
  isFromSeed: boolean;
}

const hashtagSchema = new Schema<IHashtag>(
  {
    tag: { type: String, required: true, unique: true, index: true },
    growth: { type: Number, default: 0 },
    frequency: { type: Number, default: 0 },
    momentum: { type: Number, default: 0 },
    interestLevel: { type: Number, default: 0, min: 0, max: 100 },
    sources: [{ type: String }],
    firstSeenAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
    isFromSeed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

hashtagSchema.index({ growth: -1 });

export const Hashtag = model<IHashtag>('Hashtag', hashtagSchema);
