'use client';

import React from 'react';
import { 
  ShieldCheck, 
  Users, 
  HeartPulse, 
  Pill, 
  FileText, 
  Activity, 
  Database, 
  Server, 
  Lock,
  UserCheck
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function SuperAdminPage() {
  const { user, miembros, medicamentos, estudios } = useApp();

  if (user?.rol !== 'admin') {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center max-w-md mx-auto my-12 shadow-sm">
        <Lock className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h1 className="text-xl font-bold text-slate-800">Acceso Restringido</h1>
        <p className="text-xs text-slate-500 mt-2">
          El panel de Super Administrador solo está disponible para usuarios con rol de administración del sistema.
        </p>
      </div>
    );
  }

  // Métricas
  const totalUsuariosSimulados = 14;
  const totalMiembros = miembros.length;
  const totalMedicamentosActivos = medicamentos.filter(m => m.activo).length;
  const totalEstudiosSubidos = estudios.length;

  return (
    <div className="space-y-6">
      {/* CABECERA ADMIN */}
      <div className="bg-gradient-to-r from-amber-800 to-amber-950 p-6 rounded-3xl text-white shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider bg-amber-900/80 px-2.5 py-0.5 rounded-full text-amber-200">
              Super Admin Panel
            </span>
          </div>
          <h1 className="text-2xl font-bold">Monitoreo General del Sistema</h1>
          <p className="text-xs text-amber-200/80 mt-1">
            Vista unificada del estado del servidor, volumen de usuarios e integrantes cargados.
          </p>
        </div>
      </div>

      {/* TARJETAS DE MÉTRICAS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Usuarios Auth</p>
            <p className="text-xl font-extrabold text-slate-900">{totalUsuariosSimulados}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Integrantes</p>
            <p className="text-xl font-extrabold text-slate-900">{totalMiembros}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Fármacos Activos</p>
            <p className="text-xl font-extrabold text-slate-900">{totalMedicamentosActivos}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Estudios PDF/Fotos</p>
            <p className="text-xl font-extrabold text-slate-900">{totalEstudiosSubidos}</p>
          </div>
        </div>
      </div>

      {/* ESTADO DEL SISTEMA Y BASE DE DATOS */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Server className="w-5 h-5 text-indigo-600" /> Estado de Infraestructura Supabase
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-800">PostgreSQL (RLS)</span>
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
              Operativo
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-800">Supabase Auth</span>
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
              Operativo
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-800">Storage (estudios)</span>
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
              Operativo
            </span>
          </div>
        </div>
      </div>

      {/* RESUMEN DE INTEGRANTES REGISTRADOS */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4">Detalle de Integrantes del Sistema</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3">Nombre</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Grupo / Especie</th>
                <th className="p-3">Alergias</th>
                <th className="p-3">Token QR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {miembros.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900">{m.nombre}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-sky-100 text-sky-800 font-semibold rounded-full text-[10px]">
                      {m.tipo}
                    </span>
                  </td>
                  <td className="p-3">{m.grupo_sanguineo || m.especie_raza || 'N/A'}</td>
                  <td className="p-3 font-semibold text-red-600">{m.alergias || 'Ninguna'}</td>
                  <td className="p-3 text-[10px] font-mono text-slate-400">{m.qr_code_token}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
