import { compareTwoStrings } from 'string-similarity';
import aliasesJson from './aliases.json';
import { categorize, type Category } from './taxonomy';

/**
 * Canonicalización sin IA — resuelve el "ruido semántico":
 * "Mini impresora", "Portable printer" y "impresora térmica HP X100"
 * deben terminar agrupadas en UNA sola entidad canónica.
 *
 * Pipeline: normalizar → diccionario de alias → fuzzy matching contra
 * entidades existentes → crear entidad nueva si nada matchea.
 */

// Marcas conocidas que se eliminan del nombre (no definen al producto).
const BRANDS = new Set([
  'hp', 'canon', 'epson', 'xiaomi', 'samsung', 'apple', 'anker', 'logitech',
  'phomemo', 'niimbot', 'paperang', 'sony', 'lg', 'huawei', 'lenovo', 'asus',
  'philips', 'bosch', 'ninja', 'cosori', 'stanley', 'owala', 'yeti',
  'dyson', 'shark', 'roborock', 'govee', 'wiz', 'tplink', 'baseus', 'ugreen',
]);

// Sufijos de gama/generación que no aportan identidad de producto.
const MODEL_WORDS = new Set([
  'pro', 'max', 'plus', 'ultra', 'lite', 'gen', 'edition', 'series', 'model',
  'nueva', 'nuevo', 'new', '2nd', '3rd', 'ii', 'iii', 'iv',
]);

const STOPWORDS = new Set([
  // español
  'de', 'la', 'el', 'los', 'las', 'un', 'una', 'para', 'con', 'y', 'o', 'en',
  'del', 'al', 'por', 'que', 'su', 'mi', 'este', 'esta',
  // inglés
  'the', 'a', 'an', 'for', 'with', 'and', 'or', 'of', 'in', 'on', 'to', 'my',
  'this', 'that', 'best', 'top', 'cheap', 'amazing',
]);

/** Quita acentos: "impresión" → "impresion". */
function stripAccents(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Singular heurístico básico es/en. */
function singularize(word: string): string {
  if (word.length <= 3) return word;
  if (/(ss|us|is)$/.test(word)) return word;
  if (/(ches|shes|xes|ses)$/.test(word)) return word.slice(0, -2);
  if (word.endsWith('es') && /[rnldz]es$/.test(word)) return word.slice(0, -2);
  if (word.endsWith('s')) return word.slice(0, -1);
  return word;
}

/** ¿Es un código de modelo? (contiene dígitos: "x100", "m200", "2024") */
function isModelCode(token: string): boolean {
  return /\d/.test(token);
}

/** Tokens normalizados: minúsculas, sin acentos, sin marcas/modelos/stopwords, singular. */
export function normalizeTokens(raw: string): string[] {
  return stripAccents(raw.toLowerCase())
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => !isModelCode(t))
    .filter((t) => !BRANDS.has(t))
    .filter((t) => !MODEL_WORDS.has(t))
    .map(singularize)
    .filter((t) => !STOPWORDS.has(t));
}

/** Forma normalizada estable (tokens ordenados ⇒ insensible al orden de palabras). */
export function normalizeKey(raw: string): string {
  return [...normalizeTokens(raw)].sort().join(' ');
}

/** Forma normalizada respetando el orden (para el diccionario de alias). */
export function normalizePhrase(raw: string): string {
  return normalizeTokens(raw).join(' ');
}

export function slugify(name: string): string {
  return stripAccents(name.toLowerCase())
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// Diccionario de alias con claves normalizadas (se normalizan al cargar
// para que el JSON pueda escribirse de forma natural).
const ALIAS_MAP: Map<string, string> = new Map();
for (const [alias, canonical] of Object.entries(aliasesJson)) {
  if (alias.startsWith('_')) continue;
  ALIAS_MAP.set(normalizeKey(alias), canonical as string);
}

export interface KnownEntity {
  name: string;
  slug: string;
  aliases: string[];
}

export interface CanonicalMatch {
  canonicalName: string;
  slug: string;
  category: Category;
  matchedExisting: boolean;
  via: 'alias' | 'fuzzy' | 'new';
  similarity: number;
}

export const FUZZY_THRESHOLD = 0.72;

/**
 * Resuelve un nombre crudo a su entidad canónica.
 * `known` son las entidades ya existentes en la BD (nombre + aliases).
 */
export function canonicalize(
  raw: string,
  known: KnownEntity[] = []
): CanonicalMatch {
  const key = normalizeKey(raw);
  const tokens = normalizeTokens(raw);

  // 1) Diccionario de alias (match exacto sobre forma normalizada)
  const aliased = ALIAS_MAP.get(key);
  if (aliased) {
    const existing = known.find((k) => k.name === aliased);
    return {
      canonicalName: aliased,
      slug: existing?.slug ?? slugify(aliased),
      category: categorize(normalizeTokens(aliased).concat(tokens)),
      matchedExisting: Boolean(existing),
      via: 'alias',
      similarity: 1,
    };
  }

  // 2) Fuzzy matching contra entidades conocidas (nombre + sus aliases)
  let best: { entity: KnownEntity; score: number } | null = null;
  for (const entity of known) {
    const candidates = [entity.name, ...entity.aliases];
    for (const candidate of candidates) {
      const score = compareTwoStrings(key, normalizeKey(candidate));
      if (score >= FUZZY_THRESHOLD && (!best || score > best.score)) {
        best = { entity, score };
      }
    }
  }
  if (best) {
    return {
      canonicalName: best.entity.name,
      slug: best.entity.slug,
      category: categorize(normalizeTokens(best.entity.name)),
      matchedExisting: true,
      via: 'fuzzy',
      similarity: best.score,
    };
  }

  // 3) Entidad nueva: nombre legible a partir del original limpio
  const pretty = tokens.length
    ? tokens[0].charAt(0).toUpperCase() + tokens.join(' ').slice(1)
    : raw.trim();
  return {
    canonicalName: pretty,
    slug: slugify(pretty),
    category: categorize(tokens),
    matchedExisting: false,
    via: 'new',
    similarity: 0,
  };
}
