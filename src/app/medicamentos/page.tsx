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
  Printer,
  Share2,
  FileText,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function MedicamentosPage() {
  const { miembroActivo, medicamentos, agregarMedicamento, toggleMedicamentoActivo, eliminarMedicamento } = useApp();
  const [filtro, setFiltro] = useState<'activos' | 'todos' | 'inactivos'>('activos');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

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

  const handleCrearMedicamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    await agregarMedicamento({
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

  const handleImprimir = () => {
    window.print();
  };

  const generarWhatsAppUrl = () => {
    const activos = misMedicamentos.filter(m => m.activo);
    const fechaHora = new Date().toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    let text = `💊 *ESQUEMA DE MEDICACIÓN Y DOSIS*\n`;
    text += `👤 *Paciente:* ${miembroActivo.nombre} (${miembroActivo.tipo})\n`;
    if (miembroActivo.dni) text += `🪪 *DNI:* ${miembroActivo.dni}\n`;
    if (miembroActivo.obra_social) text += `🏥 *Cobertura:* ${miembroActivo.obra_social}${miembroActivo.plan_obra_social ? ` (${miembroActivo.plan_obra_social})` : ''}\n`;
    if (miembroActivo.grupo_sanguineo) text += `🩸 *Grupo Sanguíneo:* ${miembroActivo.grupo_sanguineo}\n`;
    if (miembroActivo.alergias) text += `⚠️ *ALERGIAS CRÍTICAS:* ${miembroActivo.alergias.toUpperCase()}\n`;

    text += `\n📋 *MEDICAMENTOS ACTIVOS (${activos.length}):*\n`;

    if (activos.length === 0) {
      text += `_(No hay medicamentos activos actualmente)_\n`;
    } else {
      activos.forEach((med, idx) => {
        text += `\n*${idx + 1}. ${med.nombre}*\n`;
        if (med.droga_componente) text += `   • Droga: ${med.droga_componente}\n`;
        if (med.dosis) text += `   • Dosis: ${med.dosis}\n`;
        if (med.frecuencia) text += `   • Frecuencia: ${med.frecuencia}\n`;
        if (med.horario) text += `   • Horario: ⏰ ${med.horario}\n`;
        if (med.observaciones) text += `   • Notas: ${med.observaciones}\n`;
      });
    }

    text += `\n📅 *Generado el:* ${fechaHora}\n`;
    text += `📱 *Gestionado con MedFamiliar PWA*`;

    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="space-y-6">
      {/* CABECERA CON ACCIONES EXPORTAR / IMPRIMIR Y COMPARTIR */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Pill className="w-7 h-7 text-sky-600" /> Medicamentos y Tratamientos
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Fármacos prescritos, horarios de tomas y estado activo/inactivo para <strong>{miembroActivo.nombre}</strong>.
          </p>
        </div>

        {/* BOTONES DE ACCIÓN EXPORTAR & COMPARTIR */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-4 py-3 rounded-2xl transition-all active:scale-95 border border-slate-200"
            title="Generar vista imprimible o guardar en PDF"
          >
            <Printer className="w-4 h-4 text-slate-700" />
            <span>📄 Exportar Reporte / Imprimir PDF</span>
          </button>

          <a
            href={generarWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-md transition-all active:scale-95"
            title="Compartir esquema de medicación activa por WhatsApp"
          >
            <MessageSquare className="w-4 h-4" />
            <span>📲 Compartir Grilla por WhatsApp</span>
          </a>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Agregar Medicamento
          </button>
        </div>
      </div>

      {/* FILTROS TABS */}
      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit print:hidden">
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
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm print:hidden">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 print:hidden">
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

      {/* MODAL / VISTA PREVIA IMPRIMIBLE DE REPORTE */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 print:p-0 print:bg-white print:static">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col print:shadow-none print:max-w-none print:p-0 print:h-auto">
            
            {/* Cabecera del modal */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 mb-4 print:hidden">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-600" /> Vista Previa del Reporte Médico
              </h2>
              <button
                onClick={() => setShowPrintModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* HOJA IMPRIMIBLE */}
            <div id="printable-report" className="overflow-y-auto pr-2 space-y-6 flex-1 text-slate-900 print:overflow-visible print:pr-0">
              
              {/* Encabezado Principal */}
              <div className="border-b-2 border-sky-800 pb-4 flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-black text-sky-900 tracking-tight uppercase">
                    Reporte de Tratamiento y Medicación
                  </h1>
                  <p className="text-xs text-slate-500 font-semibold">MedFamiliar PWA - Gestión Médica y Salud Familiar</p>
                </div>
                <div className="text-right text-[11px] text-slate-500">
                  <p className="font-bold text-slate-800">Fecha de Emisión:</p>
                  <p className="font-semibold text-slate-700">{new Date().toLocaleString('es-AR')}</p>
                </div>
              </div>

              {/* Ficha del Integrante / Paciente */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DATOS DEL PACIENTE</p>
                  <p className="text-base font-extrabold text-slate-900 mt-0.5">{miembroActivo.nombre}</p>
                  <p className="text-slate-600 font-medium">
                    Rol: {miembroActivo.tipo} {miembroActivo.fecha_nacimiento ? `| Nac: ${miembroActivo.fecha_nacimiento}` : ''}
                  </p>
                </div>

                <div className="space-y-1">
                  {miembroActivo.dni && (
                    <p><span className="font-bold text-slate-700">DNI:</span> {miembroActivo.dni}</p>
                  )}
                  {miembroActivo.obra_social && (
                    <p><span className="font-bold text-slate-700">Obra Social / Plan:</span> {miembroActivo.obra_social} {miembroActivo.plan_obra_social ? `(${miembroActivo.plan_obra_social})` : ''}</p>
                  )}
                  {miembroActivo.nro_afiliado && (
                    <p><span className="font-bold text-slate-700">N° Afiliado:</span> {miembroActivo.nro_afiliado}</p>
                  )}
                  {miembroActivo.grupo_sanguineo && (
                    <p><span className="font-bold text-slate-700">Grupo Sanguíneo:</span> {miembroActivo.grupo_sanguineo}</p>
                  )}
                </div>

                {/* ALERGIAS CRÍTICAS DESTACADAS EN ROJO */}
                {miembroActivo.alergias ? (
                  <div className="sm:col-span-2 bg-red-50 border-2 border-red-300 rounded-xl p-3 text-red-900 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                    <div>
                      <p className="font-extrabold text-xs uppercase tracking-wide text-red-700">ALERGIAS CRÍTICAS DESTACADAS:</p>
                      <p className="font-bold text-sm text-red-900">{miembroActivo.alergias.toUpperCase()}</p>
                    </div>
                  </div>
                ) : (
                  <div className="sm:col-span-2 bg-emerald-50 border border-emerald-200 rounded-xl p-2 text-emerald-800 text-xs font-semibold">
                    ✓ Sin alergias críticas declaradas.
                  </div>
                )}
              </div>

              {/* TABLA MEDICAMENTOS ACTIVOS */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase border-b-2 border-slate-300 pb-1 mb-3 flex items-center justify-between">
                  <span>📋 Medicamentos Activos en Tratamiento ({misMedicamentos.filter(m => m.activo).length})</span>
                </h3>

                {misMedicamentos.filter(m => m.activo).length === 0 ? (
                  <p className="text-xs text-slate-500 italic bg-slate-50 p-4 rounded-xl border border-slate-200">
                    No hay medicamentos activos configurados actualmente.
                  </p>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-sky-50 text-sky-900 border-b border-slate-200 font-extrabold uppercase text-[10px]">
                          <th className="p-3">Medicamento / Droga</th>
                          <th className="p-3">Dosis</th>
                          <th className="p-3">Frecuencia</th>
                          <th className="p-3">Horarios Exactos</th>
                          <th className="p-3">Observaciones / Notas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {misMedicamentos.filter(m => m.activo).map((med, idx) => (
                          <tr key={med.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                            <td className="p-3 font-bold text-slate-900">
                              {med.nombre}
                              {med.droga_componente && (
                                <div className="text-[10px] text-slate-500 font-semibold">{med.droga_componente}</div>
                              )}
                            </td>
                            <td className="p-3 font-semibold text-slate-800">{med.dosis || 'N/A'}</td>
                            <td className="p-3 font-semibold text-slate-800">{med.frecuencia || 'N/A'}</td>
                            <td className="p-3 font-extrabold text-sky-900">{med.horario || 'N/A'}</td>
                            <td className="p-3 text-slate-600 italic">{med.observaciones || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* TABLA TRATAMIENTOS PAUSADOS / INACTIVOS */}
              {misMedicamentos.filter(m => !m.activo).length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-700 uppercase border-b border-slate-300 pb-1 mb-3">
                    ⏸️ Historial de Tratamientos Pausados / Inactivos ({misMedicamentos.filter(m => !m.activo).length})
                  </h3>
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl opacity-80">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold uppercase text-[10px]">
                          <th className="p-2.5">Medicamento</th>
                          <th className="p-2.5">Dosis</th>
                          <th className="p-2.5">Frecuencia</th>
                          <th className="p-2.5">Notas / Motivo Pausa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {misMedicamentos.filter(m => !m.activo).map((med, idx) => (
                          <tr key={med.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                            <td className="p-2.5 font-bold text-slate-800">{med.nombre}</td>
                            <td className="p-2.5 text-slate-700">{med.dosis || 'N/A'}</td>
                            <td className="p-2.5 text-slate-700">{med.frecuencia || 'N/A'}</td>
                            <td className="p-2.5 text-slate-500 italic">{med.observaciones || 'Tratamiento pausado'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Pie de Página del Reporte */}
              <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400">
                <p>MedFamiliar PWA • Reporte de Salud Familiar</p>
                <p>Página 1 de 1</p>
              </div>
            </div>

            {/* Acciones del Modal */}
            <div className="pt-4 border-t border-slate-200 flex justify-end gap-2 print:hidden">
              <button
                onClick={() => setShowPrintModal(false)}
                className="bg-slate-100 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-slate-200"
              >
                Cerrar
              </button>
              <button
                onClick={handleImprimir}
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2"
              >
                <Printer className="w-4 h-4" /> Imprimir / Guardar en PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
