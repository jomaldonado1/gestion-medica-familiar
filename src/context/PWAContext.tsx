'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Smartphone, 
  X, 
  Share, 
  PlusSquare, 
  Info 
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAContextType {
  isInstallable: boolean;
  isStandalone: boolean;
  isIOS: boolean;
  bannerDismissed: boolean;
  showIOSModal: boolean;
  installApp: () => void;
  dismissBanner: () => void;
  setShowIOSModal: (show: boolean) => void;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showFallbackModal, setShowFallbackModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // 1. Detectar si la app ya está corriendo en modo Standalone (PWA Instalada)
    const checkStandalone = () => {
      const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (navigator as any).standalone === true;
      const isAndroidReferrer = document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMedia || isIOSStandalone || isAndroidReferrer);
    };

    checkStandalone();

    // 2. Detectar si el dispositivo es iOS (iPhone/iPad/iPod)
    const ua = window.navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);

    // 3. Revisar si el usuario ya descartó el aviso sutil previamente
    const savedDismiss = localStorage.getItem('pwa_banner_dismissed_v1');
    if (savedDismiss === 'true') {
      setBannerDismissed(true);
    }

    // 4. Capturar el evento beforeinstallprompt (Android / Chrome / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // 5. Escuchar evento appinstalled
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const dismissBanner = () => {
    setBannerDismissed(true);
    localStorage.setItem('pwa_banner_dismissed_v1', 'true');
  };

  const installApp = async () => {
    if (isStandalone) {
      alert('La aplicación ya está instalada y ejecutándose en modo nativo en este dispositivo.');
      return;
    }

    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          console.log('El usuario aceptó la instalación de la PWA');
          setDeferredPrompt(null);
          setIsStandalone(true);
        } else {
          console.log('El usuario cerró la ventana de instalación');
        }
      } catch (err) {
        console.error('Error lanzando ventana nativa de instalación PWA:', err);
      }
    } else {
      setShowFallbackModal(true);
    }
  };

  const isInstallable = !isStandalone;

  return (
    <PWAContext.Provider
      value={{
        isInstallable,
        isStandalone,
        isIOS,
        bannerDismissed,
        showIOSModal,
        installApp,
        dismissBanner,
        setShowIOSModal
      }}
    >
      {children}

      {/* MODAL EXPLICATIVO DE 2 PASOS iOS (Safari iPhone / iPad) */}
      {showIOSModal && mounted && createPortal(
        <div className="fixed inset-0 z-[99999] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center pt-2">
              <div className="inline-flex p-3 bg-sky-100 text-sky-700 rounded-2xl mb-3">
                <Smartphone className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 leading-snug">Instalar en tu iPhone / iPad</h3>
              <p className="text-xs text-slate-500 mt-1 mb-5">
                Sigue estos 2 sencillos pasos para agregar <strong>MedFamiliar</strong> a tu pantalla de inicio en Safari:
              </p>

              <div className="space-y-3 text-left">
                {/* Paso 1 */}
                <div className="bg-sky-50/90 border border-sky-200 p-3.5 rounded-2xl flex items-start gap-3">
                  <div className="bg-sky-600 text-white p-2 rounded-xl shrink-0 mt-0.5 shadow-sm">
                    <Share className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-sky-950">1. Botón Compartir</p>
                    <p className="text-[11px] text-sky-800 mt-0.5">
                      Toca el botón <strong>Compartir</strong> (icono de caja con flecha hacia arriba 📤) en la barra de navegación de Safari.
                    </p>
                  </div>
                </div>

                {/* Paso 2 */}
                <div className="bg-teal-50/90 border border-teal-200 p-3.5 rounded-2xl flex items-start gap-3">
                  <div className="bg-teal-600 text-white p-2 rounded-xl shrink-0 mt-0.5 shadow-sm">
                    <PlusSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-teal-950">2. Agregar a pantalla de inicio</p>
                    <p className="text-[11px] text-teal-800 mt-0.5">
                      Desplázate hacia abajo y toca <strong>"Agregar a pantalla de inicio"</strong> (📲 ➕).
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSModal(false)}
                className="w-full mt-6 bg-slate-900 text-white font-bold text-xs py-3.5 rounded-xl hover:bg-slate-800 transition-all shadow-md active:scale-95"
              >
                ¡Entendido!
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL FALLBACK PARA NAVEGADORES DESKTOP / ANDROID */}
      {showFallbackModal && mounted && createPortal(
        <div className="fixed inset-0 z-[99999] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative border border-slate-100 animate-in fade-in zoom-in-95 duration-200 text-center">
            <button
              onClick={() => setShowFallbackModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-3 bg-sky-100 text-sky-700 rounded-2xl inline-block mb-3">
              <Info className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Instalar Aplicación</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Para instalar <strong>MedFamiliar</strong> en tu dispositivo:
            </p>
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-left text-xs text-slate-700 space-y-2 mb-5">
              <p>💻 <strong>En PC (Chrome/Edge):</strong> Haz clic en el icono 📲 de la barra de direcciones o en el menú <code>⋮</code> -&gt; <em>Instalar MedFamiliar</em>.</p>
              <p>📱 <strong>En Android:</strong> Abre el menú de 3 puntos <code>⋮</code> del navegador y selecciona <strong>"Instalar aplicación"</strong> o <strong>"Agregar a pantalla de inicio"</strong>.</p>
            </div>
            <button
              onClick={() => setShowFallbackModal(false)}
              className="w-full bg-sky-600 text-white font-bold text-xs py-3 rounded-xl hover:bg-sky-700 transition-all shadow-sm"
            >
              Entendido
            </button>
          </div>
        </div>,
        document.body
      )}
    </PWAContext.Provider>
  );
}

export function usePWAInstall() {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWAInstall debe usarse dentro de un PWAProvider');
  }
  return context;
}
