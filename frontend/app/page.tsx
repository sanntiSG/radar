'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  {
    label: 'Motor Matemático',
    desc: 'Z-Score, regresión lineal, medias móviles exponenciales. Sin IA de pago. Sin promesas vacías.',
  },
  {
    label: 'Histórico Propio',
    desc: 'Cada día que pasa, Radar acumula un activo que la competencia no puede replicar de un día para el otro.',
  },
  {
    label: 'Señales, No Predicciones',
    desc: 'No te decimos qué va a explotar. Te mostramos qué está acelerando ahora, con nivel de confianza explícito.',
  },
];

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero stagger
      gsap.from('.hero-word', {
        opacity: 0,
        y: 20,
        stagger: 0.08,
        duration: 0.7,
        ease: 'power3.out',
        delay: 0.1,
      });

      gsap.from('.hero-sub', {
        opacity: 0,
        y: 14,
        duration: 0.6,
        ease: 'power3.out',
        delay: 0.5,
      });

      gsap.from('.hero-cta', {
        opacity: 0,
        y: 10,
        duration: 0.5,
        ease: 'power3.out',
        delay: 0.75,
      });

      // Features scroll-triggered
      ScrollTrigger.batch('.feature-item', {
        onEnter: (els) => {
          gsap.from(els, {
            opacity: 0,
            y: 24,
            stagger: 0.12,
            duration: 0.6,
            ease: 'power3.out',
          });
        },
        start: 'top 85%',
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <main
      ref={heroRef}
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--bg)' }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 max-w-[1440px] mx-auto w-full">
        <div className="flex items-center gap-3">
          <RadarLogo />
          <span
            className="font-condensed font-700 text-lg tracking-tight"
            style={{ color: 'var(--text-1)', fontFamily: 'Barlow Condensed', fontWeight: 700 }}
          >
            RADAR
          </span>
        </div>
        <Link
          href="/dashboard"
          className="text-sm font-medium transition-colors duration-150"
          style={{ color: 'var(--text-2)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-1)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-2)')}
        >
          Dashboard →
        </Link>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col justify-center px-8 py-24 max-w-[1440px] mx-auto w-full">
        <div className="max-w-[680px]">
          {/* Label */}
          <p className="text-label mb-8 hero-word" style={{ color: 'var(--text-3)' }}>
            Plataforma de señales de mercado
          </p>

          {/* Headline */}
          <h1
            className="text-display mb-6 leading-none"
            style={{
              fontFamily: 'Barlow Condensed',
              fontWeight: 900,
              fontSize: 'clamp(3rem, 8vw, 6.5rem)',
              color: 'var(--text-1)',
              letterSpacing: '-0.02em',
            }}
          >
            <span className="hero-word inline-block">Detectamos</span>{' '}
            <span className="hero-word inline-block" style={{ color: 'var(--accent)' }}>
              señales.
            </span>
            <br />
            <span className="hero-word inline-block" style={{ color: 'var(--text-2)' }}>
              Tú decides.
            </span>
          </h1>

          {/* Subheadline */}
          <p
            className="hero-sub text-lg leading-relaxed max-w-[55ch] mb-10"
            style={{ color: 'var(--text-2)', lineHeight: 1.7 }}
          >
            Radar no promete productos ganadores. Identifica señales tempranas —
            aceleraciones de frecuencia, anomalías estadísticas, hashtags en
            crecimiento exponencial — antes de que sean tendencia conocida.
          </p>

          {/* CTA */}
          <div className="hero-cta flex items-center gap-4 flex-wrap">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-150"
              style={{
                background: 'var(--accent)',
                color: 'oklch(0.09 0.012 240)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = 'oklch(0.80 0.16 150)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = 'var(--accent)';
              }}
            >
              Ver Dashboard
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 7h12M8 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>

            <p className="text-sm" style={{ color: 'var(--text-3)' }}>
              Sin login requerido · Datos en tiempo real
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div
          className="mt-20 py-4 px-5 rounded-lg max-w-[600px]"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
        >
          <p className="text-sm" style={{ color: 'var(--text-3)', lineHeight: 1.6 }}>
            <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>Honestidad brutal: </span>
            Radar detecta señales estadísticas, no certezas. Una señal alta puede
            no convertirse en tendencia. Una señal media puede explotar mañana.
            La plataforma te muestra probabilidades con confianza explícita —
            el resto es tu criterio de negocio.
          </p>
        </div>
      </section>

      {/* Features */}
      <section
        ref={featuresRef}
        className="px-8 py-20 max-w-[1440px] mx-auto w-full"
      >
        <p className="text-label mb-12" style={{ color: 'var(--text-3)' }}>
          Diferenciadores
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px" style={{ background: 'var(--border)' }}>
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="feature-item p-8"
              style={{ background: 'var(--bg)' }}
            >
              <div
                className="text-label mb-4"
                style={{ color: 'var(--accent)' }}
              >
                {String(i + 1).padStart(2, '0')}
              </div>
              <h3
                className="text-base font-semibold mb-3"
                style={{ color: 'var(--text-1)' }}
              >
                {f.label}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)', lineHeight: 1.7 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer
        className="px-8 py-8 max-w-[1440px] mx-auto w-full flex items-center justify-between"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>
          Radar © {new Date().getFullYear()}
        </p>
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>
          Reddit + Google Trends · Motor matemático
        </p>
      </footer>
    </main>
  );
}

function RadarLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8.5" stroke="var(--accent)" strokeWidth="1" opacity="0.3" />
      <circle cx="10" cy="10" r="5.5" stroke="var(--accent)" strokeWidth="1" opacity="0.5" />
      <circle cx="10" cy="10" r="2.5" stroke="var(--accent)" strokeWidth="1" opacity="0.8" />
      <circle cx="10" cy="10" r="1" fill="var(--accent)" />
      <line x1="10" y1="10" x2="16.5" y2="3.5" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}
