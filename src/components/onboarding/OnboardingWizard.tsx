import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  ArrowRight, ArrowLeft, Globe, Check, Sparkles,
  BookOpen, Mic, Church
} from 'lucide-react';
import { useForceLightTheme } from '@/hooks/useForceLightTheme';
import { BrandIcon } from '@/components/BrandIcon';

type L = 'PT' | 'EN' | 'ES';

const STEPS = [
  'welcome', 'language', 'doctrine', 'tone', 'confirm'
] as const;

const DOCTRINES = [
  { id: 'pentecostal', label: { PT: 'Pentecostal', EN: 'Pentecostal', ES: 'Pentecostal' } },
  { id: 'batista', label: { PT: 'Batista', EN: 'Baptist', ES: 'Bautista' } },
  { id: 'presbiteriano', label: { PT: 'Presbiteriano', EN: 'Presbyterian', ES: 'Presbiteriano' } },
  { id: 'assembleia', label: { PT: 'Assembleia de Deus', EN: 'Assembly of God', ES: 'Asamblea de Dios' } },
  { id: 'metodista', label: { PT: 'Metodista', EN: 'Methodist', ES: 'Metodista' } },
  { id: 'interdenominacional', label: { PT: 'Interdenominacional', EN: 'Interdenominational', ES: 'Interdenominacional' } },
  { id: 'catolico', label: { PT: 'Católico', EN: 'Catholic', ES: 'Católico' } },
  { id: 'outro', label: { PT: 'Outro', EN: 'Other', ES: 'Otro' } },
];

const TONES = [
  { id: 'acolhedor', label: { PT: 'Acolhedor', EN: 'Welcoming', ES: 'Acogedor' }, icon: '🤗' },
  { id: 'profético', label: { PT: 'Profético', EN: 'Prophetic', ES: 'Profético' }, icon: '🔥' },
  { id: 'expositivo', label: { PT: 'Expositivo', EN: 'Expository', ES: 'Expositivo' }, icon: '📖' },
  { id: 'jovem', label: { PT: 'Jovem e Dinâmico', EN: 'Young & Dynamic', ES: 'Joven y Dinámico' }, icon: '⚡' },
  { id: 'contemplativo', label: { PT: 'Contemplativo', EN: 'Contemplative', ES: 'Contemplativo' }, icon: '🕊️' },
];


const LOADING_MESSAGES: Record<L, string[]> = {
  PT: [
    'Configurando sua conta...',
    'Aplicando suas preferências...',
    'Treinando a IA com seu perfil...',
    'Quase lá! Finalizando...',
  ],
  EN: [
    'Setting up your account...',
    'Applying your preferences...',
    'Training the AI with your profile...',
    'Almost there! Finishing...',
  ],
  ES: [
    'Configurando tu cuenta...',
    'Aplicando tus preferencias...',
    'Entrenando la IA con tu perfil...',
    '¡Casi listo! Finalizando...',
  ],
};

export default function OnboardingWizard() {
  useForceLightTheme();
  const { profile, user, refreshProfile } = useAuth();
  const { lang, setLang } = useLanguage();
  const navigate = useNavigate();

  const [stepIndex, setStepIndex] = useState(0);
  const [language, setLanguage] = useState<L>(lang);
  const [doctrine, setDoctrine] = useState('');
  const [tone, setTone] = useState('');
  const [provisioning, setProvisioning] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);

  const currentStep = STEPS[stepIndex];
  const progress = ((stepIndex + 1) / STEPS.length) * 100;
  const blogName = profile?.full_name || 'Meu Blog';

  const labels: Record<string, Record<L, string>> = {
    welcome_title: { PT: `${blogName.split(' ')[0]}, vamos personalizar tudo!`, EN: `${blogName.split(' ')[0]}, let's personalize everything!`, ES: `${blogName.split(' ')[0]}, ¡personalicemos todo!` },
    welcome_desc: { PT: 'Em poucos passos, a IA será treinada com seu perfil pastoral.', EN: 'In a few steps, the AI will be trained with your pastoral profile.', ES: 'En pocos pasos, la IA será entrenada con tu perfil pastoral.' },
    language_title: { PT: 'Qual idioma do seu conteúdo?', EN: 'What language is your content?', ES: '¿En qué idioma es tu contenido?' },
    doctrine_title: { PT: 'Qual sua linha doutrinária?', EN: 'What is your doctrinal line?', ES: '¿Cuál es tu línea doctrinal?' },
    tone_title: { PT: 'Como é seu tom pastoral?', EN: 'What is your pastoral tone?', ES: '¿Cuál es tu tono pastoral?' },
    confirm_title: { PT: 'Tudo pronto! Vamos começar.', EN: 'All set! Let\'s begin.', ES: '¡Todo listo! Vamos a comenzar.' },
    next: { PT: 'Próximo', EN: 'Next', ES: 'Siguiente' },
    back: { PT: 'Voltar', EN: 'Back', ES: 'Volver' },
    launch: { PT: '🚀 Ir para o Dashboard', EN: '🚀 Go to Dashboard', ES: '🚀 Ir al Dashboard' },
    skip: { PT: 'Pular e ativar conta', EN: 'Skip and activate', ES: 'Saltar y activar' },
  };

  const t = (key: string) => labels[key]?.[language] || labels[key]?.['PT'] || key;

  const next = () => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  const prev = () => setStepIndex((i) => Math.max(i - 1, 0));

  /** Mark profile as completed directly in Supabase (no Edge Function dependency) */
  const markProfileCompleted = async () => {
    if (!user?.id) return;

    // CRITICAL: Set profile_completed FIRST, alone, to guarantee it succeeds
    // even if other column names have issues
    const { error: completedError } = await supabase
      .from('profiles')
      .update({ profile_completed: true })
      .eq('id', user.id);

    if (completedError) {
      console.error('[Onboarding] Failed to mark profile_completed:', completedError);
    }

    // Then update pastoral preferences (non-blocking — these are optional)
    const extras: Record<string, unknown> = {};
    if (language) extras.language = language;
    if (doctrine) extras.doctrine = doctrine;
    if (tone) extras.pastoral_voice = tone;

    if (Object.keys(extras).length > 0) {
      supabase
        .from('profiles')
        .update(extras)
        .eq('id', user.id)
        .then(({ error }) => {
          if (error) console.warn('[Onboarding] Non-critical profile update failed:', error);
        });
    }
  };

  const handleSkip = async () => {
    await markProfileCompleted();
    try { localStorage.setItem('lw-onboarding-done', '1'); } catch {}
    // Use full page reload to avoid ProtectedRoute race condition
    window.location.href = '/dashboard';
  };

  const handleProvision = async () => {
    setProvisioning(true);
    const interval = setInterval(() => {
      setLoadingMsgIndex((i) => (i + 1) % LOADING_MESSAGES[language].length);
    }, 4000);

    try {
      setLang(language);

      // Always mark profile_completed directly first (prevents redirect loop)
      await markProfileCompleted();
      try { localStorage.setItem('lw-onboarding-done', '1'); } catch {}

      // Try Edge Function for blog provisioning (optional — not blocking)
      supabase.functions.invoke('provision-user-blog', {
        body: {
          language,
          doctrine_line: doctrine,
          tone,
          blog_name: blogName,
        },
      }).catch((e) => console.warn('[Provision] Blog provision failed (non-blocking):', e));

      await refreshProfile();

      toast.success(
        language === 'PT' ? 'Conta ativada com sucesso!' :
        language === 'EN' ? 'Account activated successfully!' :
        '¡Cuenta activada con éxito!'
      );
      // Use full page reload to avoid ProtectedRoute race condition
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error('Provision error:', err);
      // Even on error, navigate — profile_completed is already true
      window.location.href = '/dashboard';
    } finally {
      clearInterval(interval);
      setProvisioning(false);
    }
  };

  // Provisioning loading screen
  if (provisioning) {
    return (
      <div className="theme-app min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            {LOADING_MESSAGES[language][loadingMsgIndex]}
          </h2>
          <p className="text-muted-foreground text-sm">
            {language === 'PT' ? 'Isso pode levar até 30 segundos...' :
             language === 'EN' ? 'This may take up to 30 seconds...' :
             'Esto puede tardar hasta 30 segundos...'}
          </p>
          <div className="w-full max-w-xs mx-auto">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderOptionGrid = (
    options: { id: string; label: string | Record<L, string>; icon?: string; color?: string; style?: string; desc?: Record<L, string> }[],
    selected: string,
    onSelect: (id: string) => void,
    cols = 2
  ) => (
    <div className={`grid grid-cols-${cols} gap-3`}>
      {options.map((opt) => {
        const isSelected = selected === opt.id;
        const displayLabel = typeof opt.label === 'string' ? opt.label : opt.label[language] || opt.label['PT'];
        return (
          <button
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
              isSelected
                ? 'border-primary bg-primary/10 shadow-md scale-[1.02]'
                : 'border-border hover:border-primary/30 hover:bg-muted/50'
            }`}
          >
            <div className="flex items-center gap-3">
              {opt.icon && <span className="text-2xl">{opt.icon}</span>}
              {opt.color && (
                <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center" style={{ backgroundColor: opt.color }}>
                  {isSelected && <Check className="w-4 h-4 text-white" />}
                </div>
              )}
              <div>
                <p className={`font-medium text-sm ${opt.style || ''}`}>{displayLabel}</p>
                {opt.desc && <p className="text-xs text-muted-foreground mt-0.5">{opt.desc[language] || opt.desc['PT']}</p>}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="theme-app min-h-screen relative bg-background">
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          background:
            'radial-gradient(circle at 20% 10%, hsl(263 70% 50% / 0.08), transparent 50%), radial-gradient(circle at 80% 90%, hsl(43 80% 46% / 0.08), transparent 50%)',
        }}
      />
      <div className="relative z-10 max-w-xl mx-auto px-4 py-8">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <BrandIcon className="h-7 w-7" />
            </div>
            <span className="font-display text-2xl font-bold text-foreground">Living Word</span>
          </div>
        </div>

        {/* Skip */}
        <div className="text-center mb-4">
          <button onClick={handleSkip} className="text-xs text-muted-foreground hover:text-primary transition-colors">
            {t('skip')}
          </button>
        </div>

        {/* Progress */}
        <Progress value={progress} className="h-1.5 mb-8" />

        <Card className="p-6 space-y-6 bg-card border-border shadow-xl shadow-primary/5">
          {/* Step: Welcome */}
          {currentStep === 'welcome' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h1 className="font-display text-2xl font-bold">{t('welcome_title')}</h1>
              <p className="text-muted-foreground text-sm">{t('welcome_desc')}</p>
              <Card className="border-primary/20 bg-primary/5 p-4 text-left">
                <div className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    {language === 'PT' ? 'Configure suas preferências pastorais para que a IA se adapte ao seu estilo de comunicação.' :
                     language === 'EN' ? 'Set up your pastoral preferences so the AI adapts to your communication style.' :
                     'Configura tus preferencias pastorales para que la IA se adapte a tu estilo de comunicación.'}
                  </p>
                </div>
              </Card>
            </div>
          )}

          {/* Step: Language */}
          {currentStep === 'language' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <Globe className="w-5 h-5 text-primary" />
                <h2 className="font-display text-xl font-bold">{t('language_title')}</h2>
              </div>
              {renderOptionGrid(
                [
                  { id: 'PT', label: 'Português', icon: '🇧🇷' },
                  { id: 'EN', label: 'English', icon: '🇺🇸' },
                  { id: 'ES', label: 'Español', icon: '🇪🇸' },
                ],
                language,
                (id) => setLanguage(id as L),
                3
              )}
            </div>
          )}

          {/* Step: Doctrine */}
          {currentStep === 'doctrine' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <Church className="w-5 h-5 text-primary" />
                <h2 className="font-display text-xl font-bold">{t('doctrine_title')}</h2>
              </div>
              {renderOptionGrid(
                DOCTRINES.map((d) => ({ id: d.id, label: d.label })),
                doctrine,
                setDoctrine,
                2
              )}
            </div>
          )}

          {/* Step: Tone */}
          {currentStep === 'tone' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <Mic className="w-5 h-5 text-primary" />
                <h2 className="font-display text-xl font-bold">{t('tone_title')}</h2>
              </div>
              {renderOptionGrid(
                TONES.map((t) => ({ id: t.id, label: t.label, icon: t.icon })),
                tone,
                setTone,
                2
              )}
            </div>
          )}

          {/* Step: Confirm */}
          {currentStep === 'confirm' && (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 flex items-center justify-center">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="font-display text-xl font-bold text-center">{t('confirm_title')}</h2>
              <div className="space-y-2 text-sm">
                {[
                  { label: language === 'PT' ? 'Idioma' : language === 'EN' ? 'Language' : 'Idioma', value: language },
                  { label: language === 'PT' ? 'Doutrina' : language === 'EN' ? 'Doctrine' : 'Doctrina', value: DOCTRINES.find((d) => d.id === doctrine)?.label[language] || doctrine || '—' },
                  { label: language === 'PT' ? 'Tom' : language === 'EN' ? 'Tone' : 'Tono', value: TONES.find((t) => t.id === tone)?.label[language] || tone || '—' },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-2">
            {stepIndex > 0 && (
              <Button variant="outline" onClick={prev} className="flex-1 gap-2">
                <ArrowLeft className="w-4 h-4" />
                {t('back')}
              </Button>
            )}
            {currentStep === 'confirm' ? (
              <Button onClick={handleProvision} className="flex-1 gap-2 h-12 text-base font-semibold">
                {t('launch')}
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={next} className="flex-1 gap-2">
                {t('next')}
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Step indicator */}
          <p className="text-center text-xs text-muted-foreground">
            {stepIndex + 1} / {STEPS.length}
          </p>
        </Card>
      </div>
    </div>
  );
}
