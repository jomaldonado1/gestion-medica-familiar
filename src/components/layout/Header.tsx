'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HeartPulse, 
  Users, 
  QrCode, 
  AlertCircle, 
  ChevronDown,
  UserCheck,
  X,
  PhoneCall,
  Plus,
  LogOut
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { QRCodeSVG } from 'qrcode.react';

export function Header() {
  const pathname = usePathname();
  const { user, cerrarSesion, miembros, miembroActivo, setMiembroActivoId, consultas } = useApp();
  const [showQRModal, setShowQRModal] = useState(false);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Ocultar en vistas aisladas
  if (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password' ||
    pathname.startsWith('/emergencia/') ||
    pathname.startsWith('/auth/')
  ) {
    return null;
  }

  // Filtrar consultas próximas en los siguientes 7 días
  const proximasConsultas = consultas.filter(c => {
    if (!c.fecha_proxima_visita || c.estado !== 'programada') return false;
    const diffDays = Math.ceil((new Date(c.fecha_proxima_visita).getTime() - Date.now()) / (1000 * 3600 * 24));
    return diffDays >= 0 && diffDays <= 7;
  });

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      {/* Alerta Superior de Turnos Próximos */}
      {proximasConsultas.length > 0 && (
        <div className="bg-amber-500 text-white text-xs font-semibold px-4 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <AlertCircle className="w-4 h-4 shrink-0 animate-bounce" />
            <p className="truncate">
              ¡Tienes <strong>{proximasConsultas.length} turno(s) médico(s) próximo(s)</strong> esta semana!
            </p>
            <Link href="/consultas" className="underline font-bold text-white ml-auto shrink-0 hover:text-amber-100">
              Ver turnos
            </Link>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Mobile Logo Brand */}
        <div className="flex items-center gap-2 md:hidden">
          <div className="bg-sky-600 text-white p-2 rounded-xl shadow-sm">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-base leading-tight">MedFamiliar</span>
            <span className="block text-[10px] text-sky-600 font-bold">PWA Salud</span>
          </div>
        </div>

        {/* Desktop Active Member Indicator */}
        <div className="hidden md:flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Integrante:</span>
          {miembros.length === 0 ? (
            <Link
              href="/miembros"
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-50 text-sky-700 hover:bg-sky-100 flex items-center gap-1 border border-sky-200"
            >
              <Plus className="w-3.5 h-3.5" /> Agregar primer integrante
            </Link>
          ) : (
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              {miembros.map((m) => {
                const isSelected = miembroActivo?.id === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMiembroActivoId(m.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-200/70'
                    }`}
                  >
                    <span>{m.nombre}</span>
                    <span className={`text-[10px] font-normal opacity-80 ${isSelected ? 'text-sky-100' : 'text-slate-500'}`}>
                      ({m.tipo})
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Mobile Member Switcher Dropdown */}
        <div className="relative md:hidden">
          <button
            onClick={() => setShowMemberDropdown(!showMemberDropdown)}
            className="flex items-center gap-2 bg-sky-50 text-sky-800 border border-sky-200 px-3 py-1.5 rounded-xl text-xs font-bold"
          >
            <Users className="w-4 h-4 text-sky-600" />
            <span className="max-w-[120px] truncate">{miembroActivo?.nombre || 'Sin integrantes'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-sky-600" />
          </button>

          {showMemberDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50">
              <p className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase">Cambiar integrante</p>
              {miembros.length === 0 ? (
                <p className="px-3 py-2 text-xs text-slate-500 italic">No hay integrantes creados.</p>
              ) : (
                miembros.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setMiembroActivoId(m.id);
                      setShowMemberDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between ${
                      miembroActivo?.id === m.id ? 'bg-sky-50 text-sky-700 font-bold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{m.nombre}</p>
                      <p className="text-[10px] text-slate-500">{m.tipo}</p>
                    </div>
                    {miembroActivo?.id === m.id && <UserCheck className="w-4 h-4 text-sky-600" />}
                  </button>
                ))
              )}
              <div className="border-t border-slate-100 mt-1 pt-1 px-2">
                <Link
                  href="/miembros"
                  onClick={() => setShowMemberDropdown(false)}
                  className="flex items-center gap-1.5 text-xs text-sky-600 font-bold p-1.5 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar integrante
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons: Emergency QR Button & Logout */}
        <div className="flex items-center gap-2">
          {miembroActivo && (
            <button
              onClick={() => setShowQRModal(true)}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3 py-2 rounded-xl transition-all shadow-sm active:scale-95"
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">Generar QR SOS</span>
              <span className="sm:hidden">QR</span>
            </button>
          )}

          {user && (
            <button
              onClick={cerrarSesion}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl border border-slate-200 transition-all active:scale-95 shrink-0"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4 text-red-600" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          )}
        </div>
      </div>

      {/* MODAL DE CÓDIGO QR DE EMERGENCIA CON PORTAL AL BODY */}
      {showQRModal && miembroActivo && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200 my-auto max-h-[90vh] overflow-y-auto font-sans border border-slate-100 text-center">
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full bg-slate-100 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="pt-2">
              <div className="inline-flex p-3 bg-red-100 text-red-600 rounded-2xl mb-3">
                <QrCode className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Ficha Rápida SOS</h3>
              <p className="text-xs text-slate-500 mb-4">
                Escanea para acceder a alergias y datos de urgencia de <strong>{miembroActivo.nombre}</strong>.
              </p>

              <div className="bg-slate-50 border-2 border-red-200 p-4 rounded-2xl inline-block mb-4 shadow-inner">
                <QRCodeSVG
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/emergencia/${miembroActivo.qr_code_token}`}
                  size={160}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-left text-xs text-red-900 mb-4 space-y-1.5">
                <p><strong>Grupo Sanguíneo:</strong> {miembroActivo.grupo_sanguineo || 'N/A'}</p>
                <p><strong>Alergias:</strong> {miembroActivo.alergias || 'Ninguna registrada'}</p>
                {miembroActivo.contacto_emergencia_telefono && (
                  <p className="flex items-center gap-1 font-bold text-red-700 pt-1">
                    <PhoneCall className="w-3.5 h-3.5" />
                    Contacto: {miembroActivo.contacto_emergencia_nombre} ({miembroActivo.contacto_emergencia_telefono})
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/emergencia/${miembroActivo.qr_code_token}`}
                  target="_blank"
                  onClick={() => setShowQRModal(false)}
                  className="flex-1 bg-slate-900 text-white font-bold text-xs py-3 rounded-xl hover:bg-slate-800 transition-all text-center shadow-md"
                >
                  Abrir vista pública
                </Link>
                <button
                  onClick={() => window.print()}
                  className="bg-slate-100 text-slate-700 font-bold text-xs px-4 py-3 rounded-xl hover:bg-slate-200 transition-all border border-slate-200"
                >
                  Imprimir
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
