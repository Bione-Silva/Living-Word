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
import {
  Sparkles, Layers, Loader2, Wand2, Image as ImageIcon, Palette, BookOpen,
  Hash, PenLine, Camera, Mountain, Brush, LayoutTemplate,
} from 'lucide-react';
import { toast } from 'sonner';

type L = 'PT' | 'EN' | 'ES';

const headings: Record<L, Record<string, string>> = {
  PT: {
    title: 'Estúdio Social',
    subtitle: 'Crie artes para suas redes em um clique. Geramos todas as variações automaticamente — você só escolhe e baixa.',
    studio: 'Estúdio',
    gallery: 'Minhas Artes',
    format: 'Formato',
    slideCount: 'Quantidade',
    inputTitle: 'Conteúdo',
    inputDesc: 'Busque um versículo ou gere texto pastoral',
    contentGen: 'Gerador',
    imageMode: 'Imagem',
    carousel: 'Carrossel',
    palette: 'Paleta',
    scenes: 'Cenas',
    designTitle: 'Estilo',
    designDesc: 'Cor de fundo, fonte e cor do texto',
    sceneTitle: 'Cenas Bíblicas',
    templateTitle: 'Template',
    generateCarousel: 'Gerar Carrossel Devocional',
    carouselFromVerse: 'Cria slides automáticos a partir do versículo',
    carouselGenerated: 'Carrossel gerado!',
    carouselError: 'Erro ao gerar carrossel',
    generating: 'Gerando devocional...',
    clear: 'Limpar',
  },
  EN: {
    title: 'Social Studio',
    subtitle: 'Create social media art in one click. We generate all variations automatically — you just pick and download.',
    studio: 'Studio',
    gallery: 'My Arts',
    format: 'Format',
    inputTitle: 'Content',
    inputDesc: 'Search a verse or generate pastoral text',
    designTitle: 'Visual Style',
    designDesc: 'Background color, font and text color',
    sceneTitle: 'Biblical Scenes',
    generateCarousel: 'Generate Devotional Carousel',
    carouselFromVerse: 'Auto-creates slides from the verse',
    carouselGenerated: 'Carousel generated!',
    carouselError: 'Error generating carousel',
    generating: 'Generating devotional...',
    clear: 'Clear',
  },
  ES: {
    title: 'Estudio Social',
    subtitle: 'Crea artes para tus redes en un clic. Generamos todas las variaciones automáticamente — solo eliges y descargas.',
    studio: 'Estudio',
    gallery: 'Mis Artes',
    format: 'Formato',
    inputTitle: 'Contenido',
    inputDesc: 'Busca un versículo o genera texto pastoral',
    designTitle: 'Estilo Visual',
    designDesc: 'Color de fondo, fuente y color del texto',
    sceneTitle: 'Escenas Bíblicas',
    generateCarousel: 'Generar Carrusel Devocional',
    carouselFromVerse: 'Crea slides automáticos del versículo',
    carouselGenerated: '¡Carrusel generado!',
    carouselError: 'Error al generar carrusel',
    generating: 'Generando devocional...',
    clear: 'Limpiar',
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

  const [theme, setTheme] = useState<ThemeConfig>({
    gradient: colorPresets[0].gradient,
    fontFamily: "'Cormorant Garamond', 'Georgia', serif",
    textColor: '#FFFFFF',
    overlayOpacity: 55,
    backgroundImageUrl: undefined,
  });

  // Resolve the active Bible version label (e.g. "ARA", "KJV") from the user's profile.
  // Falls back to the default version for the current UI language.
  const versionLabel = (() => {
    const code = profile?.bible_version || getDefaultVersionCode(lang);
    return getBibleVersion(code)?.shortLabel || code.toUpperCase();
  })();

  /** Append the Bible version label to a passage reference, e.g. "João 3:16 (ARA)". */
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

  // Router state — handles 4 entry points:
  //  1) Bible verse selected → { verseText, passage }
  //  2) Devotional → { devotionalSlides, slideCount, presentationMode }
  //  3) Sermon (legacy) → { prefilledSlides, defaultAspectRatio, presentationMode }
  //  4) Sermon (Studio de Blocos / sermão pronto) → { source_content, source_title, source_origin }
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

    // 4) Sermão completo vindo do Studio de Blocos / Sermões.
    //    Pré-popula o canvas com a Grande Ideia/Título e abre uma aba focada
    //    para o pregador rodar Carrossel Devocional sem colar nada de novo.
    if (state.source_content && state.source_content.trim()) {
      const raw = state.source_content.trim();
      const firstHeading = raw.match(/^#+\s+(.+)$/m)?.[1]?.trim();
      const headline = (state.source_title || firstHeading || 'Sermão').slice(0, 120);
      // Extrai o primeiro parágrafo significativo como subtítulo
      const firstParagraph = raw
        .split('\n')
        .map((l) => l.replace(/^[#>*\-\s]+/, '').trim())
        .find((l) => l.length > 30 && l.length < 280) || '';

      setSlides([{
        text: headline,
        subtitle: firstParagraph,
        slideNumber: 1,
        totalSlides: 1,
      }]);
      setVerseContext({ text: firstParagraph || headline, book: headline });
      setSlideCount(1);
      setPresentationMode(false);
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
      // Focus first verse-related input on the page (ContentGenerator).
      const firstInput = document.querySelector<HTMLInputElement>(
        'input[placeholder*="João"], input[placeholder*="John"], input[placeholder*="Juan"]'
      );
      firstInput?.focus();
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
        setPresentationMode(false); // Devotional carousel is for social, not a presentation
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
  };

  // ── Plano free não tem acesso ao Estúdio Social ──
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
            <div className="grid sm:grid-cols-3 gap-3 max-w-2xl mx-auto pt-2">
              {[
                { plan: 'Starter', credits: 'Banco compartilhado', emoji: '🎨' },
                { plan: 'Pro', credits: '+ 20 imagens novas/mês', emoji: '👑' },
                { plan: 'Igreja', credits: '+ 50 imagens novas/mês', emoji: '🏛️' },
              ].map((p) => (
                <div key={p.plan} className="rounded-xl border border-border bg-card p-4 text-center">
                  <div className="text-2xl mb-1">{p.emoji}</div>
                  <div className="font-bold text-sm text-foreground">{p.plan}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">{p.credits}</div>
                </div>
              ))}
            </div>
            <Button
              size="lg"
              className="gap-2"
              onClick={() => window.location.assign('/upgrade')}
            >
              <Sparkles className="h-4 w-4" />
              {lang === 'PT' ? 'Ver planos' : lang === 'EN' ? 'View plans' : 'Ver planes'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="theme-app overflow-x-hidden">
      {/* Header */}
      <div className="mb-5 sm:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md shrink-0">
            <Wand2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight break-words min-w-0">{h.title}</h1>
        </div>
        <p className="text-muted-foreground text-xs sm:text-sm md:text-base max-w-2xl leading-relaxed">{h.subtitle}</p>
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

        <TabsContent value="studio" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 sm:gap-6">
            {/* ── LEFT: INPUT PANEL ── */}
            <div className="space-y-4 lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:pr-1 min-w-0">
              {/* Format selector */}
              <Card className="bg-card border-border">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">{h.format}</h3>
                  </div>
                  <AspectRatioSelector value={aspectRatio} onChange={setAspectRatio} lang={lang} />
                </CardContent>
              </Card>

              {/* Slide count selector */}
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <SlideCountPicker
                    value={slideCount}
                    onChange={(v) => {
                      setSlideCount(v);
                      // If verse loaded and user picks > 1, hint to generate carousel
                      if (v > 1 && verseContext && slides.length === 1) {
                        toast.info(
                          lang === 'PT' ? 'Clique em "Gerar Carrossel" abaixo para criar os slides'
                          : lang === 'EN' ? 'Click "Generate Carousel" below to create slides'
                          : 'Haz clic en "Generar Carrusel" abajo para crear los slides'
                        );
                      }
                    }}
                    lang={lang}
                  />
                </CardContent>
              </Card>

              {/* Content input */}
              <div>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">{h.inputTitle}</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-3 px-1">{h.inputDesc}</p>
                <ContentGenerator
                  onVerseGenerated={handleVerseGenerated}
                  onTextGenerated={handleTextGenerated}
                />
              </div>

              {/* ── NEW: Image Mode picker ── */}
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <ImageModePicker
                    value={imageMode}
                    onChange={(m) => setImageMode(m)}
                    lang={lang}
                  />
                </CardContent>
              </Card>

              {/* Devotional carousel CTA (only when verse loaded + slideCount > 1) */}
              {verseContext && slideCount > 1 && (
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start gap-2">
                      <Layers className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-foreground">{h.generateCarousel}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{h.carouselFromVerse} ({slideCount})</p>
                      </div>
                    </div>
                    <Button
                      onClick={generateDevotionalCarousel}
                      disabled={loadingDevotional}
                      size="sm"
                      className="w-full gap-1.5"
                    >
                      {loadingDevotional ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      {loadingDevotional ? h.generating : `${h.generateCarousel} (${slideCount})`}
                    </Button>
                    {showVerseError && (
                      <p className="text-[12px] mt-1" style={{ color: '#dc2626' }}>
                        {lang === 'PT'
                          ? 'Digite um versículo ou tema antes de gerar'
                          : lang === 'EN'
                          ? 'Type a verse or theme before generating'
                          : 'Escribe un versículo o tema antes de generar'}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Verse palette gallery — always visible (permanent) */}
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <VersePalettePicker
                    value={activePaletteId}
                    onChange={handlePaletteSelect}
                    lang={lang}
                  />
                </CardContent>
              </Card>

              {/* Biblical Scene Gallery — community library + AI on demand */}
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <BiblicalSceneGallery
                    onPick={handleSceneSelect}
                    lang={lang}
                    activeId={activeSceneId}
                    searchTerm={verseContext?.book || verseContext?.text}
                  />
                </CardContent>
              </Card>

              {/* Visual style — custom background + colors */}
              <div>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <Palette className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">{h.designTitle}</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-3 px-1">{h.designDesc}</p>
                <ThemeCustomizer
                  value={theme}
                  onChange={(v) => { setTheme(v); setActivePaletteId(null); setActiveSceneId(null); }}
                  lang={lang}
                  onUploadBackground={handleBackgroundUpload}
                />
              </div>

              {/* Poster style picker — single template applied to all slides */}
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <TemplatePicker value={template} onChange={setTemplate} lang={lang} />
                </CardContent>
              </Card>

              {slides.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="w-full text-muted-foreground hover:text-foreground"
                >
                  {h.clear}
                </Button>
              )}
            </div>

            {/* ── RIGHT: VARIATION GRID ── */}
            <div className="min-w-0">
              <div className="mb-2">
                <span
                  className="inline-block text-[11px] font-medium"
                  style={{
                    color: '#7c3aed',
                    background: '#ede9fe',
                    padding: '3px 10px',
                    borderRadius: 9999,
                  }}
                >
                  {lang === 'PT' ? 'Modo: ' : lang === 'EN' ? 'Mode: ' : 'Modo: '}
                  {getImageModeLabel(imageMode, lang)}
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
            </div>
          </div>
        </TabsContent>

        <TabsContent value="gallery" className="mt-0">
          <ArtGallery lang={lang} refreshTrigger={0} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
