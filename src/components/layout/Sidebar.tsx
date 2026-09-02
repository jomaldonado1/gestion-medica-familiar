'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HeartPulse, 
  Home, 
  Users, 
  Stethoscope, 
  Pill, 
  Calendar, 
  FileText, 
  ShieldCheck, 
  QrCode,
  Plus,
  ChevronRight,
  UserCheck,
  LogOut
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { PWAInstallButton } from '@/components/pwa/PWAInstallButton';
import { Sparkles } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { user, cerrarSesion, miembros, miembroActivo, setMiembroActivoId, setShowPricingModal } = useApp();

  if (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password' ||
    pathname.startsWith('/emergencia/') ||
    pathname.startsWith('/auth/')
  ) {
    return null;
  }

  const mainNav = [
    { href: '/', label: 'Panel Principal', icon: Home },
    { href: '/miembros', label: 'Integrantes y Tutores', icon: Users },
    { href: '/medicos', label: 'Médicos y Veterinarios', icon: Stethoscope },
    { href: '/medicamentos', label: 'Medicamentos y Dosis', icon: Pill },
    { href: '/consultas', label: 'Consultas y Turnos', icon: Calendar },
    { href: '/estudios', label: 'Estudios Médicos', icon: FileText },
  ];

  const planNombre = (user?.plan_nombre || 'prueba').toUpperCase();
  const maxCupo = user?.max_integrantes && user.max_integrantes >= 999 ? '∞' : (user?.max_integrantes || 1);
  const expiraMs = user?.plan_expira ? new Date(user.plan_expira).getTime() : 0;
  const diasRestantes = expiraMs > 0 ? Math.max(0, Math.ceil((expiraMs - Date.now()) / (1000 * 3600 * 24))) : null;

  return (
    <aside aria-label="Navegación lateral" className="hidden md:flex flex-col w-72 bg-white border-r border-slate-200 min-h-screen p-4 sticky top-0 h-screen overflow-y-auto">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-2 py-3 mb-4 border-b border-slate-100">
        <div className="bg-gradient-to-tr from-sky-600 to-teal-500 text-white p-2.5 rounded-2xl shadow-md">
          <HeartPulse className="w-6 h-6 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="font-bold text-slate-900 text-lg leading-tight tracking-tight">MedFamiliar</h1>
          <p className="text-xs font-semibold text-sky-600">Salud & Historial PWA</p>
        </div>
      </div>

      {/* TARJETA DE SUSCRIPCIÓN Y CUPOS */}
      <div className="mb-4 bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 text-white p-3.5 rounded-2xl border border-slate-700 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30">
            Plan {planNombre}
          </span>
          {user?.plan_nombre === 'prueba' && diasRestantes !== null && (
            <span className="text-[10px] font-bold text-amber-300">
              ⏳ {diasRestantes}d de prueba
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-xs font-medium mb-2.5 text-slate-200">
          <span>Cupo Integrantes:</span>
          <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
            {miembros.length} / {maxCupo}
          </span>
        </div>

        <button
          onClick={() => setShowPricingModal(true)}
          className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-extrabold text-xs py-2 rounded-xl transition-all shadow-sm active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
          <span>⭐ Mejorar Plan</span>
        </button>
      </div>

      {/* Member Selector Widget in Sidebar */}
      <div className="mb-4 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Integrante Activo</span>
          <Link href="/miembros" className="text-xs text-sky-600 font-semibold hover:underline flex items-center gap-0.5">
            <Plus className="w-3 h-3" /> Nuevo
          </Link>
        </div>
        
        {miembros.length === 0 ? (
          <div className="p-3 bg-white rounded-xl border border-dashed border-slate-200 text-center">
            <p className="text-xs font-semibold text-slate-500 mb-1.5">Sin integrantes</p>
            <Link
              href="/miembros"
              className="inline-flex items-center gap-1 bg-sky-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg hover:bg-sky-700"
            >
              <Plus className="w-3 h-3" /> Crear integrante
            </Link>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {miembros.map((m) => {
              const isSelected = miembroActivo?.id === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMiembroActivoId(m.id)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-all ${
                    isSelected
                      ? 'bg-sky-600 text-white font-bold shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/60'
                  }`}
                >
                  <div className="truncate pr-2">
                    <p className="truncate font-semibold">{m.nombre}</p>
                    <p className={`text-[10px] ${isSelected ? 'text-sky-100' : 'text-slate-500'}`}>{m.tipo}</p>
                  </div>
                  {isSelected && <UserCheck className="w-4 h-4 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Botón PWA de Instalación en Sidebar */}
      <div className="mb-4">
        <PWAInstallButton variant="sidebar" />
      </div>

      {/* Primary Navigation */}
      <nav aria-label="Menú principal" className="space-y-1 flex-1">
        <p className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Menú General</p>
        {mainNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-sky-50 text-sky-700 font-bold border-l-4 border-sky-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              <ChevronRight className={`w-4 h-4 opacity-40 ${isActive ? 'text-sky-600 opacity-100' : ''}`} />
            </Link>
          );
        })}

        {/* Ficha SOS Direct Access */}
        {miembroActivo && (
          <div className="pt-4 mt-4 border-t border-slate-100">
            <Link
              href={`/emergencia/${miembroActivo.qr_code_token}`}
              target="_blank"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-red-50 text-red-700 font-bold text-sm hover:bg-red-100 transition-all border border-red-200 shadow-sm"
            >
              <QrCode className="w-5 h-5 text-red-600 shrink-0" />
              <div className="truncate">
                <span className="block leading-tight">Ficha SOS / QR</span>
                <span className="text-[10px] font-normal text-red-600 opacity-90">Acceso público de emergencia</span>
              </div>
            </Link>
          </div>
        )}

        {/* Admin Link if user is superadmin or admin */}
        {(user?.rol === 'superadmin' || user?.rol === 'admin') && (
          <div className="pt-2">
            <Link
              href="/admin"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                pathname === '/admin'
                  ? 'bg-amber-100 text-amber-900 font-bold'
                  : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              <ShieldCheck className="w-5 h-5 text-amber-600" />
              <span>Super Admin</span>
            </Link>
          </div>
        )}
      </nav>

      {/* User Footer Card & Logout */}
      {user && (
        <div className="pt-4 border-t border-slate-100 mt-auto space-y-2">
          <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="truncate pr-2">
              <p className="text-xs font-bold text-slate-800 truncate">{user.nombre_completo}</p>
              <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
            </div>
            <span className="text-[10px] font-extrabold uppercase bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full shrink-0">
              {user.rol}
            </span>
          </div>

          <button
            onClick={cerrarSesion}
            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      )}
    </aside>
  );
}
