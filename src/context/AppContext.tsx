'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Miembro, 
  Medico, 
  Medicamento, 
  Consulta, 
  Estudio, 
  PerfilUser, 
  TipoMiembro,
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

  // Ficha pública
  obtenerFichaEmergenciaPorToken: (token: string) => {
    miembro: Miembro | null;
    medicamentosActivos: Medicamento[];
  };
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

  // Guardar en cache local por usuario como respaldo de persistencia
  const guardarCacheLocal = (usrId: string, nuevosMiembros: Miembro[]) => {
    try {
      if (typeof window !== 'undefined' && usrId) {
        localStorage.setItem(`med_pwa_miembros_${usrId}`, JSON.stringify(nuevosMiembros));
      }
    } catch (e) {}
  };

  const cargarCacheLocal = (usrId: string): Miembro[] => {
    try {
      if (typeof window !== 'undefined' && usrId) {
        const raw = localStorage.getItem(`med_pwa_miembros_${usrId}`);
        if (raw) return JSON.parse(raw);
      }
    } catch (e) {}
    return [];
  };

  // Escuchar sesión y cargar datos reales de Supabase
  useEffect(() => {
    async function cargarDatosSupabase() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (authUser) {
          // 1. Cargar Perfil
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

          // 2. Cargar Miembros creados por el usuario O vinculados como tutores
          const { data: dbMiembrosCreados } = await supabase
            .from('miembros')
            .select('*')
            .eq('creado_por', authUser.id);

          const { data: miembrosTutores } = await supabase
            .from('miembro_tutores')
            .select('miembro_id, rol, miembros(*)')
            .eq('user_id', authUser.id);

          const mapaMiembros = new Map<string, Miembro>();

          if (dbMiembrosCreados) {
            dbMiembrosCreados.forEach((m: any) => {
              mapaMiembros.set(m.id, { ...m, rol_actual: 'propietario' });
            });
          }

          if (miembrosTutores) {
            miembrosTutores.forEach((mt: any) => {
              if (mt.miembros) {
                mapaMiembros.set(mt.miembros.id, {
                  ...mt.miembros,
                  rol_actual: mt.rol
                });
              }
            });
          }

          let listaMiembros = Array.from(mapaMiembros.values());

          // Deduplicar miembros por combinación de Nombre + Tipo (para limpiar cualquier duplicado antiguo de Supabase)
          const mapaUnicos = new Map<string, Miembro>();
          listaMiembros.forEach(m => {
            const clave = `${m.nombre.toLowerCase().trim()}_${m.tipo}`;
            if (!mapaUnicos.has(clave)) {
              mapaUnicos.set(clave, m);
            }
          });
          listaMiembros = Array.from(mapaUnicos.values());

          // Fallback a localStorage si Supabase retornó array vacío por problema de red/consola
          if (listaMiembros.length === 0) {
            const cache = cargarCacheLocal(authUser.id);
            if (cache.length > 0) {
              listaMiembros = cache;
            }
          } else {
            guardarCacheLocal(authUser.id, listaMiembros);
          }

          setMiembros(listaMiembros);
          if (listaMiembros.length > 0) {
            setMiembroActivoIdState(prev => prev || listaMiembros[0].id);
          }

          const idsMiembros = listaMiembros.map(m => m.id);

          if (idsMiembros.length > 0) {
            // 3. Cargar Médicos
            const { data: dbMedicos } = await supabase
              .from('medicos')
              .select('*')
              .in('miembro_id', idsMiembros);
            if (dbMedicos) setMedicos(dbMedicos as Medico[]);

            // 4. Cargar Medicamentos
            const { data: dbMeds } = await supabase
              .from('medicamentos')
              .select('*')
              .in('miembro_id', idsMiembros);
            if (dbMeds) setMedicamentos(dbMeds as Medicamento[]);

            // 5. Cargar Consultas
            const { data: dbConsultas } = await supabase
              .from('consultas')
              .select('*')
              .in('miembro_id', idsMiembros);
            if (dbConsultas) setConsultas(dbConsultas as Consulta[]);

            // 6. Cargar Estudios
            const { data: dbEstudios } = await supabase
              .from('estudios')
              .select('*')
              .in('miembro_id', idsMiembros);
            if (dbEstudios) setEstudios(dbEstudios as Estudio[]);
          }
        }
      } catch (err) {
        console.log('Utilizando modo local / fallback de Supabase:', err);
      } finally {
        setLoadingAuth(false);
      }
    }

    cargarDatosSupabase();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      cargarDatosSupabase();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
    setMiembroActivoIdState('');
    router.push('/login');
    router.refresh();
  };

  // Agregar Integrante con reemplazo de ID temporal por UUID real de Supabase
  const agregarMiembro = async (datos: Omit<Miembro, 'id' | 'creado_por' | 'qr_code_token' | 'created_at'>) => {
    const tempId = `m-${Date.now()}`;
    const tempToken = `emergency-${datos.nombre.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    
    let nuevoMiembro: Miembro = {
      ...datos,
      id: tempId,
      creado_por: user?.id || 'usr-1',
      qr_code_token: tempToken,
      created_at: new Date().toISOString(),
      rol_actual: 'propietario'
    };

    // 1. Mostrar de inmediato en UI
    setMiembros(prev => {
      const actualizados = [...prev, nuevoMiembro];
      if (user?.id) guardarCacheLocal(user.id, actualizados);
      return actualizados;
    });
    setMiembroActivoIdState(tempId);

    // 2. Persistir en Supabase y actualizar con el UUID real devuelto
    try {
      if (user?.id) {
        const { data, error } = await supabase.from('miembros').insert({
          tipo: datos.tipo,
          nombre: datos.nombre,
          telefono: datos.telefono,
          dni: datos.dni,
          obra_social: datos.obra_social,
          nro_afiliado: datos.nro_afiliado,
          plan_obra_social: datos.plan_obra_social,
          fecha_nacimiento: datos.fecha_nacimiento,
          grupo_sanguineo: datos.grupo_sanguineo,
          especie_raza: datos.especie_raza,
          alergias: datos.alergias,
          contacto_emergencia_nombre: datos.contacto_emergencia_nombre,
          contacto_emergencia_telefono: datos.contacto_emergencia_telefono,
          observaciones: datos.observaciones,
          creado_por: user.id
        }).select().single();

        if (data && !error) {
          const realMiembro: Miembro = {
            ...data,
            rol_actual: 'propietario'
          };

          // Reemplazar tempId por el UUID real en el estado local y en localStorage
          setMiembros(prev => {
            const reemplazados = prev.map(m => m.id === tempId ? realMiembro : m);
            if (user?.id) guardarCacheLocal(user.id, reemplazados);
            return reemplazados;
          });
          setMiembroActivoIdState(realMiembro.id);

          // Registrar tutor propietario
          await supabase.from('miembro_tutores').insert({
            miembro_id: data.id,
            user_id: user.id,
            rol: 'propietario'
          });
        }
      }
    } catch (e) {
      console.log('Error insertando en Supabase, manteniendo copia local:', e);
    }
  };

  // Editar Integrante con desinfectado de payload y coincidencia por ID y nombre
  const editarMiembro = async (id: string, datos: Partial<Miembro>) => {
    const targetOld = miembros.find(m => m.id === id);

    // 1. Actualizar estado local de inmediato
    setMiembros(prev => {
      const actualizados = prev.map(m => m.id === id ? { ...m, ...datos } : m);
      if (user?.id) guardarCacheLocal(user.id, actualizados);
      return actualizados;
    });

    // 2. Desinfectar objeto para Supabase (solo enviar columnas validas de la tabla miembros)
    try {
      if (user?.id) {
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

        if (Object.keys(payload).length > 0) {
          // Intentar por ID de Supabase primero
          const { error } = await supabase.from('miembros').update(payload).eq('id', id);

          // Si el ID era local (m-...) o hubo desfasaje, actualizar por nombre e id de usuario
          if (error || id.startsWith('m-')) {
            if (targetOld?.nombre) {
              await supabase
                .from('miembros')
                .update(payload)
                .eq('creado_por', user.id)
                .ilike('nombre', targetOld.nombre.trim());
            }
          }
        }
      }
    } catch (e) {
      console.error('Error en editarMiembro:', e);
    }
  };

  // Eliminar Integrante con borrado de duplicados e IDs temporales en Supabase
  const eliminarMiembro = async (id: string) => {
    const target = miembros.find(m => m.id === id);

    // 1. Actualizar estado local de inmediato
    setMiembros(prev => {
      const actualizados = prev.filter(m => m.id !== id);
      if (user?.id) guardarCacheLocal(user.id, actualizados);
      return actualizados;
    });

    if (miembroActivoId === id) {
      const restante = miembros.find(m => m.id !== id);
      if (restante) setMiembroActivoIdState(restante ? restante.id : '');
    }

    // 2. Persistir eliminación en Supabase
    try {
      if (user?.id) {
        // Borrar por ID exacto
        await supabase.from('miembro_tutores').delete().eq('miembro_id', id);
        await supabase.from('miembros').delete().eq('id', id);

        // Si el integrante tiene un nombre, eliminar cualquier duplicado en Supabase con el mismo nombre para este usuario
        if (target?.nombre) {
          const { data: dupes } = await supabase
            .from('miembros')
            .select('id')
            .eq('creado_por', user.id)
            .ilike('nombre', target.nombre.trim());

          if (dupes && dupes.length > 0) {
            for (const d of dupes) {
              await supabase.from('miembro_tutores').delete().eq('miembro_id', d.id);
              await supabase.from('miembros').delete().eq('id', d.id);
            }
          }
        }
      }
    } catch (e) {
      console.error('Error en eliminarMiembro:', e);
    }
  };

  // Médicos
  const agregarMedico = async (datos: Omit<Medico, 'id' | 'created_at'>) => {
    const nuevo: Medico = {
      ...datos,
      id: `med-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    setMedicos(prev => [nuevo, ...prev]);

    try {
      await supabase.from('medicos').insert(datos);
    } catch (e) {}
  };

  const eliminarMedico = async (id: string) => {
    setMedicos(prev => prev.filter(m => m.id !== id));
    try {
      await supabase.from('medicos').delete().eq('id', id);
    } catch (e) {}
  };

  // Medicamentos
  const agregarMedicamento = async (datos: Omit<Medicamento, 'id' | 'created_at'>) => {
    const nuevo: Medicamento = {
      ...datos,
      id: `farm-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    setMedicamentos(prev => [nuevo, ...prev]);

    try {
      await supabase.from('medicamentos').insert(datos);
    } catch (e) {}
  };

  const toggleMedicamentoActivo = async (id: string) => {
    const medTarget = medicamentos.find(m => m.id === id);
    const nuevoEstado = medTarget ? !medTarget.activo : true;

    setMedicamentos(prev => prev.map(m => m.id === id ? { ...m, activo: nuevoEstado } : m));

    try {
      await supabase.from('medicamentos').update({ activo: nuevoEstado }).eq('id', id);
    } catch (e) {}
  };

  const eliminarMedicamento = async (id: string) => {
    setMedicamentos(prev => prev.filter(m => m.id !== id));
    try {
      await supabase.from('medicamentos').delete().eq('id', id);
    } catch (e) {}
  };

  // Consultas
  const agregarConsulta = async (datos: Omit<Consulta, 'id' | 'created_at'>) => {
    const nuevo: Consulta = {
      ...datos,
      id: `cons-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    setConsultas(prev => [nuevo, ...prev]);

    try {
      await supabase.from('consultas').insert({
        miembro_id: datos.miembro_id,
        medico_id: datos.medico_id,
        motivo: datos.motivo,
        fecha_visita_anterior: datos.fecha_visita_anterior,
        fecha_proxima_visita: datos.fecha_proxima_visita,
        estado: datos.estado,
        observaciones: datos.observaciones
      });
    } catch (e) {}
  };

  const cambiarEstadoConsulta = async (id: string, estado: 'programada' | 'completada' | 'cancelada') => {
    setConsultas(prev => prev.map(c => c.id === id ? { ...c, estado } : c));
    try {
      await supabase.from('consultas').update({ estado }).eq('id', id);
    } catch (e) {}
  };

  const eliminarConsulta = async (id: string) => {
    setConsultas(prev => prev.filter(c => c.id !== id));
    try {
      await supabase.from('consultas').delete().eq('id', id);
    } catch (e) {}
  };

  // Estudios
  const agregarEstudio = async (datos: Omit<Estudio, 'id' | 'created_at'>) => {
    const nuevo: Estudio = {
      ...datos,
      id: `est-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    setEstudios(prev => [nuevo, ...prev]);

    try {
      await supabase.from('estudios').insert(datos);
    } catch (e) {}
  };

  const eliminarEstudio = async (id: string) => {
    setEstudios(prev => prev.filter(e => e.id !== id));
    try {
      await supabase.from('estudios').delete().eq('id', id);
    } catch (e) {}
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
        await supabase.from('miembro_tutores').insert({
          miembro_id: miembroId,
          user_id: perfilData.id,
          rol: rol
        });
      }
    } catch (e) {}
    return true;
  };

  // Obtener Ficha de Emergencia pública por token QR
  const obtenerFichaEmergenciaPorToken = (token: string) => {
    const m = miembros.find(item => item.qr_code_token === token) || null;
    if (!m) return { miembro: null, medicamentosActivos: [] };

    const medsActivos = medicamentos.filter(med => med.miembro_id === m.id && med.activo);
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
