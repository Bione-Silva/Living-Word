import { useState, useRef, useCallback, useEffect, createRef } from 'react';
import { useLocation } from 'react-router-dom';
import JSZip from 'jszip';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AspectRatioSelector, type AspectRatio } from '@/components/social-studio/AspectRatioSelector';
import { TemplatePicker, type CanvasTemplate } from '@/components/social-studio/TemplatePicker';
import { SlideCanvas, type SlideData } from '@/components/social-studio/SlideCanvas';
import { SlideCard, type ArtStyle } from '@/components/social-studio/SlideCard';
import { VerseOfDayBanner, type VerseData } from '@/components/social-studio/VerseOfDayBanner';
import { CarouselNavigator } from '@/components/social-studio/CarouselNavigator';
import { DownloadButton } from '@/components/social-studio/DownloadButton';
import { ThemeCustomizer, type ThemeConfig, colorPresets } from '@/components/social-studio/ThemeCustomizer';
import { captureNodeAsPng } from '@/components/social-studio/export-utils';
import { PublishPanel } from '@/components/social-studio/PublishPanel';
import { ArtGallery } from '@/components/social-studio/ArtGallery';
import { ContentGenerator } from '@/components/social-studio/ContentGenerator';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Sparkles, Layers, Loader2, Archive, Image, Download,
  PanelLeftClose, PanelLeftOpen, Palette, Wand2, Twitter
} from 'lucide-react';
import { toast } from 'sonner';

type L = 'PT' | 'EN' | 'ES';

const headings: Record<L, Record<string, string>> = {
  PT: {
    title: '🎨 Estúdio Social',
    subtitle: 'Crie artes profissionais para suas redes em segundos.',
    create: '🪄 Criar',
    carousel: '📱 Carrossel',
    gallery: '🖼️ Minhas Artes',
    generating: 'Gerando devocional...',
    uploadReady: 'Imagem de fundo aplicada',
    zipDownload: 'Baixar ZIP',
    zipLoading: 'Gerando...',
    savedToCloud: 'Arte salva na nuvem! ☁️',
    emptyCanvas: 'Busque um versículo ou gere conteúdo para começar a criar.',
    devotionalCheck: 'Gerar devocional em carrossel',
    carouselEmpty: 'Gere um versículo com devocional na aba "Criar" para montar slides automáticos.',
    goCreate: 'Ir para Criar',
    generateAnother: 'Gerar Outro',
    designPanel: 'Design',
  },
  EN: {
    title: '🎨 Social Studio',
    subtitle: 'Create professional social media art in seconds.',
    create: '🪄 Create',
    carousel: '📱 Carousel',
    gallery: '🖼️ My Arts',
    generating: 'Generating devotional...',
    uploadReady: 'Background image applied',
    zipDownload: 'Download ZIP',
    zipLoading: 'Generating...',
    savedToCloud: 'Art saved to cloud! ☁️',
    emptyCanvas: 'Search a verse or generate content to start creating.',
    devotionalCheck: 'Generate devotional carousel',
    carouselEmpty: 'Generate a verse with devotional on the "Create" tab to auto-build carousel slides.',
    goCreate: 'Go to Create',
    generateAnother: 'Generate Another',
    designPanel: 'Design',
  },
  ES: {
    title: '🎨 Estudio Social',
    subtitle: 'Crea artes profesionales para tus redes en segundos.',
    create: '🪄 Crear',
    carousel: '📱 Carrusel',
    gallery: '🖼️ Mis Artes',
    generating: 'Generando devocional...',
    uploadReady: 'Imagen de fondo aplicada',
    zipDownload: 'Descargar ZIP',
    zipLoading: 'Generando...',
    savedToCloud: '¡Arte guardado en la nube! ☁️',
    emptyCanvas: 'Busca un versículo o genera contenido para empezar a crear.',
    devotionalCheck: 'Generar devocional en carrusel',
    carouselEmpty: 'Genera un versículo con devocional en la pestaña "Crear" para montar slides automáticos.',
    goCreate: 'Ir a Crear',
    generateAnother: 'Generar Otro',
    designPanel: 'Diseño',
  },
};

function dataUrlToBlob(dataUrl: string) {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
  const binary = atob(parts[1]);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
  return new Blob([array], { type: mime });
}

export default function SocialStudio() {
  const { lang } = useLanguage();
  const { profile, user } = useAuth();
  const location = useLocation();
  const h = headings[lang];

  const [activeTab, setActiveTab] = useState<string>('create');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [template, setTemplate] = useState<CanvasTemplate>('cinematic');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [verse, setVerse] = useState<VerseData | null>(null);
  const [carousel, setCarousel] = useState<SlideData[]>([]);
  const [loadingDevotional, setLoadingDevotional] = useState(false);
  const [wantDevotional, setWantDevotional] = useState(false);
  const [zipLoading, setZipLoading] = useState(false);
  const [galleryRefresh, setGalleryRefresh] = useState(0);
  const [showDesignPanel, setShowDesignPanel] = useState(true);
  const [canvasText, setCanvasText] = useState<SlideData | null>(null);
  const [theme, setTheme] = useState<ThemeConfig>({
    gradient: colorPresets[0].gradient,
    fontFamily: "'Cormorant Garamond', 'Georgia', serif",
    textColor: '#FFFFFF',
    overlayOpacity: 55,
    backgroundImageUrl: undefined,
  });

  const slideRef = useRef<HTMLDivElement>(null);
  const verseRef = useRef<HTMLDivElement>(null);

  // Load workspace Brand DNA defaults
  useEffect(() => {
    const loadWorkspaceDefaults = async () => {
      if (!user) return;
      try {
        const { data } = await supabase
          .from('workspaces')
          .select('brand_color, default_template')
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
        if (data?.default_template) {
          setTemplate(data.default_template as CanvasTemplate);
        }
      } catch {
        // silently fail
      }
    };
    loadWorkspaceDefaults();
  }, [user]);

  // Apply router state overrides
  useEffect(() => {
    const state = location.state as {
      prefilledSlides?: SlideData[];
      defaultTab?: string;
      defaultAspectRatio?: AspectRatio;
      workspaceBrandColor?: string;
      workspaceTemplate?: CanvasTemplate;
    } | null;

    if (state?.prefilledSlides && state.prefilledSlides.length > 0) {
      setCarousel(state.prefilledSlides);
      setCurrentSlide(0);
      if (state.defaultTab) setActiveTab(state.defaultTab);
      if (state.defaultAspectRatio) setAspectRatio(state.defaultAspectRatio);
    }
    if (state?.workspaceBrandColor) {
      const preset = colorPresets.find(p => p.gradient.includes(state.workspaceBrandColor!));
      setTheme(prev => ({
        ...prev,
        gradient: preset?.gradient || `linear-gradient(135deg, ${state.workspaceBrandColor}, ${state.workspaceBrandColor}88)`,
      }));
    }
    if (state?.workspaceTemplate) {
      setTemplate(state.workspaceTemplate);
    }
    if (state) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const saveToCloud = useCallback(async (ref: React.RefObject<HTMLDivElement>, title?: string) => {
    if (!ref.current || !user) return;
    try {
      const dataUrl = await captureNodeAsPng(ref.current);
      const blob = dataUrlToBlob(dataUrl);
      const fileName = `${user.id}/${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage
        .from('social_arts')
        .upload(fileName, blob, { contentType: 'image/png' });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('social_arts').getPublicUrl(fileName);
      await supabase.from('social_arts').insert({
        user_id: user.id,
        file_path: fileName,
        file_url: urlData.publicUrl,
        title: title || null,
        aspect_ratio: aspectRatio,
      });
      setGalleryRefresh(p => p + 1);
      toast.success(h.savedToCloud);
    } catch (err) {
      console.error('Save to cloud error:', err);
    }
  }, [user, aspectRatio, h.savedToCloud]);

  const handleBackgroundUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setTheme((prev) => ({ ...prev, backgroundImageUrl: reader.result as string }));
      toast.success(h.uploadReady);
    };
    reader.readAsDataURL(file);
  }, [h.uploadReady]);

  const handleVerseGenerated = useCallback(async (v: { text: string; book: string; topic_image: string }) => {
    const verseData: VerseData = v;
    setVerse(verseData);
    setCanvasText({ text: `"${v.text}"`, subtitle: v.book, slideNumber: 1, totalSlides: 1 });
    setCarousel([{ text: `"${v.text}"`, subtitle: v.book, slideNumber: 1, totalSlides: 1 }]);
    setCurrentSlide(0);

    if (wantDevotional) {
      await generateDevotional(v.text, v.book);
    }
  }, [wantDevotional]);

  const handleTextGenerated = useCallback((text: string) => {
    const truncated = text.length > 280 ? text.slice(0, 277) + '…' : text;
    setCanvasText({ text: truncated });
    setCarousel([{ text: truncated, slideNumber: 1, totalSlides: 1 }]);
    setCurrentSlide(0);
  }, []);

  const generateDevotional = async (verseText: string, book: string) => {
    setLoadingDevotional(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-pastoral-material', {
        body: {
          bible_passage: `${book} — "${verseText}"`,
          language: lang,
          bible_version: profile?.bible_version || 'ARA',
          outputModes: ['devotional'],
          pastoral_voice: profile?.pastoral_voice || undefined,
        },
      });
      if (error) throw error;
      const devotionalText = data?.outputs?.devotional || data?.outputs?.devotional_content || '';
      if (devotionalText) {
        const paragraphs = devotionalText
          .split(/\n{2,}/)
          .map((p: string) => p.replace(/^#+\s*/gm, '').trim())
          .filter((p: string) => p.length > 20);
        const totalSlides = Math.min(paragraphs.length, 5) + 1;
        const devotionalSlides: SlideData[] = paragraphs.slice(0, 5).map((p: string, i: number) => ({
          text: p.length > 200 ? p.slice(0, 197) + '…' : p,
          subtitle: i === paragraphs.slice(0, 5).length - 1 ? '@seuministério' : undefined,
          slideNumber: i + 2,
          totalSlides,
        }));
        setCarousel([
          { text: `"${verseText}"`, subtitle: book, slideNumber: 1, totalSlides },
          ...devotionalSlides,
        ]);
        setCurrentSlide(0);
        toast.success(lang === 'PT' ? 'Devocional gerado!' : lang === 'EN' ? 'Devotional generated!' : '¡Devocional generado!');
      }
    } catch {
      toast.error(lang === 'PT' ? 'Erro ao gerar devocional' : lang === 'EN' ? 'Error generating devotional' : 'Error al generar devocional');
    } finally {
      setLoadingDevotional(false);
    }
  };

  const handleDownloadAndSave = useCallback(async (ref: React.RefObject<HTMLDivElement>, fileName: string) => {
    saveToCloud(ref, fileName);
  }, [saveToCloud]);

  const handleDownloadZip = async () => {
    if (carousel.length === 0 || !slideRef.current) return;
    setZipLoading(true);
    try {
      const zip = new JSZip();
      const originalIndex = currentSlide;
      for (let i = 0; i < carousel.length; i++) {
        setCurrentSlide(i);
        await new Promise((resolve) => setTimeout(resolve, 120));
        const node = slideRef.current;
        if (!node) continue;
        const dataUrl = await captureNodeAsPng(node);
        zip.file(`slide-${i + 1}.png`, dataUrlToBlob(dataUrl));
      }
      setCurrentSlide(originalIndex);
      const blob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.download = 'carrossel.zip';
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
      setCurrentSlide(0);
      await new Promise(r => setTimeout(r, 100));
      saveToCloud(slideRef, 'carrossel');
    } catch {
      toast.error(lang === 'PT' ? 'Erro ao gerar ZIP' : lang === 'EN' ? 'Error generating ZIP' : 'Error al generar ZIP');
    } finally {
      setZipLoading(false);
    }
  };

  const currentVerseOrSlide = activeTab === 'carousel' ? carousel[currentSlide] : canvasText;
  const hasCanvas = !!currentVerseOrSlide;

  return (
    <div className="theme-app">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground">{h.title}</h1>
        <p className="text-muted-foreground text-sm mt-1 max-w-xl font-medium">{h.subtitle}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── LEFT PANEL: Canvas + Controls ── */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Template + Aspect + Design toggle row */}
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <AspectRatioSelector value={aspectRatio} onChange={setAspectRatio} lang={lang} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDesignPanel(!showDesignPanel)}
              className="gap-1.5 text-xs border-border"
            >
              {showDesignPanel ? <PanelLeftClose className="h-3.5 w-3.5" /> : <PanelLeftOpen className="h-3.5 w-3.5" />}
              <Palette className="h-3.5 w-3.5" />
              {h.designPanel}
            </Button>
          </div>

          {/* Template Picker */}
          <TemplatePicker value={template} onChange={setTemplate} lang={lang} />

          {/* Design customizer (collapsible) */}
          {showDesignPanel && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <ThemeCustomizer value={theme} onChange={setTheme} lang={lang} onUploadBackground={handleBackgroundUpload} />
            </div>
          )}

          {/* CANVAS PREVIEW */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-secondary border border-border shadow-sm mb-4">
              <TabsTrigger value="create" className="gap-1.5 text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground">
                <Wand2 className="h-3.5 w-3.5" />
                {h.create}
              </TabsTrigger>
              <TabsTrigger value="carousel" className="gap-1.5 text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground">
                <Layers className="h-3.5 w-3.5" />
                {h.carousel}
              </TabsTrigger>
              <TabsTrigger value="gallery" className="gap-1.5 text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground">
                <Image className="h-3.5 w-3.5" />
                {h.gallery}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-4 mt-0">
              {loadingDevotional && (
                <div className="flex items-center justify-center gap-2 text-sm text-foreground font-medium py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  {h.generating}
                </div>
              )}

              {hasCanvas && verse ? (
                <div className="space-y-4">
                  <VerseOfDayBanner
                    ref={verseRef}
                    verse={verse}
                    aspectRatio={aspectRatio}
                    template={template}
                    fontFamily={theme.fontFamily}
                    textColor={theme.textColor}
                    backgroundImageUrl={theme.backgroundImageUrl}
                    themeColor={theme.gradient}
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <DownloadButton targetRef={verseRef} fileName="post" lang={lang} onDownloaded={() => handleDownloadAndSave(verseRef, verse.book)} />
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 border-border text-foreground"
                      onClick={() => { setVerse(null); setCanvasText(null); }}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {h.generateAnother}
                    </Button>
                  </div>
                  <PublishPanel targetRef={verseRef} lang={lang} />

                  {/* Devotional checkbox */}
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="devotional-check"
                      checked={wantDevotional}
                      onCheckedChange={(c) => setWantDevotional(c === true)}
                    />
                    <label htmlFor="devotional-check" className="text-xs text-foreground font-medium cursor-pointer select-none">
                      {h.devotionalCheck}
                    </label>
                  </div>
                </div>
              ) : hasCanvas && canvasText ? (
                <div className="space-y-4">
                  <SlideCanvas
                    ref={slideRef}
                    slide={canvasText}
                    aspectRatio={aspectRatio}
                    template={template}
                    bgImageUrl={theme.backgroundImageUrl}
                    themeColor={theme.gradient}
                    fontFamily={theme.fontFamily}
                    textColor={theme.textColor}
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <DownloadButton targetRef={slideRef} fileName="post" lang={lang} onDownloaded={() => handleDownloadAndSave(slideRef, 'post')} />
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 border-border text-foreground"
                      onClick={() => setCanvasText(null)}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {h.generateAnother}
                    </Button>
                  </div>
                  <PublishPanel targetRef={slideRef} lang={lang} />
                </div>
              ) : !loadingDevotional ? (
                <Card className="border-dashed border-2 border-muted-foreground/20 bg-muted/5">
                  <CardContent className="p-10 sm:p-16 text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                      <Wand2 className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground font-medium max-w-xs mx-auto leading-relaxed">
                      {h.emptyCanvas}
                    </p>
                  </CardContent>
                </Card>
              ) : null}
            </TabsContent>

            <TabsContent value="carousel" className="space-y-4 mt-0">
              {carousel.length === 0 ? (
                <Card className="border-dashed border-2 border-muted-foreground/20 bg-muted/5">
                  <CardContent className="p-10 sm:p-16 text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                      <Layers className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground font-medium max-w-sm mx-auto leading-relaxed">
                      {h.carouselEmpty}
                    </p>
                    <Button
                      onClick={() => { setWantDevotional(true); setActiveTab('create'); }}
                      size="sm"
                      className="gap-2"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {h.goCreate}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <SlideCanvas
                    ref={slideRef}
                    slide={carousel[currentSlide]}
                    aspectRatio={aspectRatio}
                    template={template}
                    bgImageUrl={theme.backgroundImageUrl}
                    themeColor={theme.gradient}
                    fontFamily={theme.fontFamily}
                    textColor={theme.textColor}
                  />
                  <CarouselNavigator
                    current={currentSlide}
                    total={carousel.length}
                    onPrev={() => setCurrentSlide((p) => Math.max(0, p - 1))}
                    onNext={() => setCurrentSlide((p) => Math.min(carousel.length - 1, p + 1))}
                  />
                  <div className="flex flex-wrap justify-center gap-3">
                    <DownloadButton targetRef={slideRef} fileName={`slide-${currentSlide + 1}`} lang={lang} onDownloaded={() => handleDownloadAndSave(slideRef, `slide-${currentSlide + 1}`)} />
                    <Button onClick={handleDownloadZip} disabled={zipLoading} size="sm" variant="outline" className="gap-1.5 border-border text-foreground">
                      {zipLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />}
                      {zipLoading ? h.zipLoading : h.zipDownload}
                    </Button>
                  </div>
                  <PublishPanel targetRef={slideRef} lang={lang} />
                </>
              )}
            </TabsContent>

            <TabsContent value="gallery" className="mt-0">
              <ArtGallery lang={lang} refreshTrigger={galleryRefresh} />
            </TabsContent>
          </Tabs>
        </div>

        {/* ── RIGHT PANEL: Content Generation Tools ── */}
        <div className="w-full lg:w-[340px] shrink-0">
          <ContentGenerator
            onVerseGenerated={handleVerseGenerated}
            onTextGenerated={handleTextGenerated}
          />
        </div>
      </div>
    </div>
  );
}
