'use client';

import React, { useEffect, useState } from 'react';
import { 
  AlertTriangle, 
  PhoneCall, 
  Pill, 
  HeartPulse, 
  Printer, 
  Share2, 
  CheckCircle,
  ShieldAlert,
  UserCheck
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Miembro, Medicamento } from '@/lib/types';

export default function FichaEmergenciaPublicaPage({ params }: { params: Promise<{ token: string }> | { token: string } }) {
  const { obtenerFichaEmergenciaPorToken } = useApp();
  const [datos, setDatos] = useState<{ miembro: Miembro | null; medicamentosActivos: Medicamento[] }>({
    miembro: null,
    medicamentosActivos: []
  });
  const [cargando, setCargando] = useState(true);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    async function cargarFicha() {
      try {
        const resolvedParams = await Promise.resolve(params);
        const token = resolvedParams?.token;

        if (token) {
          const res = await obtenerFichaEmergenciaPorToken(token);
          setDatos(res);
        }
      } catch (e) {
        console.error('Error cargando ficha SOS:', e);
      } finally {
        setCargando(false);
      }
    }

    cargarFicha();
  }, [params, obtenerFichaEmergenciaPorToken]);

  const { miembro, medicamentosActivos } = datos;

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <HeartPulse className="w-16 h-16 text-red-500 mb-4 animate-spin" />
        <h1 className="text-xl font-bold text-slate-200">Cargando Ficha SOS de Emergencia...</h1>
      </div>
    );
  }

  if (!miembro) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4 animate-bounce" />
        <h1 className="text-2xl font-bold text-red-400">Ficha de Emergencia No Encontrada</h1>
        <p className="text-sm text-slate-400 max-w-sm mt-2">
          El código QR o enlace proporcionado no coincide con ningún registro activo o ha expirado.
        </p>
      </div>
    );
  }

  const handleCopiarResumen = () => {
    const texto = `FICHA SOS DE EMERGENCIA:\nPaciente: ${miembro.nombre}\nGrupo Sanguíneo: ${miembro.grupo_sanguineo || 'N/A'}\nAlergias: ${miembro.alergias || 'Ninguna'}\nContacto Urgencia: ${miembro.contacto_emergencia_nombre} (${miembro.contacto_emergencia_telefono})`;
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* BANNER SUPERIOR CRÍTICO SOS */}
        <div className="bg-red-600 text-white rounded-3xl p-6 shadow-2xl relative overflow-hidden border-2 border-red-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white text-red-600 rounded-2xl font-black shadow-lg animate-pulse-subtle">
                <HeartPulse className="w-8 h-8 stroke-[3]" />
              </div>
              <div>
                <span className="bg-red-950/60 text-red-200 font-extrabold text-[11px] uppercase tracking-widest px-3 py-1 rounded-full border border-red-400/30">
                  Acceso Público Sanitario
                </span>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-0.5">FICHA SOS EMERGENCIA</h1>
              </div>
            </div>
          </div>

          <div className="bg-red-950/50 p-4 rounded-2xl border border-red-400/40 space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-white">{miembro.nombre}</h2>
            <p className="text-xs sm:text-sm font-bold text-red-100">
              {miembro.dni && `DNI: ${miembro.dni} • `}
              Tipo: {miembro.tipo} 
              {miembro.fecha_nacimiento && ` • Fecha Nac: ${miembro.fecha_nacimiento}`}
              {miembro.especie_raza && ` • Especie/Raza: ${miembro.especie_raza}`}
            </p>
            {(miembro.obra_social || miembro.nro_afiliado) && (
              <p className="text-xs font-bold text-teal-200 bg-red-900/60 p-2 rounded-xl border border-red-400/30 mt-2">
                🏥 Cobertura: {miembro.obra_social || 'Obra Social'} {miembro.plan_obra_social ? `(${miembro.plan_obra_social})` : ''}
                {miembro.nro_afiliado && ` • N° Afiliado: ${miembro.nro_afiliado}`}
              </p>
            )}
          </div>
        </div>

        {/* BOTONERA DE LLAMADA ULTRA RÁPIDA 1-CLIC */}
        {miembro.contacto_emergencia_telefono && (
          <div className="bg-slate-900 border-2 border-red-500/80 rounded-3xl p-5 shadow-xl text-center space-y-3">
            <p className="text-xs font-bold text-red-400 uppercase tracking-widest">Contacto Directo de Urgencia</p>
            <a
              href={`tel:${miembro.contacto_emergencia_telefono}`}
              className="w-full flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold text-lg py-4 rounded-2xl shadow-xl transition-all border border-red-400"
            >
              <PhoneCall className="w-6 h-6 stroke-[3] animate-bounce" />
              Llamar a {miembro.contacto_emergencia_nombre || 'Contacto'} ({miembro.contacto_emergencia_telefono})
            </a>
          </div>
        )}

        {/* GRUPO SANGUÍNEO Y ALERGIAS DE ALTO CONTRASTE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Grupo Sanguíneo */}
          <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 flex items-center gap-4">
            <div className="p-4 bg-red-950 text-red-400 font-black text-2xl rounded-2xl border border-red-900 shrink-0">
              {miembro.grupo_sanguineo || 'N/A'}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Grupo Sanguíneo</p>
              <p className="text-sm font-extrabold text-white">
                {miembro.grupo_sanguineo ? `Factor ${miembro.grupo_sanguineo}` : 'No especificado'}
              </p>
            </div>
          </div>

          {/* Alergias Críticas */}
          <div className="bg-slate-900 p-5 rounded-3xl border border-red-900/60 bg-gradient-to-br from-slate-900 to-red-950/40">
            <p className="text-xs font-bold text-red-400 uppercase flex items-center gap-1.5 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-500" /> Alergias Médicas Críticas
            </p>
            <p className="text-sm font-extrabold text-white leading-tight">
              {miembro.alergias || 'Sin alergias conocidas registradas.'}
            </p>
          </div>
        </div>

        {/* MEDICAMENTOS EN CURSO */}
        <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Pill className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold text-white">Tratamientos y Fármacos Activos</h2>
          </div>

          {medicamentosActivos.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No consume medicamentos de forma permanente.</p>
          ) : (
            <div className="space-y-3">
              {medicamentosActivos.map((med) => (
                <div key={med.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-extrabold text-white">{med.nombre}</h3>
                    <p className="text-xs text-slate-400">{med.dosis} • {med.frecuencia}</p>
                    {med.droga_componente && (
                      <p className="text-[11px] text-sky-400 font-semibold mt-0.5">Fórmula: {med.droga_componente}</p>
                    )}
                  </div>
                  <span className="text-[10px] font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800 px-2.5 py-1 rounded-full">
                    Activo
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* OBSERVACIONES SANITARIAS */}
        {miembro.observaciones && (
          <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-2">
            <h2 className="text-xs font-bold text-slate-400 uppercase">Observaciones y Condiciones Especiales</h2>
            <p className="text-xs text-slate-200 leading-relaxed bg-slate-950 p-3 rounded-2xl border border-slate-800">
              {miembro.observaciones}
            </p>
          </div>
        )}

        {/* HERRAMIENTAS DE COPIA E IMPRESIÓN */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleCopiarResumen}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-3 rounded-2xl transition-all"
          >
            {copiado ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-slate-400" />}
            <span>{copiado ? 'Ficha Copiada' : 'Copiar Resumen'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-5 py-3 rounded-2xl transition-all"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span>Imprimir Ficha</span>
          </button>
        </div>

      </div>
    </div>
  );
}
