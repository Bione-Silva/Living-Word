import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
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

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await signUp(email, password, {
        full_name: name,
        blog_handle: handle,
        language,
        doctrine,
        pastoral_voice: voice,
      });

      setLang(language);
      toast.success(language === 'PT' ? 'Conta criada! Gerando seus primeiros devocionais...' : language === 'EN' ? 'Account created! Generating your first devotionals...' : '¡Cuenta creada! Generando tus primeros devocionales...');

      generateInitialContent().catch(console.error);
      navigate('/blog-onboarding');
    } catch (err: any) {
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

    const targetLanguages: Language[] = ['PT', 'EN', 'ES'];

    for (const targetLanguage of targetLanguages) {
      for (const p of localizedTitles[targetLanguage]) {
        try {
          const { error } = await supabase.functions.invoke('generate-blog-article', {
            body: { passage: p.passage, language: targetLanguage, title: p.title },
          });
          if (error) console.error('Auto-gen error:', error);
        } catch (e) {
          console.error('Auto-gen failed:', e);
        }
      }
    }
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
                Já tem conta? <Link to="/login" className="text-primary hover:underline">{t('auth.login')}</Link>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
