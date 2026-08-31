'use client';

import React, { useState } from 'react';
import { 
  Pill, 
  Plus, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  X,
  AlertCircle
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function MedicamentosPage() {
  const { miembroActivo, medicamentos, agregarMedicamento, toggleMedicamentoActivo, eliminarMedicamento } = useApp();
  const [filtro, setFiltro] = useState<'activos' | 'todos' | 'inactivos'>('activos');
  const [showAddModal, setShowAddModal] = useState(false);

  // Formulario
  const [nombre, setNombre] = useState('');
  const [drogaComponente, setDrogaComponente] = useState('');
  const [dosis, setDosis] = useState('');
  const [frecuencia, setFrecuencia] = useState('');
  const [horario, setHorario] = useState('');
  const [observaciones, setObservaciones] = useState('');

  if (!miembroActivo) return null;

  const misMedicamentos = medicamentos.filter(m => m.miembro_id === miembroActivo.id);
  const medicamentosFiltrados = misMedicamentos.filter(m => {
    if (filtro === 'activos') return m.activo;
    if (filtro === 'inactivos') return !m.activo;
    return true;
  });

  const handleCrearMedicamento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    agregarMedicamento({
      miembro_id: miembroActivo.id,
      nombre,
      droga_componente: drogaComponente || null,
      dosis: dosis || null,
      frecuencia: frecuencia || null,
      horario: horario || null,
      activo: true,
      observaciones: observaciones || null
    });

    setNombre('');
    setDrogaComponente('');
    setDosis('');
    setFrecuencia('');
    setHorario('');
    setObservaciones('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Pill className="w-7 h-7 text-sky-600" /> Medicamentos y Tratamientos
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Fármacos prescritos, horarios de tomas y estado activo/inactivo para <strong>{miembroActivo.nombre}</strong>.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-md transition-all shrink-0 active:scale-95"
        >
          <Plus className="w-4 h-4" /> Agregar Medicamento
        </button>
      </div>

      {/* FILTROS TABS */}
      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => setFiltro('activos')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filtro === 'activos' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Activos ({misMedicamentos.filter(m => m.activo).length})
        </button>
        <button
          onClick={() => setFiltro('inactivos')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filtro === 'inactivos' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Inactivos / Pausados ({misMedicamentos.filter(m => !m.activo).length})
        </button>
        <button
          onClick={() => setFiltro('todos')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filtro === 'todos' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Todos ({misMedicamentos.length})
        </button>
      </div>

      {/* LISTADO */}
      {medicamentosFiltrados.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <Pill className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-800">No hay medicamentos en esta categoría</h2>
          <p className="text-xs text-slate-500 mb-4">Agrega tratamientos médicos o suplementos para mantener el control.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 bg-sky-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl"
          >
            <Plus className="w-4 h-4" /> Cargar Medicamento
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {medicamentosFiltrados.map((med) => (
            <div
              key={med.id}
              className={`rounded-3xl p-5 border transition-all flex flex-col justify-between ${
                med.activo
                  ? 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                  : 'bg-slate-50 border-slate-200/80 opacity-75'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[11px] font-extrabold uppercase px-3 py-1 rounded-full ${
                    med.activo ? 'bg-sky-100 text-sky-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {med.activo ? 'En tratamiento' : 'Finalizado / Pausado'}
                  </span>

                  <button
                    onClick={() => eliminarMedicamento(med.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h2 className="text-lg font-bold text-slate-900 leading-tight">{med.nombre}</h2>
                {med.droga_componente && (
                  <p className="text-xs text-slate-500 font-medium">Componente: {med.droga_componente}</p>
                )}

                <div className="mt-4 space-y-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Dosis:</span>
                    <span className="font-bold text-slate-800">{med.dosis || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Frecuencia:</span>
                    <span className="font-bold text-slate-800">{med.frecuencia || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                    <span className="text-sky-700 font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Horario:
                    </span>
                    <span className="font-extrabold text-sky-900">{med.horario || 'Sin fijar'}</span>
                  </div>
                </div>

                {med.observaciones && (
                  <p className="text-[11px] text-slate-600 mt-3 italic">
                    Notas: {med.observaciones}
                  </p>
                )}
              </div>

              {/* Toggle Switch Activo/Inactivo */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Estado del tratamiento:</span>
                <button
                  onClick={() => toggleMedicamentoActivo(med.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    med.activo
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  }`}
                >
                  {med.activo ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Activo (Presionar para pausar)
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-amber-600" /> Pausado (Presionar para activar)
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL NUEVO MEDICAMENTO */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-900 mb-1">Cargar Medicamento</h2>
            <p className="text-xs text-slate-500 mb-4">Para: <strong>{miembroActivo.nombre}</strong></p>

            <form onSubmit={handleCrearMedicamento} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Comercial del Medicamento *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Enalapril 10mg"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Droga / Componente Activo</label>
                <input
                  type="text"
                  placeholder="Ej: Enalapril Maleato"
                  value={drogaComponente}
                  onChange={(e) => setDrogaComponente(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dosis</label>
                  <input
                    type="text"
                    placeholder="Ej: 1 comprimido"
                    value={dosis}
                    onChange={(e) => setDosis(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Frecuencia</label>
                  <input
                    type="text"
                    placeholder="Ej: Cada 12 horas"
                    value={frecuencia}
                    onChange={(e) => setFrecuencia(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Horario Fijo de Toma</label>
                <input
                  type="text"
                  placeholder="Ej: 08:00 y 20:00 hs"
                  value={horario}
                  onChange={(e) => setHorario(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Indicaciones u Observaciones</label>
                <textarea
                  rows={2}
                  placeholder="Ej: Tomar con alimentos, conservar en heladera..."
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
                  className="flex-1 bg-sky-600 text-white font-bold text-xs py-2.5 rounded-xl hover:bg-sky-700 shadow-md"
                >
                  Guardar Medicamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
