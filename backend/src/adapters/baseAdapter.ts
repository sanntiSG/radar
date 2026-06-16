/**
 * Base Adapter — Interfaz común para todas las fuentes de datos.
 * Si una fuente cae, el sistema sigue operando con el resto.
 */

export interface RawMention {
  text: string;           // título/texto de la publicación
  source: string;         // 'reddit', 'google_trends', etc.
  url?: string;
  author?: string;
  engagement: number;     // upvotes + comments + shares
  publishedAt: Date;
  tags?: string[];
  subreddit?: string;
}

export interface AdapterResult {
  success: boolean;
  source: string;
  mentions: RawMention[];
  fetchedAt: Date;
  error?: string;
}

export abstract class BaseAdapter {
  abstract readonly sourceName: string;

  /**
   * Fetch con tolerancia a fallos: siempre devuelve AdapterResult.
   * Nunca lanza — si falla, retorna success: false con el error.
   */
  async fetch(query?: string): Promise<AdapterResult> {
    const fetchedAt = new Date();
    try {
      const mentions = await this.fetchMentions(query);
      return { success: true, source: this.sourceName, mentions, fetchedAt };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[${this.sourceName}] Adapter error: ${message}`);
      return {
        success: false,
        source: this.sourceName,
        mentions: [],
        fetchedAt,
        error: message,
      };
    }
  }

  protected abstract fetchMentions(query?: string): Promise<RawMention[]>;
}
