import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Check, Crown, Lock } from 'lucide-react';
import type { Language } from '@/lib/i18n';

const doctrines = [
  'Pentecostal', 'Batista', 'Presbiteriano', 'Assembleia de Deus',
  'Metodista', 'Anglicano', 'Interdenominacional', 'Outro'
];

const voices = [
  { id: 'acolhedor', label: { PT: 'Acolhedor', EN: 'Welcoming', ES: 'Acogedor' }, free: true },
  { id: 'profético', label: { PT: 'Profético', EN: 'Prophetic', ES: 'Profético' }, free: false },
  { id: 'expositivo', label: { PT: 'Expositivo', EN: 'Expository', ES: 'Expositivo' }, free: false },
  { id: 'jovem', label: { PT: 'Jovem', EN: 'Youth', ES: 'Joven' }, free: false },
];

export default function Cadastro() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [language, setLanguage] = useState<Language>('PT');
  const [handle, setHandle] = useState('');
  const [doctrine, setDoctrine] = useState('');
  const [voice, setVoice] = useState('acolhedor');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const planParam = new URLSearchParams(window.location.search).get('plan');

  // Auth state listener — handles redirect after email confirmation
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const plan = new URLSearchParams(window.location.search).get('plan');
        if (plan) {
          navigate(`/upgrade?autoCheckout=${plan}`);
        } else {
          navigate('/dashboard');
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { needsConfirmation } = await signUp(email, password, {
        full_name: name,
        blog_handle: handle,
        language,
        doctrine,
        pastoral_voice: voice,
      });

      setLang(language);

      if (needsConfirmation) {
        toast.info(
          language === 'PT' ? 'Verifique seu e-mail para confirmar a conta!' :
          language === 'EN' ? 'Check your email to confirm your account!' :
          '¡Revisa tu correo para confirmar tu cuenta!'
        );
        // Don't navigate — wait for email confirmation via auth listener
        return;
      }

      toast.success(
        language === 'PT' ? 'Conta criada! Gerando seus primeiros devocionais...' :
        language === 'EN' ? 'Account created! Generating your first devotionals...' :
        '¡Cuenta creada! Generando tus primeros devocionales...'
      );

      generateInitialContent().catch(console.error);
      navigate(planParam ? `/upgrade?autoCheckout=${planParam}` : '/blog-onboarding');
    } catch (err: any) {
      console.error('Signup error:', err);
      toast.error(err.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  const generateInitialContent = async () => {
    const localizedTitles: Record<Language, { passage: string; title: string }[]> = {
      PT: [
        { passage: 'Salmo 23', title: 'O Senhor é meu pastor: encontrando paz em tempos difíceis' },
        { passage: 'Filipenses 4:13', title: 'Tudo posso naquele que me fortalece: a força que vem de Deus' },
        { passage: 'Provérbios 3:5-6', title: 'Confia no Senhor de todo o teu coração: um caminho de fé' },
      ],
      EN: [
        { passage: 'Psalm 23', title: 'The Lord is my shepherd: finding peace in difficult times' },
        { passage: 'Philippians 4:13', title: 'I can do all things through Christ who strengthens me' },
        { passage: 'Proverbs 3:5-6', title: 'Trust in the Lord with all your heart: a path of faith' },
      ],
      ES: [
        { passage: 'Salmo 23', title: 'El Señor es mi pastor: encontrando paz en tiempos difíciles' },
        { passage: 'Filipenses 4:13', title: 'Todo lo puedo en Cristo que me fortalece' },
        { passage: 'Proverbios 3:5-6', title: 'Confía en el Señor con todo tu corazón: un camino de fe' },
      ],
    };

    // Generate exactly 3 articles in the user's selected language only
    const userTitles = localizedTitles[language] || localizedTitles['PT'];
    const allCalls = userTitles.map(p =>
      supabase.functions.invoke('generate-blog-article', {
        body: { passage: p.passage, language, title: p.title },
      }).catch(e => console.error('Auto-gen failed:', e))
    );

    Promise.allSettled(allCalls).then(results => {
      const failed = results.filter(r => r.status === 'rejected').length;
      if (failed > 0) console.warn(`${failed} article(s) failed to generate`);
    });
  };

  const steps = [
    { num: 1, label: t('auth.step1') },
    { num: 2, label: t('auth.step2') },
    { num: 3, label: t('auth.step3') },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link to="/" className="font-display text-3xl font-bold text-gradient-gold">Living Word</Link>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= s.num ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
              }`}>
                {step > s.num ? <Check className="h-4 w-4" /> : s.num}
              </div>
              <span className="text-xs text-muted-foreground hidden sm:inline">{s.label}</span>
              {s.num < 3 && <div className={`w-8 h-px ${step > s.num ? 'bg-primary' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-display text-2xl">{steps[step - 1].label}</CardTitle>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('auth.name')}</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>{t('auth.email')}</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>{t('auth.password')}</Label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>{t('auth.language')}</Label>
                  <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PT">Português</SelectItem>
                      <SelectItem value="EN">English</SelectItem>
                      <SelectItem value="ES">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => setStep(2)} className="w-full bg-primary text-primary-foreground" disabled={!name || !email || !password}>
                  {t('auth.next')}
                </Button>

                <div className="relative my-4">
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
                  className="w-full py-5 text-sm font-medium"
                  onClick={async () => {
                    const result = await lovable.auth.signInWithOAuth('google', {
                      redirect_uri: window.location.origin,
                    });
                    if (result.error) {
                      toast.error('Erro ao entrar com Google');
                    }
                  }}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continuar com Google
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('auth.blog_handle')}</Label>
                  <div className="flex items-center gap-0 border border-input rounded-md overflow-hidden">
                    <Input
                      value={handle}
                      onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="border-0 focus-visible:ring-0"
                      placeholder="pastor-marcos"
                    />
                    <span className="text-sm text-muted-foreground px-3 whitespace-nowrap bg-secondary">.livingword.app</span>
                  </div>
                </div>
                {handle && (
                  <div className="bg-secondary/50 rounded-lg p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">{t('auth.handle_preview')}</p>
                    <p className="text-sm font-mono text-primary font-semibold">
                      {handle}.livingword.app
                    </p>
                  </div>
                )}
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">{t('auth.back')}</Button>
                  <Button onClick={() => setStep(3)} className="flex-1 bg-primary text-primary-foreground" disabled={!handle}>
                    {t('auth.next')}
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <CardDescription className="text-sm text-muted-foreground">Opcional — você pode preencher depois</CardDescription>
                <div className="space-y-2">
                  <Label>Doutrina / Tradição</Label>
                  <Select value={doctrine} onValueChange={setDoctrine}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {doctrines.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('studio.voice')}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {voices.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => v.free && setVoice(v.id)}
                        className={`p-3 rounded-lg border text-sm text-left transition-colors ${
                          voice === v.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/30'
                        } ${!v.free ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{v.label[lang]}</span>
                          {!v.free && <Lock className="h-3 w-3 text-muted-foreground" />}
                        </div>
                        {!v.free && <Badge variant="secondary" className="mt-1 text-[10px]"><Crown className="h-3 w-3 mr-1" />Pastoral</Badge>}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">{t('auth.back')}</Button>
                  <Button onClick={handleSubmit} className="flex-1 bg-primary text-primary-foreground" disabled={loading}>
                    {loading ? '...' : t('auth.create')}
                  </Button>
                </div>
              </div>
            )}

            {step === 1 && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                Já tem conta? <Link to={planParam ? `/login?plan=${planParam}` : '/login'} className="text-primary hover:underline">{t('auth.login')}</Link>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
