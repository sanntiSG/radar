import { Schema, model, type InferSchemaType } from 'mongoose';

export const ACCENTS = ['jade', 'amber', 'azure', 'violet'] as const;
export const SECTION_IDS = ['stats', 'feed', 'insights', 'watchlist'] as const;
export const SOURCE_IDS = ['reddit', 'google-trends', 'rss'] as const;

export const COUNTRIES: { code: string; label: string }[] = [
  { code: 'global', label: 'Global' },
  { code: 'AR', label: 'Argentina' },
  { code: 'MX', label: 'México' },
  { code: 'CO', label: 'Colombia' },
  { code: 'CL', label: 'Chile' },
  { code: 'PE', label: 'Perú' },
  { code: 'ES', label: 'España' },
  { code: 'UY', label: 'Uruguay' },
  { code: 'EC', label: 'Ecuador' },
  { code: 'US', label: 'Estados Unidos' },
  { code: 'BR', label: 'Brasil' },
];

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
    // Radar Personal
    country: { type: String, default: 'global' },
    niches: { type: [String], default: [] },
    platforms: { type: [String], default: [] },
    keywords: { type: [String], default: [] },
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
