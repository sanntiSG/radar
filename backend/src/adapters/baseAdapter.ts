/**
 * Cada fuente de datos se implementa como un adaptador independiente.
 * Si una fuente falla, devuelve [] y el sistema sigue operando.
 */

export interface RawItem {
  source: string; // 'reddit' | 'google-trends' | 'rss'
  originalId: string; // id único en la fuente (para el cache)
  title: string;
  text: string;
  url: string;
  engagement: number; // upvotes + comentarios, etc.
  hashtags: string[];
  createdAt: Date;
}

export interface Adapter {
  name: string;
  /** Obtiene items nuevos de la fuente. Nunca lanza: loguea y devuelve []. */
  fetchItems(): Promise<RawItem[]>;
}
