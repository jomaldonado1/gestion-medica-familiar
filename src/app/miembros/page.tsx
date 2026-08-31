'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Plus, 
  UserPlus, 
  QrCode, 
  ShieldCheck, 
  Trash2, 
  Edit3, 
  X, 
  Heart, 
  AlertTriangle,
  PhoneCall,
  CheckCircle2,
  Mail
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { TipoMiembro, RolTutor } from '@/lib/types';
import { QRCodeSVG } from 'qrcode.react';

export default function MiembrosPage() {
  const { miembros, agregarMiembro, eliminarMiembro, compartirMiembro } = useApp();
  
  // Modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState<string | null>(null); // miembro_id
  const [showQRModal, setShowQRModal] = useState<string | null>(null);

  // Formulario nuevo integrante
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<TipoMiembro>('Yo / Adulto');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [grupoSanguineo, setGrupoSanguineo] = useState('O+');
  const [especieRaza, setEspecieRaza] = useState('');
  const [alergias, setAlergias] = useState('');
  const [contactoNombre, setContactoNombre] = useState('');
  const [contactoTelefono, setContactoTelefono] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Formulario compartir tutor
  const [tutorEmail, setTutorEmail] = useState('');
  const [tutorRol, setTutorRol] = useState<RolTutor>('editor');
  const [shareSuccessMsg, setShareSuccessMsg] = useState(false);

  const handleCrearMiembro = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    agregarMiembro({
      nombre,
      tipo,
      fecha_nacimiento: fechaNacimiento || null,
      grupo_sanguineo: tipo === 'Mascota' ? null : grupoSanguineo,
      especie_raza: tipo === 'Mascota' ? especieRaza || 'Mascota' : null,
      alergias: alergias || null,
      contacto_emergencia_nombre: contactoNombre || null,
      contacto_emergencia_telefono: contactoTelefono || null,
      observaciones: observaciones || null,
    });

    // Reset
    setNombre('');
    setFechaNacimiento('');
    setAlergias('');
    setContactoNombre('');
    setContactoTelefono('');
    setObservaciones('');
    setShowAddModal(false);
  };

  const handleCompartirTutor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tutorEmail.trim() || !showShareModal) return;

    await compartirMiembro(showShareModal, tutorEmail, tutorRol);
    setShareSuccessMsg(true);
    setTimeout(() => {
      setShareSuccessMsg(false);
      setShowShareModal(null);
      setTutorEmail('');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-sky-600" /> Integrantes Familiar y Tutores
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Administra a los miembros de tu familia (padres, adultos, niños, mascotas) y comparte su gestión con otros tutores en tiempo real.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-md transition-all shrink-0 active:scale-95"
        >
          <Plus className="w-4 h-4" /> Agregar Integrante
        </button>
      </div>

      {/* REJILLA DE MIEMBROS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {miembros.map((m) => (
          <div
            key={m.id}
            className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-3">
                <span className="text-[11px] font-extrabold uppercase px-3 py-1 bg-sky-100 text-sky-800 rounded-full">
                  {m.tipo}
                </span>
                <button
                  onClick={() => setShowQRModal(m.id)}
                  className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors flex items-center gap-1 text-xs font-bold"
                  title="Ver Código QR SOS"
                >
                  <QrCode className="w-4 h-4" /> SOS QR
                </button>
              </div>

              <h2 className="text-lg font-bold text-slate-900 leading-tight">{m.nombre}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {m.tipo === 'Mascota' ? `Especie: ${m.especie_raza || 'Mascota'}` : `Grupo Sanguíneo: ${m.grupo_sanguineo || 'No especificado'}`}
                {m.fecha_nacimiento && ` • Nac: ${m.fecha_nacimiento}`}
              </p>

              {/* Alergias */}
              {m.alergias && (
                <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900">
                  <p className="font-bold flex items-center gap-1 text-red-700">
                    <AlertTriangle className="w-3.5 h-3.5" /> Alergias Conocidas:
                  </p>
                  <p className="text-[11px] mt-0.5">{m.alergias}</p>
                </div>
              )}

              {/* Contacto de urgencia */}
              {m.contacto_emergencia_telefono && (
                <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                  <p className="font-bold text-slate-900 flex items-center gap-1">
                    <PhoneCall className="w-3.5 h-3.5 text-sky-600" /> Contacto de Urgencia:
                  </p>
                  <p className="text-[11px] font-semibold text-slate-600 mt-0.5">
                    {m.contacto_emergencia_nombre}: {m.contacto_emergencia_telefono}
                  </p>
                </div>
              )}
            </div>

            {/* Acciones de Tutor */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={() => setShowShareModal(m.id)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2 rounded-xl transition-all"
              >
                <UserPlus className="w-3.5 h-3.5 text-sky-600" /> Compartir Tutor
              </button>

              <button
                onClick={() => eliminarMiembro(m.id)}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                title="Eliminar registro"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL CREAR INTEGRANTE */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-slate-900 mb-1">Nuevo Integrante Familiar</h2>
            <p className="text-xs text-slate-500 mb-5">Ingresa los datos médicos y de contacto de emergencia.</p>

            <form onSubmit={handleCrearMiembro} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Integrante *</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as TipoMiembro)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800"
                >
                  <option value="Yo / Adulto">Yo / Adulto</option>
                  <option value="Adulto Mayor / Padre">Adulto Mayor / Padre</option>
                  <option value="Hijo / Menor">Hijo / Menor</option>
                  <option value="Mascota">Mascota</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Carmen González"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fecha Nacimiento</label>
                  <input
                    type="date"
                    value={fechaNacimiento}
                    onChange={(e) => setFechaNacimiento(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800"
                  />
                </div>

                {tipo === 'Mascota' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Especie / Raza</label>
                    <input
                      type="text"
                      placeholder="Ej: Perro / Labradoodle"
                      value={especieRaza}
                      onChange={(e) => setEspecieRaza(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Grupo Sanguíneo</label>
                    <select
                      value={grupoSanguineo}
                      onChange={(e) => setGrupoSanguineo(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800"
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alergias (Crítico para Emergencia)</label>
                <input
                  type="text"
                  placeholder="Ej: Penicilina, Mariscos, Ibuprofeno"
                  value={alergias}
                  onChange={(e) => setAlergias(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Contacto Urgencia</label>
                  <input
                    type="text"
                    placeholder="Ej: Juan Pérez"
                    value={contactoNombre}
                    onChange={(e) => setContactoNombre(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono Contacto Urgencia</label>
                  <input
                    type="tel"
                    placeholder="Ej: +54 9 11 1234-5678"
                    value={contactoTelefono}
                    onChange={(e) => setContactoTelefono(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Observaciones Generales</label>
                <textarea
                  rows={2}
                  placeholder="Notas adicionales o diagnósticos crónicos..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-slate-100 text-slate-700 font-bold text-xs py-3 rounded-2xl hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-sky-600 text-white font-bold text-xs py-3 rounded-2xl hover:bg-sky-700 shadow-md"
                >
                  Guardar Integrante
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL COMPARTIR TUTOR MULTIUSUARIO */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowShareModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-900 mb-1">Gestión Compartida (Multitutor)</h2>
            <p className="text-xs text-slate-500 mb-4">
              Invita a hermanos, cónyuges o cuidadores para administrar y ver este historial en tiempo real.
            </p>

            {shareSuccessMsg ? (
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-4 rounded-2xl text-center text-xs font-bold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" /> ¡Invitación de tutor enviada correctamente!
              </div>
            ) : (
              <form onSubmit={handleCompartirTutor} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email del Tutor a invitar</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="tutor@ejemplo.com"
                      value={tutorEmail}
                      onChange={(e) => setTutorEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nivel de Acceso (Rol)</label>
                  <select
                    value={tutorRol}
                    onChange={(e) => setTutorRol(e.target.value as RolTutor)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800"
                  >
                    <option value="editor">Editor (Puede agregar y actualizar datos)</option>
                    <option value="lector">Lector (Solo consulta de historial)</option>
                    <option value="propietario">Propietario (Acceso total)</option>
                  </select>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowShareModal(null)}
                    className="flex-1 bg-slate-100 text-slate-700 font-bold text-xs py-2.5 rounded-xl hover:bg-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-sky-600 text-white font-bold text-xs py-2.5 rounded-xl hover:bg-sky-700 shadow-md"
                  >
                    Enviar Invitación
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL QR CODE INDIVIDUAL */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-center">
            <button
              onClick={() => setShowQRModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            {(() => {
              const target = miembros.find(item => item.id === showQRModal);
              if (!target) return null;

              return (
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Código QR de Emergencia</h3>
                  <p className="text-xs text-slate-500 mb-4">{target.nombre}</p>
                  
                  <div className="bg-slate-50 border-2 border-red-200 p-4 rounded-2xl inline-block mb-4">
                    <QRCodeSVG
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/emergencia/${target.qr_code_token}`}
                      size={180}
                      level="H"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/emergencia/${target.qr_code_token}`}
                      target="_blank"
                      className="flex-1 bg-red-600 text-white font-bold text-xs py-2.5 rounded-xl hover:bg-red-700"
                    >
                      Abrir Ficha Pública
                    </Link>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
