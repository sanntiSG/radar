'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { EvidenceResponse } from '@/lib/types';
import { ENTITY_LABELS } from '@/lib/format';
import { ConfidenceDots, Score, Skeleton, Sparkline, StatusBadge } from '@/components/dashboard/ui';
import { FactorBreakdown } from '@/components/dashboard/FactorBreakdown';
import { EvidenceChart } from '@/components/dashboard/EvidenceChart';

function DeltaChip({ label, deltaPct }: { label: string; deltaPct: number }) {
  const positive = deltaPct > 0;
  const flat = deltaPct === 0;
  const color = flat ? 'text-faint' : positive ? 'text-jade' : 'text-amber';
  return (
    <div className="rounded-lg bg-soft px-3 py-2.5 text-center">
      <p className={`font-mono text-lg font-medium tabular-nums ${color}`}>
        {flat ? '±0%' : `${positive ? '+' : ''}${deltaPct}%`}
      </p>
      <p className="text-xs text-faint">{label}</p>
    </div>
  );
}

export default function EvidencePage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const [data, setData] = useState<EvidenceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setData(null);
    setError(null);
    api
      .evidence(slug)
      .then(setData)
      .catch(() => setError('No se pudo cargar el Centro de Evidencias para esta señal.'));
  }, [slug]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-center">
        <p className="font-display text-lg font-bold">No encontramos esta señal</p>
        <p className="mt-2 text-sm text-dim">{error}</p>
        <Link href="/dashboard" className="mt-4 inline-block text-sm text-jade underline">
          Volver al dashboard
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 md:px-8 md:py-8">
        <Skeleton className="h-20" />
        <Skeleton className="h-60" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  const { signal, delta } = data;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <Link
        href="/dashboard"
        className="text-xs text-faint transition-colors duration-150 hover:text-ink"
      >
        ← Volver al dashboard
      </Link>

      <header className="mt-3 flex items-start justify-between gap-4 border-b border-line pb-6">
        <div className="min-w-0">
          <p className="text-xs font-medium text-jade">Centro de Evidencias</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">{signal.name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-faint">
            <span>{ENTITY_LABELS[signal.entityType]}</span>
            <span aria-hidden>·</span>
            <span>{signal.category}</span>
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <StatusBadge status={signal.status} />
            <ConfidenceDots level={signal.confidence} />
          </div>
        </div>
        <Score value={signal.radarScore} size="lg" />
      </header>

      {/* Provenance — la afirmación que hay que demostrar */}
      <section className="mt-6 rounded-xl border border-jade/25 bg-jade/5 p-5">
        <p className="text-sm leading-relaxed text-ink">
          Radar detectó esta señal hace{' '}
          <strong className="font-semibold text-jade">
            {data.daysSinceDetection === 0 ? 'menos de un día' : `${data.daysSinceDetection} días`}
          </strong>
          , cuando tenía {data.timeline[0]?.value ?? 0} menciones. Hoy tiene{' '}
          <strong className="font-semibold text-jade">
            {data.timeline[data.timeline.length - 1]?.value ?? 0}
          </strong>
          . Todo lo que sigue es la evidencia, no una promesa.
        </p>
      </section>

      {/* Timeline anotado */}
      <section className="mt-8">
        <h2 className="font-display text-sm font-bold text-dim">Cómo evolucionó desde su detección</h2>
        <div className="mt-3 rise-in">
          <EvidenceChart timeline={data.timeline} phases={data.phases} />
        </div>
      </section>

      {/* Cambios vs ayer */}
      {delta && (
        <section className="mt-8">
          <h2 className="font-display text-sm font-bold text-dim">Respecto a ayer</h2>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <DeltaChip label="Menciones" deltaPct={delta.deltaPct} />
            <div className="rounded-lg bg-soft px-3 py-2.5 text-center">
              <p className="font-mono text-lg font-medium tabular-nums text-dim">
                {delta.mentionsYesterday} → {delta.mentionsToday}
              </p>
              <p className="text-xs text-faint">Menciones (ayer → hoy)</p>
            </div>
            <div className="rounded-lg bg-soft px-3 py-2.5 text-center">
              <p
                className={`font-mono text-lg font-medium tabular-nums ${
                  delta.scoreDelta > 0 ? 'text-jade' : delta.scoreDelta < 0 ? 'text-amber' : 'text-faint'
                }`}
              >
                {delta.scoreDelta > 0 ? '+' : ''}
                {delta.scoreDelta}
              </p>
              <p className="text-xs text-faint">Δ Radar Score</p>
            </div>
            <div className="rounded-lg bg-soft px-3 py-2.5 text-center">
              <p className="font-mono text-lg font-medium tabular-nums text-dim">
                {delta.scoreYesterday} → {delta.scoreToday}
              </p>
              <p className="text-xs text-faint">Score (ayer → hoy)</p>
            </div>
          </div>
        </section>
      )}

      {/* Radar Score explicado */}
      {data.factors.length > 0 && (
        <section className="mt-8 rounded-xl border border-line bg-elev/60 p-5">
          <FactorBreakdown factors={data.factors} title="Radar Score explicado" />
        </section>
      )}

      {/* Evolución del score */}
      {data.scoreTimeline.length > 1 && (
        <section className="mt-8">
          <h2 className="font-display text-sm font-bold text-dim">Evolución del Radar Score</h2>
          <p className="mt-0.5 text-xs text-faint">
            El score que habría tenido la señal cada día, tratado como si ese día fuera "hoy".
          </p>
          <div className="mt-3 flex items-center gap-4 rounded-xl border border-line bg-elev p-4">
            <Sparkline data={data.scoreTimeline.map((p) => p.score)} width={220} height={48} />
            <span className="font-mono text-sm tabular-nums text-dim">
              {data.scoreTimeline[0].score} → {data.scoreTimeline[data.scoreTimeline.length - 1].score}
            </span>
          </div>
        </section>
      )}

      {/* Validación por fuentes */}
      <section className="mt-8 pb-10">
        <h2 className="font-display text-sm font-bold text-dim">Validación por fuentes</h2>
        {data.sources.length === 0 ? (
          <p className="mt-2 text-sm text-faint">Aún no hay fuentes registradas para esta señal.</p>
        ) : (
          <>
            <p className="mt-1 text-xs text-faint">
              {data.sourceAgreement.count === 1
                ? '1 fuente respalda esta señal.'
                : `${data.sourceAgreement.count} fuentes coinciden en esta señal — no es un dato aislado.`}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {data.sources.map((s) => (
                <span
                  key={s.id}
                  className="rounded-full border border-line bg-elev px-3 py-1.5 text-xs text-dim"
                >
                  {s.label}
                </span>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
