'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { HeartPulse, Mail, ArrowRight, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
      });

      if (error) throw error;

      setMensaje({
        tipo: 'exito',
        texto: '¡Instrucciones enviadas! Revisa tu correo electrónico para restablecer tu contraseña.'
      });
    } catch (err: any) {
      setMensaje({
        tipo: 'error',
        texto: err.message || 'Error al solicitar restablecimiento de contraseña.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-200 relative overflow-hidden">
        
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-amber-500 text-white rounded-2xl mb-3 shadow-lg">
            <HeartPulse className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Restablecer Contraseña</h1>
          <p className="text-xs text-slate-500 mt-1">
            Ingresa tu correo registrado y te enviaremos un enlace de recuperación.
          </p>
        </div>

        {mensaje && (
          <div className={`p-3.5 rounded-2xl text-xs font-bold mb-4 flex items-start gap-2 ${
            mensaje.tipo === 'exito'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {mensaje.tipo === 'exito' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            )}
            <span>{mensaje.texto}</span>
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico Registrado</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                placeholder="tu.email@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3 py-3 text-xs font-semibold text-slate-800 focus:outline-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-3.5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Enviando enlace...</span>
            ) : (
              <>
                <span>Enviar Enlace de Recuperación</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-bold hover:text-slate-900">
            <ArrowLeft className="w-3.5 h-3.5" /> Volver a Iniciar Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
