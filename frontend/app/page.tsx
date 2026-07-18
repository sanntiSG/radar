'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { RadarSweep } from '@/components/landing/RadarSweep';

const TICKER = [
  ['Mini impresora portátil', '+218%'],
  ['#tiktokmademebuyit', '+164%'],
  ['Botella térmica inteligente', '+142%'],
  ['#amazonfinds', '+121%'],
  ['Fuente de agua para mascotas', '+118%'],
  ['Luces LED inteligentes', '+96%'],
  ['#gadgets2026', '+88%'],
  ['Organizador magnético', '+61%'],
];

const MANIFESTO =
  'Cuando un producto explota en redes ya es tarde. Radar observa el murmullo previo: menciones que se repiten de forma inusual, hashtags que aceleran, categorías que despiertan. Matemática sobre histórico propio, sin humo y sin promesas.';

export default function Landing() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      // Hero: carga orquestada con stagger
      gsap.fromTo(
        '[data-hero]',
        { y: 28, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, stagger: 0.12, ease: 'expo.out', delay: 0.15 }
      );

      // Bento: las tarjetas suben al entrar en viewport
      gsap.utils.toArray<HTMLElement>('[data-card]').forEach((card, i) => {
        gsap.fromTo(
          card,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            delay: (i % 3) * 0.08,
            ease: 'expo.out',
            scrollTrigger: { trigger: card, start: 'top 88%' },
          }
        );
      });

      // Manifiesto: scrub palabra por palabra
      gsap.fromTo(
        '[data-word]',
        { opacity: 0.12 },
        {
          opacity: 1,
          stagger: 0.06,
          ease: 'none',
          scrollTrigger: {
            trigger: '[data-manifesto]',
            start: 'top 75%',
            end: 'bottom 45%',
            scrub: true,
          },
        }
      );

      // Radar del hero: escala sutil al hacer scroll
      gsap.fromTo(
        '[data-radar]',
        { scale: 0.92, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1.4, ease: 'expo.out', delay: 0.3 }
      );
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <main ref={root} className="w-full max-w-full overflow-x-hidden bg-bg text-ink">
      {/* ───────── Navegación split ───────── */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 md:px-10">
        <Link href="/" className="font-display text-xl font-bold tracking-tight">
          Radar<span className="text-jade">.</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-dim md:flex">
          <a href="#capacidades" className="transition-colors duration-200 hover:text-ink">
            Capacidades
          </a>
          <a href="#metodo" className="transition-colors duration-200 hover:text-ink">
            Método
          </a>
          <Link
            href="/dashboard"
            className="pressable rounded-full bg-jade px-5 py-2 font-medium text-[oklch(18%_0.02_165)] transition-opacity duration-200 hover:opacity-90"
          >
            Abrir dashboard
          </Link>
        </nav>
        <Link
          href="/dashboard"
          className="pressable rounded-full bg-jade px-4 py-2 text-sm font-medium text-[oklch(18%_0.02_165)] md:hidden"
        >
          Dashboard
        </Link>
      </header>

      {/* ───────── Atención: hero editorial split ───────── */}
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-24 pt-16 md:grid-cols-[1.2fr_0.8fr] md:px-10 md:pb-32 md:pt-24">
        <div className="max-w-6xl">
          <h1
            data-hero
            className="font-display font-bold leading-[1.02] tracking-tight"
            style={{ fontSize: 'clamp(2.8rem, 6vw, 5.5rem)' }}
          >
            El mercado avisa antes de moverse.
          </h1>
          <p data-hero className="mt-8 max-w-[52ch] text-lg leading-relaxed text-dim">
            Radar detecta señales tempranas — menciones inusuales, hashtags
            acelerando, categorías despertando — y las convierte en un score
            honesto con histórico, predicción y nivel de confianza.
          </p>
          <div data-hero className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/dashboard"
              className="pressable rounded-full bg-jade px-8 py-4 text-base font-semibold text-[oklch(18%_0.02_165)] transition-opacity duration-200 hover:opacity-90"
            >
              Explorar señales en vivo
            </Link>
            <a
              href="#metodo"
              className="pressable rounded-full border border-line-strong px-8 py-4 text-base font-medium text-dim transition-colors duration-200 hover:border-jade hover:text-ink"
            >
              Cómo funciona
            </a>
          </div>
        </div>
        <div data-radar className="mx-auto hidden md:block">
          <RadarSweep size={400} />
        </div>
      </section>

      {/* ───────── Ticker de señales (marquee infinito) ───────── */}
      <div className="border-y border-line py-5">
        <div className="marquee flex gap-12 whitespace-nowrap">
          {[...TICKER, ...TICKER].map(([name, pct], i) => (
            <span key={i} className="flex items-baseline gap-3 text-sm">
              <span className="text-dim">{name}</span>
              <span className="font-mono font-medium text-jade">{pct}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ───────── Interés: bento gapless 4×2 ───────── */}
      <section id="capacidades" className="mx-auto max-w-7xl px-6 py-32 md:px-10 md:py-48">
        <h2 className="font-display max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
          Un instrumento de medición, no una bola de cristal.
        </h2>
        <div className="mt-16 grid grid-flow-dense grid-cols-1 gap-4 md:grid-cols-4">
          {/* 2×2 */}
          <article
            data-card
            className="group rounded-2xl border border-line bg-elev p-8 md:col-span-2 md:row-span-2"
          >
            <p className="font-mono text-[5.5rem] font-medium leading-none text-jade md:text-[8rem]">
              87
            </p>
            <h3 className="font-display mt-6 text-2xl font-bold">Radar Score</h3>
            <p className="mt-3 max-w-[46ch] leading-relaxed text-dim">
              Un único número de 0 a 100 que pondera velocidad de crecimiento,
              aceleración, frecuencia, engagement y recencia. Cada score lleva su
              explicación: sabrás por qué sube y por qué baja.
            </p>
            <div className="mt-8 flex h-16 items-end gap-1.5">
              {[18, 22, 20, 28, 34, 31, 42, 55, 51, 68, 84, 100].map((h, i) => (
                <div
                  key={i}
                  className="w-full rounded-sm bg-soft transition-colors duration-500 group-hover:bg-jade-deep"
                  style={{ height: `${h}%`, transitionDelay: `${i * 30}ms` }}
                />
              ))}
            </div>
          </article>

          {/* 2×1 */}
          <article data-card className="rounded-2xl border border-line bg-elev p-8 md:col-span-2">
            <h3 className="font-display text-2xl font-bold">Señales, no promesas</h3>
            <p className="mt-3 leading-relaxed text-dim">
              Outliers por Z-Score e IQR, aceleraciones sostenidas y crecimiento
              simultáneo en varias fuentes. Cada señal indica su estado: nueva,
              en ascenso, en pico o enfriándose.
            </p>
          </article>

          {/* 1×1 */}
          <article data-card className="rounded-2xl border border-line bg-elev p-8">
            <p className="font-mono text-3xl font-medium text-ink">14 días</p>
            <p className="mt-3 leading-relaxed text-dim">
              de histórico propio por señal. El activo que nadie puede copiar.
            </p>
          </article>

          {/* 1×1 */}
          <article data-card className="rounded-2xl border border-line bg-elev p-8">
            <p className="font-mono text-3xl font-medium text-ink">24h · 72h · 7d</p>
            <p className="mt-3 leading-relaxed text-dim">
              Predicciones con nivel de confianza explícito. Si el dato es débil,
              te lo decimos.
            </p>
          </article>

          {/* 2×1 */}
          <article data-card className="rounded-2xl border border-line bg-elev p-8 md:col-span-2">
            <h3 className="font-display text-2xl font-bold">Una señal, mil nombres</h3>
            <p className="mt-3 leading-relaxed text-dim">
              «Mini impresora», «portable printer» y «impresora térmica X100» son
              el mismo producto. Radar los agrupa en una sola entidad canónica
              para que la señal no se diluya entre variantes.
            </p>
          </article>
        </div>
      </section>

      {/* ───────── Deseo: manifiesto con scrub ───────── */}
      <section id="metodo" className="border-y border-line bg-elev/50 py-32 md:py-48">
        <div className="mx-auto max-w-5xl px-6 md:px-10">
          <p
            data-manifesto
            className="font-display text-3xl font-bold leading-snug tracking-tight md:text-5xl md:leading-snug"
          >
            {MANIFESTO.split(' ').map((word, i) => (
              <span key={i} data-word className="inline-block">
                {word}&nbsp;
              </span>
            ))}
          </p>
          <div className="mt-20 grid gap-10 md:grid-cols-3">
            {[
              ['Fuentes abiertas', 'Reddit, Google Trends y RSS de ecommerce. Donde las tendencias nacen semanas antes de explotar en TikTok.'],
              ['Motor matemático', 'Regresión lineal, medias móviles, Z-Score y momentum. Sin cajas negras: cada cálculo es auditable.'],
              ['Histórico acumulado', 'Snapshots diarios de cada entidad. Cuanto más tiempo corre Radar, más difícil es alcanzarlo.'],
            ].map(([title, text], i) => (
              <div key={i} data-card>
                <h3 className="font-display text-xl font-bold">{title}</h3>
                <p className="mt-3 leading-relaxed text-dim">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Acción: CTA masivo ───────── */}
      <section className="mx-auto max-w-7xl px-6 py-32 text-center md:px-10 md:py-48">
        <h2
          className="font-display mx-auto max-w-5xl font-bold leading-[1.05] tracking-tight"
          style={{ fontSize: 'clamp(2.4rem, 5vw, 4.5rem)' }}
        >
          Mira lo que el mercado murmura hoy.
        </h2>
        <Link
          href="/dashboard"
          className="pressable mt-12 inline-block rounded-full bg-jade px-12 py-5 text-lg font-semibold text-[oklch(18%_0.02_165)] transition-opacity duration-200 hover:opacity-90"
        >
          Abrir el dashboard
        </Link>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-faint md:flex-row md:px-10">
          <p>
            Radar<span className="text-jade">.</span> — señales tempranas de mercado
          </p>
          <p>Datos de fuentes públicas · Sin promesas de productos ganadores</p>
        </div>
      </footer>

      <style jsx>{`
        .marquee {
          animation: marquee 36s linear infinite;
          width: max-content;
        }
        @keyframes marquee {
          to {
            transform: translateX(-50%);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee {
            animation: none;
          }
        }
      `}</style>
    </main>
  );
}
