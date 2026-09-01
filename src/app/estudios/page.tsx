'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  UploadCloud, 
  FileCheck, 
  Download, 
  Eye, 
  Trash2, 
  X, 
  Calendar,
  Image as ImageIcon,
  FileCode,
  ExternalLink
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function EstudiosPage() {
  const { miembroActivo, estudios, agregarEstudio, eliminarEstudio } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [estudioPreview, setEstudioPreview] = useState<{ url: string; nombre?: string; tipo?: string } | null>(null);
  const [imgError, setImgError] = useState(false);

  // Formulario
  const [titulo, setTitulo] = useState('');
  const [tipoEstudio, setTipoEstudio] = useState('Análisis de Sangre');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [observaciones, setObservaciones] = useState('');
  const [archivoDemoNombre, setArchivoDemoNombre] = useState<string | null>(null);
  const [archivoDataUrl, setArchivoDataUrl] = useState<string | null>(null);

  if (!miembroActivo) return null;

  const misEstudios = estudios.filter(e => e.miembro_id === miembroActivo.id);

  const handleCargarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setArchivoDemoNombre(file.name);

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setArchivoDataUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCrearEstudio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    // URL fallback de demostración si no se seleccionó un archivo local
    const finalUrl = archivoDataUrl || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=60';

    await agregarEstudio({
      miembro_id: miembroActivo.id,
      titulo,
      tipo_estudio: tipoEstudio,
      fecha,
      archivo_nombre: archivoDemoNombre || `${titulo.toLowerCase().replace(/\s+/g, '_')}.pdf`,
      archivo_url: finalUrl,
      observaciones: observaciones || null
    });

    setTitulo('');
    setObservaciones('');
    setArchivoDemoNombre(null);
    setArchivoDataUrl(null);
    setShowAddModal(false);
  };

  const abrirPreview = (url: string | null | undefined, nombre?: string, tipo?: string) => {
    if (!url) return;
    setImgError(false);
    setEstudioPreview({ url, nombre, tipo });
  };

  const isPdf = (url: string, nombre?: string) => {
    if (url.startsWith('data:application/pdf')) return true;
    if (nombre && nombre.toLowerCase().endsWith('.pdf')) return true;
    if (url.toLowerCase().includes('.pdf')) return true;
    return false;
  };

  return (
    <div className="space-y-6">
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-teal-600" /> Estudios y Análisis Médicos
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Archivos PDF e imágenes digitales de laboratorios, placas y ecografías de <strong>{miembroActivo.nombre}</strong>.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-md transition-all shrink-0 active:scale-95"
        >
          <UploadCloud className="w-4 h-4" /> Cargar Nuevo Estudio
        </button>
      </div>

      {/* LISTADO DE ESTUDIOS */}
      {misEstudios.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-800">No hay estudios médicos registrados</h2>
          <p className="text-xs text-slate-500 mb-4">Sube análisis de laboratorio, radiografías o recetas escaneadas.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 bg-teal-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl"
          >
            <UploadCloud className="w-4 h-4" /> Subir Primer Estudio
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {misEstudios.map((est) => (
            <div
              key={est.id}
              className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[11px] font-extrabold uppercase px-3 py-1 bg-teal-50 text-teal-800 rounded-full">
                    {est.tipo_estudio}
                  </span>
                  <button
                    onClick={() => eliminarEstudio(est.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                    title="Eliminar estudio"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h2 className="text-base font-bold text-slate-900 leading-tight">{est.titulo}</h2>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Fecha del estudio: {est.fecha}
                </p>

                {est.archivo_nombre && (
                  <p className="text-[11px] text-teal-700 font-semibold flex items-center gap-1 mt-2 bg-teal-50/60 px-2.5 py-1 rounded-lg w-fit">
                    <FileCheck className="w-3.5 h-3.5" /> {est.archivo_nombre}
                  </p>
                )}

                {est.observaciones && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-3">
                    {est.observaciones}
                  </p>
                )}
              </div>

              {/* Botón Ver y Descargar */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                <button
                  onClick={() => abrirPreview(est.archivo_url, est.archivo_nombre || est.titulo, est.tipo_estudio)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs py-2 rounded-xl border border-teal-200 transition-all active:scale-95"
                >
                  <Eye className="w-3.5 h-3.5 text-teal-600" /> Visualizar
                </button>
                {est.archivo_url && (
                  <a
                    href={est.archivo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={est.archivo_nombre || 'estudio.pdf'}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
                    title="Descargar archivo"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL NUEVO ESTUDIO */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-900 mb-1">Subir Estudio Médico</h2>
            <p className="text-xs text-slate-500 mb-4">Para: <strong>{miembroActivo.nombre}</strong></p>

            <form onSubmit={handleCrearEstudio} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Título del Estudio *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Análisis de Sangre Completo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Estudio</label>
                  <select
                    value={tipoEstudio}
                    onChange={(e) => setTipoEstudio(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800"
                  >
                    <option value="Análisis de Sangre">Análisis de Sangre</option>
                    <option value="Radiografía / Rayos X">Radiografía / Rayos X</option>
                    <option value="Ecografía">Ecografía</option>
                    <option value="Resonancia / Tomografía">Resonancia / Tomografía</option>
                    <option value="Informe Clínico">Informe Clínico</option>
                    <option value="Receta o Certificado">Receta o Certificado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fecha del Estudio</label>
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>

              {/* Upload Dropzone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Adjuntar PDF o Imagen</label>
                <div className="border-2 border-dashed border-teal-200 bg-teal-50/50 p-4 rounded-2xl text-center relative cursor-pointer hover:bg-teal-50 transition-colors">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleCargarArchivo}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <UploadCloud className="w-8 h-8 text-teal-600 mx-auto mb-1" />
                  <p className="text-xs font-bold text-teal-900">
                    {archivoDemoNombre ? `📄 ${archivoDemoNombre}` : 'Haz clic o arrastra tu archivo aquí'}
                  </p>
                  <p className="text-[10px] text-teal-700">Soporta PDF, PNG, JPG hasta 20MB</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Observaciones o Resultados principales</label>
                <textarea
                  rows={2}
                  placeholder="Ej: Glucemia 95 mg/dL. Valores de colesterol en rango normal."
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
                  className="flex-1 bg-teal-600 text-white font-bold text-xs py-2.5 rounded-xl hover:bg-teal-700 shadow-md"
                >
                  Guardar Estudio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PREVIEW DE DOCUMENTO E IMÁGENES */}
      {estudioPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
            <button
              onClick={() => setEstudioPreview(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full bg-slate-100 z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" /> 
              <span>Vista Previa: {estudioPreview.nombre || 'Estudio Médico'}</span>
            </h3>

            <div className="bg-slate-900 rounded-2xl overflow-hidden flex-1 min-h-[40vh] max-h-[60vh] flex flex-col items-center justify-center p-2 relative">
              {isPdf(estudioPreview.url, estudioPreview.nombre) ? (
                <iframe
                  src={estudioPreview.url}
                  title="Documento PDF"
                  className="w-full h-[55vh] rounded-xl bg-white border-0"
                />
              ) : imgError ? (
                <div className="text-center p-8 text-white max-w-md">
                  <FileText className="w-16 h-16 text-teal-400 mx-auto mb-3" />
                  <p className="font-bold text-base mb-1">{estudioPreview.nombre || 'Estudio Médico'}</p>
                  <p className="text-xs text-slate-300 mb-5">
                    Este documento o estudio está listo para ver directamente en tu navegador o descargar.
                  </p>
                  <a
                    href={estudioPreview.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg transition-all"
                  >
                    <ExternalLink className="w-4 h-4" /> Abrir Documento Completo
                  </a>
                </div>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={estudioPreview.url}
                  alt="Vista previa de estudio"
                  onError={() => setImgError(true)}
                  className="max-h-[55vh] object-contain w-full rounded-xl"
                />
              )}
            </div>

            <div className="mt-4 flex flex-wrap justify-between items-center gap-2">
              <a
                href={estudioPreview.url}
                target="_blank"
                rel="noopener noreferrer"
                download={estudioPreview.nombre || 'estudio.pdf'}
                className="flex items-center gap-2 text-teal-700 hover:text-teal-800 font-bold text-xs bg-teal-50 px-4 py-2.5 rounded-xl border border-teal-200 transition-all"
              >
                <Download className="w-4 h-4" /> Descargar Archivo Original
              </a>
              <button
                onClick={() => setEstudioPreview(null)}
                className="bg-slate-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl"
              >
                Cerrar Vista Previa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
