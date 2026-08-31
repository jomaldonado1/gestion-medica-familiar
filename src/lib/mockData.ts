import { Miembro, Medico, Medicamento, Consulta, Estudio, PerfilUser } from './types';

export const INITIAL_USER: PerfilUser = {
  id: 'usr-1',
  email: 'maria.gonzalez@ejemplo.com',
  nombre_completo: 'María González',
  telefono: '+54 9 11 4567-8901',
  rol: 'admin',
  created_at: new Date().toISOString()
};

export const INITIAL_MIEMBROS: Miembro[] = [
  {
    id: 'm-1',
    creado_por: 'usr-1',
    tipo: 'Adulto Mayor / Padre',
    nombre: 'Carmen González (Madre)',
    fecha_nacimiento: '1948-06-15',
    grupo_sanguineo: 'A+',
    especie_raza: null,
    alergias: 'Penicilina, Salicilatos, Mariscos',
    contacto_emergencia_nombre: 'María González (Hija)',
    contacto_emergencia_telefono: '+54 9 11 4567-8901',
    observaciones: 'Hipertensión crónica controlada. Usa audífono en oído izquierdo.',
    qr_code_token: 'emergency-carmen-1948-token-abc',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    rol_actual: 'propietario'
  },
  {
    id: 'm-2',
    creado_por: 'usr-1',
    tipo: 'Hijo / Menor',
    nombre: 'Lucas Gómez',
    fecha_nacimiento: '2016-11-20',
    grupo_sanguineo: 'O+',
    especie_raza: null,
    alergias: 'Polen, Ácaros, Ibuprofeno',
    contacto_emergencia_nombre: 'María González (Mamá)',
    contacto_emergencia_telefono: '+54 9 11 4567-8901',
    observaciones: 'Asma bronquial leve. Calendario de vacunación al día.',
    qr_code_token: 'emergency-lucas-2016-token-def',
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    rol_actual: 'propietario'
  },
  {
    id: 'm-3',
    creado_por: 'usr-1',
    tipo: 'Mascota',
    nombre: 'Toby',
    fecha_nacimiento: '2020-04-10',
    grupo_sanguineo: 'N/A',
    especie_raza: 'Perro / Golden Retriever',
    alergias: 'Picadura de pulgas',
    contacto_emergencia_nombre: 'Veterinaria Central 24hs',
    contacto_emergencia_telefono: '+54 9 11 9988-7766',
    observaciones: 'Vacuna antirrábica aplicada en mayo 2026. Desparasitado.',
    qr_code_token: 'emergency-toby-dog-token-ghi',
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
    rol_actual: 'propietario'
  }
];

export const INITIAL_MEDICOS: Medico[] = [
  {
    id: 'med-1',
    miembro_id: 'm-1',
    nombre: 'Dr. Alejandro Benítez',
    especialidad: 'Cardiología',
    telefono: '+54 9 11 5544-3322',
    centro_atencion: 'Sanatorio Anchorena',
    direccion: 'Av. Pueyrredón 1561, CABA',
    observaciones: 'Atiende lunes y jueves por la mañana.',
    created_at: new Date().toISOString()
  },
  {
    id: 'med-2',
    miembro_id: 'm-1',
    nombre: 'Dra. Patricia Rossi',
    especialidad: 'Geriatría / Medicina General',
    telefono: '+54 9 11 4433-2211',
    centro_atencion: 'Hospital Italiano',
    direccion: 'Tte. Gral. Juan D. Perón 4190, CABA',
    observaciones: 'Médica de cabecera.',
    created_at: new Date().toISOString()
  },
  {
    id: 'med-3',
    miembro_id: 'm-2',
    nombre: 'Dra. Sofía Martínez',
    especialidad: 'Pediatría',
    telefono: '+54 9 11 6677-8899',
    centro_atencion: 'Centro Médico Infantil',
    direccion: 'Av. Cabildo 2200, CABA',
    observaciones: 'Control de crecimiento anual.',
    created_at: new Date().toISOString()
  },
  {
    id: 'med-4',
    miembro_id: 'm-3',
    nombre: 'Dr. Gonzalo Peralta',
    especialidad: 'Veterinaria General',
    telefono: '+54 9 11 9988-7766',
    centro_atencion: 'Veterinaria San Martín 24hs',
    direccion: 'Av. San Martín 3410, CABA',
    observaciones: 'Atención de emergencias 24hs.',
    created_at: new Date().toISOString()
  }
];

export const INITIAL_MEDICAMENTOS: Medicamento[] = [
  {
    id: 'farm-1',
    miembro_id: 'm-1',
    nombre: 'Enalapril 10mg',
    droga_componente: 'Enalapril Maleato',
    dosis: '1 comprimido',
    frecuencia: 'Cada 12 horas',
    horario: '08:00 y 20:00 hs',
    activo: true,
    observaciones: 'Tomar con abundante agua antes de las comidas.',
    created_at: new Date().toISOString()
  },
  {
    id: 'farm-2',
    miembro_id: 'm-1',
    nombre: 'Atorvastatina 20mg',
    droga_componente: 'Atorvastatina Cálcica',
    dosis: '1 comprimido',
    frecuencia: 'Diaria (noche)',
    horario: '21:30 hs',
    activo: true,
    observaciones: 'Control para colesterol elevado.',
    created_at: new Date().toISOString()
  },
  {
    id: 'farm-3',
    miembro_id: 'm-2',
    nombre: 'Salbutamol Inhalador 100mcg',
    droga_componente: 'Salbutamol',
    dosis: '2 disparos (puffs)',
    frecuencia: 'Según necesidad o previo a deporte',
    horario: 'S.O.S (Crisis)',
    activo: true,
    observaciones: 'Usar con cámara espaciadora.',
    created_at: new Date().toISOString()
  },
  {
    id: 'farm-4',
    miembro_id: 'm-3',
    nombre: 'Bravecto Comprimido',
    droga_componente: 'Fluralaner',
    dosis: '1 comprimido masticable',
    frecuencia: 'Cada 3 meses',
    horario: 'Día 10 del mes',
    activo: true,
    observaciones: 'Prevención antipulgas y garrapatas.',
    created_at: new Date().toISOString()
  }
];

export const INITIAL_CONSULTAS: Consulta[] = [
  {
    id: 'cons-1',
    miembro_id: 'm-1',
    medico_id: 'med-1',
    motivo: 'Chequeo Cardiológico Anual y Holter',
    fecha_visita_anterior: '2025-09-10',
    fecha_proxima_visita: new Date(Date.now() + 3 * 86400000).toISOString(),
    estado: 'programada',
    observaciones: 'Llevar estudios de laboratorio previos.',
    medico_nombre: 'Dr. Alejandro Benítez',
    created_at: new Date().toISOString()
  },
  {
    id: 'cons-2',
    miembro_id: 'm-2',
    medico_id: 'med-3',
    motivo: 'Control Pedriátrico de los 9 años',
    fecha_visita_anterior: '2025-11-05',
    fecha_proxima_visita: new Date(Date.now() + 12 * 86400000).toISOString(),
    estado: 'programada',
    observaciones: 'Solicitar certificado de aptitud física escolar.',
    medico_nombre: 'Dra. Sofía Martínez',
    created_at: new Date().toISOString()
  },
  {
    id: 'cons-3',
    miembro_id: 'm-3',
    medico_id: 'med-4',
    motivo: 'Refuerzo Anual de Vacunas y Limpieza Dental',
    fecha_visita_anterior: '2025-05-12',
    fecha_proxima_visita: new Date(Date.now() - 5 * 86400000).toISOString(),
    estado: 'completada',
    observaciones: 'Salud general excelente. Peso: 31.5 kg.',
    medico_nombre: 'Dr. Gonzalo Peralta',
    created_at: new Date().toISOString()
  }
];

export const INITIAL_ESTUDIOS: Estudio[] = [
  {
    id: 'est-1',
    miembro_id: 'm-1',
    titulo: 'Análisis de Sangre y Lipídico Completo',
    tipo_estudio: 'Análisis de Sangre',
    fecha: '2026-07-14',
    archivo_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=60',
    archivo_nombre: 'analisis_sangre_carmen_jul2026.pdf',
    observaciones: 'Colesterol total 195 mg/dL. Glucemia normal.',
    created_at: new Date().toISOString()
  },
  {
    id: 'est-2',
    miembro_id: 'm-1',
    titulo: 'Electrocardiograma de Reposo',
    tipo_estudio: 'Informe ECG',
    fecha: '2026-06-02',
    archivo_url: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=800&auto=format&fit=crop&q=60',
    archivo_nombre: 'ecg_carmen_jun2026.pdf',
    observaciones: 'Ritmo sinusal regular. Sin signos de isquemia.',
    created_at: new Date().toISOString()
  },
  {
    id: 'est-3',
    miembro_id: 'm-2',
    titulo: 'Espirometría y Pruebas Alérgicas',
    tipo_estudio: 'Informe Neumonología',
    fecha: '2026-04-18',
    archivo_url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=60',
    archivo_nombre: 'espirometria_lucas_2026.pdf',
    observaciones: 'Capacidad pulmonar adecuada con respuesta a salbutamol.',
    created_at: new Date().toISOString()
  }
];
