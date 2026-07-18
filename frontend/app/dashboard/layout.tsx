'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/dashboard', label: 'Señales' },
  { href: '/dashboard/trends', label: 'Tendencias' },
  { href: '/dashboard/hashtags', label: 'Hashtags' },
  { href: '/dashboard/products', label: 'Productos' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink md:flex-row">
      {/* Rail lateral (desktop) / barra superior (mobile) */}
      <aside className="sticky top-0 z-20 flex shrink-0 items-center gap-1 overflow-x-auto border-b border-line bg-bg px-4 py-3 md:h-screen md:w-56 md:flex-col md:items-stretch md:gap-0 md:border-b-0 md:border-r md:px-4 md:py-6">
        <Link
          href="/"
          className="font-display mr-4 text-lg font-bold tracking-tight md:mb-8 md:mr-0 md:px-3"
        >
          Radar<span className="text-jade">.</span>
        </Link>
        <nav className="flex gap-1 md:flex-col">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`pressable whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors duration-150 ${
                  active
                    ? 'bg-soft font-medium text-ink'
                    : 'text-dim hover:bg-elev hover:text-ink'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <p className="mt-auto hidden px-3 text-xs leading-relaxed text-faint md:block">
          Señales de fuentes públicas.
          <br />
          Sin promesas — solo matemática.
        </p>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
