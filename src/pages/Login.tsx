import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { Eye, EyeOff } from 'lucide-react';
import loginBg from '@/assets/login-bg.jpg';

// Purple palette (matches brand purple #1a1346 family)
const C = {
  bg: 'hsl(250, 30%, 96%)',
  overlay: 'hsl(250, 30%, 96%)',
  border: 'hsl(252, 20%, 86%)',
  inputBg: 'hsl(250, 35%, 98%)',
  inputBgHover: 'hsl(250, 30%, 95%)',
  primary: 'hsl(255, 55%, 55%)',
  primaryHover: 'hsl(255, 55%, 48%)',
  primaryRing: 'hsl(255, 55%, 55% / 0.2)',
  text: 'hsl(252, 35%, 18%)',
  textSoft: 'hsl(252, 20%, 35%)',
  textMuted: 'hsl(252, 12%, 50%)',
  textFaint: 'hsl(252, 12%, 60%)',
  link: 'hsl(255, 55%, 50%)',
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const { signIn } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const planParam = new URLSearchParams(window.location.search).get('plan');
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error('Erro ao entrar com Google');
        return;
      }
      if (result.redirected) return;
      navigate(planParam ? `/upgrade?autoCheckout=${planParam}` : '/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao entrar com Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (forgotMode) {
        await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        toast.success('Email enviado! Verifique sua caixa de entrada.');
        setForgotMode(false);
      } else {
        await signIn(email, password);
        navigate(planParam ? `/upgrade?autoCheckout=${planParam}` : '/dashboard');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao entrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4" style={{ backgroundColor: C.bg }}>
      {/* Background emblem (kept) */}
      <img
        src={loginBg}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover opacity-[0.35] pointer-events-none"
        width={1920}
        height={1080}
      />

      {/* Subtle overlay to soften */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: `${C.overlay}80` }} />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link to="/" className="font-display text-4xl font-bold" style={{ color: C.primary }}>
            Living Word
          </Link>
          <p className="text-sm mt-2" style={{ color: C.textMuted }}>
            {forgotMode
              ? (t('auth.forgot') || 'Recuperar senha')
              : 'Sua plataforma bíblica inteligente'}
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border bg-white/80 backdrop-blur-sm p-8 sm:p-10"
          style={{
            borderColor: `${C.border}99`,
            boxShadow: '0 8px 40px hsl(255, 40%, 40%, 0.10)',
          }}
        >
          <h2 className="font-display text-2xl font-bold text-center mb-7" style={{ color: C.text }}>
            {forgotMode ? (t('auth.forgot') || 'Recuperar senha') : (t('auth.login') || 'Entrar')}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-medium" style={{ color: C.textSoft }}>{t('auth.email') || 'Email'}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ borderColor: C.border, backgroundColor: C.inputBg, color: C.text }}
                placeholder="seu@email.com"
              />
            </div>
            {!forgotMode && (
              <div className="space-y-2">
                <Label htmlFor="password" className="font-medium" style={{ color: C.textSoft }}>{t('auth.password') || 'Senha'}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ borderColor: C.border, backgroundColor: C.inputBg, color: C.text }}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    aria-pressed={showPassword}
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 flex items-center justify-center px-3 rounded-r-md transition-colors hover:opacity-70"
                    style={{ color: C.textMuted }}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full py-6 text-base font-bold rounded-xl text-white shadow-md transition-colors"
              style={{ backgroundColor: C.primary }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.primaryHover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.primary)}
              disabled={loading}
            >
              {loading ? '...' : forgotMode ? 'Enviar link' : (t('auth.login') || 'Entrar')}
            </Button>

            {!forgotMode && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t" style={{ borderColor: C.border }} />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white/80 px-3" style={{ color: C.textFaint }}>ou</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full py-5 text-sm font-medium rounded-xl transition-colors"
                  style={{ borderColor: C.border, backgroundColor: C.inputBg, color: C.text }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.inputBgHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.inputBg)}
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  {googleLoading ? '...' : 'Continuar com Google'}
                </Button>
              </>
            )}

            <div className="text-center space-y-3 pt-2">
              <button
                type="button"
                onClick={() => setForgotMode(!forgotMode)}
                className="text-sm font-medium hover:underline"
                style={{ color: C.link }}
              >
                {forgotMode ? (t('auth.login') || 'Voltar ao login') : (t('auth.forgot') || 'Esqueci minha senha')}
              </button>
              {!forgotMode && (
                <p className="text-sm" style={{ color: C.textMuted }}>
                  <Link to={planParam ? `/cadastro?plan=${planParam}` : '/cadastro'} className="font-medium hover:underline" style={{ color: C.link }}>
                    {t('auth.create') || 'Criar conta'}
                  </Link>
                </p>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-8" style={{ color: C.textFaint }}>
          Feito com ❤️ por Living Word
        </p>
      </div>
    </div>
  );
}
