import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Radar — Detección temprana de señales de mercado',
  description:
    'Detecta señales tempranas, anomalías y patrones emergentes del mercado digital antes de que se conviertan en tendencias evidentes.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
