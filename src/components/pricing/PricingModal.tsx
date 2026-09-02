'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { 
  Check, 
  X, 
  Sparkles, 
  Users, 
  User, 
  HeartHandshake, 
  MessageSquare,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  currentPlan?: string;
}

export function PricingModal({ isOpen, onClose, userEmail = '', currentPlan = 'prueba' }: PricingModalProps) {
  if (!isOpen) return null;

  const PHONE_WHATSAPP = '5493816582851'; // WhatsApp Oficial de MedFamiliar

  const getWhatsAppUrl = (planNombre: string, precio: string) => {
    const emailTexto = userEmail ? ` para mi cuenta (${userEmail})` : '';
    const mensaje = `Hola! Quiero activar el Plan ${planNombre} (${precio} ARS/año)${emailTexto} en MedFamiliar.`;
    return `https://wa.me/${PHONE_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* BOTÓN CERRAR */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* CABECERA */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="bg-sky-100 text-sky-800 text-[11px] font-extrabold uppercase px-3.5 py-1 rounded-full border border-sky-200 inline-flex items-center gap-1.5 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-sky-600" /> Planes y Suscripciones Anuales
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight tracking-tight">
            Elige el plan ideal para cuidar a tu familia
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Desbloquea cupos de integrantes, almacenamiento ilimitado de estudios y gestión compartida multitutor sin sorpresas ni renovaciones automáticas.
          </p>
        </div>

        {/* REJILLA DE 3 PLANES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* PLAN SINGULAR */}
          <div className={`bg-white rounded-3xl p-6 border-2 flex flex-col justify-between transition-all relative ${
            currentPlan === 'singular' ? 'border-sky-500 shadow-md ring-2 ring-sky-500/20' : 'border-slate-200 hover:border-slate-300'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 bg-sky-50 text-sky-600 rounded-2xl">
                  <User className="w-5 h-5" />
                </span>
                {currentPlan === 'singular' && (
                  <span className="text-[10px] font-extrabold bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded-full uppercase">
                    Plan Actual
                  </span>
                )}
              </div>

              <h3 className="text-lg font-bold text-slate-900">Plan Singular</h3>
              <p className="text-xs text-slate-500 mt-0.5">Ideal para vos o tu mascota.</p>

              <div className="my-4">
                <span className="text-2xl font-black text-slate-900">$18.000</span>
                <span className="text-xs font-semibold text-slate-500"> ARS / año</span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700 pt-4 border-t border-slate-100">
                <p className="flex items-center gap-2 font-bold text-sky-700">
                  <Check className="w-4 h-4 text-sky-600 shrink-0" />
                  1 Integrante (Adulto o Mascota)
                </p>
                <p className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  Ficha SOS QR de Emergencia
                </p>
                <p className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  Historial de Turnos y Tratamientos
                </p>
                <p className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  Estudios Médicos en Nube
                </p>
              </div>
            </div>

            <a
              href={getWhatsAppUrl('Singular', '$18.000')}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-sm active:scale-95 text-center"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>Elegir Singular</span>
            </a>
          </div>

          {/* PLAN FAMILIA (DESTACADO / CABALLITO) */}
          <div className="bg-gradient-to-b from-sky-900 to-slate-900 text-white rounded-3xl p-6 border-2 border-sky-400 shadow-xl flex flex-col justify-between relative transform md:-translate-y-2">
            
            {/* ETIQUETA MÁS POPULAR */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md flex items-center gap-1">
              <Zap className="w-3 h-3 fill-slate-950" /> Más Popular
            </div>

            <div>
              <div className="flex items-center justify-between mb-3 pt-1">
                <span className="p-2.5 bg-sky-500/20 text-sky-300 rounded-2xl border border-sky-400/30">
                  <Users className="w-5 h-5" />
                </span>
                {currentPlan === 'familia' && (
                  <span className="text-[10px] font-extrabold bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full uppercase">
                    Plan Actual
                  </span>
                )}
              </div>

              <h3 className="text-lg font-extrabold text-white">Plan Familia</h3>
              <p className="text-xs text-sky-200 mt-0.5">Hasta 4 integrantes familiares.</p>

              <div className="my-4">
                <span className="text-3xl font-black text-white">$34.000</span>
                <span className="text-xs font-semibold text-sky-200"> ARS / año</span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-100 pt-4 border-t border-sky-800/80">
                <p className="flex items-center gap-2 font-bold text-amber-300">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  Hasta 4 Integrantes Familiares
                </p>
                <p className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  Multitutor Compartido por Email
                </p>
                <p className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  Fichas SOS QR Ilimitadas
                </p>
                <p className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  Agenda de Turnos y Vacunas
                </p>
                <p className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  Estudios PDF y Fotos en Nube
                </p>
              </div>
            </div>

            <a
              href={getWhatsAppUrl('Familia', '$34.000')}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs py-3.5 rounded-xl transition-all shadow-md active:scale-95 text-center"
            >
              <MessageSquare className="w-4 h-4 fill-slate-950" />
              <span>Elegir Plan Familia</span>
            </a>
          </div>

          {/* PLAN TRIBU */}
          <div className={`bg-white rounded-3xl p-6 border-2 flex flex-col justify-between transition-all relative ${
            currentPlan === 'tribu' ? 'border-teal-500 shadow-md ring-2 ring-teal-500/20' : 'border-slate-200 hover:border-slate-300'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 bg-teal-50 text-teal-600 rounded-2xl">
                  <HeartHandshake className="w-5 h-5" />
                </span>
                {currentPlan === 'tribu' && (
                  <span className="text-[10px] font-extrabold bg-teal-100 text-teal-800 px-2.5 py-0.5 rounded-full uppercase">
                    Plan Actual
                  </span>
                )}
              </div>

              <h3 className="text-lg font-bold text-slate-900">Plan Tribu</h3>
              <p className="text-xs text-slate-500 mt-0.5">Integrantes ilimitados para toda la familia.</p>

              <div className="my-4">
                <span className="text-2xl font-black text-slate-900">$58.000</span>
                <span className="text-xs font-semibold text-slate-500"> ARS / año</span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700 pt-4 border-t border-slate-100">
                <p className="flex items-center gap-2 font-bold text-teal-700">
                  <Check className="w-4 h-4 text-teal-600 shrink-0" />
                  Integrantes Ilimitados (∞)
                </p>
                <p className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  Cuidadores y Tutores Ilimitados
                </p>
                <p className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  Historial Médico Completo de por vida
                </p>
                <p className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  Soporte Prioritario 24/7
                </p>
              </div>
            </div>

            <a
              href={getWhatsAppUrl('Tribu', '$58.000')}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-sm active:scale-95 text-center"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>Elegir Plan Tribu</span>
            </a>
          </div>

        </div>

        {/* PIE DEL MODAL DE PRECIOS */}
        <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Pago 100% Seguro vía Transferencia / MercadoPago</span>
          </div>
          <p className="text-[11px] text-slate-400">Activación inmediata tras enviar comprobante.</p>
        </div>

      </div>
    </div>,
    document.body
  );
}
