import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { type AspectRatio } from '@/components/social-studio/AspectRatioSelector';
import { type SlideData } from '@/components/social-studio/SlideCanvas';
import { ThemeCustomizer, type ThemeConfig, colorPresets } from '@/components/social-studio/ThemeCustomizer';
import { TemplatePicker, type CanvasTemplate } from '@/components/social-studio/TemplatePicker';
import { VersePalettePicker, type VersePalette } from '@/components/social-studio/VersePalettePicker';
import { getBibleVersion, getDefaultVersionCode } from '@/lib/bible-data';
import { type SlideCount } from '@/components/social-studio/SlideCountPicker';
import { BiblicalSceneGallery } from '@/components/social-studio/BiblicalSceneGallery';
import { ContentGenerator } from '@/components/social-studio/ContentGenerator';

import { VariationGrid, type VariationGridHandle } from '@/components/social-studio/VariationGrid';
import { ArtGallery } from '@/components/social-studio/ArtGallery';
import {
  getImageModePromptFragment,
  getImageModeLabel,
  type ImageMode,
} from '@/components/social-studio/ImageModePicker';
import { FormatPicker, getFormatById, findFormatByAspect, type FormatId } from '@/components/social-studio/FormatPicker';
import { MultiFormatExporter, type MultiFormatExporterHandle } from '@/components/social-studio/MultiFormatExporter';
import { FinalActionsPanel } from '@/components/social-studio/FinalActionsPanel';
import { applySceneDistribution, type CarouselDistributionMode, type SceneAsset, type SceneSourceType, type VariationMode } from '@/components/social-studio/scene-distribution';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sparkles, Loader2, Wand2, Image as ImageIcon, BookOpen,
  Mountain, Brush, LayoutTemplate, Check, ArrowRight, Layers,
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
    step1: 'Formato', step1Desc: 'Onde será publicado',
    step2: 'Conteúdo', step2Desc: 'Texto, versículo ou tema',
    step3: 'Estilo', step3Desc: 'Cores, fontes e aparência',
    step4: 'Gerar', step4Desc: 'Criamos suas variações',
    formatHeading: 'Escolha o formato',
    formatSub: 'Selecione onde sua arte será publicada',
    formatPreview: 'Pré-visualização do formato',
    contentHeading: 'Conteúdo da arte',
    contentSub: 'Busque um versículo ou gere texto pastoral',
    styleHeading: 'Estilo da sua arte',
    styleSub: 'Personalize cores, fontes e clima visual',
    generateHeading: 'Variações geradas',
    generateSub: 'Escolha a arte ideal para você',
    continue: 'Continuar', back: 'Voltar', apply: 'Aplicar estilo',
    applied: 'Estilo aplicado à arte',
    generate: 'Gerar variações',
    generating: 'Gerando devocional...',
    paletteCard: 'Paleta de Versículos', paletteCardSub: 'Escolha um versículo para sua arte',
    scenesCard: 'Cenas', scenesCardSub: 'Imagens para o fundo da arte',
    templatesCard: 'Templates', templatesCardSub: 'Modelos prontos para usar',
    needVerse: 'Carregue um versículo na etapa "Conteúdo" antes de gerar',
    carouselGenerated: 'Carrossel gerado!',
    carouselError: 'Erro ao gerar carrossel',
    clear: 'Limpar tudo',
    modeLabel: 'Modo',
  },
  EN: {
    title: 'Social Studio',
    subtitle: 'Create stunning art in just a few clicks.',
    studio: 'Studio', gallery: 'My Arts',
    step1: 'Format', step1Desc: 'Where it will be published',
    step2: 'Content', step2Desc: 'Text, verse or theme',
    step3: 'Style', step3Desc: 'Colors, fonts and look',
    step4: 'Generate', step4Desc: 'We create your variations',
    formatHeading: 'Choose the format',
    formatSub: 'Select where your art will be used',
    formatPreview: 'Format preview',
    contentHeading: 'Art content',
    contentSub: 'Search a verse or generate pastoral text',
    styleHeading: 'Art style',
    styleSub: 'Customize colors, fonts and visual mood',
    generateHeading: 'Generated variations',
    generateSub: 'Pick the art you love',
    continue: 'Continue', back: 'Back', apply: 'Apply style',
    applied: 'Style applied to artwork',
    generate: 'Generate variations',
    generating: 'Generating devotional...',
    paletteCard: 'Verse Palette', paletteCardSub: 'Pick a verse for your art',
    scenesCard: 'Scenes', scenesCardSub: 'Background images for your art',
    templatesCard: 'Templates', templatesCardSub: 'Ready-made models to use',
    needVerse: 'Load a verse in the "Content" step before generating',
    carouselGenerated: 'Carousel generated!',
    carouselError: 'Error generating carousel',
    clear: 'Clear all',
    modeLabel: 'Mode',
  },
  ES: {
    title: 'Estudio Social',
    subtitle: 'Crea artes increíbles en pocos clics.',
    studio: 'Estudio', gallery: 'Mis Artes',
    step1: 'Formato', step1Desc: 'Dónde será publicado',
    step2: 'Contenido', step2Desc: 'Texto, versículo o tema',
    step3: 'Estilo', step3Desc: 'Colores, fuentes y apariencia',
    step4: 'Generar', step4Desc: 'Creamos tus variaciones',
    formatHeading: 'Elige el formato',
    formatSub: 'Selecciona dónde se usará tu arte',
    formatPreview: 'Vista previa del formato',
    contentHeading: 'Contenido del arte',
    contentSub: 'Busca un versículo o genera texto pastoral',
    styleHeading: 'Estilo de tu arte',
    styleSub: 'Personaliza colores, fuentes y clima visual',
    generateHeading: 'Variaciones generadas',
    generateSub: 'Elige el arte ideal para ti',
    continue: 'Continuar', back: 'Volver', apply: 'Aplicar estilo',
    applied: 'Estilo aplicado al arte',
    generate: 'Generar variaciones',
    generating: 'Generando devocional...',
    paletteCard: 'Paleta de Versículos', paletteCardSub: 'Elige un versículo para tu arte',
    scenesCard: 'Escenas', scenesCardSub: 'Imágenes para el fondo del arte',
    templatesCard: 'Plantillas', templatesCardSub: 'Modelos listos para usar',
    needVerse: 'Carga un versículo en el paso "Contenido" antes de generar',
    carouselGenerated: '¡Carrusel generado!',
    carouselError: 'Error al generar carrusel',
    clear: 'Limpiar todo',
    modeLabel: 'Modo',
  },
};

// Aspect ratio → CSS aspect for preview box
const ASPECT_CSS: Record<AspectRatio, string> = {
  '1:1': '1 / 1',
  '4:5': '4 / 5',
  '9:16': '9 / 16',
  '9:16-tiktok': '9 / 16',
  '1.91:1': '1.91 / 1',
};

/**
 * Mapa de gradientes por modo visual — APLICADOS NO PREVIEW NA HORA
 * para o usuário enxergar imediatamente o efeito do modo escolhido.
 * Cada gradiente reflete o clima estético do modo correspondente.
 */
const IMAGE_MODE_GRADIENT: Record<ImageMode, string> = {
  biblica: 'linear-gradient(135deg, #3d2006 0%, #7a4010 55%, #c8861f 100%)',
  moderna: 'linear-gradient(135deg, #f4ede2 0%, #d8c9b4 55%, #8a7f70 100%)',
  editorial: 'linear-gradient(135deg, #1a1a1a 0%, #2e2e2e 55%, #4a4a4a 100%)',
  simbolica: 'linear-gradient(135deg, #0e2010 0%, #1a3d1e 55%, #3a6b3f 100%)',
};

const IMAGE_MODE_TEXT_COLOR: Record<ImageMode, string> = {
  biblica: '#FFF6E5',
  moderna: '#1f1a14',
  editorial: '#FFFFFF',
  simbolica: '#F0FFF4',
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
  const [formatId, setFormatId] = useState<FormatId>('ig-post');
  /** Multi-select destinations — must always include `formatId`. */
  const [selectedFormats, setSelectedFormats] = useState<FormatId[]>(['ig-post']);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [slideCount, setSlideCount] = useState<SlideCount>(1);
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);
  const [verseContext, setVerseContext] = useState<{ text: string; book: string } | null>(null);
  const [loadingDevotional, setLoadingDevotional] = useState(false);
  const [presentationMode, setPresentationMode] = useState(false);
  const [activePaletteId, setActivePaletteId] = useState<string | null>(null);
  const [scenePool, setScenePool] = useState<SceneAsset[]>([]);
  const [sceneSourceType, setSceneSourceType] = useState<SceneSourceType | null>(null);
  const [sceneVariationMode, setSceneVariationMode] = useState<VariationMode>('none');
  const [sceneDistributionMode, setSceneDistributionMode] = useState<CarouselDistributionMode>('auto_balance');
  const [template, setTemplate] = useState<CanvasTemplate>('cinematic');
  const [imageMode, setImageMode] = useState<ImageMode>('biblica');
  const [generatedCaption, setGeneratedCaption] = useState<string>('');
  

  const variationGridRef = useRef<VariationGridHandle | null>(null);
  const exporterRef = useRef<MultiFormatExporterHandle | null>(null);

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

  /** Set the active (preview) format. Adds to selected if absent. */
  const handleSetActiveFormat = useCallback((id: FormatId, def: ReturnType<typeof getFormatById>) => {
    if (!def) return;
    setFormatId(id);
    setAspectRatio(def.aspectRatio);
    setSlideCount(def.slideCount);
    setSelectedFormats((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  /** Toggle a destination on/off (multi-select). Active format cannot be removed alone. */
  const handleToggleFormat = useCallback((id: FormatId) => {
    setSelectedFormats((prev) => {
      if (prev.includes(id)) {
        // Don't allow removing the last selected format
        if (prev.length === 1) return prev;
        const next = prev.filter((f) => f !== id);
        // If we just removed the active one, promote the first remaining
        setFormatId((curr) => {
          if (curr !== id) return curr;
          const promoted = next[0];
          const def = getFormatById(promoted);
          if (def) {
            setAspectRatio(def.aspectRatio);
            setSlideCount(def.slideCount);
          }
          return promoted;
        });
        return next;
      }
      return [...prev, id];
    });
  }, []);

  const handlePaletteSelect = useCallback((p: VersePalette) => {
    setActivePaletteId(p.id);
    setScenePool([]);
    setSceneSourceType(null);
    setSceneVariationMode('none');
    setSceneDistributionMode('auto_balance');
    setTheme((prev) => ({
      ...prev,
      gradient: p.gradient,
      textColor: p.textColor,
      backgroundImageUrl: undefined,
    }));
  }, []);

  const handleScenePoolChange = useCallback((payload: {
    assets: SceneAsset[];
    sourceType: SceneSourceType;
    variationMode: VariationMode;
    distributionMode: CarouselDistributionMode;
  }) => {
    setScenePool(payload.assets);
    setSceneSourceType(payload.sourceType);
    setSceneVariationMode(payload.variationMode);
    setSceneDistributionMode(payload.distributionMode);
    setActivePaletteId(null);
    setTheme((prev) => ({ ...prev, backgroundImageUrl: payload.assets[0]?.imageUrl }));
    toast.success(lang === 'PT' ? 'Cenas aplicadas!' : lang === 'EN' ? 'Scenes applied!' : '¡Escenas aplicadas!');
  }, [lang]);

  const distributedSlides = useMemo(() => {
    if (slides.length === 0 || scenePool.length === 0) return slides;
    return applySceneDistribution(slides, {
      scenePool,
      sourceType: sceneSourceType,
      distributionMode: sceneDistributionMode,
    });
  }, [slides, scenePool, sceneSourceType, sceneDistributionMode, sceneVariationMode]);

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
      if (state.defaultAspectRatio) {
        setAspectRatio(state.defaultAspectRatio);
        setFormatId(findFormatByAspect(state.defaultAspectRatio, state.slideCount ?? 1));
      }
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
    setGeneratedCaption(`"${v.text}"\n\n— ${withVersion(v.book)}`);
    setSlideCount(1);
    setPresentationMode(false);
  }, [versionLabel]);

  const handleTextGenerated = useCallback((text: string) => {
    const truncated = text.length > 280 ? text.slice(0, 277) + '…' : text;
    setVerseContext(null);
    setSlides([{ text: truncated, slideNumber: 1, totalSlides: 1 }]);
    setGeneratedCaption(text);
    setSlideCount(1);
    setPresentationMode(false);
  }, []);

  const generateDevotionalCarousel = async () => {
    if (!verseContext) {
      setStep('content');
      toast.error(h.needVerse);
      return;
    }
    setLoadingDevotional(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-social-carousel', {
        body: {
          verse: `${verseContext.book} — "${verseContext.text}"`,
          topic: verseContext.book,
          language: lang,
          slideCount,
          // Visual mode (4 reais) — escolhido pelo usuário na etapa Estilo
          visualMode: imageMode,
          // Mantidos para retrocompat até o backend migrar tudo
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
        setSelectedSlideIndex(0);
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
    setSelectedSlideIndex(0);
    setGeneratedCaption('');
    setStep('format');
  };

  const currentFormat = useMemo(() => getFormatById(formatId), [formatId]);

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
          {/* ── 4-step wizard tracker (estrutura fixa, só muda o estado) ── */}
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
                      <div className="text-sm font-bold leading-tight text-foreground">
                        {s.n}. {s.label}
                      </div>
                      <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">{s.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── ESTRUTURA FIXA: Esquerda compacta | Centro amplo (preview prioritário) | Direita compacta ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_240px] gap-4">
            {/* ═══ COLUNA ESQUERDA — controles da etapa ═══ */}
            <Card className="bg-card border-border min-w-0">
              <CardContent className="p-3.5 sm:p-4 space-y-3.5">
                {step === 'format' && (
                  <>
                    <div>
                      <h2 className="text-base font-bold text-foreground font-display leading-tight">{h.formatHeading}</h2>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{h.formatSub}</p>
                    </div>
                    <FormatPicker
                      value={formatId}
                      selected={selectedFormats}
                      onSetActive={handleSetActiveFormat}
                      onToggle={handleToggleFormat}
                      lang={lang}
                    />
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
                  </>
                )}

                {step === 'style' && (
                  <>
                    <div>
                      <h2 className="text-lg font-bold text-foreground font-display">{h.styleHeading}</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">{h.styleSub}</p>
                    </div>
                    <ThemeCustomizer
                      value={theme}
                      onChange={(v) => { setTheme(v); setActivePaletteId(null); setActiveSceneId(null); }}
                      lang={lang}
                      onUploadBackground={handleBackgroundUpload}
                    />
                  </>
                )}

                {step === 'generate' && (
                  <>
                    <div>
                      <h2 className="text-lg font-bold text-foreground font-display">{h.generateHeading}</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">{h.generateSub}</p>
                    </div>
                    <Button
                      onClick={generateDevotionalCarousel}
                      disabled={loadingDevotional || !verseContext}
                      className="w-full gap-2"
                    >
                      {loadingDevotional ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      {loadingDevotional ? h.generating : `${h.generate} (${slideCount})`}
                    </Button>
                    {!verseContext && (
                      <p className="text-xs text-muted-foreground bg-secondary border border-border rounded-lg p-3">
                        {h.needVerse}
                      </p>
                    )}
                    {slides.length > 0 && (
                      <Button variant="ghost" onClick={handleClear} className="w-full text-muted-foreground">
                        {h.clear}
                      </Button>
                    )}
                  </>
                )}

                {/* Navegação fixa no rodapé do painel esquerdo.
                    Na etapa "Estilo" o botão é APLICAR (efeito imediato no preview);
                    nas demais é CONTINUAR (avança o wizard). */}
                <div className="flex gap-2 pt-3 border-t border-border">
                  {currentStepIndex > 0 && (
                    <Button onClick={goBack} variant="outline" className="flex-1">{h.back}</Button>
                  )}
                  {step === 'style' ? (
                    <Button
                      onClick={() => {
                        // Tudo já está aplicado em tempo real (theme + imageMode);
                        // este botão só dá feedback explícito + avança para Gerar.
                        toast.success(h.applied);
                        goNext();
                      }}
                      className="flex-1 gap-2"
                    >
                      <Check className="h-4 w-4" />
                      {h.apply}
                    </Button>
                  ) : currentStepIndex < steps.length - 1 ? (
                    <Button onClick={goNext} className="flex-1 gap-2">
                      {h.continue}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            {/* ═══ CENTRO — preview/produto persistente em todas as etapas ═══ */}
            <Card className="bg-card border-border min-w-0">
              <CardContent className="p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-muted-foreground">
                    {lang === 'PT' ? 'Sua arte' : lang === 'EN' ? 'Your art' : 'Tu arte'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center text-[11px] font-medium rounded-full px-2.5 py-1 bg-secondary text-foreground">
                      {currentFormat?.channel[lang]} • {currentFormat?.size}
                    </span>
                    {step !== 'format' && (
                      <span className="inline-flex items-center text-[11px] font-medium rounded-full px-2.5 py-1 bg-primary/10 text-primary">
                        {h.modeLabel}: {getImageModeLabel(imageMode, lang)}
                      </span>
                    )}
                  </div>
                </div>

                {slides.length > 0 ? (
                  <VariationGrid
                    ref={variationGridRef}
                    slides={slides}
                    aspectRatio={aspectRatio}
                    theme={theme}
                    lang={lang}
                    template={template}
                    presentationMode={presentationMode}
                    selectedIndex={selectedSlideIndex}
                    onSelectIndex={setSelectedSlideIndex}
                  />
                ) : (
                  <div
                    className="relative mx-auto rounded-2xl border-2 border-dashed border-primary/30 bg-secondary/30 flex items-center justify-center max-w-full"
                    style={{
                      aspectRatio: ASPECT_CSS[aspectRatio],
                      width: aspectRatio === '9:16' || aspectRatio === '9:16-tiktok' ? 380 : '100%',
                      maxWidth: aspectRatio === '9:16' || aspectRatio === '9:16-tiktok' ? 380 : 720,
                      maxHeight: 720,
                    }}
                  >
                    <div className="text-center px-6">
                      <ImageIcon className="h-10 w-10 mx-auto text-primary/50 mb-3" />
                      <div className="text-sm font-bold text-foreground">
                        {currentFormat?.channel[lang]} <span className="font-normal text-muted-foreground">({currentFormat?.type[lang]})</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{currentFormat?.size}</div>
                      <p className="text-[11px] text-muted-foreground/80 leading-relaxed mt-4 max-w-[260px] mx-auto">
                        {lang === 'PT'
                          ? 'Escolha um versículo ou tema na etapa "Conteúdo" para ver sua arte aqui.'
                          : lang === 'EN'
                          ? 'Pick a verse or theme on the "Content" step to see your art here.'
                          : 'Elige un versículo o tema en el paso "Contenido" para ver tu arte aquí.'}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ═══ COLUNA DIREITA — apoio persistente (sempre visível) ═══ */}
            <Card className="bg-card border-border min-w-0 h-fit lg:sticky lg:top-4">
              <CardContent className="p-3.5 sm:p-4">
                <FinalActionsPanel
                  slides={slides}
                  selectedIndex={selectedSlideIndex}
                  formatLabel={`${currentFormat?.channel[lang] ?? ''} (${currentFormat?.type[lang] ?? ''})`}
                  formatSize={currentFormat?.size ?? ''}
                  destinations={selectedFormats.map((fid) => {
                    const def = getFormatById(fid);
                    return {
                      id: fid,
                      label: `${def?.channel[lang] ?? ''} (${def?.type[lang] ?? ''})`,
                      size: def?.size ?? '',
                    };
                  })}
                  caption={generatedCaption}
                  lang={lang}
                  onDownloadSingle={(idx) => variationGridRef.current?.downloadSlide(idx, 'png') ?? Promise.resolve()}
                  onDownloadZip={async () => {
                    // If only one destination, fall back to the single-format ZIP
                    if (selectedFormats.length <= 1) {
                      await variationGridRef.current?.downloadAllZip();
                      return;
                    }
                    // Multi-destination: build ZIP with one folder per channel
                    try {
                      const blob = await exporterRef.current?.buildZip();
                      if (!blob) return;
                      const fname = `living-word-multicanal-${Date.now()}.zip`;
                      const link = document.createElement('a');
                      link.download = fname;
                      link.href = URL.createObjectURL(blob);
                      link.click();
                      URL.revokeObjectURL(link.href);
                      toast.success(
                        lang === 'PT' ? 'ZIP multicanal pronto!' :
                        lang === 'EN' ? 'Multi-channel ZIP ready!' :
                        '¡ZIP multicanal listo!'
                      );
                    } catch (err) {
                      console.error(err);
                      toast.error(h.carouselError);
                    }
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* ── Bottom row: 3 colunas inline (sempre visíveis, sem popup) ──
               Paleta de Versículos · Cenas · Templates aplicam ao vivo no preview. */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-foreground leading-tight">{h.paletteCard}</div>
                    <div className="text-[11px] text-muted-foreground leading-snug">{h.paletteCardSub}</div>
                  </div>
                </div>
                <div className="max-h-[320px] overflow-y-auto pr-1">
                  <VersePalettePicker
                    value={activePaletteId}
                    onChange={handlePaletteSelect}
                    lang={lang}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Mountain className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-foreground leading-tight">{h.scenesCard}</div>
                    <div className="text-[11px] text-muted-foreground leading-snug">{h.scenesCardSub}</div>
                  </div>
                </div>
                <div className="max-h-[320px] overflow-y-auto pr-1">
                  <BiblicalSceneGallery
                    onPick={handleSceneSelect}
                    lang={lang}
                    activeId={activeSceneId}
                    searchTerm={verseContext?.book || verseContext?.text}
                    visualMode={imageMode}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <LayoutTemplate className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-foreground leading-tight">{h.templatesCard}</div>
                    <div className="text-[11px] text-muted-foreground leading-snug">{h.templatesCardSub}</div>
                  </div>
                </div>
                <div className="max-h-[320px] overflow-y-auto pr-1">
                  <TemplatePicker
                    value={template}
                    onChange={setTemplate}
                    lang={lang}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gallery" className="mt-0">
          <ArtGallery lang={lang} refreshTrigger={0} />
        </TabsContent>
      </Tabs>

      {/* ── Offscreen multi-format renderer (powers per-channel ZIP export) ── */}
      {slides.length > 0 && selectedFormats.length > 1 && (
        <MultiFormatExporter
          ref={exporterRef}
          formats={selectedFormats}
          slides={slides}
          theme={theme}
          template={template}
        />
      )}
    </div>
  );
}
