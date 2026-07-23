import { Schema, model, type InferSchemaType } from 'mongoose';

export const ACCENTS = ['jade', 'amber', 'azure', 'violet'] as const;
export const SECTION_IDS = ['stats', 'feed', 'insights', 'watchlist'] as const;
export const SOURCE_IDS = ['reddit', 'google-trends', 'rss'] as const;

// Radar Personal enriquecido (N11)
export const EXPERIENCE_LEVELS = ['principiante', 'vendedor', 'agencia', 'empresa'] as const;
export const LANGUAGES = ['es', 'en', 'pt'] as const;

export const GOALS: { id: string; label: string }[] = [
  { id: 'encontrar_productos', label: 'Encontrar productos con potencial temprano' },
  { id: 'seguir_competencia', label: 'Seguir a la competencia y sus anuncios' },
  { id: 'validar_ideas', label: 'Validar ideas antes de invertir' },
  { id: 'ahorrar_tiempo', label: 'Ahorrar tiempo de investigación manual' },
  { id: 'detectar_nichos', label: 'Detectar nichos en expansión' },
  { id: 'escalar_negocio', label: 'Escalar un negocio ya existente' },
];

export const MARKETPLACES: { id: string; label: string }[] = [
  { id: 'shopify', label: 'Shopify' },
  { id: 'mercadolibre', label: 'MercadoLibre' },
  { id: 'amazon', label: 'Amazon' },
  { id: 'tiktok_shop', label: 'TikTok Shop' },
  { id: 'etsy', label: 'Etsy' },
  { id: 'woocommerce', label: 'WooCommerce' },
  { id: 'otro', label: 'Otro' },
];

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
    // Radar Personal enriquecido (N11)
    experienceLevel: { type: String, enum: [...EXPERIENCE_LEVELS, ''], default: '' },
    goals: { type: [String], default: [] },
    marketplaces: { type: [String], default: [] },
    language: { type: String, enum: LANGUAGES, default: 'es' },
    region: { type: String, default: '' },
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
    // Racha diaria
    streak: { type: Number, default: 0 },
    lastActiveDate: { type: String, default: '' }, // ISO date YYYY-MM-DD
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof userSchema>;
export const User = model('User', userSchema);
