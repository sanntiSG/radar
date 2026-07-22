'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { authFetch, useAuth } from '@/lib/auth';
import { relativeDate } from '@/lib/format';
import { Skeleton } from '@/components/dashboard/ui';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

interface AlertItem {
  _id: string;
  type: 'radar_score' | 'outlier' | 'acceleration';
  entityType: string;
  slug: string;
  message: string;
  seen: boolean;
  triggeredAt: string;
  userId: string | null;
}

const TYPE_LABELS: Record<AlertItem['type'], string> = {
  radar_score: 'Radar Score alto',
  outlier: 'Anomalía estadística',
  acceleration: 'Aceleración sostenida',
};

export default function AlertsPage() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<AlertItem[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchAlerts = user
      ? authFetch('/api/alerts?limit=50')
      : fetch(`${BASE}/api/alerts?limit=50`).then((r) => r.json());

    fetchAlerts
      .then((data: any) => setAlerts(data.items))
      .catch(() => setError(true));
  }, [user]);

  const markSeen = async (alert: AlertItem) => {
    setAlerts((prev) =>
      prev?.map((a) => (a._id === alert._id ? { ...a, seen: true } : a)) ?? null
    );
    await fetch(`${BASE}/api/alerts/${alert._id}/seen`, { method: 'PATCH' }).catch(
      () => undefined
    );
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <header className="border-b border-line pb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Alertas del motor</h1>
        <p className="mt-1 max-w-[65ch] text-sm text-dim">
          Radar avisa cuando una señal supera un Radar Score de 75, muestra una anomalía
          estadística o acelera varios períodos seguidos.
          {user && (
            <> También incluye alertas de tus{' '}
              <Link href="/dashboard" className="text-jade underline">pines con notificaciones activas</Link>.
            </>
          )}
        </p>
      </header>

      {error ? (
        <div className="mt-6 rounded-xl border border-line bg-elev p-8 text-center text-sm text-dim">
          No se pudo conectar con la API.
        </div>
      ) : !alerts ? (
        <div className="mt-6 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="mt-6 rounded-xl border border-line bg-elev p-10 text-center">
          <p className="font-display text-lg font-bold">Sin alertas por ahora</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-dim">
            Cuando el motor detecte scores altos, outliers o aceleraciones sostenidas,
            aparecerán aquí. Configura notificaciones en tus pines del dashboard.
          </p>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-[var(--border)]">
          {alerts.map((alert, i) => {
            const isPersonal = user && alert.userId != null;
            return (
              <li
                key={alert._id}
                className="rise-in flex items-start gap-4 px-2 py-4"
                style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
              >
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    alert.seen ? 'bg-soft' : 'bg-jade'
                  }`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm leading-relaxed ${alert.seen ? 'text-faint' : 'text-ink'}`}>
                    {alert.message}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-faint">
                      {TYPE_LABELS[alert.type]} · {relativeDate(alert.triggeredAt)}
                    </span>
                    {isPersonal && (
                      <span className="rounded bg-jade/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-jade">
                        mi pin
                      </span>
                    )}
                  </div>
                </div>
                {!alert.seen && (
                  <button
                    onClick={() => markSeen(alert)}
                    className="pressable shrink-0 rounded-full border border-line px-3 py-1.5 text-xs text-dim transition-colors duration-150 hover:border-jade hover:text-ink"
                  >
                    Marcar vista
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
