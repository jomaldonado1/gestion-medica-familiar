'use client';

import React from 'react';
import Link from 'next/link';
import { 
  HeartPulse, 
  Pill, 
  Calendar, 
  FileText, 
  Stethoscope, 
  QrCode, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  PhoneCall,
  ChevronRight
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function DashboardPage() {
  const { 
    miembroActivo, 
    medicamentos, 
    consultas, 
    estudios, 
    medicos,
    toggleMedicamentoActivo 
  } = useApp();

  if (!miembroActivo) {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm max-w-xl mx-auto my-8">
        <div className="p-4 bg-sky-50 text-sky-600 rounded-3xl inline-block mb-4 shadow-sm">
          <HeartPulse className="w-16 h-16 stroke-[2.5]" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">¡Bienvenido a MedFamiliar!</h2>
        <p className="text-sm text-slate-600 mb-6 max-w-md mx-auto leading-relaxed">
          Tu cuenta está lista. Comienza agregando a tu primer integrante familiar (padre/adulto mayor, tú mismo, hijo o mascota) para llevar su historial médico y generar su Ficha de Emergencia SOS.
        </p>
        <Link
          href="/miembros"
          className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold text-sm px-6 py-3.5 rounded-2xl shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" /> Crear tu primer integrante familiar (+ Nuevo)
        </Link>
      </div>
    );
  }

  // Filtrar datos para el miembro activo
  const misMedicamentos = medicamentos.filter(m => m.miembro_id === miembroActivo.id);
  const misMedicamentosActivos = misMedicamentos.filter(m => m.activo);
  
  const misConsultas = consultas.filter(c => c.miembro_id === miembroActivo.id);
  const proximasConsultas = misConsultas
    .filter(c => c.estado === 'programada')
    .sort((a, b) => new Date(a.fecha_proxima_visita || 0).getTime() - new Date(b.fecha_proxima_visita || 0).getTime());

  const misEstudios = estudios.filter(e => e.miembro_id === miembroActivo.id);
  const misMedicos = medicos.filter(m => m.miembro_id === miembroActivo.id);

  return (
    <div className="space-y-6">
      {/* TARJETA CABECERA DEL INTEGRANTE ACTIVO */}
      <div className="bg-gradient-to-r from-sky-700 via-sky-600 to-teal-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        {/* Background decorative icons */}
        <HeartPulse className="absolute -right-8 -bottom-8 w-48 h-48 opacity-10 pointer-events-none" />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-sky-900/50 backdrop-blur-sm border border-sky-300/30 text-sky-100 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                {miembroActivo.tipo}
              </span>
              {miembroActivo.rol_actual && (
                <span className="bg-teal-900/50 backdrop-blur-sm border border-teal-300/30 text-teal-100 text-[11px] px-2.5 py-0.5 rounded-full font-semibold">
                  Rol: {miembroActivo.rol_actual}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{miembroActivo.nombre}</h1>
            <p className="text-xs sm:text-sm text-sky-100 opacity-90 mt-1">
              {miembroActivo.fecha_nacimiento && `Fecha Nac: ${miembroActivo.fecha_nacimiento}`} 
              {miembroActivo.grupo_sanguineo && ` • Grupo: ${miembroActivo.grupo_sanguineo}`}
              {miembroActivo.especie_raza && ` • Especie/Raza: ${miembroActivo.especie_raza}`}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Link
              href={`/emergencia/${miembroActivo.qr_code_token}`}
              target="_blank"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg border border-red-400 transition-all hover:scale-105"
            >
              <QrCode className="w-4 h-4" />
              <span>Ver SOS Pública</span>
            </Link>
          </div>
        </div>

        {/* ALERTA DE ALERGIAS */}
        {miembroActivo.alergias && (
          <div className="mt-4 pt-3 border-t border-sky-400/30 flex items-center gap-2 text-xs text-amber-200 bg-amber-950/30 p-2.5 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
            <p className="truncate">
              <strong className="text-amber-100">Alergias Críticas:</strong> {miembroActivo.alergias}
            </p>
          </div>
        )}
      </div>

      {/* BOTONERA DE ACCESO RÁPIDO */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/medicamentos"
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-sky-300 transition-all flex flex-col items-center text-center group"
        >
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl mb-2 group-hover:scale-110 transition-transform">
            <Pill className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="text-xs font-bold text-slate-800">Fármacos</span>
          <span className="text-[10px] text-slate-500">{misMedicamentosActivos.length} activos</span>
        </Link>

        <Link
          href="/consultas"
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-300 transition-all flex flex-col items-center text-center group"
        >
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl mb-2 group-hover:scale-110 transition-transform">
            <Calendar className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="text-xs font-bold text-slate-800">Turnos</span>
          <span className="text-[10px] text-slate-500">{proximasConsultas.length} pendientes</span>
        </Link>

        <Link
          href="/estudios"
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-teal-300 transition-all flex flex-col items-center text-center group"
        >
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl mb-2 group-hover:scale-110 transition-transform">
            <FileText className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="text-xs font-bold text-slate-800">Estudios</span>
          <span className="text-[10px] text-slate-500">{misEstudios.length} guardados</span>
        </Link>

        <Link
          href="/medicos"
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col items-center text-center group"
        >
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl mb-2 group-hover:scale-110 transition-transform">
            <Stethoscope className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="text-xs font-bold text-slate-800">Médicos</span>
          <span className="text-[10px] text-slate-500">{misMedicos.length} agendados</span>
        </Link>
      </div>

      {/* SECCIÓN DOS COLUMNAS DE RESUMEN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* TRATAMIENTOS Y MEDICAMENTOS ACTIVOS */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-sky-100 text-sky-700 rounded-xl">
                <Pill className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Medicamentos Activos</h2>
            </div>
            <Link href="/medicamentos" className="text-xs font-bold text-sky-600 hover:underline flex items-center gap-1">
              Ver todos <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {misMedicamentosActivos.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No hay medicamentos activos para {miembroActivo.nombre}.
            </p>
          ) : (
            <div className="space-y-3">
              {misMedicamentosActivos.map((med) => (
                <div
                  key={med.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-sky-50/50 transition-colors"
                >
                  <div className="pr-2">
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">{med.nombre}</h3>
                    <p className="text-xs text-slate-600 font-medium">{med.dosis} • {med.frecuencia}</p>
                    <p className="text-[11px] text-sky-700 font-semibold flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" /> Horario: {med.horario || 'No especificado'}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleMedicamentoActivo(med.id)}
                    className="p-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold rounded-xl text-xs transition-all flex items-center gap-1 shrink-0"
                    title="Marcar como descontinuado o inactivo"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="hidden sm:inline">Activo</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PRÓXIMAS CONSULTAS MÉDICAS */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Próximos Turnos</h2>
            </div>
            <Link href="/consultas" className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1">
              Ver calendario <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {proximasConsultas.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No hay turnos agendados próximamente.
            </p>
          ) : (
            <div className="space-y-3">
              {proximasConsultas.map((cons) => {
                const fechaObj = cons.fecha_proxima_visita ? new Date(cons.fecha_proxima_visita) : null;
                const diasRestantes = fechaObj 
                  ? Math.ceil((fechaObj.getTime() - Date.now()) / (1000 * 3600 * 24))
                  : null;

                return (
                  <div
                    key={cons.id}
                    className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/80 flex items-start justify-between gap-3"
                  >
                    <div>
                      <span className="inline-block text-[10px] font-extrabold uppercase bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md mb-1">
                        {diasRestantes !== null && diasRestantes === 0
                          ? '¡Hoy!'
                          : diasRestantes === 1
                          ? 'Mañana'
                          : `En ${diasRestantes} días`}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">{cons.motivo}</h3>
                      {cons.medico_nombre && (
                        <p className="text-xs text-slate-600 mt-0.5">Doctor/a: {cons.medico_nombre}</p>
                      )}
                    </div>
                    {fechaObj && (
                      <div className="text-right shrink-0">
                        <p className="text-xs font-extrabold text-amber-800">
                          {fechaObj.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                        </p>
                        <p className="text-[11px] font-semibold text-slate-500">
                          {fechaObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* TELÉFONOS RÁPIDOS DE EMERGENCIA */}
      <div className="bg-red-50 rounded-3xl p-5 border border-red-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-600 text-white rounded-2xl shadow-sm animate-pulse-subtle">
            <PhoneCall className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-red-950">Contacto de Emergencia</h3>
            <p className="text-xs text-red-800">
              {miembroActivo.contacto_emergencia_nombre
                ? `${miembroActivo.contacto_emergencia_nombre}: ${miembroActivo.contacto_emergencia_telefono}`
                : 'No se configuró teléfono de contacto'}
            </p>
          </div>
        </div>

        {miembroActivo.contacto_emergencia_telefono && (
          <a
            href={`tel:${miembroActivo.contacto_emergencia_telefono}`}
            className="w-full sm:w-auto text-center bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-md transition-all active:scale-95"
          >
            Llamar {miembroActivo.contacto_emergencia_telefono}
          </a>
        )}
      </div>
    </div>
  );
}
