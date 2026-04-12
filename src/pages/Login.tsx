// @ts-nocheck
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import loginBg from '@/assets/login-bg.jpg';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="min-h-screen relative flex items-center justify-center p-4" style={{ backgroundColor: 'hsl(37, 33%, 94%)' }}>
      {/* Background image with low opacity */}
      <img
        src={loginBg}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover opacity-[0.35] pointer-events-none"
        width={1920}
        height={1080}
      />

      {/* Subtle overlay to soften */}
      <div className="absolute inset-0 bg-[hsl(37,33%,94%)]/50 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link to="/" className="font-display text-4xl font-bold" style={{ color: 'hsl(28, 42%, 38%)' }}>
            Living Word
          </Link>
          <p className="text-sm mt-2" style={{ color: 'hsl(24, 15%, 45%)' }}>
            {forgotMode
              ? (t('auth.forgot') || 'Recuperar senha')
              : 'Sua plataforma pastoral inteligente'}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[hsl(30,15%,82%)]/60 bg-white/80 backdrop-blur-sm shadow-[0_8px_40px_hsl(28,20%,50%,0.08)] p-8 sm:p-10">
          {/* Dev-only Master Quick Access */}
          {import.meta.env.DEV && (
            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                try {
                  await signIn('bx4usa@gmail.com', 'Master@123');
                  navigate(planParam ? `/upgrade?autoCheckout=${planParam}` : '/dashboard');
                } catch (err: any) {
                  toast.error(err.message || 'Erro no login master');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="w-full mb-6 py-4 text-lg font-bold rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg hover:scale-[1.02] transition-transform"
            >
              🔥 Acesso Rápido Master (bx4usa@gmail.com)
            </button>
          )}

          <h2 className="font-display text-2xl font-bold text-center mb-7" style={{ color: 'hsl(24, 30%, 18%)' }}>
            {forgotMode ? (t('auth.forgot') || 'Recuperar senha') : (t('auth.login') || 'Entrar')}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[hsl(24,20%,30%)] font-medium">{t('auth.email') || 'Email'}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-[hsl(30,15%,82%)] bg-[hsl(37,30%,97%)] focus:border-[hsl(28,42%,50%)] focus:ring-[hsl(28,42%,50%)]/20 text-[hsl(24,30%,15%)] placeholder:text-[hsl(24,15%,60%)]"
                placeholder="seu@email.com"
              />
            </div>
            {!forgotMode && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[hsl(24,20%,30%)] font-medium">{t('auth.password') || 'Senha'}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-[hsl(30,15%,82%)] bg-[hsl(37,30%,97%)] focus:border-[hsl(28,42%,50%)] focus:ring-[hsl(28,42%,50%)]/20 text-[hsl(24,30%,15%)]"
                  placeholder="••••••••"
                />
              </div>
            )}

            <Button
              type="submit"
              className="w-full py-6 text-base font-bold rounded-xl bg-[hsl(28,42%,42%)] hover:bg-[hsl(28,42%,36%)] text-white shadow-md"
              disabled={loading}
            >
              {loading ? '...' : forgotMode ? 'Enviar link' : (t('auth.login') || 'Entrar')}
            </Button>

            {!forgotMode && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[hsl(30,15%,82%)]" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white/80 px-3 text-[hsl(24,15%,55%)]">ou</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full py-5 text-sm font-medium rounded-xl border-[hsl(30,15%,82%)] bg-[hsl(37,30%,97%)] hover:bg-[hsl(37,25%,94%)] text-[hsl(24,30%,18%)]"
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
                style={{ color: 'hsl(28, 42%, 42%)' }}
              >
                {forgotMode ? (t('auth.login') || 'Voltar ao login') : (t('auth.forgot') || 'Esqueci minha senha')}
              </button>
              {!forgotMode && (
                <p className="text-sm" style={{ color: 'hsl(24, 15%, 50%)' }}>
                  <Link to={planParam ? `/cadastro?plan=${planParam}` : '/cadastro'} className="font-medium hover:underline" style={{ color: 'hsl(28, 42%, 42%)' }}>
                    {t('auth.create') || 'Criar conta'}
                  </Link>
                </p>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-8" style={{ color: 'hsl(24, 15%, 55%)' }}>
          Feito com ❤️ por Living Word
        </p>
      </div>
    </div>
  );
}
