import type { Metadata } from 'next';
import { Schibsted_Grotesk, Spline_Sans_Mono } from 'next/font/google';
import { AuthProvider } from '@/lib/auth';
import './globals.css';

const body = Schibsted_Grotesk({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const mono = Spline_Sans_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Radar — Detección temprana de señales de mercado',
  description:
    'Detecta señales tempranas, anomalías y patrones emergentes del mercado digital antes de que se conviertan en tendencias evidentes. Sin promesas: matemática sobre histórico propio.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${body.variable} ${mono.variable}`}>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        {/* Cabinet Grotesk — display (Fontshare, gratuita) */}
        <link
          href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@500,700,800&display=swap"
          rel="stylesheet"
        />
        <style>{`:root { --font-display: 'Cabinet Grotesk', var(--font-body), sans-serif; }`}</style>
      </head>
      <body className="font-body">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
