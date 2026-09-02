'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AppProvider } from '@/context/AppContext';
import { PWAProvider } from '@/context/PWAContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { PWAInstallBanner } from '@/components/pwa/PWAInstallBanner';

function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Rutas de pantalla completa aisladas (Auth Shell / Emergency Shell)
  const isStandalonePage = 
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password' ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/emergencia/');

  if (isStandalonePage) {
    return <main className="min-h-screen w-full bg-slate-900">{children}</main>;
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Desktop Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        <Header />
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
          {children}
        </main>
      </div>

      {/* Mobile Navigation Bar */}
      <BottomNav />

      {/* Aviso flotante sutil PWA */}
      <PWAInstallBanner />
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <PWAProvider>
        <LayoutShell>{children}</LayoutShell>
      </PWAProvider>
    </AppProvider>
  );
}
