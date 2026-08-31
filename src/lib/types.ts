export type TipoMiembro = 
  | 'Adulto Mayor / Padre' 
  | 'Yo / Adulto' 
  | 'Hijo / Menor' 
  | 'Mascota';

export type RolTutor = 'propietario' | 'editor' | 'lector';

export type RolUsuario = 'user' | 'admin';

export interface PerfilUser {
  id: string;
  email: string;
  nombre_completo: string | null;
  telefono: string | null;
  rol: RolUsuario;
  created_at: string;
}

export interface Miembro {
  id: string;
  creado_por: string;
  tipo: TipoMiembro;
  nombre: string;
  fecha_nacimiento: string | null;
  grupo_sanguineo: string | null;
  especie_raza: string | null;
  alergias: string | null;
  contacto_emergencia_nombre: string | null;
  contacto_emergencia_telefono: string | null;
  observaciones: string | null;
  qr_code_token: string;
  foto_url?: string | null;
  created_at: string;
  rol_actual?: RolTutor;
}

export interface MiembroTutor {
  id: string;
  miembro_id: string;
  user_id: string;
  rol: RolTutor;
  created_at: string;
  perfil?: PerfilUser;
}

export interface Medico {
  id: string;
  miembro_id: string;
  nombre: string;
  especialidad: string | null;
  telefono: string | null;
  centro_atencion: string | null;
  direccion: string | null;
  observaciones: string | null;
  created_at: string;
}

export interface Medicamento {
  id: string;
  miembro_id: string;
  nombre: string;
  droga_componente: string | null;
  dosis: string | null;
  frecuencia: string | null;
  horario: string | null;
  activo: boolean;
  observaciones: string | null;
  created_at: string;
}

export interface Consulta {
  id: string;
  miembro_id: string;
  medico_id?: string | null;
  motivo: string;
  fecha_visita_anterior?: string | null;
  fecha_proxima_visita?: string | null;
  estado: 'programada' | 'completada' | 'cancelada';
  observaciones: string | null;
  created_at: string;
  medico_nombre?: string;
}

export interface Estudio {
  id: string;
  miembro_id: string;
  titulo: string;
  tipo_estudio: string;
  fecha: string;
  archivo_url?: string | null;
  archivo_nombre?: string | null;
  observaciones: string | null;
  created_at: string;
}
