import { Router } from 'express';
import { compareTwoStrings } from 'string-similarity';
import { Signal } from '../models';
import { COUNTRIES } from '../models/User';
import { authOptional } from '../middlewares/auth';
import { normalizeTokens } from '../services/canonicalize';
import { CATEGORIES } from '../services/taxonomy';
import { asyncHandler } from './helpers';

export const assistantRouter = Router();

/**
 * Radar Assistant v2 — router de intenciones determinista sobre datos
 * propios, sin IA de pago. Se evalúa una lista ORDENADA de intenciones (la
 * más específica primero); gana la primera que matchea. Dos "modificadores"
 * transversales se aplican al final sobre cualquier respuesta con señales:
 * ventana temporal (recencia) y geo (transparencia sobre qué está y qué no
 * está geo-segmentado).
 */

interface AssistantPayload {
  answer: string;
  kind: string;
  signals?: unknown[];
  categories?: {
    name: string;
    avgAcceleration: number;
    avgVelocity: number;
    avgMomentum: number;
    count: number;
  }[];
  suggestions?: string[];
}

interface QueryContext {
  q: string;
  tokens: string[];
}

const SIGNAL_PROJECTION =
  'name slug category entityType radarScore growthScore status confidence confidenceScore ' +
  'explanation factors metrics predictions sparkline detectedAt sources';

// ── Vocabularios de intención ────────────────────────────────────────────

const CAT_TOKENS = CATEGORIES.map((c) => ({ name: c, tokens: new Set(normalizeTokens(c)) }));

const ACCEL_WORDS = ['acelerar', 'acelerando', 'acelera', 'aceleran', 'aceleracion', 'aceleraciones'];
const VELOCITY_WORDS = ['crecer', 'creciendo', 'crece', 'crecen', 'crecimiento', 'crecimientos'];
const MOMENTUM_WORDS = ['momentum'];
const CONTINUATION_WORDS = ['seguir', 'continuar', 'seguira', 'seguiran', 'continuara', 'continuaran'];

const ENTITY_TOKENS: Record<'product' | 'hashtag' | 'trend', string[]> = {
  product: ['producto', 'productos', 'product', 'articulo', 'item'],
  hashtag: ['hashtag', 'hashtags', 'etiqueta', 'etiquetas', 'tag'],
  trend: ['tendencia', 'tendencias', 'trend'],
};

const ENTITY_PLURAL: Record<string, string> = {
  product: 'productos',
  hashtag: 'hashtags',
  trend: 'tendencias',
};

const SUGGESTIONS = [
  '¿Qué está creciendo ahora?',
  'Muéstrame oportunidades tempranas',
  '¿Qué categorías aceleran más?',
  'Productos de Gadgets acelerando',
  '¿Qué tiene mayor probabilidad de seguir creciendo?',
  '¿Cuántas señales hay?',
  '¿De dónde vienen los datos?',
];

// ── Helpers de detección ─────────────────────────────────────────────────

function detectCategory(tokens: string[]): string | null {
  for (const cat of CAT_TOKENS) if (tokens.some((t) => cat.tokens.has(t))) return cat.name;
  return null;
}

function detectEntityTypeToken(tokens: string[]): 'product' | 'hashtag' | 'trend' | null {
  for (const [type, words] of Object.entries(ENTITY_TOKENS)) {
    if (tokens.some((t) => words.includes(t))) return type as 'product' | 'hashtag' | 'trend';
  }
  return null;
}

function detectMetricVerb(tokens: string[]): 'acceleration' | 'velocity' | 'momentum' | null {
  if (tokens.some((t) => ACCEL_WORDS.includes(t))) return 'acceleration';
  if (tokens.some((t) => VELOCITY_WORDS.includes(t))) return 'velocity';
  if (tokens.some((t) => MOMENTUM_WORDS.includes(t))) return 'momentum';
  return null;
}

/** Detecta un país mencionado en la consulta contra la lista de COUNTRIES soportada. */
function detectCountry(tokens: string[]): { code: string; label: string } | null {
  const tokenSet = new Set(tokens);
  for (const c of COUNTRIES) {
    if (c.code === 'global') continue;
    const labelTokens = normalizeTokens(c.label);
    if (labelTokens.length > 0 && labelTokens.every((t) => tokenSet.has(t))) return c;
  }
  return null;
}

/**
 * Ventana temporal ("hoy", "48h", "esta semana"). Se parsea sobre el texto
 * crudo (no sobre tokens) porque normalizeTokens descarta cualquier token
 * con dígitos.
 */
function parseTimeWindow(rawQuery: string): { hours: number; label: string } | null {
  const q = rawQuery.toLowerCase();
  const hourMatch = q.match(/(\d+)\s*h(?:oras?)?\b/);
  if (hourMatch) return { hours: Number(hourMatch[1]), label: `las últimas ${hourMatch[1]} horas` };
  const dayMatch = q.match(/(\d+)\s*d[ií]as?\b/);
  if (dayMatch) return { hours: Number(dayMatch[1]) * 24, label: `los últimos ${dayMatch[1]} días` };
  if (/\bhoy\b/.test(q)) return { hours: 24, label: 'hoy' };
  if (/\besta semana\b|\bultima semana\b|\búltima semana\b/.test(q)) {
    return { hours: 24 * 7, label: 'esta semana' };
  }
  return null;
}

/** Fuzzy match de un fragmento de texto contra nombres de señales. */
async function findSignalByName(fragment: string) {
  const allSignals = await Signal.find().select(SIGNAL_PROJECTION).lean();
  let best: { signal: (typeof allSignals)[0]; score: number } | null = null;
  for (const s of allSignals) {
    const score = compareTwoStrings(fragment.toLowerCase(), s.name.toLowerCase());
    if (!best || score > best.score) best = { signal: s, score };
  }
  return best && best.score >= 0.35 ? best.signal : null;
}

// ── Modificadores transversales (se aplican tras resolver la intención) ──

/** Ventana temporal: filtra/reordena por recencia real y aclara la granularidad diaria. */
function applyTimeWindow(payload: AssistantPayload, window: { hours: number; label: string } | null): AssistantPayload {
  if (!window || !payload.signals || payload.signals.length === 0) return payload;
  const list = payload.signals as { metrics?: { recency?: number } }[];
  const withinWindow = list.filter((s) => (s.metrics?.recency ?? 999) <= window.hours);
  const finalList = withinWindow.length > 0 ? withinWindow : list;
  const sorted = [...finalList].sort(
    (a, b) => (a.metrics?.recency ?? 999) - (b.metrics?.recency ?? 999)
  );
  return {
    ...payload,
    signals: sorted,
    answer:
      `${payload.answer} Acotado a ${window.label} por recencia real de actividad — Radar actualiza a ` +
      `granularidad diaria, así que "hoy" refleja el último snapshot disponible.`,
  };
}

/** Geo: transparencia — nada está geo-segmentado salvo el interés de Google Trends. */
function applyGeo(payload: AssistantPayload, country: { code: string; label: string } | null): AssistantPayload {
  if (!country) return payload;
  return {
    ...payload,
    answer:
      `${payload.answer} Nota: las señales de Radar aún no están geo-segmentadas — solo el interés de ` +
      `Google Trends usa "${country.label}" como referencia; el resto de los datos es agregado global.`,
  };
}

// ── Intenciones (orden = prioridad; la primera que matchea gana) ────────

type IntentHandler = (ctx: QueryContext) => Promise<AssistantPayload | null>;

/** "Compara X con Y" / "X vs Y" — contraste directo entre dos señales. */
const comparisonIntent: IntentHandler = async (ctx) => {
  const match =
    ctx.q.match(/compara(?:r)?\s+(.+?)\s+(?:con|y)\s+(.+)/i) ??
    ctx.q.match(/(.+?)\s+(?:vs\.?|versus)\s+(.+)/i);
  if (!match) return null;
  const [, fragA, fragB] = match;
  const [a, b] = await Promise.all([findSignalByName(fragA), findSignalByName(fragB)]);
  if (!a || !b || a.slug === b.slug) return null;

  const leader = a.radarScore >= b.radarScore ? a : b;
  const other = leader === a ? b : a;
  return {
    answer:
      `${leader.name} (Radar Score ${leader.radarScore}) va adelante de ${other.name} (${other.radarScore}) ` +
      `en este momento. ${leader.name}: ${leader.explanation} ${other.name}: ${other.explanation}`,
    kind: 'comparison',
    signals: [a, b],
    suggestions: [`Explícame ${leader.name}`, '¿Qué está creciendo?', 'Oportunidades tempranas'],
  };
};

/** "Explica X" / "por qué X" — desglose de factores de una señal puntual. */
const explainIntent: IntentHandler = async (ctx) => {
  const triggers = ['explica', 'explique', 'porque', 'razon', 'motivo', 'detalle'];
  if (!ctx.tokens.some((t) => triggers.includes(t))) return null;
  const idx = ctx.tokens.findIndex((t) => triggers.includes(t));
  const fragment = ctx.tokens.slice(idx + 1).join(' ');
  if (fragment.length <= 2) return null;

  const signal = await findSignalByName(fragment);
  if (!signal) return null;

  const factors = (signal as { factors?: { weight: number | null; contribution: number; label: string }[] }).factors;
  const topFactor = factors?.find((f) => f.weight && f.contribution > 50);
  return {
    answer:
      `${signal.name}: ${signal.explanation}` +
      (topFactor ? ` El factor principal es "${topFactor.label}" con una contribución de ${topFactor.contribution}/100.` : ''),
    kind: 'explain',
    signals: [signal],
    suggestions: SUGGESTIONS.slice(0, 3),
  };
};

/** "¿Qué categorías aceleran/crecen más?" — ranking agregado por categoría. */
const categoryRankingIntent: IntentHandler = async (ctx) => {
  if (!ctx.tokens.includes('categoria') && !ctx.tokens.includes('categorias')) return null;

  const signals = await Signal.find({ status: { $ne: 'dormant' } }).select('category metrics').lean();
  if (signals.length === 0) {
    return { answer: 'Aún no hay suficientes señales activas para rankear categorías.', kind: 'category_ranking', categories: [] };
  }

  const byCat = new Map<string, { accelSum: number; velSum: number; momSum: number; count: number }>();
  for (const s of signals) {
    const cur = byCat.get(s.category) ?? { accelSum: 0, velSum: 0, momSum: 0, count: 0 };
    cur.accelSum += s.metrics?.acceleration ?? 0;
    cur.velSum += s.metrics?.velocity ?? 0;
    cur.momSum += s.metrics?.momentum ?? 0;
    cur.count++;
    byCat.set(s.category, cur);
  }

  const metric = detectMetricVerb(ctx.tokens) ?? 'acceleration';
  const categories = [...byCat.entries()]
    .map(([name, v]) => ({
      name,
      avgAcceleration: Math.round((v.accelSum / v.count) * 10) / 10,
      avgVelocity: Math.round((v.velSum / v.count) * 10) / 10,
      avgMomentum: Math.round(v.momSum / v.count),
      count: v.count,
    }))
    .sort((a, b) =>
      metric === 'velocity' ? b.avgVelocity - a.avgVelocity
      : metric === 'momentum' ? b.avgMomentum - a.avgMomentum
      : b.avgAcceleration - a.avgAcceleration
    )
    .slice(0, 8);

  const metricLabel = metric === 'velocity' ? 'velocidad de crecimiento' : metric === 'momentum' ? 'momentum' : 'aceleración';
  return {
    answer: `"${categories[0].name}" lidera en ${metricLabel} entre las categorías activas, con ${categories[0].count} señales monitoreadas.`,
    kind: 'category_ranking',
    categories,
    suggestions: [`Señales de ${categories[0].name}`, '¿Qué está creciendo?', 'Oportunidades tempranas'],
  };
};

/** "Mayor probabilidad de seguir creciendo" — confianza alta + proyección sostenida. */
const continuationIntent: IntentHandler = async (ctx) => {
  const triggersContinuation =
    ctx.tokens.includes('probabilidad') ||
    (CONTINUATION_WORDS.some((w) => ctx.tokens.includes(w)) &&
      (VELOCITY_WORDS.some((w) => ctx.tokens.includes(w)) || ctx.tokens.includes('crecen')));
  if (!triggersContinuation) return null;

  const candidates = await Signal.find({
    confidence: { $in: ['medium', 'high'] },
    'predictions.d7': { $ne: null },
  })
    .select(SIGNAL_PROJECTION)
    .lean();

  const likely = candidates
    .filter((s) => (s.predictions?.d7 ?? 0) > (s.metrics?.frequency ?? 0))
    .sort((a, b) => (b.confidenceScore ?? 0) - (a.confidenceScore ?? 0))
    .slice(0, 6);

  return {
    answer:
      likely.length > 0
        ? `${likely.length} señales con mayor probabilidad de continuar creciendo, según confianza del modelo y proyección a 7 días. "${likely[0].name}" es la más sólida.`
        : 'Ninguna señal cumple ahora mismo confianza alta + proyección de crecimiento sostenido.',
    kind: 'continuation',
    signals: likely,
    suggestions: ['Explícame la primera', 'Oportunidades tempranas', '¿Qué categorías aceleran más?'],
  };
};

/** "Productos de belleza acelerando" — entityType + categoría + métrica combinados. */
const combinedMetricIntent: IntentHandler = async (ctx) => {
  const metric = detectMetricVerb(ctx.tokens);
  const entityType = detectEntityTypeToken(ctx.tokens);
  const category = detectCategory(ctx.tokens);
  if (!metric || (!entityType && !category)) return null;

  const filter: Record<string, unknown> = { status: { $ne: 'dormant' } };
  if (entityType) filter.entityType = entityType;
  if (category) filter.category = category;

  const sortField =
    metric === 'acceleration' ? 'metrics.acceleration' : metric === 'velocity' ? 'metrics.velocity' : 'metrics.momentum';
  const signals = await Signal.find(filter)
    .select(SIGNAL_PROJECTION)
    .sort({ [sortField]: -1 })
    .limit(6);

  const metricLabel = metric === 'acceleration' ? 'aceleración' : metric === 'velocity' ? 'velocidad de crecimiento' : 'momentum';
  const scopeLabel = [entityType ? ENTITY_PLURAL[entityType] : null, category].filter(Boolean).join(' de ');
  return {
    answer:
      signals.length > 0
        ? `${signals.length} ${scopeLabel || 'señales'} ordenadas por ${metricLabel}. "${signals[0].name}" lidera este criterio.`
        : `No encontré ${scopeLabel || 'señales'} activas con ese criterio en este momento.`,
    kind: 'metric_ranking',
    signals,
    suggestions: ['¿Qué categorías aceleran más?', 'Oportunidades tempranas', '¿Qué está creciendo?'],
  };
};

/** Señales tempranas ignoradas por la mayoría. */
const opportunitiesIntent: IntentHandler = async (ctx) => {
  const oppTokens = ['oportunidad', 'oportunidades', 'emergente', 'temprana', 'ignorada', 'escondida', 'descubrir'];
  if (!ctx.tokens.some((t) => oppTokens.includes(t))) return null;
  const signals = await Signal.find({ status: { $ne: 'dormant' } })
    .select(SIGNAL_PROJECTION)
    .sort({ 'metrics.acceleration': -1, 'metrics.velocity': -1 })
    .limit(6);
  return {
    answer:
      'Señales con mayor potencial de crecimiento temprano en este momento. Combinan alta aceleración con volumen aún bajo — las que el mercado no descubrió todavía.',
    kind: 'opportunities',
    signals,
    suggestions: ['Explícame la primera', '¿Qué está creciendo más?', '¿Qué categorías aceleran más?'],
  };
};

/** Predicciones generales a 7 días con confianza media/alta. */
const predictionsIntent: IntentHandler = async (ctx) => {
  const predTokens = ['prediccion', 'predicciones', 'futuro', 'pronostico', 'crecera', 'tendran', 'proximos'];
  if (!ctx.tokens.some((t) => predTokens.includes(t))) return null;
  const signals = await Signal.find({ confidence: { $in: ['medium', 'high'] }, 'predictions.d7': { $ne: null } })
    .select(SIGNAL_PROJECTION)
    .sort({ radarScore: -1 })
    .limit(6);
  return {
    answer:
      'Señales con predicciones a 7 días y confianza media o alta. Las predicciones se construyen con regresión lineal y suavizado exponencial sobre el histórico real.',
    kind: 'predictions',
    signals,
    suggestions: ['¿Cuál tiene mayor confianza?', 'Oportunidades tempranas', '¿Qué está creciendo?'],
  };
};

const statsIntent: IntentHandler = async (ctx) => {
  const statsTokens = ['estadistica', 'estadisticas', 'resumen', 'cuantas', 'cuantos', 'total', 'hay', 'tiene'];
  if (!ctx.tokens.some((t) => statsTokens.includes(t))) return null;
  const [total, rising, highConf, peaking] = await Promise.all([
    Signal.countDocuments(),
    Signal.countDocuments({ status: 'rising' }),
    Signal.countDocuments({ confidence: 'high' }),
    Signal.countDocuments({ status: 'peaking' }),
  ]);
  return {
    answer: `Radar monitorea ${total} señales en total. ${rising} están en ascenso activo, ${peaking} están en su pico máximo, y ${highConf} tienen confianza alta en sus predicciones.`,
    kind: 'stats',
    suggestions: ['¿Qué está creciendo?', 'Oportunidades tempranas', '¿De dónde vienen los datos?'],
  };
};

const sourcesIntent: IntentHandler = async (ctx) => {
  const sourceTokens = ['fuente', 'fuentes', 'dato', 'datos', 'donde', 'origen', 'plataforma', 'reddit', 'google'];
  if (!ctx.tokens.some((t) => sourceTokens.includes(t))) return null;
  return {
    answer:
      'Radar extrae datos de tres fuentes públicas gratuitas: Reddit (publicaciones y discusiones de subreddits de ecommerce), Google Trends (índice de interés de búsqueda por keyword) y RSS de blogs especializados en ecommerce. Los datos se renuevan cada 2 horas. No se usan APIs de pago.',
    kind: 'sources',
    suggestions: ['¿Qué está creciendo?', 'Estadísticas generales', 'Oportunidades tempranas'],
  };
};

const hashtagsIntent: IntentHandler = async (ctx) => {
  const hashtagTokens = ['hashtag', 'hashtags', 'etiqueta', 'etiquetas', 'tag'];
  if (!ctx.tokens.some((t) => hashtagTokens.includes(t))) return null;
  const signals = await Signal.find({ entityType: 'hashtag' }).select(SIGNAL_PROJECTION).sort({ radarScore: -1 }).limit(6);
  return {
    answer: 'Top hashtags por Radar Score. Son los más mencionados y con mayor crecimiento en las fuentes monitoreadas.',
    kind: 'hashtags',
    signals,
    suggestions: ['¿Cuál tiene más momentum?', '¿Qué productos están creciendo?', 'Oportunidades'],
  };
};

const productsIntent: IntentHandler = async (ctx) => {
  const productTokens = ['producto', 'productos', 'product', 'articulo', 'item'];
  if (!ctx.tokens.some((t) => productTokens.includes(t))) return null;
  const signals = await Signal.find({ entityType: 'product' }).select(SIGNAL_PROJECTION).sort({ radarScore: -1 }).limit(6);
  return {
    answer: 'Top productos por Radar Score. Ordenados por velocidad de crecimiento, aceleración, frecuencia y engagement combinados.',
    kind: 'products',
    signals,
    suggestions: ['Oportunidades tempranas', '¿Qué tendencias hay?', '¿Qué categorías aceleran más?'],
  };
};

const categoryIntent: IntentHandler = async (ctx) => {
  const detected = detectCategory(ctx.tokens);
  if (!detected) return null;
  const signals = await Signal.find({ category: detected }).select(SIGNAL_PROJECTION).sort({ radarScore: -1 }).limit(6);
  return {
    answer:
      signals.length > 0
        ? `${signals.length} señales detectadas en ${detected}. La más fuerte es "${signals[0].name}" con Radar Score ${signals[0].radarScore}.`
        : `No hay señales activas en la categoría ${detected} en este momento.`,
    kind: 'category',
    signals,
    suggestions: [`Explícame ${signals[0]?.name ?? 'la primera'}`, 'Oportunidades tempranas', '¿Qué está creciendo?'],
  };
};

const defaultTopIntent: IntentHandler = async () => {
  const signals = await Signal.find({ status: { $in: ['rising', 'peaking', 'new'] } })
    .select(SIGNAL_PROJECTION)
    .sort({ radarScore: -1 })
    .limit(8);
  return {
    answer:
      signals.length > 0
        ? `Estas son las ${signals.length} señales con mayor Radar Score actualmente. "${signals[0].name}" lidera con ${signals[0].radarScore} puntos.`
        : 'El radar no tiene señales activas en este momento. Ejecuta el seed para cargar datos.',
    kind: 'top',
    signals,
    suggestions: SUGGESTIONS.slice(1),
  };
};

const INTENTS: IntentHandler[] = [
  comparisonIntent,
  explainIntent,
  categoryRankingIntent,
  continuationIntent,
  combinedMetricIntent,
  opportunitiesIntent,
  predictionsIntent,
  statsIntent,
  sourcesIntent,
  hashtagsIntent,
  productsIntent,
  categoryIntent,
  defaultTopIntent, // siempre matchea — cierra la cadena
];

/**
 * POST /api/assistant/query
 * Body: { q: string }
 * Response: { answer, kind, signals?, categories?, suggestions? }
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

    const ctx: QueryContext = { q, tokens: normalizeTokens(q) };
    const country = detectCountry(ctx.tokens);
    const window = parseTimeWindow(q);

    let payload: AssistantPayload | null = null;
    for (const intent of INTENTS) {
      payload = await intent(ctx);
      if (payload) break;
    }
    // defaultTopIntent siempre responde, pero por tipado tratamos el caso null.
    if (!payload) payload = await defaultTopIntent(ctx);
    let resolved: AssistantPayload = payload ?? {
      answer: 'El radar no tiene señales activas en este momento.',
      kind: 'top',
      suggestions: SUGGESTIONS,
    };

    resolved = applyTimeWindow(resolved, window);
    resolved = applyGeo(resolved, country);

    res.json(resolved);
  })
);
