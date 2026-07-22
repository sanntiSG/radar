import { Router } from 'express';
import { compareTwoStrings } from 'string-similarity';
import { Signal } from '../models';
import { authOptional } from '../middlewares/auth';
import { normalizeTokens } from '../services/canonicalize';
import { CATEGORIES } from '../services/taxonomy';
import { asyncHandler } from './helpers';

export const assistantRouter = Router();

// Normalized category names for intent detection
const CAT_TOKENS = CATEGORIES.map((c) => ({
  name: c,
  tokens: new Set(normalizeTokens(c)),
}));

/** Detect which category the query is asking about, if any. */
function detectCategory(tokens: string[]): string | null {
  for (const cat of CAT_TOKENS) {
    if (tokens.some((t) => cat.tokens.has(t))) return cat.name;
  }
  return null;
}

/** Fuzzy match a query fragment against signal names to find a specific signal. */
async function findSignalByName(fragment: string): Promise<typeof Signal.prototype | null> {
  const allSignals = await Signal.find().select('name slug factors explanation metrics').lean();
  let best: { signal: (typeof allSignals)[0]; score: number } | null = null;
  for (const s of allSignals) {
    const score = compareTwoStrings(fragment.toLowerCase(), s.name.toLowerCase());
    if (!best || score > best.score) best = { signal: s, score };
  }
  if (best && best.score >= 0.35) return best.signal as any;
  return null;
}

const SUGGESTIONS = [
  '¿Qué está creciendo ahora?',
  'Muéstrame oportunidades tempranas',
  'Señales de Gadgets',
  'Señales de Cocina',
  '¿Qué tienen buenas predicciones?',
  '¿Cuántas señales hay?',
  '¿De dónde vienen los datos?',
];

/**
 * POST /api/assistant/query
 * Body: { q: string }
 * Response: { answer: string, kind: string, signals?: [], suggestions?: [] }
 */
assistantRouter.post(
  '/query',
  authOptional,
  asyncHandler(async (req, res) => {
    const q = typeof req.body?.q === 'string' ? req.body.q.trim() : '';
    if (!q || q.length < 2) {
      return res.json({
        answer: 'Hola, soy Radar. Puedo responder preguntas sobre las señales de mercado detectadas. ¿Qué quieres saber?',
        kind: 'welcome',
        suggestions: SUGGESTIONS,
      });
    }

    const tokens = normalizeTokens(q);

    // ── INTENT: explain a specific entity ────────────────────────────────────
    const explainTriggers = ['explica', 'explique', 'porque', 'razon', 'motivo', 'detalle'];
    if (tokens.some((t) => explainTriggers.includes(t))) {
      // Extract entity fragment: everything after the trigger word
      const triggerIdx = tokens.findIndex((t) => explainTriggers.includes(t));
      const fragment = tokens.slice(triggerIdx + 1).join(' ');
      if (fragment.length > 2) {
        const signal = await findSignalByName(fragment);
        if (signal) {
          const hasFactor = Array.isArray((signal as any).factors) && (signal as any).factors.length > 0;
          const topFactor = hasFactor
            ? (signal as any).factors.find((f: any) => f.weight && f.contribution > 50)
            : null;
          const answer = hasFactor
            ? `${signal.name}: ${signal.explanation} ${
                topFactor ? `El factor principal es "${topFactor.label}" con una contribución de ${topFactor.contribution}/100.` : ''
              }`
            : `${signal.name}: ${signal.explanation}`;
          return res.json({
            answer,
            kind: 'explain',
            signals: [signal],
            suggestions: SUGGESTIONS.slice(0, 3),
          });
        }
      }
    }

    // ── INTENT: opportunities ─────────────────────────────────────────────────
    const oppTokens = ['oportunidad', 'oportunidades', 'emergente', 'temprana', 'ignorada', 'escondida', 'descubrir'];
    if (tokens.some((t) => oppTokens.includes(t))) {
      const signals = await Signal.find({ status: { $ne: 'dormant' } })
        .select('name slug category entityType radarScore growthScore status metrics sparkline')
        .sort({ 'metrics.acceleration': -1, 'metrics.velocity': -1 })
        .limit(6);
      return res.json({
        answer: `Señales con mayor potencial de crecimiento temprano en este momento. Combinan alta aceleración con volumen aún bajo — las que el mercado no descubrió todavía.`,
        kind: 'opportunities',
        signals,
        suggestions: ['Explícame la primera', '¿Qué está creciendo más?', 'Señales de Gadgets'],
      });
    }

    // ── INTENT: predictions / future ─────────────────────────────────────────
    const predTokens = ['prediccion', 'predicciones', 'futuro', 'pronostico', 'crecera', 'tendran', 'proximos'];
    if (tokens.some((t) => predTokens.includes(t))) {
      const signals = await Signal.find({ confidence: { $in: ['medium', 'high'] }, 'predictions.d7': { $ne: null } })
        .select('name slug category entityType radarScore growthScore confidence status predictions sparkline')
        .sort({ radarScore: -1 })
        .limit(6);
      return res.json({
        answer: `Señales con predicciones a 7 días y confianza media o alta. Las predicciones se construyen con regresión lineal y suavizado exponencial sobre el histórico real.`,
        kind: 'predictions',
        signals,
        suggestions: ['¿Cuál tiene mayor confianza?', 'Oportunidades tempranas', '¿Qué está creciendo?'],
      });
    }

    // ── INTENT: stats / summary ───────────────────────────────────────────────
    const statsTokens = ['estadistica', 'estadisticas', 'resumen', 'cuantas', 'cuantos', 'total', 'hay', 'tiene'];
    if (tokens.some((t) => statsTokens.includes(t))) {
      const [total, rising, highConf, peaking] = await Promise.all([
        Signal.countDocuments(),
        Signal.countDocuments({ status: 'rising' }),
        Signal.countDocuments({ confidence: 'high' }),
        Signal.countDocuments({ status: 'peaking' }),
      ]);
      return res.json({
        answer: `Radar monitorea ${total} señales en total. ${rising} están en ascenso activo, ${peaking} están en su pico máximo, y ${highConf} tienen confianza alta en sus predicciones.`,
        kind: 'stats',
        suggestions: ['¿Qué está creciendo?', 'Oportunidades tempranas', '¿De dónde vienen los datos?'],
      });
    }

    // ── INTENT: sources / data ────────────────────────────────────────────────
    const sourceTokens = ['fuente', 'fuentes', 'dato', 'datos', 'donde', 'origen', 'plataforma', 'reddit', 'google'];
    if (tokens.some((t) => sourceTokens.includes(t))) {
      return res.json({
        answer: `Radar extrae datos de tres fuentes públicas gratuitas: Reddit (publicaciones y discusiones de subreddits de ecommerce), Google Trends (índice de interés de búsqueda por keyword) y RSS de blogs especializados en ecommerce. Los datos se renuevan cada 2 horas. No se usan APIs de pago.`,
        kind: 'sources',
        suggestions: ['¿Qué está creciendo?', 'Estadísticas generales', 'Oportunidades tempranas'],
      });
    }

    // ── INTENT: hashtags ─────────────────────────────────────────────────────
    const hashtagTokens = ['hashtag', 'hashtags', 'etiqueta', 'etiquetas', 'tag'];
    if (tokens.some((t) => hashtagTokens.includes(t))) {
      const signals = await Signal.find({ entityType: 'hashtag' })
        .select('name slug category entityType radarScore growthScore status metrics sparkline')
        .sort({ radarScore: -1 })
        .limit(6);
      return res.json({
        answer: `Top hashtags por Radar Score. Son los más mencionados y con mayor crecimiento en las fuentes monitoreadas.`,
        kind: 'hashtags',
        signals,
        suggestions: ['¿Cuál tiene más momentum?', '¿Qué productos están creciendo?', 'Oportunidades'],
      });
    }

    // ── INTENT: products ─────────────────────────────────────────────────────
    const productTokens = ['producto', 'productos', 'product', 'articulo', 'item'];
    if (tokens.some((t) => productTokens.includes(t))) {
      const signals = await Signal.find({ entityType: 'product' })
        .select('name slug category entityType radarScore growthScore status metrics sparkline')
        .sort({ radarScore: -1 })
        .limit(6);
      return res.json({
        answer: `Top productos por Radar Score. Ordenados por velocidad de crecimiento, aceleración, frecuencia y engagement combinados.`,
        kind: 'products',
        signals,
        suggestions: ['Oportunidades tempranas', '¿Qué tendencias hay?', 'Señales de Gadgets'],
      });
    }

    // ── INTENT: by category ───────────────────────────────────────────────────
    const detectedCat = detectCategory(tokens);
    if (detectedCat) {
      const signals = await Signal.find({ category: detectedCat })
        .select('name slug category entityType radarScore growthScore status confidence metrics sparkline')
        .sort({ radarScore: -1 })
        .limit(6);
      return res.json({
        answer: signals.length > 0
          ? `${signals.length} señales detectadas en ${detectedCat}. La más fuerte es "${signals[0].name}" con Radar Score ${signals[0].radarScore}.`
          : `No hay señales activas en la categoría ${detectedCat} en este momento.`,
        kind: 'category',
        signals,
        suggestions: [`Explícame ${signals[0]?.name ?? 'la primera'}`, 'Oportunidades tempranas', '¿Qué está creciendo?'],
      });
    }

    // ── DEFAULT INTENT: top growing signals ──────────────────────────────────
    const signals = await Signal.find({ status: { $in: ['rising', 'peaking', 'new'] } })
      .select('name slug category entityType radarScore growthScore status confidence metrics sparkline')
      .sort({ radarScore: -1 })
      .limit(8);
    return res.json({
      answer: signals.length > 0
        ? `Estas son las ${signals.length} señales con mayor Radar Score actualmente. "${signals[0].name}" lidera con ${signals[0].radarScore} puntos.`
        : `El radar no tiene señales activas en este momento. Ejecuta el seed para cargar datos.`,
      kind: 'top',
      signals,
      suggestions: SUGGESTIONS.slice(1),
    });
  })
);
