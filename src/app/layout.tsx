import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppLayout } from '@/components/layout/AppLayout';

export const metadata: Metadata = {
  title: 'MedFamiliar - Gestión Médica y Salud Familiar Integral PWA',
  description: 'Aplicación web progresiva responsiva para la gestión unificada de historiales médicos, tratamientos, turnos, vacunas y fichas de emergencia SOS de toda la familia.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MedFamiliar',
  },
  formatDetection: {
    telephone: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#0284c7',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="antialiased bg-slate-50 text-slate-900 selection:bg-sky-500 selection:text-white">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
