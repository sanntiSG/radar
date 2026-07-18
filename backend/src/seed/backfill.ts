import { interestOverTime, TRACKED_KEYWORDS } from '../adapters/googleTrends';
import { connectDb, disconnectDb } from '../config/db';
import { Snapshot, Trend } from '../models';
import { canonicalize } from '../services/canonicalize';
import { recomputeAll } from '../signals/signalEngine';

/**
 * Backfill: descarga 14 días de interés real de Google Trends para las
 * keywords trackeadas y los guarda como snapshots de tendencias.
 * Si Google devuelve HTML (bloqueo blando), esa keyword se salta.
 */
async function main() {
  await connectDb();

  let ok = 0;
  for (const keyword of TRACKED_KEYWORDS) {
    try {
      const points = await interestOverTime(keyword, 14);
      if (points.length === 0) continue;

      const match = canonicalize(keyword);
      await Trend.updateOne(
        { slug: match.slug },
        {
          $set: { category: match.category, lastSeenAt: new Date() },
          $addToSet: { aliases: keyword, sources: 'google-trends' },
          $setOnInsert: { name: match.canonicalName, firstSeenAt: points[0].date },
        },
        { upsert: true }
      );

      for (const point of points) {
        const date = new Date(point.date);
        date.setUTCHours(0, 0, 0, 0);
        await Snapshot.updateOne(
          { entityType: 'trend', slug: match.slug, date },
          { $set: { interest: point.value, source: 'google-trends' } },
          { upsert: true }
        );
      }
      ok++;
      console.log(`[backfill] ${keyword}: ${points.length} puntos`);
    } catch (err) {
      console.warn(`[backfill] ${keyword} falló:`, (err as Error).message);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }

  if (ok > 0) await recomputeAll();
  console.log(`[backfill] Completo: ${ok}/${TRACKED_KEYWORDS.length} keywords`);
  await disconnectDb();
}

main().catch((err) => {
  console.error('[backfill] Falló:', err);
  process.exit(1);
});
