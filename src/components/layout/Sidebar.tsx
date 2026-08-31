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
  UserCheck
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

export function Sidebar() {
  const pathname = usePathname();
  const { user, miembros, miembroActivo, setMiembroActivoId } = useApp();

  if (pathname.startsWith('/emergencia/')) return null;

  const mainNav = [
    { href: '/', label: 'Panel Principal', icon: Home },
    { href: '/miembros', label: 'Integrantes y Tutores', icon: Users },
    { href: '/medicos', label: 'Médicos y Veterinarios', icon: Stethoscope },
    { href: '/medicamentos', label: 'Medicamentos y Dosis', icon: Pill },
    { href: '/consultas', label: 'Consultas y Turnos', icon: Calendar },
    { href: '/estudios', label: 'Estudios Médicos', icon: FileText },
  ];

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

      {/* Member Selector Widget in Sidebar */}
      <div className="mb-6 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Integrante Activo</span>
          <Link href="/miembros" className="text-xs text-sky-600 font-semibold hover:underline flex items-center gap-0.5">
            <Plus className="w-3 h-3" /> Nuevo
          </Link>
        </div>
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

        {/* Admin Link if user is admin */}
        {user?.rol === 'admin' && (
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

      {/* User Footer Card */}
      {user && (
        <div className="pt-4 border-t border-slate-100 mt-auto">
          <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="truncate pr-2">
              <p className="text-xs font-bold text-slate-800 truncate">{user.nombre_completo}</p>
              <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
            </div>
            <span className="text-[10px] font-extrabold uppercase bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full shrink-0">
              {user.rol}
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}
