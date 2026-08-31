# 🏥 MedFamiliar PWA - Gestión Médica y Salud Familiar Integral

Aplicación Web Progresiva (PWA) 100% responsiva (Mobile-First para celulares, adaptable a tablets y computadoras) para la gestión unificada e integral del historial médico, tratamientos, consultas y fichas de emergencia de la familia (adultos mayores, adultos, niños y mascotas).

---

## ✨ Características Principales

1. **Gestión Multitutor Compartida (`miembro_tutores`):**
   - Un usuario puede registrar múltiples integrantes familiares (Padres/Adultos Mayores, Yo/Adulto, Hijos/Menores, Mascotas).
   - Acceso compartido multitutor en tiempo real con roles (`propietario`, `editor`, `lector`) para coordinar el cuidado de los padres o familiares entre varios tutores.

2. **Ficha Rápida de Emergencia SOS (`/emergencia/[token]`):**
   - Vista pública accesible por enlace o Código QR único **sin requerir inicio de sesión**.
   - Muestra de forma inmediata y en alto contraste: Grupo Sanguíneo, Alergias Críticas, Medicamentos Activos y Botón de Llamada de 1-clic a contactos de urgencia.

3. **Módulos Médicos Integrados:**
   - 🩺 **Médicos y Veterinarios:** Directorio de profesionales, clínica, especialidad y llamadas directas.
   - 💊 **Medicamentos y Tratamientos:** Control de fármacos, dosis, horarios y switch activo/inactivo.
   - 📅 **Consultas y Turnos:** Recordatorios con alerta visual de urgencia ("¡Hoy!", "Mañana", "En X días").
   - 📁 **Estudios Médicos:** Carga y vista previa de PDFs o imágenes clínicas (Supabase Storage).

4. **Panel Super Administrador (`/admin`):**
   - Monitoreo global de usuarios, volumen de integrantes, estudios subidos y estado operativo de Supabase.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS.
- **Iconografía & QR:** Lucide React, `qrcode.react`.
- **Backend / Database:** Supabase (PostgreSQL + Supabase Auth + Supabase Storage).

---

## 🚀 Configuración y Despliegue

### 1. Variables de Entorno (`.env.local`)
Copia `.env.local.example` a `.env.local` y agrega las credenciales de tu proyecto en Supabase:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

### 2. Base de Datos (SQL Schema)
Ejecuta el script [`supabase/schema.sql`](supabase/schema.sql) en el **SQL Editor** de tu consola de Supabase. Esto creará automáticamente las tablas, índices, triggers y políticas de seguridad RLS.

### 3. Desarrollo Local
```bash
npm install
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### 4. Despliegue en Vercel
1. Conecta este repositorio en Vercel.
2. Configura las variables de entorno `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Vercel compilará automáticamente con `npm run build`.
