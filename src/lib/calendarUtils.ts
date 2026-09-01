/**
 * Utilidades para Sincronización de Calendarios (Google Calendar y .ICS) 
 * y Notificaciones de 1-Clic por WhatsApp.
 */

export function generarGoogleCalendarUrl(params: {
  motivo: string;
  pacienteNombre: string;
  medicoNombre?: string;
  centroAtencion?: string;
  direccion?: string;
  fechaProximaVisita: string; // ISO string
  observaciones?: string | null;
}) {
  const startDate = new Date(params.fechaProximaVisita);
  // Asumir 1 hora de duración
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  const formatIsoForGCal = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d\d\d/g, '');
  };

  const title = encodeURIComponent(`Turno Médico: ${params.motivo} (${params.pacienteNombre})`);
  const dates = `${formatIsoForGCal(startDate)}/${formatIsoForGCal(endDate)}`;
  const location = encodeURIComponent([params.centroAtencion, params.direccion].filter(Boolean).join(', '));
  const details = encodeURIComponent(
    `Paciente: ${params.pacienteNombre}\nMédico/Especialista: ${params.medicoNombre || 'No especificado'}\nMotivo: ${params.motivo}\nObservaciones: ${params.observaciones || 'Ninguna'}`
  );

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
}

export function descargarArchivoICS(params: {
  motivo: string;
  pacienteNombre: string;
  medicoNombre?: string;
  centroAtencion?: string;
  direccion?: string;
  fechaProximaVisita: string; // ISO string
  observaciones?: string | null;
}) {
  const startDate = new Date(params.fechaProximaVisita);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  const formatIsoForICS = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d\d\d/g, '');
  };

  const nowFormatted = formatIsoForICS(new Date());
  const startFormatted = formatIsoForICS(startDate);
  const endFormatted = formatIsoForICS(endDate);
  const uid = `med-turno-${Date.now()}@medfamiliar.pwa`;
  const location = [params.centroAtencion, params.direccion].filter(Boolean).join(', ');
  const description = `Paciente: ${params.pacienteNombre}\\nMédico: ${params.medicoNombre || 'No especificado'}\\nMotivo: ${params.motivo}\\nObservaciones: ${params.observaciones || 'Sin observaciones'}`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MedFamiliar PWA//Salud y Turnos//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${nowFormatted}`,
    `DTSTART:${startFormatted}`,
    `DTEND:${endFormatted}`,
    `SUMMARY:Turno Médico: ${params.motivo} - ${params.pacienteNombre}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT24H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Recordatorio de Turno Médico (en 24hs)',
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Recordatorio URGENTE de Turno Médico (en 2hs)',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `turno_${params.pacienteNombre.toLowerCase().replace(/\s+/g, '_')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generarWhatsAppUrl(params: {
  telefono: string;
  pacienteNombre: string;
  medicoNombre?: string;
  especialidad?: string;
  motivo: string;
  fechaHoraIso: string;
  lugar?: string;
  tipoRecordatorio: 'paciente' | 'emergencia';
}) {
  let cleanPhone = params.telefono.replace(/[^\d]/g, '');

  const fechaObj = new Date(params.fechaHoraIso);
  const fechaStr = fechaObj.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const horaStr = fechaObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  let mensaje = '';
  if (params.tipoRecordatorio === 'paciente') {
    mensaje = `Hola ${params.pacienteNombre}! 👋 Te recuerdo tu próximo turno médico:\n\n🩺 *Médico:* ${params.medicoNombre || 'No especificado'} ${params.especialidad ? `(${params.especialidad})` : ''}\n📅 *Fecha:* ${fechaStr}\n⏰ *Hora:* ${horaStr} hs\n📍 *Lugar:* ${params.lugar || 'No especificado'}\n📝 *Motivo:* ${params.motivo}\n\nEnviado desde MedFamiliar PWA 🏥`;
  } else {
    mensaje = `Hola! Te aviso sobre el próximo turno médico de *${params.pacienteNombre}*:\n\n🩺 *Médico:* ${params.medicoNombre || 'No especificado'}\n📅 *Fecha:* ${fechaStr}\n⏰ *Hora:* ${horaStr} hs\n📍 *Lugar:* ${params.lugar || 'No especificado'}\n📝 *Motivo:* ${params.motivo}\n\nEnviado desde MedFamiliar PWA 🏥`;
  }

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(mensaje)}`;
}
