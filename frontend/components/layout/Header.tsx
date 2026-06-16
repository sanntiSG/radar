'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { label: 'Señales',     href: '/dashboard' },
  { label: 'Tendencias',  href: '/dashboard/trends' },
  { label: 'Hashtags',    href: '/dashboard/hashtags' },
  { label: 'Productos',   href: '/dashboard/products' },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between h-14 px-6"
      style={{
        background: 'color-mix(in oklch, var(--bg) 85%, transparent)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 shrink-0">
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8.5" stroke="var(--accent)" strokeWidth="1" opacity="0.3" />
          <circle cx="10" cy="10" r="5.5" stroke="var(--accent)" strokeWidth="1" opacity="0.55" />
          <circle cx="10" cy="10" r="2.5" stroke="var(--accent)" strokeWidth="1" opacity="0.8" />
          <circle cx="10" cy="10" r="1" fill="var(--accent)" />
          <line x1="10" y1="10" x2="16.5" y2="3.5" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
        </svg>
        <span
          style={{
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 700,
            fontSize: '1rem',
            letterSpacing: '0.06em',
            color: 'var(--text-1)',
          }}
        >
          RADAR
        </span>
      </Link>

      {/* Nav */}
      <nav className="hidden sm:flex items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-1.5 rounded text-sm font-medium transition-colors duration-150"
              style={{
                color: isActive ? 'var(--text-1)' : 'var(--text-3)',
                background: isActive ? 'var(--surface-raised)' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.color = 'var(--text-2)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.color = 'var(--text-3)';
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Right */}
      <div className="flex items-center gap-3">
        <span
          className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
          style={{
            background: 'var(--accent-subtle)',
            color: 'var(--accent)',
            border: '1px solid var(--accent-dim)',
          }}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--accent)', animation: 'pulse 2s infinite' }}
          />
          En vivo
        </span>
      </div>
    </header>
  );
}
