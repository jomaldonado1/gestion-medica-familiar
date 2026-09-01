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

  // Guardar en cache local por usuario de todos los módulos
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

  // Escuchar sesión y cargar datos reales de Supabase (Single Source of Truth con Auto-reparación)
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

          // Self-healing: auto-limpieza de erratas y duplicados en Supabase
          if (dbMiembrosCreados && dbMiembrosCreados.length > 0) {
            // 1. Borrar duplicado de MARIA EVA CARRANZA (Yo / Adulto) si existe la de (Adulto Mayor / Padre)
            const dupesMariaEva = dbMiembrosCreados.filter(m => m.nombre.toLowerCase().trim().includes('maria eva carranza'));
            if (dupesMariaEva.length > 1) {
              const dupeABorrar = dupesMariaEva.find(m => m.tipo === 'Yo / Adulto');
              if (dupeABorrar) {
                await supabase.from('miembro_tutores').delete().eq('miembro_id', dupeABorrar.id);
                await supabase.from('miembros').delete().eq('id', dupeABorrar.id);
                mapaMiembrosDb.delete(dupeABorrar.id);
              }
            }

            // 2. Corregir errata MALDOANDO -> MALDONADO
            const antonioErrata = dbMiembrosCreados.find(m => m.nombre.toLowerCase().trim().includes('maldoando'));
            if (antonioErrata) {
              await supabase.from('miembros').update({ nombre: 'ANTONIO MALDONADO' }).eq('id', antonioErrata.id);
              const mObj = mapaMiembrosDb.get(antonioErrata.id);
              if (mObj) mObj.nombre = 'ANTONIO MALDONADO';
            }
          }

          // 3. Sincronizar items de la caché local que faltan en Supabase (ej: LANA)
          const cacheLocalMiembros = cargarCacheModulo<Miembro>(authUser.id, 'miembros');
          if (cacheLocalMiembros && cacheLocalMiembros.length > 0) {
            for (const cM of cacheLocalMiembros) {
              const claveCache = cM.nombre.toLowerCase().trim();
              const existeEnDb = Array.from(mapaMiembrosDb.values()).some(dbM => dbM.nombre.toLowerCase().trim() === claveCache);

              if (!existeEnDb) {
                const { data: inserted } = await supabase.from('miembros').insert({
                  tipo: cM.tipo,
                  nombre: cM.nombre,
                  telefono: cM.telefono || null,
                  dni: cM.dni || null,
                  obra_social: cM.obra_social || null,
                  nro_afiliado: cM.nro_afiliado || null,
                  plan_obra_social: cM.plan_obra_social || null,
                  fecha_nacimiento: cM.fecha_nacimiento || null,
                  grupo_sanguineo: cM.grupo_sanguineo || null,
                  especie_raza: cM.especie_raza || null,
                  alergias: cM.alergias || null,
                  contacto_emergencia_nombre: cM.contacto_emergencia_nombre || null,
                  contacto_emergencia_telefono: cM.contacto_emergencia_telefono || null,
                  observaciones: cM.observaciones || null,
                  creado_por: authUser.id
                }).select().single();

                if (inserted) {
                  const mNuevo = { ...inserted, rol_actual: 'propietario' } as Miembro;
                  mapaMiembrosDb.set(inserted.id, mNuevo);
                  await supabase.from('miembro_tutores').insert({
                    miembro_id: inserted.id,
                    user_id: authUser.id,
                    rol: 'propietario'
                  });
                }
              }
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
          } else if (cacheLocalMiembros && cacheLocalMiembros.length > 0) {
            listaFinalMiembros = cacheLocalMiembros;
          }

          setMiembros(listaFinalMiembros);
          guardarCacheCompleto(authUser.id, { miembros: listaFinalMiembros });

          if (listaFinalMiembros.length > 0) {
            setMiembroActivoIdState(prev => prev || listaFinalMiembros[0].id);
          }

          const idsMiembros = listaFinalMiembros.map(m => m.id);

          if (idsMiembros.length > 0) {
            // 3. Cargar Médicos
            const { data: dbMedicos } = await supabase
              .from('medicos')
              .select('*')
              .in('miembro_id', idsMiembros);
            const cacheMedicos = cargarCacheModulo<Medico>(authUser.id, 'medicos');
            const medicosFinales = dbMedicos && dbMedicos.length > 0 ? (dbMedicos as Medico[]) : cacheMedicos;
            setMedicos(medicosFinales);
            guardarCacheCompleto(authUser.id, { medicos: medicosFinales });

            // 4. Cargar Medicamentos
            const { data: dbMeds } = await supabase
              .from('medicamentos')
              .select('*')
              .in('miembro_id', idsMiembros);
            const cacheMeds = cargarCacheModulo<Medicamento>(authUser.id, 'meds');
            const medsFinales = dbMeds && dbMeds.length > 0 ? (dbMeds as Medicamento[]) : cacheMeds;
            setMedicamentos(medsFinales);
            guardarCacheCompleto(authUser.id, { medicamentos: medsFinales });

            // 5. Cargar Consultas
            const { data: dbConsultas } = await supabase
              .from('consultas')
              .select('*')
              .in('miembro_id', idsMiembros);
            const cacheConsultas = cargarCacheModulo<Consulta>(authUser.id, 'consultas');
            const consultasFinales = dbConsultas && dbConsultas.length > 0 ? (dbConsultas as Consulta[]) : cacheConsultas;
            setConsultas(consultasFinales);
            guardarCacheCompleto(authUser.id, { consultas: consultasFinales });

            // 6. Cargar Estudios
            const { data: dbEstudios } = await supabase
              .from('estudios')
              .select('*')
              .in('miembro_id', idsMiembros);
            const cacheEstudios = cargarCacheModulo<Estudio>(authUser.id, 'estudios');
            const estudiosFinales = dbEstudios && dbEstudios.length > 0 ? (dbEstudios as Estudio[]) : cacheEstudios;
            setEstudios(estudiosFinales);
            guardarCacheCompleto(authUser.id, { estudios: estudiosFinales });
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

    try {
      const { data: actuales } = await supabase
        .from('miembros')
        .select('id')
        .eq('creado_por', user.id);

      if (actuales && actuales.length > 0) {
        for (const act of actuales) {
          await supabase.from('miembro_tutores').delete().eq('miembro_id', act.id);
          await supabase.from('miembros').delete().eq('id', act.id);
        }
      }

      for (let i = 0; i < miembros.length; i++) {
        const m = miembros[i];
        const payloadInsert: Record<string, any> = {
          tipo: m.tipo,
          nombre: m.nombre,
          telefono: m.telefono || null,
          dni: m.dni || null,
          obra_social: m.obra_social || null,
          nro_afiliado: m.nro_afiliado || null,
          plan_obra_social: m.plan_obra_social || null,
          fecha_nacimiento: m.fecha_nacimiento || null,
          grupo_sanguineo: m.grupo_sanguineo || null,
          especie_raza: m.especie_raza || null,
          alergias: m.alergias || null,
          contacto_emergencia_nombre: m.contacto_emergencia_nombre || null,
          contacto_emergencia_telefono: m.contacto_emergencia_telefono || null,
          observaciones: m.observaciones || null,
          creado_por: user.id
        };

        if (m.qr_code_token && !m.qr_code_token.startsWith('emergency-')) {
          payloadInsert.qr_code_token = m.qr_code_token;
        }

        const { data: nuevo, error } = await supabase.from('miembros').insert(payloadInsert).select().single();

        if (nuevo && !error) {
          miembros[i].id = nuevo.id;
          miembros[i].qr_code_token = nuevo.qr_code_token;
          await supabase.from('miembro_tutores').insert({
            miembro_id: nuevo.id,
            user_id: user.id,
            rol: 'propietario'
          });
        }
      }

      setMiembros([...miembros]);
      guardarCacheCompleto(user.id, { miembros, medicos, medicamentos, consultas, estudios });
    } catch (e) {
      console.error('Error en limpiarDuplicadosSupabase:', e);
    }
  };

  const sincronizarConNube = async () => {
    if (!user?.id) return;
    await limpiarDuplicadosSupabase();
  };

  // Agregar Integrante
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

    setMiembros(prev => {
      const actualizados = [...prev, nuevoMiembro];
      if (user?.id) guardarCacheCompleto(user.id, { miembros: actualizados });
      return actualizados;
    });
    setMiembroActivoIdState(tempId);

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

          setMiembros(prev => {
            const reemplazados = prev.map(m => m.id === tempId ? realMiembro : m);
            if (user?.id) guardarCacheCompleto(user.id, { miembros: reemplazados });
            return reemplazados;
          });
          setMiembroActivoIdState(realMiembro.id);

          await supabase.from('miembro_tutores').insert({
            miembro_id: data.id,
            user_id: user.id,
            rol: 'propietario'
          });
        }
      }
    } catch (e) {
      console.log('Error insertando en Supabase:', e);
    }
  };

  // Editar Integrante
  const editarMiembro = async (id: string, datos: Partial<Miembro>) => {
    const targetOld = miembros.find(m => m.id === id);

    setMiembros(prev => {
      const actualizados = prev.map(m => m.id === id ? { ...m, ...datos } : m);
      if (user?.id) guardarCacheCompleto(user.id, { miembros: actualizados });
      return actualizados;
    });

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
          await supabase.from('miembros').update(payload).eq('id', id);

          if (targetOld?.nombre) {
            await supabase
              .from('miembros')
              .update(payload)
              .eq('creado_por', user.id)
              .ilike('nombre', targetOld.nombre.trim());
          }
        }
      }
    } catch (e) {
      console.error('Error en editarMiembro:', e);
    }
  };

  // Eliminar Integrante
  const eliminarMiembro = async (id: string) => {
    const target = miembros.find(m => m.id === id);

    setMiembros(prev => {
      const actualizados = prev.filter(m => m.id !== id);
      if (user?.id) guardarCacheCompleto(user.id, { miembros: actualizados });
      return actualizados;
    });

    if (miembroActivoId === id) {
      const restante = miembros.find(m => m.id !== id);
      if (restante) setMiembroActivoIdState(restante ? restante.id : '');
    }

    try {
      if (user?.id) {
        await supabase.from('miembro_tutores').delete().eq('miembro_id', id);
        await supabase.from('miembros').delete().eq('id', id);

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
    const tempId = `med-${Date.now()}`;
    let nuevoMedico: Medico = {
      ...datos,
      id: tempId,
      created_at: new Date().toISOString()
    };

    setMedicos(prev => {
      const actualizados = [nuevoMedico, ...prev];
      if (user?.id) guardarCacheCompleto(user.id, { medicos: actualizados });
      return actualizados;
    });

    try {
      if (user?.id) {
        const { data, error } = await supabase.from('medicos').insert({
          miembro_id: datos.miembro_id,
          nombre: datos.nombre,
          especialidad: datos.especialidad || null,
          telefono: datos.telefono || null,
          centro_atencion: datos.centro_atencion || null,
          direccion: datos.direccion || null,
          observaciones: datos.observaciones || null
        }).select().single();

        if (data && !error) {
          setMedicos(prev => {
            const reemplazados = prev.map(m => m.id === tempId ? (data as Medico) : m);
            if (user?.id) guardarCacheCompleto(user.id, { medicos: reemplazados });
            return reemplazados;
          });
        }
      }
    } catch (e) {
      console.error('Error insertando médico:', e);
    }
  };

  const eliminarMedico = async (id: string) => {
    setMedicos(prev => {
      const actualizados = prev.filter(m => m.id !== id);
      if (user?.id) guardarCacheCompleto(user.id, { medicos: actualizados });
      return actualizados;
    });

    try {
      if (user?.id) {
        await supabase.from('medicos').delete().eq('id', id);
      }
    } catch (e) {}
  };

  // Medicamentos
  const agregarMedicamento = async (datos: Omit<Medicamento, 'id' | 'created_at'>) => {
    const tempId = `farm-${Date.now()}`;
    let nuevoMed: Medicamento = {
      ...datos,
      id: tempId,
      created_at: new Date().toISOString()
    };

    setMedicamentos(prev => {
      const actualizados = [nuevoMed, ...prev];
      if (user?.id) guardarCacheCompleto(user.id, { medicamentos: actualizados });
      return actualizados;
    });

    try {
      if (user?.id) {
        const { data, error } = await supabase.from('medicamentos').insert({
          miembro_id: datos.miembro_id,
          nombre: datos.nombre,
          droga_componente: datos.droga_componente || null,
          dosis: datos.dosis || null,
          frecuencia: datos.frecuencia || null,
          horario: datos.horario || null,
          activo: datos.activo ?? true,
          observaciones: datos.observaciones || null
        }).select().single();

        if (data && !error) {
          setMedicamentos(prev => {
            const reemplazados = prev.map(m => m.id === tempId ? (data as Medicamento) : m);
            if (user?.id) guardarCacheCompleto(user.id, { medicamentos: reemplazados });
            return reemplazados;
          });
        }
      }
    } catch (e) {
      console.error('Error insertando medicamento:', e);
    }
  };

  const toggleMedicamentoActivo = async (id: string) => {
    const medTarget = medicamentos.find(m => m.id === id);
    const nuevoEstado = medTarget ? !medTarget.activo : true;

    setMedicamentos(prev => {
      const actualizados = prev.map(m => m.id === id ? { ...m, activo: nuevoEstado } : m);
      if (user?.id) guardarCacheCompleto(user.id, { medicamentos: actualizados });
      return actualizados;
    });

    try {
      if (user?.id) {
        await supabase.from('medicamentos').update({ activo: nuevoEstado }).eq('id', id);
      }
    } catch (e) {}
  };

  const eliminarMedicamento = async (id: string) => {
    setMedicamentos(prev => {
      const actualizados = prev.filter(m => m.id !== id);
      if (user?.id) guardarCacheCompleto(user.id, { medicamentos: actualizados });
      return actualizados;
    });

    try {
      if (user?.id) {
        await supabase.from('medicamentos').delete().eq('id', id);
      }
    } catch (e) {}
  };

  // Consultas
  const agregarConsulta = async (datos: Omit<Consulta, 'id' | 'created_at'>) => {
    const tempId = `cons-${Date.now()}`;
    let nuevaCons: Consulta = {
      ...datos,
      id: tempId,
      created_at: new Date().toISOString()
    };

    setConsultas(prev => {
      const actualizados = [nuevaCons, ...prev];
      if (user?.id) guardarCacheCompleto(user.id, { consultas: actualizados });
      return actualizados;
    });

    try {
      if (user?.id) {
        const medicoIdSanitizado = (datos.medico_id && !datos.medico_id.startsWith('med-')) ? datos.medico_id : null;

        const { data, error } = await supabase.from('consultas').insert({
          miembro_id: datos.miembro_id,
          medico_id: medicoIdSanitizado,
          motivo: datos.motivo,
          fecha_visita_anterior: datos.fecha_visita_anterior || null,
          fecha_proxima_visita: datos.fecha_proxima_visita || null,
          estado: datos.estado || 'programada',
          observaciones: datos.observaciones || null
        }).select().single();

        if (data && !error) {
          setConsultas(prev => {
            const reemplazados = prev.map(c => c.id === tempId ? { ...data, medico_nombre: datos.medico_nombre } as Consulta : c);
            if (user?.id) guardarCacheCompleto(user.id, { consultas: reemplazados });
            return reemplazados;
          });
        }
      }
    } catch (e) {
      console.error('Error insertando consulta:', e);
    }
  };

  const cambiarEstadoConsulta = async (id: string, estado: 'programada' | 'completada' | 'cancelada') => {
    setConsultas(prev => {
      const actualizados = prev.map(c => c.id === id ? { ...c, estado } : c);
      if (user?.id) guardarCacheCompleto(user.id, { consultas: actualizados });
      return actualizados;
    });

    try {
      if (user?.id) {
        await supabase.from('consultas').update({ estado }).eq('id', id);
      }
    } catch (e) {}
  };

  const eliminarConsulta = async (id: string) => {
    setConsultas(prev => {
      const actualizados = prev.filter(c => c.id !== id);
      if (user?.id) guardarCacheCompleto(user.id, { consultas: actualizados });
      return actualizados;
    });

    try {
      if (user?.id) {
        await supabase.from('consultas').delete().eq('id', id);
      }
    } catch (e) {}
  };

  // Estudios
  const agregarEstudio = async (datos: Omit<Estudio, 'id' | 'created_at'>) => {
    const tempId = `est-${Date.now()}`;
    let nuevoEstudio: Estudio = {
      ...datos,
      id: tempId,
      created_at: new Date().toISOString()
    };

    setEstudios(prev => {
      const actualizados = [nuevoEstudio, ...prev];
      if (user?.id) guardarCacheCompleto(user.id, { estudios: actualizados });
      return actualizados;
    });

    try {
      if (user?.id) {
        const { data, error } = await supabase.from('estudios').insert({
          miembro_id: datos.miembro_id,
          titulo: datos.titulo,
          tipo_estudio: datos.tipo_estudio,
          fecha: datos.fecha || new Date().toISOString().split('T')[0],
          archivo_url: datos.archivo_url || null,
          archivo_nombre: datos.archivo_nombre || null,
          observaciones: datos.observaciones || null
        }).select().single();

        if (data && !error) {
          setEstudios(prev => {
            const reemplazados = prev.map(e => e.id === tempId ? (data as Estudio) : e);
            if (user?.id) guardarCacheCompleto(user.id, { estudios: reemplazados });
            return reemplazados;
          });
        }
      }
    } catch (e) {
      console.error('Error insertando estudio:', e);
    }
  };

  const eliminarEstudio = async (id: string) => {
    setEstudios(prev => {
      const actualizados = prev.filter(e => e.id !== id);
      if (user?.id) guardarCacheCompleto(user.id, { estudios: actualizados });
      return actualizados;
    });

    try {
      if (user?.id) {
        await supabase.from('estudios').delete().eq('id', id);
      }
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
