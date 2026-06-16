import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Radar — Detección Temprana de Señales de Mercado',
    template: '%s · Radar',
  },
  description:
    'Detecta señales emergentes antes de que se conviertan en tendencias conocidas. Análisis matemático de mercado para emprendedores y vendedores online.',
  keywords: ['señales de mercado', 'tendencias ecommerce', 'dropshipping', 'radar', 'análisis de mercado'],
  openGraph: {
    title: 'Radar — Señales de Mercado',
    description: 'Detecta señales. Tú decides.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: 'oklch(0.09 0.012 240)',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className="antialiased">{children}</body>
    </html>
  );
}
