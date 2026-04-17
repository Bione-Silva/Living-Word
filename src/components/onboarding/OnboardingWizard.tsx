import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  ArrowRight, ArrowLeft, Globe, Check, Sparkles,
  BookOpen, Palette, Type, Layout, Mic, Church
} from 'lucide-react';
import { useForceLightTheme } from '@/hooks/useForceLightTheme';
import { BrandIcon } from '@/components/BrandIcon';

type L = 'PT' | 'EN' | 'ES';

const STEPS = [
  'welcome', 'language', 'doctrine', 'tone', 'handle',
  'theme_color', 'font_family', 'layout_style', 'confirm'
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

const COLORS = [
  { id: 'amber', label: 'Âmbar', color: '#8B6914' },
  { id: 'blue', label: 'Azul', color: '#2563EB' },
  { id: 'green', label: 'Verde', color: '#16A34A' },
  { id: 'rose', label: 'Rosa', color: '#E11D48' },
  { id: 'purple', label: 'Roxo', color: '#7C3AED' },
  { id: 'teal', label: 'Turquesa', color: '#0D9488' },
  { id: 'indigo', label: 'Índigo', color: '#4F46E5' },
  { id: 'orange', label: 'Laranja', color: '#EA580C' },
];

const FONTS = [
  { id: 'cormorant', label: 'Cormorant Garamond', preview: 'Aa', style: 'font-serif' },
  { id: 'montserrat', label: 'Montserrat', preview: 'Aa', style: 'font-sans' },
  { id: 'playfair', label: 'Playfair Display', preview: 'Aa', style: 'font-serif italic' },
  { id: 'inter', label: 'Inter', preview: 'Aa', style: 'font-sans' },
  { id: 'merriweather', label: 'Merriweather', preview: 'Aa', style: 'font-serif' },
];

const LAYOUTS = [
  { id: 'classic', label: { PT: 'Clássico', EN: 'Classic', ES: 'Clásico' }, desc: { PT: 'Limpo e tradicional', EN: 'Clean and traditional', ES: 'Limpio y tradicional' } },
  { id: 'modern', label: { PT: 'Moderno', EN: 'Modern', ES: 'Moderno' }, desc: { PT: 'Visual contemporâneo', EN: 'Contemporary visual', ES: 'Visual contemporáneo' } },
  { id: 'magazine', label: { PT: 'Revista', EN: 'Magazine', ES: 'Revista' }, desc: { PT: 'Estilo editorial', EN: 'Editorial style', ES: 'Estilo editorial' } },
];

const LOADING_MESSAGES: Record<L, string[]> = {
  PT: [
    'Semeando suas palavras...',
    'Preparando a capa do seu blog...',
    'Gerando seus 3 primeiros devocionais...',
    'Aplicando sua identidade visual...',
    'Quase lá! Finalizando seu blog...',
  ],
  EN: [
    'Sowing your words...',
    'Preparing your blog cover...',
    'Generating your first 3 devotionals...',
    'Applying your visual identity...',
    'Almost there! Finishing your blog...',
  ],
  ES: [
    'Sembrando tus palabras...',
    'Preparando la portada de tu blog...',
    'Generando tus 3 primeros devocionales...',
    'Aplicando tu identidad visual...',
    '¡Casi listo! Finalizando tu blog...',
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
  const [handle, setHandle] = useState(profile?.blog_handle || '');
  const [themeColor, setThemeColor] = useState('amber');
  const [fontFamily, setFontFamily] = useState('cormorant');
  const [layoutStyle, setLayoutStyle] = useState('classic');
  const [provisioning, setProvisioning] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);

  const currentStep = STEPS[stepIndex];
  const progress = ((stepIndex + 1) / STEPS.length) * 100;
  const blogName = profile?.full_name || 'Meu Blog';
  const cleanHandle = handle.toLowerCase().replace(/[^a-z0-9-]/g, '') || 'meu-blog';

  const labels: Record<string, Record<L, string>> = {
    welcome_title: { PT: `${blogName.split(' ')[0]}, vamos personalizar tudo!`, EN: `${blogName.split(' ')[0]}, let's personalize everything!`, ES: `${blogName.split(' ')[0]}, ¡personalicemos todo!` },
    welcome_desc: { PT: 'Em poucos passos, seu blog estará no ar com sua cara.', EN: 'In a few steps, your blog will be live with your identity.', ES: 'En pocos pasos, tu blog estará en línea con tu identidad.' },
    language_title: { PT: 'Qual idioma do seu conteúdo?', EN: 'What language is your content?', ES: '¿En qué idioma es tu contenido?' },
    doctrine_title: { PT: 'Qual sua linha doutrinária?', EN: 'What is your doctrinal line?', ES: '¿Cuál es tu línea doctrinal?' },
    tone_title: { PT: 'Como é seu tom pastoral?', EN: 'What is your pastoral tone?', ES: '¿Cuál es tu tono pastoral?' },
    handle_title: { PT: 'Escolha o link do seu blog', EN: 'Choose your blog link', ES: 'Elige el link de tu blog' },
    color_title: { PT: 'Escolha a cor do seu blog', EN: 'Choose your blog color', ES: 'Elige el color de tu blog' },
    font_title: { PT: 'Escolha a tipografia', EN: 'Choose the typography', ES: 'Elige la tipografía' },
    layout_title: { PT: 'Escolha o estilo de layout', EN: 'Choose the layout style', ES: 'Elige el estilo de layout' },
    confirm_title: { PT: 'Tudo pronto! Confirme e lance.', EN: 'All set! Confirm and launch.', ES: '¡Todo listo! Confirma y lanza.' },
    next: { PT: 'Próximo', EN: 'Next', ES: 'Siguiente' },
    back: { PT: 'Voltar', EN: 'Back', ES: 'Volver' },
    launch: { PT: '🚀 Lançar meu blog', EN: '🚀 Launch my blog', ES: '🚀 Lanzar mi blog' },
    skip: { PT: 'Pular e ativar conta', EN: 'Skip and activate', ES: 'Saltar y activar' },
  };

  const t = (key: string) => labels[key]?.[language] || labels[key]?.['PT'] || key;

  const next = () => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  const prev = () => setStepIndex((i) => Math.max(i - 1, 0));

  const handleProvision = async () => {
    setProvisioning(true);
    const interval = setInterval(() => {
      setLoadingMsgIndex((i) => (i + 1) % LOADING_MESSAGES[language].length);
    }, 4000);

    try {
      setLang(language);

      const { data, error } = await supabase.functions.invoke('provision-user-blog', {
        body: {
          language,
          doctrine_line: doctrine,
          tone,
          theme_color: themeColor,
          font_family: fontFamily,
          layout_style: layoutStyle,
          blog_handle: cleanHandle,
          blog_name: blogName,
        },
      });

      if (error) throw error;

      await refreshProfile();

      toast.success(
        language === 'PT' ? `Blog criado com ${data?.articles_created || 3} artigos!` :
        language === 'EN' ? `Blog created with ${data?.articles_created || 3} articles!` :
        `¡Blog creado con ${data?.articles_created || 3} artículos!`
      );
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Provision error:', err);
      toast.error(
        language === 'PT' ? 'Erro ao criar blog. Tente novamente.' :
        language === 'EN' ? 'Error creating blog. Try again.' :
        'Error al crear blog. Intenta de nuevo.'
      );
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
          <button onClick={() => navigate('/dashboard')} className="text-xs text-muted-foreground hover:text-primary transition-colors">
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
                    {language === 'PT' ? 'Ao final, vamos gerar automaticamente 3 artigos devocionais para seu blog com imagens de capa profissionais.' :
                     language === 'EN' ? 'At the end, we will automatically generate 3 devotional articles for your blog with professional cover images.' :
                     'Al final, generaremos automáticamente 3 artículos devocionales para tu blog con imágenes de portada profesionales.'}
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

          {/* Step: Handle */}
          {currentStep === 'handle' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <Globe className="w-5 h-5 text-primary" />
                <h2 className="font-display text-xl font-bold">{t('handle_title')}</h2>
              </div>
              <div className="flex items-center border border-input rounded-lg overflow-hidden bg-background">
                <Input
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="border-0 focus-visible:ring-0 text-base"
                  placeholder="pastor-marcos"
                />
                <span className="text-sm text-muted-foreground px-3 whitespace-nowrap bg-muted/50 py-2.5 border-l border-input">
                  .livingword.app
                </span>
              </div>
              {handle && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-mono font-semibold text-primary">{cleanHandle}.livingword.app</span>
                </p>
              )}
            </div>
          )}

          {/* Step: Theme Color */}
          {currentStep === 'theme_color' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <Palette className="w-5 h-5 text-primary" />
                <h2 className="font-display text-xl font-bold">{t('color_title')}</h2>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {COLORS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setThemeColor(c.id)}
                    className={`w-full aspect-square rounded-xl border-2 transition-all flex items-center justify-center ${
                      themeColor === c.id ? 'border-foreground scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.color }}
                    title={c.label}
                  >
                    {themeColor === c.id && <Check className="w-6 h-6 text-white" />}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {COLORS.find((c) => c.id === themeColor)?.label}
              </p>
            </div>
          )}

          {/* Step: Font Family */}
          {currentStep === 'font_family' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <Type className="w-5 h-5 text-primary" />
                <h2 className="font-display text-xl font-bold">{t('font_title')}</h2>
              </div>
              {renderOptionGrid(
                FONTS.map((f) => ({ id: f.id, label: f.label, style: f.style })),
                fontFamily,
                setFontFamily,
                2
              )}
            </div>
          )}

          {/* Step: Layout Style */}
          {currentStep === 'layout_style' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <Layout className="w-5 h-5 text-primary" />
                <h2 className="font-display text-xl font-bold">{t('layout_title')}</h2>
              </div>
              {renderOptionGrid(
                LAYOUTS.map((l) => ({ id: l.id, label: l.label, desc: l.desc })),
                layoutStyle,
                setLayoutStyle,
                3
              )}
            </div>
          )}

          {/* Step: Confirm */}
          {currentStep === 'confirm' && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold text-center">{t('confirm_title')}</h2>
              <div className="space-y-2 text-sm">
                {[
                  { label: language === 'PT' ? 'Idioma' : language === 'EN' ? 'Language' : 'Idioma', value: language },
                  { label: language === 'PT' ? 'Doutrina' : language === 'EN' ? 'Doctrine' : 'Doctrina', value: DOCTRINES.find((d) => d.id === doctrine)?.label[language] || doctrine },
                  { label: language === 'PT' ? 'Tom' : language === 'EN' ? 'Tone' : 'Tono', value: TONES.find((t) => t.id === tone)?.label[language] || tone },
                  { label: 'Blog', value: `${cleanHandle}.livingword.app` },
                  { label: language === 'PT' ? 'Cor' : language === 'EN' ? 'Color' : 'Color', value: COLORS.find((c) => c.id === themeColor)?.label || themeColor },
                  { label: language === 'PT' ? 'Fonte' : language === 'EN' ? 'Font' : 'Fuente', value: FONTS.find((f) => f.id === fontFamily)?.label || fontFamily },
                  { label: 'Layout', value: LAYOUTS.find((l) => l.id === layoutStyle)?.label[language] || layoutStyle },
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
