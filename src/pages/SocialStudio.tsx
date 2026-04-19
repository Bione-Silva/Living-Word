import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AspectRatioSelector, type AspectRatio } from '@/components/social-studio/AspectRatioSelector';
import { type SlideData } from '@/components/social-studio/SlideCanvas';
import { ThemeCustomizer, type ThemeConfig, colorPresets } from '@/components/social-studio/ThemeCustomizer';
import { TemplatePicker, type CanvasTemplate } from '@/components/social-studio/TemplatePicker';
import { VersePalettePicker, type VersePalette } from '@/components/social-studio/VersePalettePicker';
import { getBibleVersion, getDefaultVersionCode } from '@/lib/bible-data';
import { SlideCountPicker, type SlideCount } from '@/components/social-studio/SlideCountPicker';
import { BiblicalSceneGallery } from '@/components/social-studio/BiblicalSceneGallery';
import { ContentGenerator } from '@/components/social-studio/ContentGenerator';
import { VariationGrid } from '@/components/social-studio/VariationGrid';
import { ArtGallery } from '@/components/social-studio/ArtGallery';
import {
  ImageModePicker,
  getImageModePromptFragment,
  getImageModeLabel,
  type ImageMode,
} from '@/components/social-studio/ImageModePicker';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Sparkles, Layers, Loader2, Wand2, Image as ImageIcon, Palette, BookOpen,
  Camera, Mountain, Brush, LayoutTemplate, Check, ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

type L = 'PT' | 'EN' | 'ES';
type WizardStep = 'format' | 'content' | 'style' | 'generate';

const headings: Record<L, Record<string, string>> = {
  PT: {
    title: 'Estúdio Social',
    subtitle: 'Crie artes incríveis em poucos cliques.',
    studio: 'Estúdio',
    gallery: 'Minhas Artes',
    step1: 'Formato',
    step1Desc: 'Onde será publicado',
    step2: 'Conteúdo',
    step2Desc: 'Texto, versículo ou tema',
    step3: 'Estilo',
    step3Desc: 'Cores, fontes e aparência',
    step4: 'Gerar',
    step4Desc: 'Criamos suas variações',
    formatHeading: 'Escolha o formato',
    formatSub: 'Selecione onde sua arte será usada',
    contentHeading: 'Conteúdo da arte',
    contentSub: 'Busque um versículo ou gere texto pastoral',
    styleHeading: 'Personalize o visual',
    styleSub: 'Cores, fontes e cenário',
    generateHeading: 'Pronto para gerar',
    generateSub: 'Vamos criar variações com base no seu estilo',
    variations: 'Variações geradas',
    seeAll: 'Ver todas',
    variationsHint: 'Variações criadas com base no seu estilo',
    continue: 'Continuar',
    back: 'Voltar',
    generate: 'Gerar Carrossel Devocional',
    generating: 'Gerando devocional...',
    paletteCard: 'Paleta de Versículos',
    paletteCardSub: 'Escolha um versículo para sua arte',
    scenesCard: 'Cenas',
    scenesCardSub: 'Imagens para o fundo da arte',
    stylesCard: 'Estilos',
    stylesCardSub: 'Aparência, fonte e clima visual',
    templatesCard: 'Templates',
    templatesCardSub: 'Modelos prontos para usar',
    finalReady: 'Pronto? Escolha como deseja usar sua arte',
    copy: 'Copiar',
    copyDesc: 'Copiar imagem',
    share: 'Compartilhar',
    shareDesc: 'Gerar link',
    download: 'Baixar',
    downloadDesc: 'PNG ou ZIP',
    finalHint: '1 arte: PNG • Carrossel: ZIP com todas as imagens',
    needVerse: 'Carregue um versículo na etapa "Conteúdo" antes de gerar',
    carouselGenerated: 'Carrossel gerado!',
    carouselError: 'Erro ao gerar carrossel',
    clear: 'Limpar tudo',
    modeLabel: 'Modo',
  },
  EN: {
    title: 'Social Studio',
    subtitle: 'Create stunning art in just a few clicks.',
    studio: 'Studio',
    gallery: 'My Arts',
    step1: 'Format',
    step1Desc: 'Where it will be published',
    step2: 'Content',
    step2Desc: 'Text, verse or theme',
    step3: 'Style',
    step3Desc: 'Colors, fonts and look',
    step4: 'Generate',
    step4Desc: 'We create your variations',
    formatHeading: 'Choose the format',
    formatSub: 'Select where your art will be used',
    contentHeading: 'Art content',
    contentSub: 'Search a verse or generate pastoral text',
    styleHeading: 'Customize the look',
    styleSub: 'Colors, fonts and scenery',
    generateHeading: 'Ready to generate',
    generateSub: 'We will create variations based on your style',
    variations: 'Generated variations',
    seeAll: 'See all',
    variationsHint: 'Variations created from your style',
    continue: 'Continue',
    back: 'Back',
    generate: 'Generate Devotional Carousel',
    generating: 'Generating devotional...',
    paletteCard: 'Verse Palette',
    paletteCardSub: 'Pick a verse for your art',
    scenesCard: 'Scenes',
    scenesCardSub: 'Background images for your art',
    stylesCard: 'Styles',
    stylesCardSub: 'Look, font and visual mood',
    templatesCard: 'Templates',
    templatesCardSub: 'Ready-made models to use',
    finalReady: 'Ready? Choose how to use your art',
    copy: 'Copy',
    copyDesc: 'Copy image',
    share: 'Share',
    shareDesc: 'Get link',
    download: 'Download',
    downloadDesc: 'PNG or ZIP',
    finalHint: '1 art: PNG • Carousel: ZIP with all images',
    needVerse: 'Load a verse in the "Content" step before generating',
    carouselGenerated: 'Carousel generated!',
    carouselError: 'Error generating carousel',
    clear: 'Clear all',
    modeLabel: 'Mode',
  },
  ES: {
    title: 'Estudio Social',
    subtitle: 'Crea artes increíbles en pocos clics.',
    studio: 'Estudio',
    gallery: 'Mis Artes',
    step1: 'Formato',
    step1Desc: 'Dónde será publicado',
    step2: 'Contenido',
    step2Desc: 'Texto, versículo o tema',
    step3: 'Estilo',
    step3Desc: 'Colores, fuentes y apariencia',
    step4: 'Generar',
    step4Desc: 'Creamos tus variaciones',
    formatHeading: 'Elige el formato',
    formatSub: 'Selecciona dónde se usará tu arte',
    contentHeading: 'Contenido del arte',
    contentSub: 'Busca un versículo o genera texto pastoral',
    styleHeading: 'Personaliza la apariencia',
    styleSub: 'Colores, fuentes y escenario',
    generateHeading: 'Listo para generar',
    generateSub: 'Crearemos variaciones basadas en tu estilo',
    variations: 'Variaciones generadas',
    seeAll: 'Ver todas',
    variationsHint: 'Variaciones creadas con base en tu estilo',
    continue: 'Continuar',
    back: 'Volver',
    generate: 'Generar Carrusel Devocional',
    generating: 'Generando devocional...',
    paletteCard: 'Paleta de Versículos',
    paletteCardSub: 'Elige un versículo para tu arte',
    scenesCard: 'Escenas',
    scenesCardSub: 'Imágenes para el fondo del arte',
    stylesCard: 'Estilos',
    stylesCardSub: 'Apariencia, fuente y clima visual',
    templatesCard: 'Plantillas',
    templatesCardSub: 'Modelos listos para usar',
    finalReady: '¿Listo? Elige cómo usar tu arte',
    copy: 'Copiar',
    copyDesc: 'Copiar imagen',
    share: 'Compartir',
    shareDesc: 'Generar enlace',
    download: 'Descargar',
    downloadDesc: 'PNG o ZIP',
    finalHint: '1 arte: PNG • Carrusel: ZIP con todas las imágenes',
    needVerse: 'Carga un versículo en el paso "Contenido" antes de generar',
    carouselGenerated: '¡Carrusel generado!',
    carouselError: 'Error al generar carrusel',
    clear: 'Limpiar todo',
    modeLabel: 'Modo',
  },
};

export default function SocialStudio() {
  const { lang } = useLanguage();
  const { user, profile } = useAuth();
  const location = useLocation();
  const h = headings[lang];
  const userPlan = (profile?.plan || 'free') as 'free' | 'starter' | 'pro' | 'igreja';
  const hasAccess = userPlan !== 'free';

  const [activeTab, setActiveTab] = useState<string>('studio');
  const [step, setStep] = useState<WizardStep>('format');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('4:5');
  const [slideCount, setSlideCount] = useState<SlideCount>(1);
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [verseContext, setVerseContext] = useState<{ text: string; book: string } | null>(null);
  const [loadingDevotional, setLoadingDevotional] = useState(false);
  const [presentationMode, setPresentationMode] = useState(false);
  const [activePaletteId, setActivePaletteId] = useState<string | null>(null);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [template, setTemplate] = useState<CanvasTemplate>('cinematic');
  const [imageMode, setImageMode] = useState<ImageMode>('biblica');
  const [showVerseError, setShowVerseError] = useState(false);
  const [openModal, setOpenModal] = useState<null | 'palette' | 'scenes' | 'styles' | 'templates'>(null);

  const [theme, setTheme] = useState<ThemeConfig>({
    gradient: colorPresets[0].gradient,
    fontFamily: "'Cormorant Garamond', 'Georgia', serif",
    textColor: '#FFFFFF',
    overlayOpacity: 55,
    backgroundImageUrl: undefined,
  });

  const versionLabel = (() => {
    const code = profile?.bible_version || getDefaultVersionCode(lang);
    return getBibleVersion(code)?.shortLabel || code.toUpperCase();
  })();

  const withVersion = (passage: string) =>
    passage.includes('(') ? passage : `${passage} (${versionLabel})`;

  const handlePaletteSelect = useCallback((p: VersePalette) => {
    setActivePaletteId(p.id);
    setActiveSceneId(null);
    setTheme((prev) => ({
      ...prev,
      gradient: p.gradient,
      textColor: p.textColor,
      backgroundImageUrl: undefined,
    }));
  }, []);

  const handleSceneSelect = useCallback((imageUrl: string, sceneId: string) => {
    setActiveSceneId(sceneId);
    setActivePaletteId(null);
    setTheme((prev) => ({ ...prev, backgroundImageUrl: imageUrl }));
    toast.success(lang === 'PT' ? 'Cena aplicada!' : lang === 'EN' ? 'Scene applied!' : '¡Escena aplicada!');
  }, [lang]);

  // Workspace defaults
  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const { data } = await supabase
          .from('workspaces')
          .select('brand_color')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data?.brand_color) {
          const preset = colorPresets.find(p => p.gradient.includes(data.brand_color!));
          setTheme(prev => ({
            ...prev,
            gradient: preset?.gradient || `linear-gradient(135deg, ${data.brand_color}, ${data.brand_color}88)`,
          }));
        }
      } catch { /* silent */ }
    };
    load();
  }, [user]);

  // Router state — incoming verse / sermon prefill
  useEffect(() => {
    const state = location.state as {
      prefilledSlides?: SlideData[];
      defaultAspectRatio?: AspectRatio;
      presentationMode?: boolean;
      verseText?: string;
      passage?: string;
      slideCount?: SlideCount;
      source_content?: string;
      source_title?: string;
      source_origin?: string;
    } | null;
    if (!state) return;

    if (state.source_content && state.source_content.trim()) {
      const raw = state.source_content.trim();
      const firstHeading = raw.match(/^#+\s+(.+)$/m)?.[1]?.trim();
      const headline = (state.source_title || firstHeading || 'Sermão').slice(0, 120);
      const firstParagraph = raw
        .split('\n')
        .map((l) => l.replace(/^[#>*\-\s]+/, '').trim())
        .find((l) => l.length > 30 && l.length < 280) || '';

      setSlides([{ text: headline, subtitle: firstParagraph, slideNumber: 1, totalSlides: 1 }]);
      setVerseContext({ text: firstParagraph || headline, book: headline });
      setSlideCount(1);
      setPresentationMode(false);
      setStep('style');
      window.history.replaceState({}, document.title);
      toast.success(
        lang === 'PT' ? 'Sermão carregado! Pronto para gerar carrossel.'
          : lang === 'EN' ? 'Sermon loaded! Ready to generate carousel.'
          : '¡Sermón cargado! Listo para generar carrusel.'
      );
      return;
    }

    if (state.prefilledSlides && state.prefilledSlides.length > 0) {
      setSlides(state.prefilledSlides);
      if (state.defaultAspectRatio) setAspectRatio(state.defaultAspectRatio);
      if (state.presentationMode) setPresentationMode(true);
      if (state.slideCount) setSlideCount(state.slideCount);
      window.history.replaceState({}, document.title);
      return;
    }

    if (state.verseText && state.passage) {
      setVerseContext({ text: state.verseText, book: state.passage });
      setSlides([{
        text: `"${state.verseText}"`,
        subtitle: withVersion(state.passage),
        slideNumber: 1,
        totalSlides: 1,
      }]);
      setSlideCount(1);
      setPresentationMode(false);
      setStep('style');
      window.history.replaceState({}, document.title);
      toast.success(
        lang === 'PT' ? 'Versículo carregado no Estúdio!'
          : lang === 'EN' ? 'Verse loaded in Studio!'
          : '¡Versículo cargado en el Estudio!'
      );
    }
  }, [location.state, lang]);

  const handleBackgroundUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setTheme((prev) => ({ ...prev, backgroundImageUrl: reader.result as string }));
      setActiveSceneId(null);
      toast.success(lang === 'PT' ? 'Imagem aplicada' : lang === 'EN' ? 'Image applied' : 'Imagen aplicada');
    };
    reader.readAsDataURL(file);
  }, [lang]);

  const handleVerseGenerated = useCallback((v: { text: string; book: string; topic_image: string }) => {
    setVerseContext({ text: v.text, book: v.book });
    setSlides([{ text: `"${v.text}"`, subtitle: withVersion(v.book), slideNumber: 1, totalSlides: 1 }]);
    setSlideCount(1);
    setPresentationMode(false);
    setShowVerseError(false);
  }, [versionLabel]);

  const handleTextGenerated = useCallback((text: string) => {
    const truncated = text.length > 280 ? text.slice(0, 277) + '…' : text;
    setVerseContext(null);
    setSlides([{ text: truncated, slideNumber: 1, totalSlides: 1 }]);
    setSlideCount(1);
    setPresentationMode(false);
  }, []);

  const generateDevotionalCarousel = async () => {
    if (!verseContext) {
      setShowVerseError(true);
      setStep('content');
      return;
    }
    setShowVerseError(false);
    setLoadingDevotional(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-social-carousel', {
        body: {
          verse: `${verseContext.book} — "${verseContext.text}"`,
          topic: verseContext.book,
          language: lang,
          slideCount,
          imageMode,
          imageStyle: imageMode,
          stylePrompt: getImageModePromptFragment(imageMode),
        },
      });
      if (error) throw error;
      const result = data?.slides as Array<{ slide: number; type: string; title: string; content: string }>;
      if (result && result.length > 0) {
        const total = result.length;
        const built: SlideData[] = result.map((s, i) => ({
          text: s.type === 'verse' ? `"${s.content}"` : s.title,
          subtitle: s.type === 'verse' ? withVersion(verseContext.book) : s.content,
          slideNumber: i + 1,
          totalSlides: total,
        }));
        setSlides(built);
        setPresentationMode(false);
        toast.success(h.carouselGenerated);
      }
    } catch {
      toast.error(h.carouselError);
    } finally {
      setLoadingDevotional(false);
    }
  };

  const handleClear = () => {
    setSlides([]);
    setVerseContext(null);
    setPresentationMode(false);
    setSlideCount(1);
    setActivePaletteId(null);
    setActiveSceneId(null);
    setShowVerseError(false);
    setStep('format');
  };

  // ── Plano free não tem acesso ──
  if (!hasAccess) {
    return (
      <div className="theme-app max-w-3xl mx-auto py-12">
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-background">
          <CardContent className="p-8 sm:p-12 text-center space-y-6">
            <div className="inline-flex h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 items-center justify-center shadow-lg mx-auto">
              <Wand2 className="h-8 w-8 text-primary-foreground" />
            </div>
            <div className="space-y-2">
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
                {lang === 'PT' ? 'Estúdio Social' : lang === 'EN' ? 'Social Studio' : 'Estudio Social'}
              </h1>
              <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
                {lang === 'PT'
                  ? 'Crie artes profissionais para suas redes em segundos. Disponível nos planos Starter, Pro e Igreja.'
                  : lang === 'EN'
                  ? 'Create professional social media art in seconds. Available on Starter, Pro and Church plans.'
                  : 'Crea artes profesionales para tus redes en segundos. Disponible en planes Starter, Pro e Iglesia.'}
              </p>
            </div>
            <Button size="lg" className="gap-2" onClick={() => window.location.assign('/upgrade')}>
              <Sparkles className="h-4 w-4" />
              {lang === 'PT' ? 'Ver planos' : lang === 'EN' ? 'View plans' : 'Ver planes'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Wizard step definitions ──
  const steps: Array<{ id: WizardStep; n: number; label: string; desc: string; icon: typeof Layers }> = [
    { id: 'format', n: 1, label: h.step1, desc: h.step1Desc, icon: Layers },
    { id: 'content', n: 2, label: h.step2, desc: h.step2Desc, icon: BookOpen },
    { id: 'style', n: 3, label: h.step3, desc: h.step3Desc, icon: Brush },
    { id: 'generate', n: 4, label: h.step4, desc: h.step4Desc, icon: Sparkles },
  ];
  const currentStepIndex = steps.findIndex((s) => s.id === step);
  const goNext = () => {
    if (currentStepIndex < steps.length - 1) setStep(steps[currentStepIndex + 1].id);
  };
  const goBack = () => {
    if (currentStepIndex > 0) setStep(steps[currentStepIndex - 1].id);
  };

  return (
    <div className="theme-app overflow-x-hidden">
      {/* Header */}
      <div className="mb-5 sm:mb-6">
        <div className="flex items-center gap-3 mb-1.5">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md shrink-0">
            <Wand2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight">{h.title}</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">{h.subtitle}</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-secondary border border-border shadow-sm mb-5">
          <TabsTrigger value="studio" className="gap-1.5 text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            {h.studio}
          </TabsTrigger>
          <TabsTrigger value="gallery" className="gap-1.5 text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground">
            <ImageIcon className="h-3.5 w-3.5" />
            {h.gallery}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="studio" className="mt-0 space-y-5">
          {/* ── 4-step wizard tracker ── */}
          <div className="overflow-x-auto -mx-1">
            <div className="flex items-stretch gap-2 sm:gap-3 px-1 min-w-max">
              {steps.map((s, idx) => {
                const Icon = s.icon;
                const active = step === s.id;
                const done = idx < currentStepIndex;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStep(s.id)}
                    className={`flex-1 min-w-[180px] flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-all ${
                      active
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : done
                          ? 'border-primary/30 bg-card hover:border-primary/50'
                          : 'border-border bg-card hover:border-primary/30'
                    }`}
                  >
                    <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center ${
                      active ? 'bg-primary text-primary-foreground' : done ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'
                    }`}>
                      {done ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                      <div className={`text-sm font-bold leading-tight ${active ? 'text-foreground' : 'text-foreground'}`}>
                        {s.n}. {s.label}
                      </div>
                      <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">{s.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Main 3-column grid: Step panel | Preview | Variations ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr_300px] gap-4">
            {/* LEFT — Active step panel */}
            <Card className="bg-card border-border min-w-0">
              <CardContent className="p-4 sm:p-5 space-y-4">
                {step === 'format' && (
                  <>
                    <div>
                      <h2 className="text-lg font-bold text-foreground font-display">{h.formatHeading}</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">{h.formatSub}</p>
                    </div>
                    <AspectRatioSelector value={aspectRatio} onChange={setAspectRatio} lang={lang} />
                    <SlideCountPicker
                      value={slideCount}
                      onChange={(v) => {
                        setSlideCount(v);
                        if (v > 1 && verseContext && slides.length === 1) {
                          toast.info(
                            lang === 'PT' ? 'Avance até "Gerar" para criar os slides'
                            : lang === 'EN' ? 'Go to "Generate" to create slides'
                            : 'Avanza a "Generar" para crear los slides'
                          );
                        }
                      }}
                      lang={lang}
                    />
                    <Button onClick={goNext} className="w-full gap-2" size="lg">
                      {h.continue}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </>
                )}

                {step === 'content' && (
                  <>
                    <div>
                      <h2 className="text-lg font-bold text-foreground font-display">{h.contentHeading}</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">{h.contentSub}</p>
                    </div>
                    <ContentGenerator
                      onVerseGenerated={handleVerseGenerated}
                      onTextGenerated={handleTextGenerated}
                    />
                    {showVerseError && (
                      <p className="text-[12px] text-destructive">{h.needVerse}</p>
                    )}
                    <div className="flex gap-2">
                      <Button onClick={goBack} variant="outline" className="flex-1">{h.back}</Button>
                      <Button onClick={goNext} className="flex-1 gap-2">
                        {h.continue}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}

                {step === 'style' && (
                  <>
                    <div>
                      <h2 className="text-lg font-bold text-foreground font-display">{h.styleHeading}</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">{h.styleSub}</p>
                    </div>
                    <ImageModePicker value={imageMode} onChange={setImageMode} lang={lang} />
                    <div className="pt-2 border-t border-border">
                      <ThemeCustomizer
                        value={theme}
                        onChange={(v) => { setTheme(v); setActivePaletteId(null); setActiveSceneId(null); }}
                        lang={lang}
                        onUploadBackground={handleBackgroundUpload}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={goBack} variant="outline" className="flex-1">{h.back}</Button>
                      <Button onClick={goNext} className="flex-1 gap-2">
                        {h.continue}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}

                {step === 'generate' && (
                  <>
                    <div>
                      <h2 className="text-lg font-bold text-foreground font-display">{h.generateHeading}</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">{h.generateSub}</p>
                    </div>
                    {!verseContext && (
                      <p className="text-xs text-muted-foreground bg-secondary border border-border rounded-lg p-3">
                        {h.needVerse}
                      </p>
                    )}
                    <Button
                      onClick={generateDevotionalCarousel}
                      disabled={loadingDevotional || !verseContext}
                      size="lg"
                      className="w-full gap-2"
                    >
                      {loadingDevotional ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      {loadingDevotional ? h.generating : `${h.generate} (${slideCount})`}
                    </Button>
                    <div className="flex gap-2">
                      <Button onClick={goBack} variant="outline" className="flex-1">{h.back}</Button>
                      {slides.length > 0 && (
                        <Button variant="ghost" onClick={handleClear} className="flex-1 text-muted-foreground">
                          {h.clear}
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* CENTER — Preview */}
            <Card className="bg-card border-border min-w-0">
              <CardContent className="p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="inline-flex items-center text-[11px] font-medium rounded-full px-2.5 py-1 bg-primary/10 text-primary">
                    {h.modeLabel}: {getImageModeLabel(imageMode, lang)}
                  </span>
                </div>
                <VariationGrid
                  slides={slides}
                  aspectRatio={aspectRatio}
                  theme={theme}
                  lang={lang}
                  template={template}
                  presentationMode={presentationMode}
                />
              </CardContent>
            </Card>

            {/* RIGHT — Variations summary */}
            <Card className="bg-card border-border min-w-0">
              <CardContent className="p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">{h.variations}</h3>
                  <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary/15 text-primary text-[10px] font-bold px-1.5">
                    {slides.length}
                  </span>
                </div>
                {slides.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-secondary/30 p-6 text-center">
                    <ImageIcon className="h-6 w-6 mx-auto text-muted-foreground/60 mb-2" />
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{h.variationsHint}</p>
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground">{h.variationsHint}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Bottom row: Quick-access tools ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'palette' as const, icon: BookOpen, title: h.paletteCard, desc: h.paletteCardSub },
              { id: 'scenes' as const, icon: Mountain, title: h.scenesCard, desc: h.scenesCardSub },
              { id: 'styles' as const, icon: Brush, title: h.stylesCard, desc: h.stylesCardSub },
              { id: 'templates' as const, icon: LayoutTemplate, title: h.templatesCard, desc: h.templatesCardSub },
            ].map((c) => {
              const Icon = c.icon;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setOpenModal(c.id)}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left hover:border-primary/40 hover:shadow-sm transition-all"
                >
                  <div className="h-9 w-9 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-foreground leading-tight">{c.title}</div>
                    <div className="text-[11px] text-muted-foreground leading-snug mt-0.5">{c.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="gallery" className="mt-0">
          <ArtGallery lang={lang} refreshTrigger={0} />
        </TabsContent>
      </Tabs>

      {/* ── Quick-access modals (Paleta / Cenas / Estilos / Templates) ── */}
      <Dialog open={openModal === 'palette'} onOpenChange={(v) => !v && setOpenModal(null)}>
        <DialogContent className="theme-app border-border bg-background text-foreground sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">{h.paletteCard}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto pr-1">
            <VersePalettePicker value={activePaletteId} onChange={(p) => { handlePaletteSelect(p); setOpenModal(null); }} lang={lang} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openModal === 'scenes'} onOpenChange={(v) => !v && setOpenModal(null)}>
        <DialogContent className="theme-app border-border bg-background text-foreground sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-display">{h.scenesCard}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto pr-1">
            <BiblicalSceneGallery
              onPick={(url, id) => { handleSceneSelect(url, id); setOpenModal(null); }}
              lang={lang}
              activeId={activeSceneId}
              searchTerm={verseContext?.book || verseContext?.text}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openModal === 'styles'} onOpenChange={(v) => !v && setOpenModal(null)}>
        <DialogContent className="theme-app border-border bg-background text-foreground sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">{h.stylesCard}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto pr-1 space-y-4">
            <ImageModePicker value={imageMode} onChange={setImageMode} lang={lang} />
            <ThemeCustomizer
              value={theme}
              onChange={(v) => { setTheme(v); setActivePaletteId(null); setActiveSceneId(null); }}
              lang={lang}
              onUploadBackground={handleBackgroundUpload}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openModal === 'templates'} onOpenChange={(v) => !v && setOpenModal(null)}>
        <DialogContent className="theme-app border-border bg-background text-foreground sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">{h.templatesCard}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto pr-1">
            <TemplatePicker value={template} onChange={(t) => { setTemplate(t); setOpenModal(null); }} lang={lang} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
