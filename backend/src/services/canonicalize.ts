/**
 * Canonicalización de Entidades
 *
 * Resuelve el "ruido semántico": "mini impresora", "portable printer" y
 * "thermal sticker maker" se agrupan bajo una sola entidad canónica.
 *
 * Enfoque sin IA de pago:
 *   1. Normalización (lowercase, sin acentos, sin stopwords)
 *   2. Mapa de alias/sinónimos editable
 *   3. Matching difuso por tokens (string-similarity)
 */

import stringSimilarity from 'string-similarity';

// ── Stopwords ─────────────────────────────────────────────────────────────────

const STOPWORDS = new Set([
  // Español
  'de', 'la', 'el', 'en', 'un', 'una', 'los', 'las', 'del', 'al', 'y', 'o',
  'con', 'por', 'para', 'se', 'que', 'es', 'son', 'muy', 'mas',
  // Inglés
  'the', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'is', 'are', 'be', 'it', 'its', 'this', 'that', 'my', 'your',
]);

// ── Mapa de Alias y Sinónimos ─────────────────────────────────────────────────
// Formato: { canonical: string, aliases: string[] }
// Se puede ampliar desde un archivo externo o base de datos.

export interface AliasEntry {
  canonical: string;
  aliases: string[];
  category?: string;
}

export const ALIAS_MAP: AliasEntry[] = [
  // Gadgets
  {
    canonical: 'mini impresora portatil',
    category: 'Gadgets',
    aliases: [
      'portable printer', 'mini printer', 'thermal sticker printer',
      'thermal sticker maker', 'sticker printer', 'impresora termica',
      'impresora portatil', 'mini thermal printer', 'pocket printer',
    ],
  },
  {
    canonical: 'organizador magnetico',
    category: 'Hogar',
    aliases: [
      'magnetic organizer', 'magnetic storage', 'organizador imantado',
      'magnetic shelf', 'magnetic rack', 'magnetic holder',
    ],
  },
  {
    canonical: 'botella termica inteligente',
    category: 'Fitness',
    aliases: [
      'smart water bottle', 'smart thermal bottle', 'botella inteligente',
      'botella termica', 'smart bottle', 'hydration tracker bottle',
      'temperature bottle', 'smart hydration',
    ],
  },
  {
    canonical: 'led inteligente',
    category: 'Hogar',
    aliases: [
      'smart led', 'smart light', 'led strip', 'tira led', 'led strip lights',
      'smart bulb', 'bombilla inteligente', 'luces led', 'rgb lights',
      'smart rgb', 'wifi bulb', 'color light bulb',
    ],
  },
  {
    canonical: 'gadget de cocina',
    category: 'Cocina',
    aliases: [
      'kitchen gadget', 'cocina gadget', 'kitchen tool', 'utensilio cocina',
      'kitchen hack', 'cooking gadget',
    ],
  },
  {
    canonical: 'masaje electrico',
    category: 'Salud y bienestar',
    aliases: [
      'electric massager', 'gun massager', 'massage gun', 'masajeador electrico',
      'muscle gun', 'percussion massager', 'deep tissue massager',
    ],
  },
  {
    canonical: 'cargador inalambrico',
    category: 'Tecnología',
    aliases: [
      'wireless charger', 'qi charger', 'carga inalambrica', 'cargador qi',
      'wireless charging pad', 'magsafe', 'mag safe charger',
    ],
  },
  {
    canonical: 'auriculares inalambricos',
    category: 'Tecnología',
    aliases: [
      'wireless earbuds', 'tws earbuds', 'bluetooth earbuds', 'auriculares bluetooth',
      'earbuds', 'airpods clone', 'true wireless', 'headphones wireless',
    ],
  },
];

// Construir mapa invertido: alias normalizado → canónico
const aliasIndex = new Map<string, string>();
for (const entry of ALIAS_MAP) {
  aliasIndex.set(normalize(entry.canonical), entry.canonical);
  for (const alias of entry.aliases) {
    aliasIndex.set(normalize(alias), entry.canonical);
  }
}

// ── Normalización ─────────────────────────────────────────────────────────────

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quitar acentos
    .replace(/[^a-z0-9\s]/g, '')     // quitar puntuación
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w)) // quitar stopwords
    .join(' ')
    .trim();
}

// ── Lookup por alias exacto ───────────────────────────────────────────────────

export function lookupAlias(text: string): string | null {
  const key = normalize(text);
  return aliasIndex.get(key) ?? null;
}

// ── Matching difuso por tokens ────────────────────────────────────────────────

const SIMILARITY_THRESHOLD = 0.65;

export function fuzzyMatch(text: string, candidates: string[]): string | null {
  if (candidates.length === 0) return null;
  const normalized = normalize(text);
  const result = stringSimilarity.findBestMatch(normalized, candidates.map(normalize));
  if (result.bestMatch.rating >= SIMILARITY_THRESHOLD) {
    return candidates[result.bestMatchIndex];
  }
  return null;
}

// ── Función principal: canonicalizar ─────────────────────────────────────────

/**
 * Devuelve el nombre canónico de una entidad.
 * Prioridad: alias exacto → matching difuso → normalización básica.
 */
export function canonicalize(text: string): string {
  // 1. Buscar en el mapa de alias (lookup exacto)
  const aliasHit = lookupAlias(text);
  if (aliasHit) return aliasHit;

  // 2. Matching difuso contra todos los canónicos conocidos
  const canonicals = ALIAS_MAP.map((e) => e.canonical);
  const fuzzyHit = fuzzyMatch(text, canonicals);
  if (fuzzyHit) return fuzzyHit;

  // 3. Fallback: normalización básica (el texto limpio se usa como canónico)
  return normalize(text) || text.toLowerCase().trim();
}

/**
 * Canonicaliza y devuelve también la categoría inferida.
 */
export function canonicalizeWithCategory(text: string): { canonical: string; category: string | null } {
  const canonical = canonicalize(text);
  const entry = ALIAS_MAP.find((e) => e.canonical === canonical);
  return { canonical, category: entry?.category ?? null };
}

/**
 * Agrupa una lista de strings bajo sus canónicos.
 * @returns Map de canónico → lista de variantes originales
 */
export function groupByCanonical(texts: string[]): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  for (const text of texts) {
    const canonical = canonicalize(text);
    const existing = groups.get(canonical) ?? [];
    existing.push(text);
    groups.set(canonical, existing);
  }
  return groups;
}
