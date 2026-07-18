import { describe, expect, it } from 'vitest';
import {
  canonicalize,
  normalizeKey,
  normalizeTokens,
  slugify,
  type KnownEntity,
} from '../canonicalize';
import { categorize } from '../taxonomy';

describe('normalización', () => {
  it('quita acentos, marcas, modelos y stopwords', () => {
    expect(normalizeTokens('Impresora Térmica HP X100 Pro')).toEqual([
      'impresora',
      'termica',
    ]);
  });
  it('singulariza básico', () => {
    expect(normalizeTokens('luces led inteligentes')).toEqual([
      'luce',
      'led',
      'inteligente',
    ]);
  });
  it('clave insensible al orden de palabras', () => {
    expect(normalizeKey('impresora mini portátil')).toBe(
      normalizeKey('portátil mini impresora')
    );
  });
  it('slugify', () => {
    expect(slugify('Mini impresora portátil')).toBe('mini-impresora-portatil');
  });
});

describe('canonicalize — el caso crítico de CLAUDE.md', () => {
  it('agrupa variantes es/en/marca+modelo en UNA entidad', () => {
    // Primera aparición vía alias dictionary
    const first = canonicalize('Portable printer');
    expect(first.canonicalName).toBe('Mini impresora portátil');
    expect(first.via).toBe('alias');

    const known: KnownEntity[] = [
      {
        name: 'Mini impresora portátil',
        slug: 'mini-impresora-portatil',
        aliases: ['portable printer'],
      },
    ];

    // Variante en español
    const second = canonicalize('mini impresora', known);
    expect(second.canonicalName).toBe('Mini impresora portátil');
    expect(second.matchedExisting).toBe(true);

    // Variante con marca y código de modelo
    const third = canonicalize('Impresora térmica HP X100', known);
    expect(third.canonicalName).toBe('Mini impresora portátil');

    // Variante en inglés con marca
    const fourth = canonicalize('Phomemo thermal sticker maker', known);
    expect(fourth.canonicalName).toBe('Mini impresora portátil');
  });

  it('fuzzy matching agrupa nombres similares sin alias', () => {
    const known: KnownEntity[] = [
      { name: 'Organizador magnético cocina', slug: 'organizador-magnetico-cocina', aliases: [] },
    ];
    const match = canonicalize('organizadores magnéticos de cocina', known);
    expect(match.matchedExisting).toBe(true);
    expect(match.via).toBe('fuzzy');
  });

  it('nombres distintos crean entidades distintas', () => {
    const known: KnownEntity[] = [
      { name: 'Mini impresora portátil', slug: 'mini-impresora-portatil', aliases: [] },
    ];
    const match = canonicalize('Aspiradora robot para autos', known);
    expect(match.matchedExisting).toBe(false);
    expect(match.via).toBe('new');
  });
});

describe('taxonomía', () => {
  it('categoriza por keywords bilingües', () => {
    expect(categorize(normalizeTokens('mini impresora portátil'))).toBe('Gadgets');
    expect(categorize(normalizeTokens('smart water bottle'))).toBe('Cocina');
    expect(categorize(normalizeTokens('neck massager therapy'))).toBe('Salud y bienestar');
    expect(categorize(normalizeTokens('cat water fountain'))).toBe('Mascotas');
    expect(categorize(normalizeTokens('cosa rara desconocida'))).toBe('General');
  });
  it('canonicalize asigna categoría', () => {
    expect(canonicalize('air fryer').category).toBe('Cocina');
    expect(canonicalize('posture corrector').category).toBe('Fitness');
  });
});
