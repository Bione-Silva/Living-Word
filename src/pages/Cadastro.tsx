import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';
import type { Language } from '@/lib/i18n';
import watermarkBg from '@/assets/onboarding-watermark.jpg';

type L = 'PT' | 'EN' | 'ES';

const copy = {
  title: { PT: 'Crie sua conta grátis', EN: 'Create your free account', ES: 'Crea tu cuenta gratis' } as Record<L, string>,
  subtitle: { PT: 'Comece a produzir conteúdo pastoral com IA em minutos.', EN: 'Start producing pastoral content with AI in minutes.', ES: 'Comienza a producir contenido pastoral con IA en minutos.' } as Record<L, string>,
  name: { PT: 'Nome completo', EN: 'Full name', ES: 'Nombre completo' } as Record<L, string>,
  email: { PT: 'E-mail', EN: 'Email', ES: 'Correo electrónico' } as Record<L, string>,
  password: { PT: 'Senha', EN: 'Password', ES: 'Contraseña' } as Record<L, string>,
  language: { PT: 'Idioma', EN: 'Language', ES: 'Idioma' } as Record<L, string>,
  cta: { PT: 'Criar conta', EN: 'Create account', ES: 'Crear cuenta' } as Record<L, string>,
  or: { PT: 'ou', EN: 'or', ES: 'o' } as Record<L, string>,
  google: { PT: 'Continuar com Google', EN: 'Continue with Google', ES: 'Continuar con Google' } as Record<L, string>,
  hasAccount: { PT: 'Já tem conta?', EN: 'Already have an account?', ES: '¿Ya tienes cuenta?' } as Record<L, string>,
  login: { PT: 'Entrar', EN: 'Sign in', ES: 'Iniciar sesión' } as Record<L, string>,
  checkEmail: { PT: 'Verifique seu e-mail para confirmar a conta!', EN: 'Check your email to confirm your account!', ES: '¡Revisa tu correo para confirmar tu cuenta!' } as Record<L, string>,
  success: { PT: 'Conta criada com sucesso!', EN: 'Account created successfully!', ES: '¡Cuenta creada con éxito!' } as Record<L, string>,
};

export default function Cadastro() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [language, setLanguage] = useState<Language>('PT');
  const [loading, setLoading] = useState(false);

  const { signUp } = useAuth();
  const { lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const planParam = new URLSearchParams(window.location.search).get('plan');

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const plan = new URLSearchParams(window.location.search).get('plan');
        if (plan) {
          navigate(`/upgrade?autoCheckout=${plan}`);
        } else {
          navigate('/onboarding');
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    setLoading(true);
    try {
      const { needsConfirmation } = await signUp(email, password, {
        full_name: name,
        language,
      });

      setLang(language);

      if (needsConfirmation) {
        toast.info(copy.checkEmail[language]);
        return;
      }

      toast.success(copy.success[language]);
      navigate(planParam ? `/upgrade?autoCheckout=${planParam}` : '/onboarding');
    } catch (err: any) {
      console.error('Signup error:', err);
      toast.error(err.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4" style={{ backgroundColor: 'hsl(37, 33%, 96%)' }}>
      {/* Watermark background */}
      <img
        src={watermarkBg}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover opacity-[0.12] pointer-events-none"
        width={1920}
        height={1080}
      />
      <div className="absolute inset-0 bg-[hsl(37,33%,96%)]/40 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="font-display text-3xl font-bold" style={{ color: 'hsl(28, 42%, 38%)' }}>
            Living Word
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[hsl(30,15%,85%)]/60 bg-white/80 backdrop-blur-sm shadow-[0_8px_40px_hsl(28,20%,50%,0.06)] p-7 sm:p-9">
          <div className="text-center mb-6">
            <div className="w-12 h-12 mx-auto rounded-xl bg-[hsl(28,42%,42%)]/10 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6" style={{ color: 'hsl(28, 42%, 42%)' }} />
            </div>
            <h1 className="font-display text-xl font-bold text-[hsl(24,30%,18%)]">{copy.title[lang]}</h1>
            <p className="text-sm text-[hsl(24,15%,45%)] mt-1">{copy.subtitle[lang]}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[hsl(24,20%,30%)] font-medium">{copy.name[lang]}</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-[hsl(30,15%,82%)] bg-[hsl(37,30%,98%)] text-[hsl(24,30%,15%)]"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[hsl(24,20%,30%)] font-medium">{copy.email[lang]}</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-[hsl(30,15%,82%)] bg-[hsl(37,30%,98%)] text-[hsl(24,30%,15%)]"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[hsl(24,20%,30%)] font-medium">{copy.password[lang]}</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-[hsl(30,15%,82%)] bg-[hsl(37,30%,98%)] text-[hsl(24,30%,15%)]"
                required
                minLength={6}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[hsl(24,20%,30%)] font-medium">{copy.language[lang]}</Label>
              <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
                <SelectTrigger className="border-[hsl(30,15%,82%)] bg-[hsl(37,30%,98%)] text-[hsl(24,30%,15%)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PT">Português</SelectItem>
                  <SelectItem value="EN">English</SelectItem>
                  <SelectItem value="ES">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              className="w-full py-5 rounded-xl bg-[hsl(28,42%,42%)] hover:bg-[hsl(28,42%,36%)] text-white font-bold"
              disabled={loading || !name || !email || !password}
            >
              {loading ? '...' : copy.cta[lang]}
            </Button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[hsl(30,15%,85%)]" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white/80 px-3 text-[hsl(24,15%,55%)]">{copy.or[lang]}</span></div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full py-5 text-sm font-medium rounded-xl border-[hsl(30,15%,82%)] bg-[hsl(37,30%,97%)] hover:bg-[hsl(37,25%,94%)] text-[hsl(24,30%,18%)]"
            onClick={async () => {
              const result = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin });
              if (result.error) toast.error('Erro ao entrar com Google');
            }}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {copy.google[lang]}
          </Button>

          <p className="text-center text-sm text-[hsl(24,15%,50%)] mt-5">
            {copy.hasAccount[lang]}{' '}
            <Link to={planParam ? `/login?plan=${planParam}` : '/login'} className="font-medium hover:underline" style={{ color: 'hsl(28, 42%, 42%)' }}>
              {copy.login[lang]}
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-6" style={{ color: 'hsl(24, 15%, 55%)' }}>
          Feito com ❤️ por Living Word
        </p>
      </div>
    </div>
  );
}
