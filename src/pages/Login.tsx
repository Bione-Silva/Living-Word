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
import { BrandIcon } from '@/components/BrandIcon';
import { useForceLightTheme } from '@/hooks/useForceLightTheme';

const PURPLE_THEME = {
  '--primary': '263 70% 50%',
  '--primary-foreground': '0 0% 100%',
  '--ring': '263 70% 50%',
} as React.CSSProperties;

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
    <div
      className="theme-app min-h-screen relative flex items-center justify-center p-4"
      style={{
        ...PURPLE_THEME,
        backgroundColor: '#F1ECFA',
        backgroundImage: `url(${loginBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Soft purple wash to keep card readable */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 40%, hsl(263 70% 96% / 0.65), hsl(263 60% 90% / 0.35) 60%, transparent 100%)',
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <BrandIcon className="h-7 w-7" />
            </div>
            <span className="font-display text-3xl font-bold" style={{ color: 'hsl(263 70% 35%)' }}>Living Word</span>
          </Link>
          <p className="text-sm mt-3" style={{ color: 'hsl(263 30% 40%)' }}>
            {forgotMode
              ? (t('auth.forgot') || 'Recuperar senha')
              : 'Sua plataforma bíblica inteligente'}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card text-card-foreground shadow-xl shadow-primary/5 p-8 sm:p-10">
          <h2 className="font-display text-2xl font-bold text-center mb-7 text-foreground">
            {forgotMode ? (t('auth.forgot') || 'Recuperar senha') : (t('auth.login') || 'Entrar')}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-medium">{t('auth.email') || 'Email'}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                className="bg-background border-border"
              />
            </div>
            {!forgotMode && (
              <div className="space-y-2">
                <Label htmlFor="password" className="font-medium">{t('auth.password') || 'Senha'}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="pr-10 bg-background border-border"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    aria-pressed={showPassword}
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 flex items-center justify-center px-3 rounded-r-md text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full py-6 text-base font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
              disabled={loading}
            >
              {loading ? '...' : forgotMode ? 'Enviar link' : (t('auth.login') || 'Entrar')}
            </Button>

            {!forgotMode && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-3 text-muted-foreground">ou</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full py-5 text-sm font-medium rounded-xl bg-background border-border hover:bg-muted"
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
                className="text-sm font-medium text-primary hover:underline"
              >
                {forgotMode ? (t('auth.login') || 'Voltar ao login') : (t('auth.forgot') || 'Esqueci minha senha')}
              </button>
              {!forgotMode && (
                <p className="text-sm text-muted-foreground">
                  <Link
                    to={planParam ? `/cadastro?plan=${planParam}` : '/cadastro'}
                    className="font-medium text-primary hover:underline"
                  >
                    {t('auth.create') || 'Criar conta'}
                  </Link>
                </p>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-8 text-muted-foreground">
          Feito com ❤️ por Living Word
        </p>
      </div>
    </div>
  );
}
