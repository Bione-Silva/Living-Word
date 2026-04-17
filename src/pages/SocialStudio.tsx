import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AspectRatioSelector, type AspectRatio } from '@/components/social-studio/AspectRatioSelector';
import { type SlideData } from '@/components/social-studio/SlideCanvas';
import { ThemeCustomizer, type ThemeConfig, colorPresets } from '@/components/social-studio/ThemeCustomizer';
import { ContentGenerator } from '@/components/social-studio/ContentGenerator';
import { VariationGrid } from '@/components/social-studio/VariationGrid';
import { ArtGallery } from '@/components/social-studio/ArtGallery';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sparkles, Layers, Loader2, Wand2, Image as ImageIcon, Palette, BookOpen,
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
    inputTitle: 'Conteúdo',
    inputDesc: 'Busque um versículo ou gere texto pastoral',
    designTitle: 'Estilo Visual',
    designDesc: 'Cor de fundo, fonte e cor do texto',
    generateCarousel: 'Gerar Carrossel Devocional',
    carouselFromVerse: 'Cria 5 slides automáticos a partir do versículo',
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
    generateCarousel: 'Generate Devotional Carousel',
    carouselFromVerse: 'Auto-creates 5 slides from the verse',
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
    generateCarousel: 'Generar Carrusel Devocional',
    carouselFromVerse: 'Crea 5 slides automáticos del versículo',
    carouselGenerated: '¡Carrusel generado!',
    carouselError: 'Error al generar carrusel',
    generating: 'Generando devocional...',
    clear: 'Limpiar',
  },
};

export default function SocialStudio() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();
  const h = headings[lang];

  const [activeTab, setActiveTab] = useState<string>('studio');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('4:5');
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [verseContext, setVerseContext] = useState<{ text: string; book: string } | null>(null);
  const [loadingDevotional, setLoadingDevotional] = useState(false);
  const [presentationMode, setPresentationMode] = useState(false);

  const [theme, setTheme] = useState<ThemeConfig>({
    gradient: colorPresets[0].gradient,
    fontFamily: "'Cormorant Garamond', 'Georgia', serif",
    textColor: '#FFFFFF',
    overlayOpacity: 55,
    backgroundImageUrl: undefined,
  });

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

  // Router state (e.g. coming from sermon → "create art")
  useEffect(() => {
    const state = location.state as {
      prefilledSlides?: SlideData[];
      defaultAspectRatio?: AspectRatio;
      presentationMode?: boolean;
    } | null;
    if (state?.prefilledSlides && state.prefilledSlides.length > 0) {
      setSlides(state.prefilledSlides);
      if (state.defaultAspectRatio) setAspectRatio(state.defaultAspectRatio);
      if (state.presentationMode) setPresentationMode(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleBackgroundUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setTheme((prev) => ({ ...prev, backgroundImageUrl: reader.result as string }));
      toast.success(lang === 'PT' ? 'Imagem aplicada' : lang === 'EN' ? 'Image applied' : 'Imagen aplicada');
    };
    reader.readAsDataURL(file);
  }, [lang]);

  const handleVerseGenerated = useCallback((v: { text: string; book: string; topic_image: string }) => {
    setVerseContext({ text: v.text, book: v.book });
    setSlides([{ text: `"${v.text}"`, subtitle: v.book, slideNumber: 1, totalSlides: 1 }]);
    setPresentationMode(false);
  }, []);

  const handleTextGenerated = useCallback((text: string) => {
    const truncated = text.length > 280 ? text.slice(0, 277) + '…' : text;
    setVerseContext(null);
    setSlides([{ text: truncated, slideNumber: 1, totalSlides: 1 }]);
    setPresentationMode(false);
  }, []);

  const generateDevotionalCarousel = async () => {
    if (!verseContext) return;
    setLoadingDevotional(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-social-carousel', {
        body: {
          verse: `${verseContext.book} — "${verseContext.text}"`,
          topic: verseContext.book,
          language: lang,
        },
      });
      if (error) throw error;
      const result = data?.slides as Array<{ slide: number; type: string; title: string; content: string }>;
      if (result && result.length > 0) {
        const total = result.length;
        const built: SlideData[] = result.map((s, i) => ({
          text: s.type === 'verse' ? `"${s.content}"` : s.title,
          subtitle: s.type === 'verse' ? verseContext.book : s.content,
          slideNumber: i + 1,
          totalSlides: total,
        }));
        setSlides(built);
        setPresentationMode(true);
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
  };

  return (
    <div className="theme-app">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md">
            <Wand2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground tracking-tight">{h.title}</h1>
        </div>
        <p className="text-muted-foreground text-sm sm:text-base max-w-2xl leading-relaxed">{h.subtitle}</p>
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
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
            {/* ── LEFT: INPUT PANEL ── */}
            <div className="space-y-4 lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:pr-1">
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

              {/* Devotional carousel CTA (only when verse loaded) */}
              {verseContext && slides.length === 1 && (
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start gap-2">
                      <Layers className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-foreground">{h.generateCarousel}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{h.carouselFromVerse}</p>
                      </div>
                    </div>
                    <Button
                      onClick={generateDevotionalCarousel}
                      disabled={loadingDevotional}
                      size="sm"
                      className="w-full gap-1.5"
                    >
                      {loadingDevotional ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      {loadingDevotional ? h.generating : h.generateCarousel}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Visual style */}
              <div>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <Palette className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">{h.designTitle}</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-3 px-1">{h.designDesc}</p>
                <ThemeCustomizer
                  value={theme}
                  onChange={setTheme}
                  lang={lang}
                  onUploadBackground={handleBackgroundUpload}
                />
              </div>

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
              <VariationGrid
                slides={slides}
                aspectRatio={aspectRatio}
                theme={theme}
                lang={lang}
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
