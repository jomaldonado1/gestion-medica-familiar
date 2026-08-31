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
  const [miembroActivoId, setMiembroActivoIdState] = useState<string>(INITIAL_MIEMBROS[0]?.id || '');
  
  const [medicos, setMedicos] = useState<Medico[]>(INITIAL_MEDICOS);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>(INITIAL_MEDICAMENTOS);
  const [consultas, setConsultas] = useState<Consulta[]>(INITIAL_CONSULTAS);
  const [estudios, setEstudios] = useState<Estudio[]>(INITIAL_ESTUDIOS);

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

          if (perfilData) {
            setUser(perfilData as PerfilUser);
          } else {
            setUser({
              id: authUser.id,
              email: authUser.email || '',
              nombre_completo: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Usuario',
              telefono: null,
              rol: 'user',
              created_at: new Date().toISOString()
            });
          }

          // 2. Cargar Miembros mediante relación de tutores o creaciones
          const { data: miembrosTutores } = await supabase
            .from('miembro_tutores')
            .select('miembro_id, rol, miembros(*)')
            .eq('user_id', authUser.id);

          if (miembrosTutores && miembrosTutores.length > 0) {
            const listaMiembros: Miembro[] = miembrosTutores
              .filter(mt => mt.miembros)
              .map((mt: any) => ({
                ...mt.miembros,
                rol_actual: mt.rol
              }));

            setMiembros(listaMiembros);
            if (listaMiembros.length > 0 && !miembroActivoId) {
              setMiembroActivoIdState(listaMiembros[0].id);
            }

            const idsMiembros = listaMiembros.map(m => m.id);

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
    router.push('/login');
    router.refresh();
  };

  // Agregar Integrante
  const agregarMiembro = async (datos: Omit<Miembro, 'id' | 'creado_por' | 'qr_code_token' | 'created_at'>) => {
    const nuevoId = `m-${Date.now()}`;
    const nuevoToken = `emergency-${datos.nombre.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    
    const nuevoMiembro: Miembro = {
      ...datos,
      id: nuevoId,
      creado_por: user?.id || 'usr-1',
      qr_code_token: nuevoToken,
      created_at: new Date().toISOString(),
      rol_actual: 'propietario'
    };

    setMiembros(prev => [...prev, nuevoMiembro]);
    setMiembroActivoIdState(nuevoId);

    // Persistir en Supabase si hay auth
    try {
      if (user?.id) {
        const { data, error } = await supabase.from('miembros').insert({
          tipo: datos.tipo,
          nombre: datos.nombre,
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
          // Crear tutor propietario
          await supabase.from('miembro_tutores').insert({
            miembro_id: data.id,
            user_id: user.id,
            rol: 'propietario'
          });
        }
      }
    } catch (e) {
      console.log('Persistencia local realizada');
    }
  };

  // Editar Integrante
  const editarMiembro = async (id: string, datos: Partial<Miembro>) => {
    setMiembros(prev => prev.map(m => m.id === id ? { ...m, ...datos } : m));
    try {
      await supabase.from('miembros').update(datos).eq('id', id);
    } catch (e) {}
  };

  // Eliminar Integrante
  const eliminarMiembro = async (id: string) => {
    setMiembros(prev => prev.filter(m => m.id !== id));
    if (miembroActivoId === id) {
      const restante = miembros.find(m => m.id !== id);
      if (restante) setMiembroActivoIdState(restante.id);
    }
    try {
      await supabase.from('miembros').delete().eq('id', id);
    } catch (e) {}
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
      // Buscar perfil por email
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
