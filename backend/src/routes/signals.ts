import { Router } from 'express';
import { Signal, Snapshot } from '../models';
import { dayDelta, detectPhases, scoreOverTime } from '../engine';
import { asyncHandler, categoryFilter, paginate } from './helpers';

const SOURCE_LABELS: Record<string, string> = {
  reddit: 'Reddit',
  'google-trends': 'Google Trends',
  rss: 'RSS / Blogs',
};

export const signalsRouter = Router();

// GET /api/signals?category=&status=&sort=radarScore&page=&limit=
signalsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = paginate(req);
    const filter: Record<string, unknown> = { ...categoryFilter(req) };
    if (typeof req.query.status === 'string' && req.query.status) {
      filter.status = req.query.status;
    }
    const sortField = req.query.sort === 'detectedAt' ? 'detectedAt' : 'radarScore';

    const [items, total] = await Promise.all([
      Signal.find(filter).sort({ [sortField]: -1 }).skip(skip).limit(limit),
      Signal.countDocuments(filter),
    ]);
    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  })
);

// GET /api/signals/stats — números agregados para el dashboard
signalsRouter.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const [total, rising, highConfidence, avg] = await Promise.all([
      Signal.countDocuments(),
      Signal.countDocuments({ status: 'rising' }),
      Signal.countDocuments({ confidence: 'high' }),
      Signal.aggregate([{ $group: { _id: null, avgScore: { $avg: '$radarScore' } } }]),
    ]);
    res.json({
      total,
      rising,
      highConfidence,
      avgRadarScore: Math.round(avg[0]?.avgScore ?? 0),
    });
  })
);

// GET /api/signals/:slug
signalsRouter.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const signal = await Signal.findOne({ slug: req.params.slug });
    if (!signal) return res.status(404).json({ error: 'Señal no encontrada' });
    res.json(signal);
  })
);

// GET /api/signals/:slug/evidence — Centro de Evidencias: timeline anotado,
// evolución del Radar Score, cambio vs ayer y fuentes que respaldan la señal.
signalsRouter.get(
  '/:slug/evidence',
  asyncHandler(async (req, res) => {
    const signal = await Signal.findOne({ slug: req.params.slug }).lean();
    if (!signal) return res.status(404).json({ error: 'Señal no encontrada' });

    const field = signal.entityType === 'trend' ? 'interest' : 'mentions';
    const snapshots = await Snapshot.find({ entityType: signal.entityType, slug: signal.slug })
      .sort({ date: 1 })
      .limit(90)
      .lean();

    const timeline = snapshots.map((s) => ({
      date: new Date(s.date).toISOString().slice(0, 10),
      value: field === 'interest' ? s.interest : s.mentions,
      engagement: s.engagement,
    }));

    const sources = (signal.sources ?? []).map((id) => ({
      id,
      label: SOURCE_LABELS[id] ?? id,
    }));

    const daysSinceDetection = Math.max(
      0,
      Math.round((Date.now() - new Date(signal.detectedAt).getTime()) / 86400000)
    );

    res.json({
      signal,
      timeline,
      scoreTimeline: scoreOverTime(timeline),
      phases: detectPhases(timeline),
      delta: dayDelta(timeline),
      factors: signal.factors ?? [],
      sources,
      sourceAgreement: { count: sources.length, sources: sources.map((s) => s.id) },
      firstDetectedAt: signal.detectedAt,
      daysSinceDetection,
    });
  })
);
