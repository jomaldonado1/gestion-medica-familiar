-- ====================================================================
-- ESQUEMA DE BASE DE DATOS PARA GESTIÓN MÉDICA Y SALUD FAMILIAR PWA
-- Supabase PostgreSQL + Row Level Security (RLS)
-- ====================================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA: PROFILES (Perfiles de Usuario integrados con Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    nombre_completo TEXT,
    telefono TEXT,
    rol TEXT NOT NULL DEFAULT 'user' CHECK (rol IN ('user', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Trigger para crear perfil automáticamente al registrarse un usuario en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, nombre_completo, rol)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
        'user'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. TABLA: MIEMBROS (Integrantes Familiares y Mascotas)
CREATE TABLE IF NOT EXISTS public.miembros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creado_por UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('Adulto Mayor / Padre', 'Yo / Adulto', 'Hijo / Menor', 'Mascota')),
    nombre TEXT NOT NULL,
    dni TEXT,
    obra_social TEXT,
    nro_afiliado TEXT,
    plan_obra_social TEXT,
    fecha_nacimiento DATE,
    grupo_sanguineo TEXT, -- Ej: 'A+', 'O-', 'B+', o N/A para mascotas
    especie_raza TEXT,    -- Para mascotas (Ej: 'Perro / Caniche')
    alergias TEXT,        -- Crítico para emergencias
    contacto_emergencia_nombre TEXT,
    contacto_emergencia_telefono TEXT,
    observaciones TEXT,
    qr_code_token UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
    foto_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Alter table migrations para bases de datos existentes
ALTER TABLE public.miembros ADD COLUMN IF NOT EXISTS dni TEXT;
ALTER TABLE public.miembros ADD COLUMN IF NOT EXISTS obra_social TEXT;
ALTER TABLE public.miembros ADD COLUMN IF NOT EXISTS nro_afiliado TEXT;
ALTER TABLE public.miembros ADD COLUMN IF NOT EXISTS plan_obra_social TEXT;

CREATE INDEX IF NOT EXISTS idx_miembros_qr_token ON public.miembros(qr_code_token);
CREATE INDEX IF NOT EXISTS idx_miembros_creado_por ON public.miembros(creado_por);


-- 3. TABLA: MIEMBRO_TUTORES (Gestión Compartida Multitutor)
CREATE TABLE IF NOT EXISTS public.miembro_tutores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    miembro_id UUID NOT NULL REFERENCES public.miembros(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rol TEXT NOT NULL DEFAULT 'editor' CHECK (rol IN ('propietario', 'editor', 'lector')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_miembro_tutor UNIQUE (miembro_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_miembro_tutores_user ON public.miembro_tutores(user_id);
CREATE INDEX IF NOT EXISTS idx_miembro_tutores_miembro ON public.miembro_tutores(miembro_id);


-- 4. TABLA: MEDICOS (Directorio de Profesionales y Veterinarios)
CREATE TABLE IF NOT EXISTS public.medicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    miembro_id UUID NOT NULL REFERENCES public.miembros(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    especialidad TEXT,
    telefono TEXT,
    centro_atencion TEXT,
    direccion TEXT,
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_medicos_miembro ON public.medicos(miembro_id);


-- 5. TABLA: MEDICAMENTOS (Fármacos y Tratamientos)
CREATE TABLE IF NOT EXISTS public.medicamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    miembro_id UUID NOT NULL REFERENCES public.miembros(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    droga_componente TEXT,
    dosis TEXT,
    frecuencia TEXT,
    horario TEXT,
    activo BOOLEAN NOT NULL DEFAULT true,
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_medicamentos_miembro ON public.medicamentos(miembro_id);
CREATE INDEX IF NOT EXISTS idx_medicamentos_activo ON public.medicamentos(activo);


-- 6. TABLA: CONSULTAS (Visitas Médicas y Turnos)
CREATE TABLE IF NOT EXISTS public.consultas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    miembro_id UUID NOT NULL REFERENCES public.miembros(id) ON DELETE CASCADE,
    medico_id UUID REFERENCES public.medicos(id) ON DELETE SET NULL,
    motivo TEXT NOT NULL,
    fecha_visita_anterior DATE,
    fecha_proxima_visita TIMESTAMPTZ,
    estado TEXT NOT NULL DEFAULT 'programada' CHECK (estado IN ('programada', 'completada', 'cancelada')),
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_consultas_miembro ON public.consultas(miembro_id);
CREATE INDEX IF NOT EXISTS idx_consultas_proxima ON public.consultas(fecha_proxima_visita);


-- 7. TABLA: ESTUDIOS (Estudios Médicos y Archivos Adjuntos)
CREATE TABLE IF NOT EXISTS public.estudios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    miembro_id UUID NOT NULL REFERENCES public.miembros(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    tipo_estudio TEXT NOT NULL, -- Ej: 'Análisis de Sangre', 'Radiografía', 'Ecografía', 'Informe'
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    archivo_url TEXT,
    archivo_nombre TEXT,
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_estudios_miembro ON public.estudios(miembro_id);


-- ====================================================================
-- FUNCIONES REUTILIZABLES PARA SEGURIDAD (RLS)
-- ====================================================================

-- Función helper para verificar si un usuario es tutor autorizado de un miembro
CREATE OR REPLACE FUNCTION public.is_tutor_of(_miembro_id UUID, _required_roles TEXT[] DEFAULT ARRAY['propietario', 'editor', 'lector'])
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.miembro_tutores 
        WHERE miembro_id = _miembro_id 
          AND user_id = auth.uid() 
          AND rol = ANY(_required_roles)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.miembros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.miembro_tutores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estudios ENABLE ROW LEVEL SECURITY;

-- 1. POLÍTICAS PARA PROFILES
CREATE POLICY "Los usuarios pueden ver su propio perfil" 
    ON public.profiles FOR SELECT USING (auth.uid() = id OR rol = 'admin');

CREATE POLICY "Los usuarios pueden actualizar su propio perfil" 
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. POLÍTICAS PARA MIEMBROS
CREATE POLICY "Tutores pueden ver sus miembros" 
    ON public.miembros FOR SELECT 
    USING (public.is_tutor_of(id) OR auth.jwt()->>'role' = 'service_role');

-- Lectura pública solo para la Ficha Rápida de Emergencia por token
CREATE POLICY "Acceso público por QR token" 
    ON public.miembros FOR SELECT 
    USING (true);

CREATE POLICY "Usuarios autenticados pueden crear miembros" 
    ON public.miembros FOR INSERT 
    WITH CHECK (auth.uid() = creado_por);

CREATE POLICY "Propietarios y Editores pueden actualizar miembros" 
    ON public.miembros FOR UPDATE 
    USING (public.is_tutor_of(id, ARRAY['propietario', 'editor']));

CREATE POLICY "Solo Propietarios pueden eliminar miembros" 
    ON public.miembros FOR DELETE 
    USING (public.is_tutor_of(id, ARRAY['propietario']));


-- 3. POLÍTICAS PARA MIEMBRO_TUTORES
CREATE POLICY "Ver relaciones de tutores" 
    ON public.miembro_tutores FOR SELECT 
    USING (user_id = auth.uid() OR public.is_tutor_of(miembro_id));

CREATE POLICY "Propietarios pueden invitar o modificar tutores" 
    ON public.miembro_tutores FOR ALL 
    USING (public.is_tutor_of(miembro_id, ARRAY['propietario']));


-- 4. POLÍTICAS PARA MEDICOS, MEDICAMENTOS, CONSULTAS Y ESTUDIOS
-- Médicos
CREATE POLICY "Tutores pueden ver medicos" ON public.medicos FOR SELECT USING (public.is_tutor_of(miembro_id));
CREATE POLICY "Editores pueden gestionar medicos" ON public.medicos FOR ALL USING (public.is_tutor_of(miembro_id, ARRAY['propietario', 'editor']));

-- Medicamentos
CREATE POLICY "Tutores pueden ver medicamentos" ON public.medicamentos FOR SELECT USING (public.is_tutor_of(miembro_id));
CREATE POLICY "Editores pueden gestionar medicamentos" ON public.medicamentos FOR ALL USING (public.is_tutor_of(miembro_id, ARRAY['propietario', 'editor']));

-- Consultas
CREATE POLICY "Tutores pueden ver consultas" ON public.consultas FOR SELECT USING (public.is_tutor_of(miembro_id));
CREATE POLICY "Editores pueden gestionar consultas" ON public.consultas FOR ALL USING (public.is_tutor_of(miembro_id, ARRAY['propietario', 'editor']));

-- Estudios
CREATE POLICY "Tutores pueden ver estudios" ON public.estudios FOR SELECT USING (public.is_tutor_of(miembro_id));
CREATE POLICY "Editores pueden gestionar estudios" ON public.estudios FOR ALL USING (public.is_tutor_of(miembro_id, ARRAY['propietario', 'editor']));

-- ====================================================================
-- BUCKETS DE STORAGE (CONFIGURACIÓN DE ARCHIVOS)
-- ====================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('estudios-medicos', 'estudios-medicos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Usuarios autenticados pueden subir estudios" 
    ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'estudios-medicos' AND auth.role() = 'authenticated');

CREATE POLICY "Cualquier tutor autenticado puede leer estudios" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'estudios-medicos');
