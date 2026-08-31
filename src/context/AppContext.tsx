'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
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

interface AppContextType {
  user: PerfilUser | null;
  setUser: (user: PerfilUser | null) => void;
  miembros: Miembro[];
  miembroActivo: Miembro | null;
  setMiembroActivoId: (id: string) => void;
  agregarMiembro: (datos: Omit<Miembro, 'id' | 'creado_por' | 'qr_code_token' | 'created_at'>) => void;
  editarMiembro: (id: string, datos: Partial<Miembro>) => void;
  eliminarMiembro: (id: string) => void;
  
  // Médicos
  medicos: Medico[];
  agregarMedico: (datos: Omit<Medico, 'id' | 'created_at'>) => void;
  eliminarMedico: (id: string) => void;
  
  // Medicamentos
  medicamentos: Medicamento[];
  agregarMedicamento: (datos: Omit<Medicamento, 'id' | 'created_at'>) => void;
  toggleMedicamentoActivo: (id: string) => void;
  eliminarMedicamento: (id: string) => void;
  
  // Consultas
  consultas: Consulta[];
  agregarConsulta: (datos: Omit<Consulta, 'id' | 'created_at'>) => void;
  cambiarEstadoConsulta: (id: string, estado: 'programada' | 'completada' | 'cancelada') => void;
  eliminarConsulta: (id: string) => void;
  
  // Estudios
  estudios: Estudio[];
  agregarEstudio: (datos: Omit<Estudio, 'id' | 'created_at'>) => void;
  eliminarEstudio: (id: string) => void;

  // Tutores
  compartirMiembro: (miembroId: string, emailTutor: string, rol: RolTutor) => Promise<boolean>;

  // Búsqueda por token de emergencia público
  obtenerFichaEmergenciaPorToken: (token: string) => {
    miembro: Miembro | null;
    medicamentosActivos: Medicamento[];
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PerfilUser | null>(INITIAL_USER);
  const [miembros, setMiembros] = useState<Miembro[]>(INITIAL_MIEMBROS);
  const [miembroActivoId, setMiembroActivoIdState] = useState<string>(INITIAL_MIEMBROS[0]?.id || '');
  
  const [medicos, setMedicos] = useState<Medico[]>(INITIAL_MEDICOS);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>(INITIAL_MEDICAMENTOS);
  const [consultas, setConsultas] = useState<Consulta[]>(INITIAL_CONSULTAS);
  const [estudios, setEstudios] = useState<Estudio[]>(INITIAL_ESTUDIOS);

  // Miembro actualmente seleccionado
  const miembroActivo = miembros.find(m => m.id === miembroActivoId) || miembros[0] || null;

  const setMiembroActivoId = (id: string) => {
    setMiembroActivoIdState(id);
  };

  // Agregar Integrante
  const agregarMiembro = (datos: Omit<Miembro, 'id' | 'creado_por' | 'qr_code_token' | 'created_at'>) => {
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
  };

  // Editar Integrante
  const editarMiembro = (id: string, datos: Partial<Miembro>) => {
    setMiembros(prev => prev.map(m => m.id === id ? { ...m, ...datos } : m));
  };

  // Eliminar Integrante
  const eliminarMiembro = (id: string) => {
    setMiembros(prev => prev.filter(m => m.id !== id));
    if (miembroActivoId === id) {
      const restante = miembros.find(m => m.id !== id);
      if (restante) setMiembroActivoIdState(restante.id);
    }
  };

  // Médicos
  const agregarMedico = (datos: Omit<Medico, 'id' | 'created_at'>) => {
    const nuevo: Medico = {
      ...datos,
      id: `med-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    setMedicos(prev => [nuevo, ...prev]);
  };

  const eliminarMedico = (id: string) => {
    setMedicos(prev => prev.filter(m => m.id !== id));
  };

  // Medicamentos
  const agregarMedicamento = (datos: Omit<Medicamento, 'id' | 'created_at'>) => {
    const nuevo: Medicamento = {
      ...datos,
      id: `farm-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    setMedicamentos(prev => [nuevo, ...prev]);
  };

  const toggleMedicamentoActivo = (id: string) => {
    setMedicamentos(prev => prev.map(m => m.id === id ? { ...m, activo: !m.activo } : m));
  };

  const eliminarMedicamento = (id: string) => {
    setMedicamentos(prev => prev.filter(m => m.id !== id));
  };

  // Consultas
  const agregarConsulta = (datos: Omit<Consulta, 'id' | 'created_at'>) => {
    const nuevo: Consulta = {
      ...datos,
      id: `cons-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    setConsultas(prev => [nuevo, ...prev]);
  };

  const cambiarEstadoConsulta = (id: string, estado: 'programada' | 'completada' | 'cancelada') => {
    setConsultas(prev => prev.map(c => c.id === id ? { ...c, estado } : c));
  };

  const eliminarConsulta = (id: string) => {
    setConsultas(prev => prev.filter(c => c.id !== id));
  };

  // Estudios
  const agregarEstudio = (datos: Omit<Estudio, 'id' | 'created_at'>) => {
    const nuevo: Estudio = {
      ...datos,
      id: `est-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    setEstudios(prev => [nuevo, ...prev]);
  };

  const eliminarEstudio = (id: string) => {
    setEstudios(prev => prev.filter(e => e.id !== id));
  };

  // Compartir miembro con otro tutor
  const compartirMiembro = async (miembroId: string, emailTutor: string, rol: RolTutor): Promise<boolean> => {
    // Simula invitacion y vinculacion multitutor
    return true;
  };

  // Ficha de emergencia pública
  const obtenerFichaEmergenciaPorToken = (token: string) => {
    const m = miembros.find(item => item.qr_code_token === token) || null;
    if (!m) return { miembro: null, medicamentosActivos: [] };

    const medsActivos = medicamentos.filter(med => med.miembro_id === m.id && med.activo);
    return { miembro: m, medicamentosActivos: medsActivos };
  };

  return (
    <AppContext.Provider value={{
      user,
      setUser,
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
