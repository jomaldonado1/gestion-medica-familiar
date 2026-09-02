'use client';

import React from 'react';
import { Smartphone, Sparkles, Download } from 'lucide-react';
import { usePWAInstall } from '@/context/PWAContext';

interface PWAInstallButtonProps {
  variant?: 'sidebar' | 'header' | 'mobile' | 'compact';
  className?: string;
}

export function PWAInstallButton({ variant = 'sidebar', className = '' }: PWAInstallButtonProps) {
  const { isInstallable, installApp } = usePWAInstall();

  if (!isInstallable) return null;

  if (variant === 'header') {
    return (
      <button
        onClick={installApp}
        className={`flex items-center gap-1.5 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white font-extrabold text-xs px-3 py-2 rounded-xl transition-all shadow-sm active:scale-95 shrink-0 ${className}`}
        title="Instalar MedFamiliar en este dispositivo"
      >
        <Smartphone className="w-4 h-4" />
        <span className="hidden sm:inline">📲 Instalar App</span>
        <span className="sm:hidden">📲 Instalar</span>
      </button>
    );
  }

  if (variant === 'mobile') {
    return (
      <button
        onClick={installApp}
        className={`w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-sky-50 to-teal-50 border border-sky-300 text-sky-950 font-bold text-xs hover:bg-sky-100 transition-all ${className}`}
      >
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-sky-600" />
          <span>📲 Instalar Aplicación</span>
        </div>
        <span className="text-[10px] uppercase font-extrabold bg-sky-600 text-white px-2 py-0.5 rounded-md">
          PWA
        </span>
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={installApp}
        className={`inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 bg-sky-100/80 hover:bg-sky-200 px-2.5 py-1.5 rounded-xl transition-all ${className}`}
      >
        <Download className="w-3.5 h-3.5 text-sky-600" />
        <span>Instalar App</span>
      </button>
    );
  }

  // Variante Sidebar (Predeterminada para escritorio)
  return (
    <button
      onClick={installApp}
      className={`w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white font-bold text-xs transition-all shadow-md hover:shadow-lg active:scale-[0.98] ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 bg-white/20 rounded-xl backdrop-blur-sm">
          <Smartphone className="w-4 h-4 text-white" />
        </div>
        <div className="text-left">
          <span className="block leading-tight font-extrabold text-white">📲 Instalar Aplicación</span>
          <span className="text-[10px] text-sky-100 font-normal">Acceso rápido sin navegador</span>
        </div>
      </div>
      <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
    </button>
  );
}
