'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HeartPulse, Mail, Lock, ArrowRight, Sparkles, KeyRound, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [modoMagicLink, setModoMagicLink] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje(null);

    try {
      if (modoMagicLink) {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        setMensaje({
          tipo: 'exito',
          texto: '¡Magic Link enviado! Revisa tu bandeja de entrada para ingresar sin contraseña.'
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      setMensaje({
        tipo: 'error',
        texto: err.message || 'Error al iniciar sesión. Revisa tus credenciales o el estado de Supabase.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-200 relative overflow-hidden">
        
        {/* Decorativo Superior */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-sky-600 text-white rounded-2xl mb-3 shadow-lg">
            <HeartPulse className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">MedFamiliar PWA</h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestión médica y salud familiar unificada en tiempo real.
          </p>
        </div>

        {/* Mensaje de estado */}
        {mensaje && (
          <div className={`p-3.5 rounded-2xl text-xs font-bold mb-4 flex items-start gap-2 ${
            mensaje.tipo === 'exito'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{mensaje.texto}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                placeholder="tu.email@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3 py-3 text-xs font-semibold text-slate-800 focus:outline-sky-600"
              />
            </div>
          </div>

          {!modoMagicLink && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-700">Contraseña</label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-bold text-sky-600 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3 py-3 text-xs font-semibold text-slate-800 focus:outline-sky-600"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs py-3.5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Procesando...</span>
            ) : (
              <>
                <span>{modoMagicLink ? 'Enviar Magic Link' : 'Iniciar Sesión'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Conmutador Magic Link */}
        <div className="mt-4 text-center">
          <button
            onClick={() => setModoMagicLink(!modoMagicLink)}
            className="text-xs text-slate-600 font-bold hover:text-slate-900 flex items-center justify-center gap-1.5 mx-auto"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{modoMagicLink ? 'Ingresar con contraseña' : 'Ingresar con enlace directo (Magic Link)'}</span>
          </button>
        </div>

        {/* Footer Registro */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            ¿No tienes cuenta aún?{' '}
            <Link href="/register" className="text-sky-600 font-bold hover:underline">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
