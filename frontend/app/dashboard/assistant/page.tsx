'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { AssistantResponse, Signal } from '@/lib/types';
import { Score, Sparkline, StatusBadge } from '@/components/dashboard/ui';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  response?: AssistantResponse;
}

const INITIAL_SUGGESTIONS = [
  '¿Qué está creciendo ahora?',
  'Muéstrame oportunidades tempranas',
  '¿Qué categorías aceleran más?',
  'Productos de Gadgets acelerando',
  '¿Qué tiene mayor probabilidad de seguir creciendo?',
  'Compara mini impresora portátil con corrector de postura',
  '¿Cuántas señales hay?',
  '¿De dónde vienen los datos?',
];

async function query(q: string): Promise<AssistantResponse> {
  const res = await fetch(`${BASE}/api/assistant/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q }),
  });
  if (!res.ok) throw new Error('Error del asistente');
  return res.json();
}

function SignalCard({ signal }: { signal: Signal }) {
  return (
    <Link
      href={`/dashboard/signal/${signal.slug}`}
      className="flex items-center gap-3 rounded-lg border border-line bg-bg px-3 py-2.5 text-xs transition-colors duration-150 hover:border-jade/40"
    >
      <Score value={signal.radarScore} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-ink">{signal.name}</p>
        <p className="text-faint">{signal.category}</p>
      </div>
      <Sparkline data={signal.sparkline} />
      <StatusBadge status={signal.status} />
    </Link>
  );
}

function CategoryRankingList({ categories }: { categories: NonNullable<AssistantResponse['categories']> }) {
  const max = Math.max(...categories.map((c) => c.avgAcceleration), 1);
  return (
    <div className="space-y-2 rounded-lg border border-line bg-bg p-3">
      {categories.map((c) => (
        <div key={c.name} className="text-xs">
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <span className="font-medium text-ink">{c.name}</span>
            <span className="font-mono text-[11px] text-faint">
              accel {c.avgAcceleration} · {c.count} señales
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-soft">
            <div
              className="h-full rounded-full bg-jade transition-all duration-500"
              style={{ width: `${Math.max(4, (c.avgAcceleration / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ComparisonCards({ signals }: { signals: Signal[] }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <SignalCard signal={signals[0]} />
      </div>
      <span className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-wide text-faint">vs</span>
      <div className="flex-1">
        <SignalCard signal={signals[1]} />
      </div>
    </div>
  );
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(INITIAL_SUGGESTIONS);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const q = text.trim();
    setInput('');
    setLoading(true);
    setMessages((prev) => [...prev, { role: 'user', text: q }]);
    try {
      const response = await query(q);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: response.answer, response },
      ]);
      if (response.suggestions?.length) setSuggestions(response.suggestions);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Hubo un error al consultar el motor. ¿Intentamos de nuevo?' },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-3xl flex-col px-4 md:px-8">
      {/* Header */}
      <header className="shrink-0 border-b border-line py-5">
        <h1 className="font-display text-xl font-bold tracking-tight">Asistente de Radar</h1>
        <p className="mt-0.5 text-xs text-faint">
          Responde con datos propios del sistema — sin IA externa ni costos por token.
        </p>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center gap-8 pt-8 text-center">
            <div>
              <p className="font-display text-lg font-bold">Hola, soy Radar</p>
              <p className="mt-1 text-sm leading-relaxed text-dim">
                Puedo ayudarte a entender qué señales detectó el motor, explicar por qué una señal
                existe o mostrarte oportunidades tempranas.
              </p>
            </div>
            <div className="w-full text-left">
              <p className="mb-3 text-xs font-medium text-faint">Preguntas sugeridas</p>
              <div className="flex flex-wrap gap-2">
                {INITIAL_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="pressable rounded-full border border-line px-3 py-1.5 text-xs text-dim transition-colors duration-150 hover:border-jade hover:text-ink"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-1' : ''}`}>
                  {msg.role === 'user' ? (
                    <div className="rounded-2xl rounded-tr-sm bg-jade px-4 py-2.5 text-sm font-medium text-[oklch(18%_0.02_165)]">
                      {msg.text}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="rounded-2xl rounded-tl-sm border border-line bg-elev px-4 py-3 text-sm leading-relaxed text-ink">
                        {msg.text}
                      </div>
                      {msg.response?.kind === 'category_ranking' && msg.response.categories && msg.response.categories.length > 0 && (
                        <CategoryRankingList categories={msg.response.categories} />
                      )}
                      {msg.response?.kind === 'comparison' && msg.response.signals?.length === 2 ? (
                        <ComparisonCards signals={msg.response.signals} />
                      ) : (
                        msg.response?.signals &&
                        msg.response.signals.length > 0 && (
                          <div className="space-y-1.5">
                            {msg.response.signals.slice(0, 5).map((s) => (
                              <SignalCard key={s._id ?? s.slug} signal={s} />
                            ))}
                          </div>
                        )
                      )}
                      {msg.response?.suggestions && (
                        <div className="flex flex-wrap gap-1.5">
                          {msg.response.suggestions.map((s) => (
                            <button
                              key={s}
                              onClick={() => send(s)}
                              className="pressable rounded-full border border-line px-2.5 py-1 text-[11px] text-dim transition-colors duration-150 hover:border-jade hover:text-ink"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-tl-sm border border-line bg-elev px-4 py-3">
                  <span className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-jade"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-line py-4">
        {messages.length > 0 && suggestions.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {suggestions.slice(0, 4).map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="pressable rounded-full border border-line px-2.5 py-1 text-[11px] text-dim transition-colors duration-150 hover:border-jade hover:text-ink"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pregúntale a Radar…"
            disabled={loading}
            className="flex-1 rounded-xl border border-line bg-elev px-4 py-2.5 text-sm text-ink outline-none transition-colors duration-150 placeholder:text-faint focus:border-jade disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="pressable rounded-xl bg-jade px-4 py-2.5 text-sm font-semibold text-[oklch(18%_0.02_165)] transition-opacity duration-150 disabled:opacity-40"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}
