'use client';

import React, { useState } from 'react';
import { 
  Calendar, 
  Plus, 
  Clock, 
  Stethoscope, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Trash2, 
  X 
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function ConsultasPage() {
  const { miembroActivo, consultas, medicos, agregarConsulta, cambiarEstadoConsulta, eliminarConsulta } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);

  // Formulario
  const [motivo, setMotivo] = useState('');
  const [medicoId, setMedicoId] = useState('');
  const [fechaVisitaAnterior, setFechaVisitaAnterior] = useState('');
  const [fechaProximaVisita, setFechaProximaVisita] = useState('');
  const [observaciones, setObservaciones] = useState('');

  if (!miembroActivo) return null;

  const misConsultas = consultas.filter(c => c.miembro_id === miembroActivo.id);
  const misMedicos = medicos.filter(m => m.miembro_id === miembroActivo.id);

  const handleCrearConsulta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivo.trim()) return;

    const medicoSelec = misMedicos.find(m => m.id === medicoId);

    agregarConsulta({
      miembro_id: miembroActivo.id,
      medico_id: medicoId || null,
      motivo,
      fecha_visita_anterior: fechaVisitaAnterior || null,
      fecha_proxima_visita: fechaProximaVisita ? new Date(fechaProximaVisita).toISOString() : null,
      estado: 'programada',
      observaciones: observaciones || null,
      medico_nombre: medicoSelec ? medicoSelec.nombre : undefined
    });

    setMotivo('');
    setMedicoId('');
    setFechaVisitaAnterior('');
    setFechaProximaVisita('');
    setObservaciones('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-7 h-7 text-amber-600" /> Consultas y Turnos Médicos
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Historial de visitas pasadas y recordatorios de próximos turnos para <strong>{miembroActivo.nombre}</strong>.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-md transition-all shrink-0 active:scale-95"
        >
          <Plus className="w-4 h-4" /> Programar Turno
        </button>
      </div>

      {/* LISTADO DE TURNOS */}
      {misConsultas.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-800">No hay turnos registrados</h2>
          <p className="text-xs text-slate-500 mb-4">Agenda las próximas citas médicas de {miembroActivo.nombre}.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 bg-amber-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl"
          >
            <Plus className="w-4 h-4" /> Agendar Cita
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {misConsultas.map((cons) => {
            const fechaProxima = cons.fecha_proxima_visita ? new Date(cons.fecha_proxima_visita) : null;
            const diasDiff = fechaProxima 
              ? Math.ceil((fechaProxima.getTime() - Date.now()) / (1000 * 3600 * 24))
              : null;

            return (
              <div
                key={cons.id}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-extrabold uppercase px-3 py-1 rounded-full ${
                      cons.estado === 'completada'
                        ? 'bg-emerald-100 text-emerald-800'
                        : cons.estado === 'cancelada'
                        ? 'bg-slate-200 text-slate-700'
                        : diasDiff !== null && diasDiff <= 2
                        ? 'bg-red-100 text-red-800 animate-pulse-subtle'
                        : 'bg-amber-100 text-amber-900'
                    }`}>
                      {cons.estado === 'completada' ? 'Completado' : cons.estado === 'cancelada' ? 'Cancelado' : 'Programado'}
                    </span>

                    {diasDiff !== null && cons.estado === 'programada' && (
                      <span className="text-[11px] font-bold text-amber-700">
                        {diasDiff < 0 ? '¡Vencido!' : diasDiff === 0 ? '¡HOY!' : diasDiff === 1 ? 'Mañana' : `En ${diasDiff} días`}
                      </span>
                    )}
                  </div>

                  <h2 className="text-base font-bold text-slate-900">{cons.motivo}</h2>
                  {cons.medico_nombre && (
                    <p className="text-xs text-slate-600 flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-indigo-600" /> Professional: <strong>{cons.medico_nombre}</strong>
                    </p>
                  )}
                  {cons.observaciones && (
                    <p className="text-xs text-slate-500 italic mt-1">{cons.observaciones}</p>
                  )}
                </div>

                {/* Fechas & Acciones */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-left md:text-right text-xs">
                    {fechaProxima && (
                      <p className="font-extrabold text-amber-900">
                        Próxima cita: {fechaProxima.toLocaleDateString('es-AR')} - {fechaProxima.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                      </p>
                    )}
                    {cons.fecha_visita_anterior && (
                      <p className="text-slate-400 text-[11px]">
                        Visita anterior: {cons.fecha_visita_anterior}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {cons.estado === 'programada' && (
                      <button
                        onClick={() => cambiarEstadoConsulta(cons.id, 'completada')}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200"
                      >
                        Marcar Asistido
                      </button>
                    )}
                    <button
                      onClick={() => eliminarConsulta(cons.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL PROGRAMAR TURNO */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-900 mb-1">Programar Turno Médico</h2>
            <p className="text-xs text-slate-500 mb-4">Para: <strong>{miembroActivo.nombre}</strong></p>

            <form onSubmit={handleCrearConsulta} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Motivo de Consulta *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Chequeo Anual, Control de Presión, Vacunación"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Médico / Especialista (Opcional)</label>
                <select
                  value={medicoId}
                  onChange={(e) => setMedicoId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800"
                >
                  <option value="">-- Ninguno o No Agendado --</option>
                  {misMedicos.map(med => (
                    <option key={med.id} value={med.id}>
                      {med.nombre} ({med.especialidad || 'General'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fecha Próxima Cita *</label>
                  <input
                    type="datetime-local"
                    required
                    value={fechaProximaVisita}
                    onChange={(e) => setFechaProximaVisita(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fecha Visita Anterior</label>
                  <input
                    type="date"
                    value={fechaVisitaAnterior}
                    onChange={(e) => setFechaVisitaAnterior(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Indicaciones o Preparación previa</label>
                <textarea
                  rows={2}
                  placeholder="Ej: Ayuno de 8 horas, llevar estudios impresos..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-slate-100 text-slate-700 font-bold text-xs py-2.5 rounded-xl hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 text-white font-bold text-xs py-2.5 rounded-xl hover:bg-amber-700 shadow-md"
                >
                  Agendar Turno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
