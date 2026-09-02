'use client';

import React from 'react';
import { Smartphone, Download, X } from 'lucide-react';
import { usePWAInstall } from '@/context/PWAContext';

export function PWAInstallBanner() {
  const { isInstallable, bannerDismissed, installApp, dismissBanner } = usePWAInstall();

  if (!isInstallable || bannerDismissed) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-40 bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-3xl shadow-2xl border border-slate-700/80 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-sky-600 to-teal-500 rounded-2xl shrink-0 shadow-md">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-bold text-xs sm:text-sm text-white">Instalar MedFamiliar PWA</h4>
              <span className="text-[9px] font-extrabold bg-sky-500/30 text-sky-300 border border-sky-400/30 px-1.5 py-0.5 rounded-full uppercase">
                Recomendado
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
              Accede a tus fichas médicas al instante desde tu pantalla de inicio.
            </p>
          </div>
        </div>

        <button
          onClick={dismissBanner}
          className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
          title="Descartar aviso"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-800">
        <button
          onClick={installApp}
          className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Instalar Ahora</span>
        </button>
        <button
          onClick={dismissBanner}
          className="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          Ahora no
        </button>
      </div>
    </div>
  );
}
