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
