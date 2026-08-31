'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Users, 
  Pill, 
  Calendar, 
  FileText, 
  QrCode
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

export function BottomNav() {
  const pathname = usePathname();
  const { miembroActivo } = useApp();

  // Ocultar en vistas aisladas (Auth y Emergencia)
  if (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password' ||
    pathname.startsWith('/emergencia/') ||
    pathname.startsWith('/auth/')
  ) {
    return null;
  }

  const navItems = [
    { href: '/', label: 'Inicio', icon: Home },
    { href: '/miembros', label: 'Miembros', icon: Users },
    { href: '/medicamentos', label: 'Medicinas', icon: Pill },
    { href: '/consultas', label: 'Turnos', icon: Calendar },
    { href: '/estudios', label: 'Estudios', icon: FileText },
  ];

  return (
    <nav aria-label="Navegación móvil" className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 shadow-lg">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1.5 px-2 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-sky-600 bg-sky-50 font-bold scale-105'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[11px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}

        {/* Ficha QR de Emergencia Directa */}
        {miembroActivo && (
          <Link
            href={`/emergencia/${miembroActivo.qr_code_token}`}
            target="_blank"
            className="flex flex-col items-center py-1.5 px-2 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-all border border-red-200"
            title="Ver Ficha Rápida de Emergencia Pública"
          >
            <QrCode className="w-5 h-5 mb-0.5 stroke-[2.5]" />
            <span className="text-[11px] tracking-tight">QR SOS</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
