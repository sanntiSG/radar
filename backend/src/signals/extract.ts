import type { RawItem } from '../adapters/baseAdapter';
import { normalizeTokens } from '../services/canonicalize';

/**
 * Extracción de candidatos a producto desde títulos/textos:
 * n-gramas (2-3 tokens normalizados) contados entre todos los items.
 * Un candidato es válido si se repite lo suficiente — la canonicalización
 * posterior agrupa las variantes en entidades canónicas.
 */

// Tokens demasiado genéricos para formar un candidato por sí solos.
const GENERIC = new Set([
  'producto', 'product', 'cosa', 'thing', 'item', 'idea', 'gift', 'regalo',
  'review', 'resena', 'deal', 'oferta', 'buy', 'compra', 'venta', 'sale',
  'love', 'like', 'need', 'want', 'get', 'got', 'found', 'made', 'make',
  'good', 'great', 'nice', 'perfect', 'favorite', 'today', 'finally',
]);

export interface Candidate {
  phrase: string; // frase normalizada (orden original)
  count: number; // en cuántos items aparece
  engagement: number; // engagement acumulado de esos items
  sources: Set<string>;
}

function ngrams(tokens: string[], size: number): string[] {
  const out: string[] = [];
  for (let i = 0; i + size <= tokens.length; i++) {
    out.push(tokens.slice(i, i + size).join(' '));
  }
  return out;
}

/**
 * Cuenta n-gramas de 2-3 tokens en los items y devuelve candidatos
 * que aparecen en al menos `minCount` items distintos.
 */
export function extractCandidates(
  items: RawItem[],
  minCount = 2
): Candidate[] {
  const counts = new Map<string, Candidate>();

  for (const item of items) {
    const tokens = normalizeTokens(`${item.title} ${item.text}`);
    const seen = new Set<string>(); // un item aporta 1 al conteo de cada frase
    for (const size of [2, 3]) {
      for (const phrase of ngrams(tokens, size)) {
        const words = phrase.split(' ');
        if (words.every((w) => GENERIC.has(w))) continue;
        if (words.some((w) => w.length < 3)) continue;
        if (seen.has(phrase)) continue;
        seen.add(phrase);

        const existing = counts.get(phrase);
        if (existing) {
          existing.count++;
          existing.engagement += item.engagement;
          existing.sources.add(item.source);
        } else {
          counts.set(phrase, {
            phrase,
            count: 1,
            engagement: item.engagement,
            sources: new Set([item.source]),
          });
        }
      }
    }
  }

  return [...counts.values()]
    .filter((c) => c.count >= minCount)
    .sort((a, b) => b.count - a.count);
}

/** Agrega hashtags de todos los items con su frecuencia y engagement. */
export function aggregateHashtags(
  items: RawItem[]
): Map<string, { count: number; engagement: number; sources: Set<string> }> {
  const map = new Map<string, { count: number; engagement: number; sources: Set<string> }>();
  for (const item of items) {
    for (const tag of item.hashtags) {
      const entry = map.get(tag);
      if (entry) {
        entry.count++;
        entry.engagement += item.engagement;
        entry.sources.add(item.source);
      } else {
        map.set(tag, { count: 1, engagement: item.engagement, sources: new Set([item.source]) });
      }
    }
  }
  return map;
}
