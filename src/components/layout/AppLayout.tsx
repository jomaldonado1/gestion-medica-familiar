'use client';

import React from 'react';
import { AppProvider } from '@/context/AppContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
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
      </div>
    </AppProvider>
  );
}
