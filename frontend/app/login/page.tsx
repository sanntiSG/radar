'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { RadarSweep } from '@/components/landing/RadarSweep';
import { useAuth } from '@/lib/auth';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          renderButton: (el: HTMLElement, options: object) => void;
        };
      };
    };
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { user, loginDemo, loginGoogle } = useAuth();
  const googleButton = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) router.replace('/dashboard');
  }, [user, router]);

  // Botón oficial de Google Identity Services
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleButton.current) return;

    const init = () => {
      if (!window.google || !googleButton.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response: { credential: string }) => {
          setBusy(true);
          setError(null);
          try {
            await loginGoogle(response.credential);
            router.replace('/dashboard');
          } catch {
            setError('No se pudo validar la sesión de Google. Revisa GOOGLE_CLIENT_ID en backend/.env.');
          } finally {
            setBusy(false);
          }
        },
      });
      window.google.accounts.id.renderButton(googleButton.current, {
        theme: 'filled_black',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        width: 280,
      });
    };

    if (window.google) {
      init();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = init;
    document.head.appendChild(script);
  }, [loginGoogle, router]);

  const handleDemo = async () => {
    setBusy(true);
    setError(null);
    try {
      await loginDemo();
      router.replace('/dashboard');
    } catch {
      setError('No se pudo conectar con la API. ¿Está corriendo el backend en el puerto 4000?');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-6 text-ink">
      {/* Radar de fondo, sutil */}
      <div className="pointer-events-none absolute -right-40 -top-40 opacity-25 md:opacity-40">
        <RadarSweep size={560} />
      </div>

      <div className="relative w-full max-w-sm">
        <Link href="/" className="font-display text-xl font-bold tracking-tight">
          Radar<span className="text-jade">.</span>
        </Link>
        <h1 className="font-display mt-10 text-3xl font-bold leading-tight tracking-tight">
          Tu radar, tu cuenta.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-dim">
          Inicia sesión para personalizar tu dashboard, fijar señales en tu
          watchlist y guardar tus filtros.
        </p>

        <div className="mt-10 space-y-4">
          {GOOGLE_CLIENT_ID ? (
            <div ref={googleButton} className="flex justify-center" />
          ) : (
            <div className="rounded-xl border border-line bg-elev p-4 text-xs leading-relaxed text-faint">
              El login con Google se activará cuando pegues tu{' '}
              <span className="font-mono text-dim">NEXT_PUBLIC_GOOGLE_CLIENT_ID</span> en{' '}
              <span className="font-mono text-dim">frontend/.env.local</span> y{' '}
              <span className="font-mono text-dim">GOOGLE_CLIENT_ID</span> en{' '}
              <span className="font-mono text-dim">backend/.env</span>.
            </div>
          )}

          <button
            onClick={handleDemo}
            disabled={busy}
            className="pressable w-full rounded-full bg-jade px-6 py-3.5 font-semibold text-[oklch(18%_0.02_165)] transition-opacity duration-200 hover:opacity-90 disabled:opacity-50"
          >
            {busy ? 'Entrando…' : 'Explorar con cuenta demo'}
          </button>

          {error && <p className="text-xs leading-relaxed text-danger">{error}</p>}
        </div>

        <p className="mt-8 text-xs leading-relaxed text-faint">
          La cuenta demo es compartida y sirve para probar la personalización.
          Con Google, tus preferencias y watchlist son solo tuyas.
        </p>
      </div>
    </main>
  );
}
