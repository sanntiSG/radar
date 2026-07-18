export function formatPct(value: number): string {
  const rounded = Math.round(value);
  return `${rounded > 0 ? '+' : ''}${rounded}%`;
}

export function formatNumber(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(Math.round(value));
}

export const STATUS_LABELS: Record<string, string> = {
  new: 'Nueva',
  rising: 'En ascenso',
  peaking: 'En pico',
  cooling: 'Enfriándose',
  dormant: 'Dormida',
};

export const CONFIDENCE_LABELS: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
};

export const ENTITY_LABELS: Record<string, string> = {
  product: 'Producto',
  hashtag: 'Hashtag',
  trend: 'Tendencia',
  category: 'Categoría',
};

export function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 36e5);
  if (hours < 1) return 'hace minutos';
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'hace 1 día' : `hace ${days} días`;
}
