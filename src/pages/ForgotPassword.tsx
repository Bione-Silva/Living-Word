// @ts-nocheck
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import loginBg from '@/assets/login-bg.jpg';

type L = 'PT' | 'EN' | 'ES';

const copy = {
  title: { PT: 'Recuperar senha', EN: 'Recover password', ES: 'Recuperar contraseña' } as Record<L, string>,
  subtitle: { PT: 'Insira seu e-mail e enviaremos um link para você redefinir sua senha.', EN: 'Enter your email and we will send you a link to reset your password.', ES: 'Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.' } as Record<L, string>,
  email: { PT: 'E-mail', EN: 'Email', ES: 'Correo electrónico' } as Record<L, string>,
  cta: { PT: 'Enviar link de recuperação', EN: 'Send recovery link', ES: 'Enviar enlace de recuperación' } as Record<L, string>,
  backToLogin: { PT: 'Voltar ao login', EN: 'Back to login', ES: 'Volver al inicio de sesión' } as Record<L, string>,
  success: { PT: 'E-mail enviado! Verifique sua caixa de entrada.', EN: 'Email sent! Check your inbox.', ES: '¡Correo enviado! Revisa tu bandeja de entrada.' } as Record<L, string>,
};

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { lang } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success(copy.success[lang]);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao tentar enviar e-mail de recuperação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4" style={{ backgroundColor: 'hsl(37, 33%, 94%)' }}>
      <img
        src={loginBg}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover opacity-[0.35] pointer-events-none"
        width={1920}
        height={1080}
      />
      <div className="absolute inset-0 bg-[hsl(37,33%,94%)]/50 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-10">
          <Link to="/" className="font-display text-4xl font-bold" style={{ color: 'hsl(28, 42%, 38%)' }}>
            Living Word
          </Link>
          <p className="text-sm mt-2" style={{ color: 'hsl(24, 15%, 45%)' }}>
            Sua plataforma pastoral inteligente
          </p>
        </div>

        <div className="rounded-2xl border border-[hsl(30,15%,82%)]/60 bg-white/80 backdrop-blur-sm shadow-[0_8px_40px_hsl(28,20%,50%,0.08)] p-8 sm:p-10">
          <h2 className="font-display text-2xl font-bold text-center mb-3" style={{ color: 'hsl(24, 30%, 18%)' }}>
            {copy.title[lang]}
          </h2>
          <p className="text-sm text-center mb-7" style={{ color: 'hsl(24, 15%, 45%)' }}>
            {copy.subtitle[lang]}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[hsl(24,20%,30%)] font-medium">
                {copy.email[lang]}
              </Label>
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

            <Button
              type="submit"
              className="w-full py-6 text-base font-bold rounded-xl bg-[hsl(28,42%,42%)] hover:bg-[hsl(28,42%,36%)] text-white shadow-md"
              disabled={loading || !email}
            >
              {loading ? '...' : copy.cta[lang]}
            </Button>

            <div className="text-center pt-2">
              <Link to="/login" className="text-sm font-medium hover:underline" style={{ color: 'hsl(28, 42%, 42%)' }}>
                {copy.backToLogin[lang]}
              </Link>
            </div>
          </form>
        </div>

        <p className="text-center text-xs mt-8" style={{ color: 'hsl(24, 15%, 55%)' }}>
          Feito com ❤️ por Living Word
        </p>
      </div>
    </div>
  );
}
