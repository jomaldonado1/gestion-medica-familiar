'use client';

import React, { useState } from 'react';
import { 
  Stethoscope, 
  Plus, 
  PhoneCall, 
  MapPin, 
  Building2, 
  Trash2, 
  X,
  UserCheck
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function MedicosPage() {
  const { miembroActivo, medicos, agregarMedico, eliminarMedico } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);

  // Formulario nuevo médico
  const [nombre, setNombre] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [telefono, setTelefono] = useState('');
  const [centroAtencion, setCentroAtencion] = useState('');
  const [direccion, setDireccion] = useState('');
  const [observaciones, setObservaciones] = useState('');

  if (!miembroActivo) return null;

  const misMedicos = medicos.filter(m => m.miembro_id === miembroActivo.id);

  const handleCrearMedico = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    agregarMedico({
      miembro_id: miembroActivo.id,
      nombre,
      especialidad: especialidad || null,
      telefono: telefono || null,
      centro_atencion: centroAtencion || null,
      direccion: direccion || null,
      observaciones: observaciones || null
    });

    setNombre('');
    setEspecialidad('');
    setTelefono('');
    setCentroAtencion('');
    setDireccion('');
    setObservaciones('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-7 h-7 text-indigo-600" /> Médicos y Veterinarios
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Directorio de profesionales de cabecera y centros de atención para <strong>{miembroActivo.nombre}</strong>.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-md transition-all shrink-0 active:scale-95"
        >
          <Plus className="w-4 h-4" /> Agregar Profesional
        </button>
      </div>

      {/* LISTADO DE MÉDICOS */}
      {misMedicos.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-800">No hay profesionales agendados</h2>
          <p className="text-xs text-slate-500 mb-4">
            Agrega los datos de los médicos o veterinarios tratantes de {miembroActivo.nombre}.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl"
          >
            <Plus className="w-4 h-4" /> Registrar Profesional
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {misMedicos.map((med) => (
            <div
              key={med.id}
              className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[11px] font-extrabold uppercase px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full">
                    {med.especialidad || 'Medicina General'}
                  </span>
                  <button
                    onClick={() => eliminarMedico(med.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h2 className="text-lg font-bold text-slate-900 leading-tight">{med.nombre}</h2>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  {med.centro_atencion && (
                    <p className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{med.centro_atencion}</span>
                    </p>
                  )}
                  {med.direccion && (
                    <p className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{med.direccion}</span>
                    </p>
                  )}
                  {med.observaciones && (
                    <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100 mt-2">
                      {med.observaciones}
                    </p>
                  )}
                </div>
              </div>

              {med.telefono && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <a
                    href={`tel:${med.telefono}`}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs py-2.5 rounded-xl border border-indigo-200 transition-all"
                  >
                    <PhoneCall className="w-4 h-4 text-indigo-600" />
                    <span>Llamar {med.telefono}</span>
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MODAL CREAR MÉDICO */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-900 mb-1">Registrar Médico / Veterinario</h2>
            <p className="text-xs text-slate-500 mb-4">Para: <strong>{miembroActivo.nombre}</strong></p>

            <form onSubmit={handleCrearMedico} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Dr. Alejandro Benítez"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Especialidad</label>
                <input
                  type="text"
                  placeholder="Ej: Cardiología, Pediatría, Veterinaria"
                  value={especialidad}
                  onChange={(e) => setEspecialidad(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    placeholder="+54 9 11..."
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Centro de Atención</label>
                  <input
                    type="text"
                    placeholder="Ej: Sanatorio Anchorena"
                    value={centroAtencion}
                    onChange={(e) => setCentroAtencion(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Dirección del Consultorio</label>
                <input
                  type="text"
                  placeholder="Ej: Av. Pueyrredón 1561, CABA"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  placeholder="Días y horarios de atención..."
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
                  className="flex-1 bg-indigo-600 text-white font-bold text-xs py-2.5 rounded-xl hover:bg-indigo-700 shadow-md"
                >
                  Guardar Profesional
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
