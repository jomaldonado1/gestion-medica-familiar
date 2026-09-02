'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Miembro, 
  Medico, 
  Medicamento, 
  Consulta, 
  Estudio, 
  PerfilUser, 
  RolTutor 
} from '@/lib/types';
import { 
  INITIAL_USER, 
  INITIAL_MIEMBROS, 
  INITIAL_MEDICOS, 
  INITIAL_MEDICAMENTOS, 
  INITIAL_CONSULTAS, 
  INITIAL_ESTUDIOS 
} from '@/lib/mockData';
import { createClient } from '@/lib/supabase/client';

interface AppContextType {
  user: PerfilUser | null;
  loadingAuth: boolean;
  cerrarSesion: () => Promise<void>;
  
  miembros: Miembro[];
  miembroActivo: Miembro | null;
  setMiembroActivoId: (id: string) => void;
  agregarMiembro: (datos: Omit<Miembro, 'id' | 'creado_por' | 'qr_code_token' | 'created_at'>) => Promise<void>;
  editarMiembro: (id: string, datos: Partial<Miembro>) => Promise<void>;
  eliminarMiembro: (id: string) => Promise<void>;
  sincronizarConNube: () => Promise<void>;
  limpiarDuplicadosSupabase: () => Promise<void>;
  
  // Médicos
  medicos: Medico[];
  agregarMedico: (datos: Omit<Medico, 'id' | 'created_at'>) => Promise<void>;
  eliminarMedico: (id: string) => Promise<void>;
  
  // Medicamentos
  medicamentos: Medicamento[];
  agregarMedicamento: (datos: Omit<Medicamento, 'id' | 'created_at'>) => Promise<void>;
  toggleMedicamentoActivo: (id: string) => Promise<void>;
  eliminarMedicamento: (id: string) => Promise<void>;
  
  // Consultas
  consultas: Consulta[];
  agregarConsulta: (datos: Omit<Consulta, 'id' | 'created_at'>) => Promise<void>;
  cambiarEstadoConsulta: (id: string, estado: 'programada' | 'completada' | 'cancelada') => Promise<void>;
  eliminarConsulta: (id: string) => Promise<void>;
  
  // Estudios
  estudios: Estudio[];
  agregarEstudio: (datos: Omit<Estudio, 'id' | 'created_at'>) => Promise<void>;
  eliminarEstudio: (id: string) => Promise<void>;

  // Tutores
  compartirMiembro: (miembroId: string, emailTutor: string, rol: RolTutor) => Promise<boolean>;

  // Ficha pública de emergencia por token QR
  obtenerFichaEmergenciaPorToken: (token: string) => Promise<{
    miembro: Miembro | null;
    medicamentosActivos: Medicamento[];
  }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<PerfilUser | null>(INITIAL_USER);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [miembros, setMiembros] = useState<Miembro[]>(INITIAL_MIEMBROS);
  const [miembroActivoId, setMiembroActivoIdState] = useState<string>('');
  
  const [medicos, setMedicos] = useState<Medico[]>(INITIAL_MEDICOS);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>(INITIAL_MEDICAMENTOS);
  const [consultas, setConsultas] = useState<Consulta[]>(INITIAL_CONSULTAS);
  const [estudios, setEstudios] = useState<Estudio[]>(INITIAL_ESTUDIOS);

  // Guardar cache local de respaldo para soporte offline
  const guardarCacheCompleto = (usrId: string, data: {
    miembros?: Miembro[];
    medicos?: Medico[];
    medicamentos?: Medicamento[];
    consultas?: Consulta[];
    estudios?: Estudio[];
  }) => {
    try {
      if (typeof window !== 'undefined' && usrId) {
        if (data.miembros) localStorage.setItem(`med_cache_miembros_${usrId}`, JSON.stringify(data.miembros));
        if (data.medicos) localStorage.setItem(`med_cache_medicos_${usrId}`, JSON.stringify(data.medicos));
        if (data.medicamentos) localStorage.setItem(`med_cache_meds_${usrId}`, JSON.stringify(data.medicamentos));
        if (data.consultas) localStorage.setItem(`med_cache_consultas_${usrId}`, JSON.stringify(data.consultas));
        if (data.estudios) localStorage.setItem(`med_cache_estudios_${usrId}`, JSON.stringify(data.estudios));
      }
    } catch (e) {}
  };

  const cargarCacheModulo = <T,>(usrId: string, modulo: string): T[] => {
    try {
      if (typeof window !== 'undefined' && usrId) {
        const raw = localStorage.getItem(`med_cache_${modulo}_${usrId}`);
        if (raw) return JSON.parse(raw);
      }
    } catch (e) {}
    return [];
  };

  // Carga unificada de datos desde Supabase (Single Source of Truth)
  const cargarDatosSupabase = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        setUser(null);
        setMiembros([]);
        setMedicos([]);
        setMedicamentos([]);
        setConsultas([]);
        setEstudios([]);
        setLoadingAuth(false);
        return;
      }

      // 1. Perfil del Usuario
      const { data: perfilData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      const currentProfile: PerfilUser = perfilData ? (perfilData as PerfilUser) : {
        id: authUser.id,
        email: authUser.email || '',
        nombre_completo: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Usuario',
        telefono: null,
        rol: 'user',
        created_at: new Date().toISOString()
      };

      setUser(currentProfile);

      // 2. Cargar Miembros creados por el usuario u obtenidos mediante tutores
      const { data: dbMiembrosCreados } = await supabase
        .from('miembros')
        .select('*')
        .eq('creado_por', authUser.id);

      const { data: miembrosTutores } = await supabase
        .from('miembro_tutores')
        .select('miembro_id, rol, miembros(*)')
        .eq('user_id', authUser.id);

      const mapaMiembrosDb = new Map<string, Miembro>();

      if (dbMiembrosCreados) {
        dbMiembrosCreados.forEach((m: any) => {
          mapaMiembrosDb.set(m.id, { ...m, rol_actual: 'propietario' });
        });
      }

      if (miembrosTutores) {
        miembrosTutores.forEach((mt: any) => {
          if (mt.miembros) {
            mapaMiembrosDb.set(mt.miembros.id, {
              ...mt.miembros,
              rol_actual: mt.rol
            });
          }
        });
      }

      // Auto-limpieza de duplicados o erratas conocidas
      if (dbMiembrosCreados && dbMiembrosCreados.length > 0) {
        const dupesMariaEva = dbMiembrosCreados.filter(m => m.nombre.toLowerCase().trim().includes('maria eva carranza'));
        if (dupesMariaEva.length > 1) {
          const dupeABorrar = dupesMariaEva.find(m => m.tipo === 'Yo / Adulto');
          if (dupeABorrar) {
            await supabase.from('miembro_tutores').delete().eq('miembro_id', dupeABorrar.id);
            await supabase.from('miembros').delete().eq('id', dupeABorrar.id);
            mapaMiembrosDb.delete(dupeABorrar.id);
          }
        }

        const antonioErrata = dbMiembrosCreados.find(m => m.nombre.toLowerCase().trim().includes('maldoando'));
        if (antonioErrata) {
          await supabase.from('miembros').update({ nombre: 'ANTONIO MALDONADO' }).eq('id', antonioErrata.id);
          const mObj = mapaMiembrosDb.get(antonioErrata.id);
          if (mObj) mObj.nombre = 'ANTONIO MALDONADO';
        }
      }

      const listaMiembrosDb = Array.from(mapaMiembrosDb.values());
      let listaFinalMiembros: Miembro[] = [];

      if (listaMiembrosDb && listaMiembrosDb.length > 0) {
        const mapaUnicos = new Map<string, Miembro>();
        listaMiembrosDb.forEach(m => {
          const clave = m.nombre.toLowerCase().trim();
          if (!mapaUnicos.has(clave)) {
            mapaUnicos.set(clave, m);
          }
        });
        listaFinalMiembros = Array.from(mapaUnicos.values());
      } else {
        const cacheLocalMiembros = cargarCacheModulo<Miembro>(authUser.id, 'miembros');
        if (cacheLocalMiembros && cacheLocalMiembros.length > 0) {
          listaFinalMiembros = cacheLocalMiembros;
        }
      }

      setMiembros(listaFinalMiembros);
      guardarCacheCompleto(authUser.id, { miembros: listaFinalMiembros });

      if (listaFinalMiembros.length > 0) {
        setMiembroActivoIdState(prev => prev && listaFinalMiembros.some(m => m.id === prev) ? prev : listaFinalMiembros[0].id);
      }

      const idsMiembros = listaFinalMiembros.map(m => m.id);

      if (idsMiembros.length > 0) {
        // 3. Médicos
        const { data: dbMedicos } = await supabase
          .from('medicos')
          .select('*')
          .in('miembro_id', idsMiembros);
        const cacheMedicos = cargarCacheModulo<Medico>(authUser.id, 'medicos');
        const medicosFinales = dbMedicos ? (dbMedicos as Medico[]) : cacheMedicos;
        setMedicos(medicosFinales);
        guardarCacheCompleto(authUser.id, { medicos: medicosFinales });

        // 4. Medicamentos
        const { data: dbMeds } = await supabase
          .from('medicamentos')
          .select('*')
          .in('miembro_id', idsMiembros);
        const cacheMeds = cargarCacheModulo<Medicamento>(authUser.id, 'meds');
        const medsFinales = dbMeds ? (dbMeds as Medicamento[]) : cacheMeds;
        setMedicamentos(medsFinales);
        guardarCacheCompleto(authUser.id, { medicamentos: medsFinales });

        // 5. Consultas
        const { data: dbConsultas } = await supabase
          .from('consultas')
          .select('*')
          .in('miembro_id', idsMiembros);
        const cacheConsultas = cargarCacheModulo<Consulta>(authUser.id, 'consultas');
        const consultasFinales = dbConsultas ? (dbConsultas as Consulta[]) : cacheConsultas;
        setConsultas(consultasFinales);
        guardarCacheCompleto(authUser.id, { consultas: consultasFinales });

        // 6. Estudios
        const { data: dbEstudios } = await supabase
          .from('estudios')
          .select('*')
          .in('miembro_id', idsMiembros);
        const cacheEstudios = cargarCacheModulo<Estudio>(authUser.id, 'estudios');
        const estudiosFinales = dbEstudios ? (dbEstudios as Estudio[]) : cacheEstudios;
        setEstudios(estudiosFinales);
        guardarCacheCompleto(authUser.id, { estudios: estudiosFinales });
      }
    } catch (err) {
      console.error('Error cargando datos de Supabase:', err);
    } finally {
      setLoadingAuth(false);
    }
  }, [supabase]);

  // Supabase Realtime + Suscripción a Cambios en Vivo y Eventos de Enfoque/Reconexión
  useEffect(() => {
    cargarDatosSupabase();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      cargarDatosSupabase();
    });

    // Suscripción Realtime por Supabase Postgres Changes
    const channel = supabase
      .channel('pwa_realtime_db_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        () => {
          cargarDatosSupabase();
        }
      )
      .subscribe();

    // Eventos de Reconexión y Reenfoque de Ventana
    const handleFocus = () => cargarDatosSupabase();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        cargarDatosSupabase();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocus);
      window.addEventListener('online', handleFocus);
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('online', handleFocus);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [cargarDatosSupabase, supabase]);

  const miembroActivo = miembros.find(m => m.id === miembroActivoId) || miembros[0] || null;

  const setMiembroActivoId = (id: string) => {
    setMiembroActivoIdState(id);
  };

  // Cerrar Sesión (Logout)
  const cerrarSesion = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    }
    setUser(null);
    setMiembros([]);
    setMedicos([]);
    setMedicamentos([]);
    setConsultas([]);
    setEstudios([]);
    setMiembroActivoIdState('');
    router.push('/login');
    router.refresh();
  };

  // Limpiar duplicados de Supabase conservando qr_code_token constante
  const limpiarDuplicadosSupabase = async () => {
    if (!user?.id) return;
    await cargarDatosSupabase();
  };

  const sincronizarConNube = async () => {
    await cargarDatosSupabase();
  };

  // MUTACIÓN STRICT SUPABASE: Agregar Integrante
  const agregarMiembro = async (datos: Omit<Miembro, 'id' | 'creado_por' | 'qr_code_token' | 'created_at'>) => {
    if (!user?.id) {
      alert('Debes iniciar sesión para agregar integrantes.');
      return;
    }

    const payload: Record<string, any> = {
      tipo: datos.tipo,
      nombre: datos.nombre,
      telefono: datos.telefono || null,
      dni: datos.dni || null,
      obra_social: datos.obra_social || null,
      nro_afiliado: datos.nro_afiliado || null,
      plan_obra_social: datos.plan_obra_social || null,
      fecha_nacimiento: datos.fecha_nacimiento || null,
      grupo_sanguineo: datos.grupo_sanguineo || null,
      especie_raza: datos.especie_raza || null,
      alergias: datos.alergias || null,
      contacto_emergencia_nombre: datos.contacto_emergencia_nombre || null,
      contacto_emergencia_telefono: datos.contacto_emergencia_telefono || null,
      observaciones: datos.observaciones || null,
      creado_por: user.id
    };

    let { data, error } = await supabase.from('miembros').insert(payload).select().single();

    // Fallback si la base de datos no tiene aún las columnas nuevas ('dni', 'telefono', 'obra_social', etc.) o la caché del esquema no se ha refrescado
    if (error && (error.message.includes('schema cache') || error.message.includes('column'))) {
      console.warn('Reintentando inserción sin campos extendidos opcionales por falta de columna en BD Supabase:', error.message);
      const fallbackPayload = { ...payload };
      delete fallbackPayload.dni;
      delete fallbackPayload.telefono;
      delete fallbackPayload.obra_social;
      delete fallbackPayload.nro_afiliado;
      delete fallbackPayload.plan_obra_social;

      const res = await supabase.from('miembros').insert(fallbackPayload).select().single();
      data = res.data;
      error = res.error;
    }

    if (error) {
      console.error('Error insertando integrante en Supabase:', error);
      alert(`No se pudo crear el integrante en la nube: ${error.message}`);
      return;
    }

    if (data) {
      await supabase.from('miembro_tutores').insert({
        miembro_id: data.id,
        user_id: user.id,
        rol: 'propietario'
      });

      setMiembroActivoIdState(data.id);
      await cargarDatosSupabase();
    }
  };

  // MUTACIÓN STRICT SUPABASE: Editar Integrante
  const editarMiembro = async (id: string, datos: Partial<Miembro>) => {
    if (!user?.id) {
      alert('Debes iniciar sesión para guardar cambios.');
      return;
    }

    // Actualización inmediata en el estado local
    setMiembros(prev => prev.map(m => m.id === id ? { ...m, ...datos } : m));

    const payload: Record<string, any> = {};
    if (datos.nombre !== undefined) payload.nombre = datos.nombre;
    if (datos.tipo !== undefined) payload.tipo = datos.tipo;
    if (datos.telefono !== undefined) payload.telefono = datos.telefono;
    if (datos.dni !== undefined) payload.dni = datos.dni;
    if (datos.obra_social !== undefined) payload.obra_social = datos.obra_social;
    if (datos.nro_afiliado !== undefined) payload.nro_afiliado = datos.nro_afiliado;
    if (datos.plan_obra_social !== undefined) payload.plan_obra_social = datos.plan_obra_social;
    if (datos.fecha_nacimiento !== undefined) payload.fecha_nacimiento = datos.fecha_nacimiento;
    if (datos.grupo_sanguineo !== undefined) payload.grupo_sanguineo = datos.grupo_sanguineo;
    if (datos.especie_raza !== undefined) payload.especie_raza = datos.especie_raza;
    if (datos.alergias !== undefined) payload.alergias = datos.alergias;
    if (datos.contacto_emergencia_nombre !== undefined) payload.contacto_emergencia_nombre = datos.contacto_emergencia_nombre;
    if (datos.contacto_emergencia_telefono !== undefined) payload.contacto_emergencia_telefono = datos.contacto_emergencia_telefono;
    if (datos.observaciones !== undefined) payload.observaciones = datos.observaciones;

    let { error } = await supabase.from('miembros').update(payload).eq('id', id);

    if (error && (error.message.includes('schema cache') || error.message.includes('column'))) {
      console.warn('Reintentando actualización sin campos extendidos opcionales:', error.message);
      const fallbackPayload = { ...payload };
      delete fallbackPayload.dni;
      delete fallbackPayload.telefono;
      delete fallbackPayload.obra_social;
      delete fallbackPayload.nro_afiliado;
      delete fallbackPayload.plan_obra_social;

      if (Object.keys(fallbackPayload).length > 0) {
        const res = await supabase.from('miembros').update(fallbackPayload).eq('id', id);
        error = res.error;
      } else {
        error = null;
      }
    }

    if (error) {
      console.error('Error actualizando integrante en Supabase:', error);
      alert(`No se pudo actualizar en la nube: ${error.message}`);
      return;
    }

    await cargarDatosSupabase();
  };

  // MUTACIÓN STRICT SUPABASE: Eliminar Integrante
  const eliminarMiembro = async (id: string) => {
    if (!user?.id) {
      alert('Debes iniciar sesión para eliminar integrantes.');
      return;
    }

    // Actualización inmediata del estado local y del miembro activo si fue eliminado
    setMiembros(prev => {
      const filtrados = prev.filter(m => m.id !== id);
      if (miembroActivoId === id && filtrados.length > 0) {
        setMiembroActivoIdState(filtrados[0].id);
      }
      return filtrados;
    });

    await supabase.from('miembro_tutores').delete().eq('miembro_id', id);
    const { error } = await supabase.from('miembros').delete().eq('id', id);

    if (error) {
      console.error('Error eliminando integrante en Supabase:', error);
      alert(`No se pudo eliminar el integrante de la nube: ${error.message}`);
      await cargarDatosSupabase();
      return;
    }

    await cargarDatosSupabase();
  };

  // MUTACIÓN STRICT SUPABASE: Agregar Médico
  const agregarMedico = async (datos: Omit<Medico, 'id' | 'created_at'>) => {
    if (!user?.id) {
      alert('Debes iniciar sesión para agregar médicos.');
      return;
    }

    const { error } = await supabase.from('medicos').insert({
      miembro_id: datos.miembro_id,
      nombre: datos.nombre,
      especialidad: datos.especialidad || null,
      telefono: datos.telefono || null,
      centro_atencion: datos.centro_atencion || null,
      direccion: datos.direccion || null,
      observaciones: datos.observaciones || null
    });

    if (error) {
      console.error('Error insertando médico en Supabase:', error);
      alert(`No se pudo registrar el médico en la nube: ${error.message}`);
      return;
    }

    await cargarDatosSupabase();
  };

  // MUTACIÓN STRICT SUPABASE: Eliminar Médico
  const eliminarMedico = async (id: string) => {
    if (!user?.id) return;
    const { error } = await supabase.from('medicos').delete().eq('id', id);

    if (error) {
      console.error('Error eliminando médico:', error);
      alert(`Error al eliminar médico: ${error.message}`);
      return;
    }

    await cargarDatosSupabase();
  };

  // MUTACIÓN STRICT SUPABASE: Agregar Medicamento
  const agregarMedicamento = async (datos: Omit<Medicamento, 'id' | 'created_at'>) => {
    if (!user?.id) {
      alert('Debes iniciar sesión para registrar medicamentos.');
      return;
    }

    const { error } = await supabase.from('medicamentos').insert({
      miembro_id: datos.miembro_id,
      nombre: datos.nombre,
      droga_componente: datos.droga_componente || null,
      dosis: datos.dosis || null,
      frecuencia: datos.frecuencia || null,
      horario: datos.horario || null,
      activo: datos.activo ?? true,
      observaciones: datos.observaciones || null
    });

    if (error) {
      console.error('Error insertando medicamento en Supabase:', error);
      alert(`No se pudo agregar el medicamento a la nube: ${error.message}`);
      return;
    }

    await cargarDatosSupabase();
  };

  // MUTACIÓN STRICT SUPABASE: Toggle Medicamento Activo
  const toggleMedicamentoActivo = async (id: string) => {
    if (!user?.id) return;
    const medTarget = medicamentos.find(m => m.id === id);
    const nuevoEstado = medTarget ? !medTarget.activo : true;

    const { error } = await supabase.from('medicamentos').update({ activo: nuevoEstado }).eq('id', id);

    if (error) {
      console.error('Error actualizando medicamento en Supabase:', error);
      alert(`Error al cambiar estado del tratamiento: ${error.message}`);
      return;
    }

    await cargarDatosSupabase();
  };

  // MUTACIÓN STRICT SUPABASE: Eliminar Medicamento
  const eliminarMedicamento = async (id: string) => {
    if (!user?.id) return;
    const { error } = await supabase.from('medicamentos').delete().eq('id', id);

    if (error) {
      console.error('Error eliminando medicamento:', error);
      alert(`Error al eliminar medicamento: ${error.message}`);
      return;
    }

    await cargarDatosSupabase();
  };

  // MUTACIÓN STRICT SUPABASE: Agregar Consulta / Turno
  const agregarConsulta = async (datos: Omit<Consulta, 'id' | 'created_at'>) => {
    if (!user?.id) {
      alert('Debes iniciar sesión para agendar turnos.');
      return;
    }

    const medicoIdSanitizado = (datos.medico_id && !datos.medico_id.startsWith('med-')) ? datos.medico_id : null;

    const { error } = await supabase.from('consultas').insert({
      miembro_id: datos.miembro_id,
      medico_id: medicoIdSanitizado,
      motivo: datos.motivo,
      fecha_visita_anterior: datos.fecha_visita_anterior || null,
      fecha_proxima_visita: datos.fecha_proxima_visita || null,
      estado: datos.estado || 'programada',
      observaciones: datos.observaciones || null
    });

    if (error) {
      console.error('Error insertando consulta en Supabase:', error);
      alert(`No se pudo agendar el turno en la nube: ${error.message}`);
      return;
    }

    await cargarDatosSupabase();
  };

  // MUTACIÓN STRICT SUPABASE: Cambiar Estado Consulta
  const cambiarEstadoConsulta = async (id: string, estado: 'programada' | 'completada' | 'cancelada') => {
    if (!user?.id) return;
    const { error } = await supabase.from('consultas').update({ estado }).eq('id', id);

    if (error) {
      console.error('Error actualizando turno:', error);
      alert(`Error al actualizar el turno: ${error.message}`);
      return;
    }

    await cargarDatosSupabase();
  };

  // MUTACIÓN STRICT SUPABASE: Eliminar Consulta
  const eliminarConsulta = async (id: string) => {
    if (!user?.id) return;
    const { error } = await supabase.from('consultas').delete().eq('id', id);

    if (error) {
      console.error('Error eliminando turno:', error);
      alert(`Error al eliminar turno: ${error.message}`);
      return;
    }

    await cargarDatosSupabase();
  };

  // MUTACIÓN STRICT SUPABASE: Agregar Estudio
  const agregarEstudio = async (datos: Omit<Estudio, 'id' | 'created_at'>) => {
    if (!user?.id) {
      alert('Debes iniciar sesión para guardar estudios.');
      return;
    }

    const { error } = await supabase.from('estudios').insert({
      miembro_id: datos.miembro_id,
      titulo: datos.titulo,
      tipo_estudio: datos.tipo_estudio,
      fecha: datos.fecha || new Date().toISOString().split('T')[0],
      archivo_url: datos.archivo_url || null,
      archivo_nombre: datos.archivo_nombre || null,
      observaciones: datos.observaciones || null
    });

    if (error) {
      console.error('Error insertando estudio en Supabase:', error);
      alert(`No se pudo guardar el estudio en la nube: ${error.message}`);
      return;
    }

    await cargarDatosSupabase();
  };

  // MUTACIÓN STRICT SUPABASE: Eliminar Estudio
  const eliminarEstudio = async (id: string) => {
    if (!user?.id) return;
    const { error } = await supabase.from('estudios').delete().eq('id', id);

    if (error) {
      console.error('Error eliminando estudio:', error);
      alert(`Error al eliminar estudio: ${error.message}`);
      return;
    }

    await cargarDatosSupabase();
  };

  // Compartir tutor por email
  const compartirMiembro = async (miembroId: string, emailTutor: string, rol: RolTutor): Promise<boolean> => {
    try {
      const { data: perfilData } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', emailTutor)
        .single();

      if (perfilData) {
        const { error } = await supabase.from('miembro_tutores').insert({
          miembro_id: miembroId,
          user_id: perfilData.id,
          rol: rol
        });

        if (error) {
          alert(`No se pudo compartir el integrante: ${error.message}`);
          return false;
        }

        await cargarDatosSupabase();
        return true;
      } else {
        alert(`No se encontró ningún usuario registrado con el email: ${emailTutor}`);
        return false;
      }
    } catch (e: any) {
      alert(`Error al compartir tutor: ${e?.message || 'Error de red'}`);
      return false;
    }
  };

  // Obtener Ficha de Emergencia pública por token QR
  const obtenerFichaEmergenciaPorToken = async (token: string): Promise<{
    miembro: Miembro | null;
    medicamentosActivos: Medicamento[];
  }> => {
    let m = miembros.find(item => item.qr_code_token === token) || null;

    if (!m && token) {
      try {
        const { data: dbMiembro, error } = await supabase
          .from('miembros')
          .select('*')
          .eq('qr_code_token', token)
          .single();

        if (dbMiembro && !error) {
          m = dbMiembro as Miembro;
        }
      } catch (e) {}
    }

    if (!m) return { miembro: null, medicamentosActivos: [] };

    let medsActivos = medicamentos.filter(med => med.miembro_id === m!.id && med.activo);

    if (medsActivos.length === 0 && m.id) {
      try {
        const { data: dbMeds } = await supabase
          .from('medicamentos')
          .select('*')
          .eq('miembro_id', m.id)
          .eq('activo', true);

        if (dbMeds) medsActivos = dbMeds as Medicamento[];
      } catch (e) {}
    }

    return { miembro: m, medicamentosActivos: medsActivos };
  };

  return (
    <AppContext.Provider value={{
      user,
      loadingAuth,
      cerrarSesion,
      miembros,
      miembroActivo,
      setMiembroActivoId,
      agregarMiembro,
      editarMiembro,
      eliminarMiembro,
      sincronizarConNube,
      limpiarDuplicadosSupabase,
      medicos,
      agregarMedico,
      eliminarMedico,
      medicamentos,
      agregarMedicamento,
      toggleMedicamentoActivo,
      eliminarMedicamento,
      consultas,
      agregarConsulta,
      cambiarEstadoConsulta,
      eliminarConsulta,
      estudios,
      agregarEstudio,
      eliminarEstudio,
      compartirMiembro,
      obtenerFichaEmergenciaPorToken
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe ser usado dentro de un AppProvider');
  }
  return context;
}
