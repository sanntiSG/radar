import type { Preferences } from './auth';

/**
 * Listas y adaptaciones de copy del Radar Personal enriquecido (N11).
 * La adaptación es real, no cosmética: cambia lo que el usuario lee según
 * su nivel declarado, no solo lo que se guarda en su perfil.
 */

export const EXPERIENCE_LEVELS: { id: Exclude<Preferences['experienceLevel'], ''>; label: string }[] = [
  { id: 'principiante', label: 'Principiante' },
  { id: 'vendedor', label: 'Vendedor / Emprendedor' },
  { id: 'agencia', label: 'Agencia' },
  { id: 'empresa', label: 'Empresa' },
];

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

export const LANGUAGES: { id: Preferences['language']; label: string }[] = [
  { id: 'es', label: 'Español' },
  { id: 'en', label: 'English' },
  { id: 'pt', label: 'Português' },
];

const COUNTRY_LABELS: Record<string, string> = {
  AR: 'Argentina', MX: 'México', CO: 'Colombia', CL: 'Chile', PE: 'Perú',
  ES: 'España', UY: 'Uruguay', EC: 'Ecuador', US: 'Estados Unidos', BR: 'Brasil',
};

export const MAX_GOALS = 4;

function isDense(level: Preferences['experienceLevel']): boolean {
  return level === 'agencia' || level === 'empresa';
}

/** Subtítulo del dashboard adaptado al nivel de experiencia declarado. */
export function dashboardSubtitle(level: Preferences['experienceLevel']): string {
  if (level === 'principiante') {
    return 'Te mostramos qué está pasando y por qué importa — sin dar nada por sabido.';
  }
  if (isDense(level)) {
    return 'Datos densos, sin relleno — lo que necesitas para decidir rápido.';
  }
  return 'Lo que el mercado murmura, ordenado a tu manera.';
}

/** Subtítulo del Radar Diario adaptado al nivel. */
export function dailySubtitle(level: Preferences['experienceLevel']): string {
  if (level === 'principiante') {
    return 'Un resumen simple de lo más relevante — con el porqué de cada señal a mano.';
  }
  if (isDense(level)) {
    return 'Resumen operativo del día: movimientos, oportunidades y cambios desde ayer.';
  }
  return 'Lo más relevante del mercado detectado hoy.';
}

/** Saludo del Asistente adaptado al nivel. */
export function assistantIntro(level: Preferences['experienceLevel']): string {
  if (level === 'principiante') {
    return 'Puedo ayudarte a entender qué está pasando en el mercado, explicarte por qué existe una señal (paso a paso) o mostrarte oportunidades tempranas.';
  }
  if (isDense(level)) {
    return 'Consultas directas sobre señales, rankings por categoría, comparaciones y proyecciones — todo sobre datos propios, sin relleno.';
  }
  return 'Puedo ayudarte a entender qué señales detectó el motor, explicar por qué una señal existe o mostrarte oportunidades tempranas.';
}

/** Resumen compacto de perfil para la cabecera ("Agencia · Argentina · Gadgets, Cocina"). */
export function profileSummary(prefs: Pick<Preferences, 'experienceLevel' | 'country' | 'niches'>): string | null {
  const parts: string[] = [];
  const levelLabel = EXPERIENCE_LEVELS.find((l) => l.id === prefs.experienceLevel)?.label;
  if (levelLabel) parts.push(levelLabel);
  if (prefs.country && prefs.country !== 'global') parts.push(COUNTRY_LABELS[prefs.country] ?? prefs.country);
  if (prefs.niches && prefs.niches.length > 0) {
    parts.push(prefs.niches.slice(0, 2).join(', ') + (prefs.niches.length > 2 ? '…' : ''));
  }
  return parts.length > 0 ? parts.join(' · ') : null;
}

/**
 * Reordena sugerencias del asistente priorizando las que calzan con los
 * objetivos declarados del usuario (heurística simple por palabras clave).
 */
export function biasSuggestionsByGoals(suggestions: string[], goals: string[]): string[] {
  if (!goals || goals.length === 0) return suggestions;
  const weight = (s: string): number => {
    const lower = s.toLowerCase();
    let score = 0;
    if (goals.includes('seguir_competencia') && (lower.includes('compara') || lower.includes('vs'))) score += 2;
    if (goals.includes('detectar_nichos') && lower.includes('categor')) score += 2;
    if (goals.includes('encontrar_productos') && lower.includes('oportunidad')) score += 2;
    if (goals.includes('validar_ideas') && lower.includes('probabilidad')) score += 2;
    if (goals.includes('ahorrar_tiempo') && lower.includes('creciendo')) score += 1;
    return score;
  };
  return [...suggestions].sort((a, b) => weight(b) - weight(a));
}
