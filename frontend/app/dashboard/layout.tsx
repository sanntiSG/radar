'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';

const NAV = [
  { href: '/dashboard', label: 'Señales' },
  { href: '/dashboard/trends', label: 'Tendencias' },
  { href: '/dashboard/hashtags', label: 'Hashtags' },
  { href: '/dashboard/products', label: 'Productos' },
  { href: '/dashboard/sources', label: 'Fuentes' },
];

function UserBlock() {
  const { user, logout, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return (
      <Link
        href="/login"
        className="pressable whitespace-nowrap rounded-lg px-3 py-2 text-sm text-dim transition-colors duration-150 hover:bg-elev hover:text-ink md:mt-4 md:border-t md:border-line md:pt-4"
      >
        Iniciar sesión
      </Link>
    );
  }

  const initial = (user.name || user.email).charAt(0).toUpperCase();
  return (
    <div className="flex items-center gap-2 md:mt-4 md:border-t md:border-line md:pt-4">
      <Link
        href="/dashboard/profile"
        className="pressable flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors duration-150 hover:bg-elev"
        title="Perfil y preferencias"
      >
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatarUrl} alt="" className="h-7 w-7 shrink-0 rounded-full" />
        ) : (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-jade font-display text-sm font-bold text-[oklch(18%_0.02_165)]">
            {initial}
          </span>
        )}
        <span className="hidden min-w-0 md:block">
          <span className="block truncate text-sm font-medium">{user.name || 'Mi cuenta'}</span>
          <span className="block truncate text-xs text-faint">{user.plan === 'pro' ? 'Plan Pro' : 'Plan Free'}</span>
        </span>
      </Link>
      <button
        onClick={logout}
        className="pressable hidden rounded-lg px-2 py-1.5 text-xs text-faint transition-colors duration-150 hover:bg-elev hover:text-ink md:block"
        title="Cerrar sesión"
      >
        Salir
      </button>
    </div>
  );
}

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
        <div className="ml-auto md:ml-0 md:mt-auto">
          <p className="mb-0 hidden px-3 pb-3 text-xs leading-relaxed text-faint md:block">
            Señales de fuentes públicas.
            <br />
            Sin promesas — solo matemática.
          </p>
          <UserBlock />
        </div>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
