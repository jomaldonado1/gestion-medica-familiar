'use client';

import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  Users, 
  HeartPulse, 
  Lock,
  Search,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { createClient } from '@/lib/supabase/client';
import { PerfilUser, PlanNombre, EstadoSuscripcion } from '@/lib/types';

interface PerfilConStats extends PerfilUser {
  integrantes_usados: number;
}

export default function SuperAdminPage() {
  const { user } = useApp();
  const supabase = createClient();

  const [perfiles, setPerfiles] = useState<PerfilConStats[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [guardandoId, setGuardandoId] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Cargar lista completa de usuarios e integrantes desde Supabase PostgreSQL
  const cargarPerfilesAdmin = async () => {
    try {
      setCargando(true);
      
      const { data: dbProfiles, error: errProf } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: dbMiembros, error: errMemb } = await supabase
        .from('miembros')
        .select('id, creado_por');

      if (errProf) {
        console.error('Error cargando perfiles admin:', errProf);
        return;
      }

      // Calcular conteo de integrantes por usuario
      const conteoMapa = new Map<string, number>();
      if (dbMiembros) {
        dbMiembros.forEach(m => {
          conteoMapa.set(m.creado_por, (conteoMapa.get(m.creado_por) || 0) + 1);
        });
      }

      const adaptados: PerfilConStats[] = (dbProfiles || []).map(p => ({
        id: p.id,
        email: p.email || '',
        nombre_completo: p.nombre_completo || 'Sin nombre',
        telefono: p.telefono || null,
        rol: p.rol || 'cliente',
        plan_nombre: p.plan_nombre || 'prueba',
        max_integrantes: p.max_integrantes ?? 1,
        fecha_alta: p.fecha_alta || p.created_at,
        plan_expira: p.plan_expira || new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString(),
        estado_suscripcion: p.estado_suscripcion || 'activo',
        created_at: p.created_at,
        integrantes_usados: conteoMapa.get(p.id) || 0
      }));

      setPerfiles(adaptados);
    } catch (e) {
      console.error('Error en cargarPerfilesAdmin:', e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (user?.rol === 'superadmin' || user?.rol === 'admin') {
      cargarPerfilesAdmin();
    }
  }, [user]);

  // Si no tiene permisos de SuperAdmin / Admin, mostrar bloqueo
  if (user?.rol !== 'superadmin' && user?.rol !== 'admin') {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center max-w-md mx-auto my-12 shadow-sm">
        <Lock className="w-12 h-12 text-amber-500 mx-auto mb-3 animate-bounce" />
        <h1 className="text-xl font-bold text-slate-800">Acceso Restringido</h1>
        <p className="text-xs text-slate-500 mt-2">
          El panel de Super Administrador solo está disponible para usuarios autorizados del sistema.
        </p>
      </div>
    );
  }

  // 1-Click Actualizar Plan (cambia plan_nombre y max_integrantes)
  const handleCambiarPlan = async (perfilId: string, nuevoPlan: PlanNombre) => {
    try {
      setGuardandoId(perfilId);

      let nuevoMaxCupo = 1;
      if (nuevoPlan === 'singular') nuevoMaxCupo = 1;
      if (nuevoPlan === 'familia') nuevoMaxCupo = 4;
      if (nuevoPlan === 'tribu') nuevoMaxCupo = 999;

      const { error } = await supabase
        .from('profiles')
        .update({
          plan_nombre: nuevoPlan,
          max_integrantes: nuevoMaxCupo,
          estado_suscripcion: 'activo',
          updated_at: new Date().toISOString()
        })
        .eq('id', perfilId);

      if (error) {
        alert(`Error al actualizar plan: ${error.message}`);
      } else {
        setMensajeExito(`Plan actualizado a "${nuevoPlan.toUpperCase()}" correctamente.`);
        setTimeout(() => setMensajeExito(null), 3000);
        await cargarPerfilesAdmin();
      }
    } catch (e: any) {
      alert(`Error al cambiar plan: ${e?.message || 'Error de conexión'}`);
    } finally {
      setGuardandoId(null);
    }
  };

  // 1-Click Extender 1 Año (agrega 365 días a plan_expira)
  const handleExtenderUnAno = async (perfilId: string, fechaExpiraActual: string) => {
    try {
      setGuardandoId(perfilId);

      const baseFecha = new Date(fechaExpiraActual).getTime() > Date.now() 
        ? new Date(fechaExpiraActual) 
        : new Date();
      
      const nuevaExpira = new Date(baseFecha.getTime() + 365 * 24 * 3600 * 1000).toISOString();

      const { error } = await supabase
        .from('profiles')
        .update({
          plan_expira: nuevaExpira,
          estado_suscripcion: 'activo',
          updated_at: new Date().toISOString()
        })
        .eq('id', perfilId);

      if (error) {
        alert(`Error al extender fecha: ${error.message}`);
      } else {
        setMensajeExito(`Se extendió 1 año de suscripción hasta el ${new Date(nuevaExpira).toLocaleDateString()}.`);
        setTimeout(() => setMensajeExito(null), 3000);
        await cargarPerfilesAdmin();
      }
    } catch (e: any) {
      alert(`Error al extender suscripción: ${e?.message || 'Error de conexión'}`);
    } finally {
      setGuardandoId(null);
    }
  };

  // 1-Click Cambiar Estado de Suscripción
  const handleCambiarEstado = async (perfilId: string, nuevoEstado: EstadoSuscripcion) => {
    try {
      setGuardandoId(perfilId);

      const { error } = await supabase
        .from('profiles')
        .update({
          estado_suscripcion: nuevoEstado,
          updated_at: new Date().toISOString()
        })
        .eq('id', perfilId);

      if (error) {
        alert(`Error al cambiar estado: ${error.message}`);
      } else {
        setMensajeExito(`Estado cambiado a "${nuevoEstado.toUpperCase()}".`);
        setTimeout(() => setMensajeExito(null), 3000);
        await cargarPerfilesAdmin();
      }
    } catch (e: any) {
      alert(`Error al cambiar estado: ${e?.message || 'Error de conexión'}`);
    } finally {
      setGuardandoId(null);
    }
  };

  // Métricas Rápidas
  const totalUsuarios = perfiles.length;
  const suscripcionesActivas = perfiles.filter(p => p.estado_suscripcion === 'activo').length;
  const cuentasEnPrueba = perfiles.filter(p => p.plan_nombre === 'prueba').length;
  const cuentasVencidas = perfiles.filter(p => 
    p.estado_suscripcion === 'vencido' || new Date(p.plan_expira).getTime() < Date.now()
  ).length;

  // Filtrar perfiles por búsqueda de email o nombre
  const perfilesFiltrados = perfiles.filter(p => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return true;
    return (
      (p.email && p.email.toLowerCase().includes(q)) ||
      (p.nombre_completo && p.nombre_completo.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      
      {/* CABECERA SUPERADMIN */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 p-6 rounded-3xl text-white shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
            <span className="text-[11px] font-extrabold uppercase tracking-wider bg-amber-400 text-slate-950 px-3 py-0.5 rounded-full">
              Panel Superadministrador
            </span>
          </div>
          <h1 className="text-2xl font-black">Control de Suscripciones y Cuentas</h1>
          <p className="text-xs text-sky-200/80 mt-1">
            Gestión completa de planes, prórrogas de vencimiento y asignación de cupos familiares.
          </p>
        </div>

        <button
          onClick={cargarPerfilesAdmin}
          disabled={cargando}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition-all active:scale-95 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 text-sky-400 ${cargando ? 'animate-spin' : ''}`} />
          <span>Actualizar Datos</span>
        </button>
      </div>

      {/* ALERTAS DE ÉXITO */}
      {mensajeExito && (
        <div className="bg-emerald-500 text-white font-bold text-xs p-4 rounded-2xl shadow-md flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {/* MÉTRICAS RÁPIDAS (4 TARJETAS) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Usuarios</p>
            <p className="text-2xl font-black text-slate-900">{totalUsuarios}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Suscripciones Activas</p>
            <p className="text-2xl font-black text-emerald-700">{suscripcionesActivas}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">En Prueba Gratis</p>
            <p className="text-2xl font-black text-amber-700">{cuentasEnPrueba}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cuentas Vencidas</p>
            <p className="text-2xl font-black text-red-600">{cuentasVencidas}</p>
          </div>
        </div>
      </div>

      {/* TABLA DE CLIENTES Y CONTROL DE PLANES */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Listado de Clientes y Suscripciones</h2>
            <p className="text-xs text-slate-500">Modifica el plan o prorroga el vencimiento directamente en 1 clic.</p>
          </div>

          {/* BUSCADOR */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por email o nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50"
            />
          </div>
        </div>

        {cargando ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center">
            <RefreshCw className="w-8 h-8 animate-spin text-sky-600 mb-2" />
            <p className="text-xs font-semibold">Cargando base de datos de usuarios...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3">Usuario / Email</th>
                  <th className="p-3">Plan Actual</th>
                  <th className="p-3">Integrantes Usados</th>
                  <th className="p-3">Vencimiento</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {perfilesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400 italic">
                      No se encontraron usuarios coincidentes.
                    </td>
                  </tr>
                ) : (
                  perfilesFiltrados.map((p) => {
                    const estaVencido = new Date(p.plan_expira).getTime() < Date.now();
                    const maxCupoTexto = p.max_integrantes >= 999 ? '∞' : p.max_integrantes;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        
                        {/* USUARIO Y EMAIL */}
                        <td className="p-3">
                          <p className="font-extrabold text-slate-900">{p.nombre_completo || 'Usuario'}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{p.email}</p>
                          {p.rol === 'superadmin' || p.rol === 'admin' ? (
                            <span className="inline-block mt-1 text-[9px] font-black uppercase px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full">
                              {p.rol}
                            </span>
                          ) : null}
                        </td>

                        {/* SELECTOR RÁPIDO DE PLAN */}
                        <td className="p-3">
                          <select
                            value={p.plan_nombre}
                            disabled={guardandoId === p.id}
                            onChange={(e) => handleCambiarPlan(p.id, e.target.value as PlanNombre)}
                            className="bg-slate-100 hover:bg-slate-200 border border-slate-300 font-bold text-slate-800 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                          >
                            <option value="prueba">PRUEBA (1 Cupo)</option>
                            <option value="singular">SINGULAR (1 Cupo)</option>
                            <option value="familia">FAMILIA (4 Cupos)</option>
                            <option value="tribu">TRIBU (Ilimitado)</option>
                          </select>
                        </td>

                        {/* INTEGRANTES USADOS vs PERMITIDOS */}
                        <td className="p-3">
                          <span className={`font-extrabold px-2.5 py-1 rounded-xl text-xs ${
                            p.integrantes_usados >= p.max_integrantes && p.max_integrantes < 999
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-slate-100 text-slate-800 border border-slate-200'
                          }`}>
                            {p.integrantes_usados} / {maxCupoTexto}
                          </span>
                        </td>

                        {/* VENCIMIENTO */}
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className={`font-semibold ${estaVencido ? 'text-red-600 font-extrabold' : 'text-slate-800'}`}>
                              {new Date(p.plan_expira).toLocaleDateString()}
                            </span>
                          </div>
                          {estaVencido && (
                            <span className="text-[9px] font-bold uppercase text-red-600 block mt-0.5">Vencido</span>
                          )}
                        </td>

                        {/* SELECTOR DE ESTADO */}
                        <td className="p-3">
                          <select
                            value={p.estado_suscripcion}
                            disabled={guardandoId === p.id}
                            onChange={(e) => handleCambiarEstado(p.id, e.target.value as EstadoSuscripcion)}
                            className={`font-extrabold rounded-xl px-2.5 py-1 text-[11px] focus:outline-none cursor-pointer border ${
                              p.estado_suscripcion === 'activo'
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : p.estado_suscripcion === 'vencido'
                                ? 'bg-red-100 text-red-900 border-red-300'
                                : 'bg-slate-200 text-slate-800 border-slate-300'
                            }`}
                          >
                            <option value="activo">ACTIVO</option>
                            <option value="vencido">VENCIDO</option>
                            <option value="pausado">PAUSADO</option>
                          </select>
                        </td>

                        {/* BOTÓN ACCIÓN EXTENDER 1 AÑO */}
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleExtenderUnAno(p.id, p.plan_expira)}
                            disabled={guardandoId === p.id}
                            className="inline-flex items-center gap-1 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-sm active:scale-95 transition-all"
                            title="Extender 365 días la fecha de vencimiento"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                            <span>+1 Año</span>
                          </button>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
