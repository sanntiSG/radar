'use client';

/**
 * Motivo visual de la marca: barrido de radar con blips de señal.
 * SVG + CSS puro (fuera del main thread — no consume el presupuesto GSAP).
 */
export function RadarSweep({ size = 420 }: { size?: number }) {
  const rings = [0.25, 0.5, 0.75, 1];
  const blips = [
    { x: 62, y: 30, delay: '0s', r: 3.5 },
    { x: 34, y: 58, delay: '1.1s', r: 2.5 },
    { x: 71, y: 66, delay: '2.3s', r: 3 },
    { x: 45, y: 22, delay: '3.2s', r: 2 },
  ];

  return (
    <div
      className="relative select-none"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 100 100" className="h-full w-full">
        {rings.map((r) => (
          <circle
            key={r}
            cx="50"
            cy="50"
            r={r * 46}
            fill="none"
            stroke="var(--border)"
            strokeWidth="0.35"
          />
        ))}
        <line x1="4" y1="50" x2="96" y2="50" stroke="var(--border)" strokeWidth="0.25" />
        <line x1="50" y1="4" x2="50" y2="96" stroke="var(--border)" strokeWidth="0.25" />

        {blips.map((b, i) => (
          <g key={i}>
            <circle cx={b.x} cy={b.y} r={b.r} fill="var(--jade)" opacity="0">
              <animate
                attributeName="opacity"
                values="0;0.9;0"
                dur="4.5s"
                begin={b.delay}
                repeatCount="indefinite"
              />
            </circle>
            <circle cx={b.x} cy={b.y} r={b.r} fill="none" stroke="var(--jade)" strokeWidth="0.4" opacity="0">
              <animate
                attributeName="r"
                values={`${b.r};${b.r * 3.2}`}
                dur="4.5s"
                begin={b.delay}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0;0.5;0"
                dur="4.5s"
                begin={b.delay}
                repeatCount="indefinite"
              />
            </circle>
          </g>
        ))}
        <circle cx="50" cy="50" r="1.4" fill="var(--jade)" />
      </svg>

      {/* Barrido cónico */}
      <div
        className="absolute inset-[4%] rounded-full"
        style={{
          background:
            'conic-gradient(from 0deg, transparent 0deg, transparent 300deg, oklch(78% 0.14 168 / 0.22) 348deg, oklch(78% 0.14 168 / 0.45) 360deg)',
          animation: 'radar-spin 4.5s linear infinite',
          maskImage: 'radial-gradient(circle, black 98%, transparent 100%)',
        }}
      />
      <style jsx>{`
        @keyframes radar-spin {
          to {
            transform: rotate(360deg);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          div > div {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
