import { Schema, model, type InferSchemaType } from 'mongoose';

export const ACCENTS = ['jade', 'amber', 'azure', 'violet'] as const;
export const SECTION_IDS = ['stats', 'feed', 'insights', 'watchlist'] as const;

const sectionPrefSchema = new Schema(
  {
    id: { type: String, enum: SECTION_IDS, required: true },
    visible: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const preferencesSchema = new Schema(
  {
    accent: { type: String, enum: ACCENTS, default: 'jade' },
    defaultCategory: { type: String, default: 'Todas' },
    defaultSort: { type: String, enum: ['radarScore', 'detectedAt'], default: 'radarScore' },
    defaultStatus: { type: String, default: '' },
    sections: {
      type: [sectionPrefSchema],
      default: () =>
        SECTION_IDS.map((id, order) => ({ id, visible: true, order })),
    },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, default: '' },
    googleId: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    plan: { type: String, enum: ['free', 'pro'], default: 'free' },
    preferences: { type: preferencesSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof userSchema>;
export const User = model('User', userSchema);
