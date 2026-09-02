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
    rol TEXT NOT NULL DEFAULT 'cliente' CHECK (rol IN ('cliente', 'superadmin', 'user', 'admin')),
    plan_nombre TEXT NOT NULL DEFAULT 'prueba' CHECK (plan_nombre IN ('prueba', 'singular', 'familia', 'tribu')),
    max_integrantes INTEGER NOT NULL DEFAULT 1,
    fecha_alta TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    plan_expira TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + INTERVAL '90 days'),
    estado_suscripcion TEXT NOT NULL DEFAULT 'activo' CHECK (estado_suscripcion IN ('activo', 'vencido', 'pausado')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Migraciones seguras IF NOT EXISTS para bases de datos existentes
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rol TEXT DEFAULT 'cliente';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan_nombre TEXT DEFAULT 'prueba';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS max_integrantes INTEGER DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fecha_alta TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan_expira TIMESTAMPTZ DEFAULT (timezone('utc'::text, now()) + INTERVAL '90 days');
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS estado_suscripcion TEXT DEFAULT 'activo';

-- Trigger para crear perfil automáticamente al registrarse un usuario en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id, 
        email, 
        nombre_completo, 
        rol,
        plan_nombre,
        max_integrantes,
        fecha_alta,
        plan_expira,
        estado_suscripcion
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
        'cliente',
        'prueba',
        1,
        timezone('utc'::text, now()),
        timezone('utc'::text, now()) + INTERVAL '90 days',
        'activo'
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
    telefono TEXT,
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
ALTER TABLE public.miembros ADD COLUMN IF NOT EXISTS telefono TEXT;
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

-- TRIGGER AUTOMÁTICO: Vincular tutor propietario al crear un miembro
CREATE OR REPLACE FUNCTION public.handle_new_miembro()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.miembro_tutores (miembro_id, user_id, rol)
    VALUES (NEW.id, NEW.creado_por, 'propietario')
    ON CONFLICT (miembro_id, user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_miembro_created
    AFTER INSERT ON public.miembros
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_miembro();


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
    tipo_estudio TEXT NOT NULL,
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

CREATE OR REPLACE FUNCTION public.is_tutor_of(_miembro_id UUID, _required_roles TEXT[] DEFAULT ARRAY['propietario', 'editor', 'lector'])
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.miembro_tutores 
        WHERE miembro_id = _miembro_id 
          AND user_id = auth.uid() 
          AND rol = ANY(_required_roles)
    ) OR EXISTS (
        SELECT 1 
        FROM public.miembros 
        WHERE id = _miembro_id 
          AND creado_por = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (rol = 'superadmin' OR rol = 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES PERMISIVAS Y GARANTIZADAS
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.miembros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.miembro_tutores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estudios ENABLE ROW LEVEL SECURITY;

-- 1. POLÍTICAS PARA PROFILES
DROP POLICY IF EXISTS "Los usuarios pueden ver su propio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Los usuarios o admin pueden ver perfiles" ON public.profiles;
CREATE POLICY "Los usuarios o admin pueden ver perfiles" 
    ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_superadmin());

DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Los usuarios o admin pueden actualizar perfil" ON public.profiles;
CREATE POLICY "Los usuarios o admin pueden actualizar perfil" 
    ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_superadmin());

-- 2. POLÍTICAS PARA MIEMBROS
DROP POLICY IF EXISTS "Tutores pueden ver sus miembros" ON public.miembros;
DROP POLICY IF EXISTS "Acceso público por QR token" ON public.miembros;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear miembros" ON public.miembros;
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar miembros" ON public.miembros;
DROP POLICY IF EXISTS "Propietarios y Editores pueden actualizar miembros" ON public.miembros;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar miembros" ON public.miembros;
DROP POLICY IF EXISTS "Solo Propietarios pueden eliminar miembros" ON public.miembros;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar miembros" ON public.miembros;
DROP POLICY IF EXISTS "Acceso a miembros por tutores o QR publico" ON public.miembros;
DROP POLICY IF EXISTS "Permitir todo a autenticados en miembros" ON public.miembros;

CREATE POLICY "Permitir todo a autenticados en miembros" 
    ON public.miembros FOR ALL TO authenticated 
    USING (true) WITH CHECK (true);

CREATE POLICY "Acceso público por QR token" 
    ON public.miembros FOR SELECT TO anon 
    USING (true);


-- 3. POLÍTICAS PARA MIEMBRO_TUTORES
DROP POLICY IF EXISTS "Ver relaciones de tutores" ON public.miembro_tutores;
DROP POLICY IF EXISTS "Propietarios pueden invitar o modificar tutores" ON public.miembro_tutores;

CREATE POLICY "Permitir todo a tutores en miembro_tutores" 
    ON public.miembro_tutores FOR ALL 
    USING (auth.role() = 'authenticated');


-- 4. POLÍTICAS PARA MEDICOS, MEDICAMENTOS, CONSULTAS Y ESTUDIOS
DROP POLICY IF EXISTS "Tutores pueden ver medicos" ON public.medicos;
DROP POLICY IF EXISTS "Editores pueden gestionar medicos" ON public.medicos;
DROP POLICY IF EXISTS "Permitir todo en medicos" ON public.medicos;
DROP POLICY IF EXISTS "Permitir todo a autenticados en medicos" ON public.medicos;
CREATE POLICY "Permitir todo a autenticados en medicos" 
    ON public.medicos FOR ALL TO authenticated 
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Tutores pueden ver medicamentos" ON public.medicamentos;
DROP POLICY IF EXISTS "Editores pueden gestionar medicamentos" ON public.medicamentos;
DROP POLICY IF EXISTS "Permitir lectura en medicamentos" ON public.medicamentos;
DROP POLICY IF EXISTS "Permitir gestion a usuarios autenticados en medicamentos" ON public.medicamentos;
DROP POLICY IF EXISTS "Permitir todo a autenticados en medicamentos" ON public.medicamentos;
CREATE POLICY "Permitir todo a autenticados en medicamentos" 
    ON public.medicamentos FOR ALL TO authenticated 
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Tutores pueden ver consultas" ON public.consultas;
DROP POLICY IF EXISTS "Editores pueden gestionar consultas" ON public.consultas;
DROP POLICY IF EXISTS "Permitir todo en consultas" ON public.consultas;
DROP POLICY IF EXISTS "Permitir todo a autenticados en consultas" ON public.consultas;
CREATE POLICY "Permitir todo a autenticados en consultas" 
    ON public.consultas FOR ALL TO authenticated 
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Tutores pueden ver estudios" ON public.estudios;
DROP POLICY IF EXISTS "Editores pueden gestionar estudios" ON public.estudios;
DROP POLICY IF EXISTS "Permitir todo en estudios" ON public.estudios;
DROP POLICY IF EXISTS "Permitir todo a autenticados en estudios" ON public.estudios;
CREATE POLICY "Permitir todo a autenticados en estudios" 
    ON public.estudios FOR ALL TO authenticated 
    USING (true) WITH CHECK (true);

-- ====================================================================
-- BUCKETS DE STORAGE (CONFIGURACIÓN DE ARCHIVOS)
-- ====================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('estudios-medicos', 'estudios-medicos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Usuarios autenticados pueden subir estudios" ON storage.objects;
CREATE POLICY "Usuarios autenticados pueden subir estudios" 
    ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'estudios-medicos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Cualquier tutor autenticado puede leer estudios" ON storage.objects;
CREATE POLICY "Cualquier tutor autenticado puede leer estudios" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'estudios-medicos');
