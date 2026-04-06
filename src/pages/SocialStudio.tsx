import { useState, useRef, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import JSZip from 'jszip';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AspectRatioSelector, type AspectRatio } from '@/components/social-studio/AspectRatioSelector';
import { SlideCanvas, type SlideData } from '@/components/social-studio/SlideCanvas';
import { VerseOfDayBanner, type VerseData } from '@/components/social-studio/VerseOfDayBanner';
import { CarouselNavigator } from '@/components/social-studio/CarouselNavigator';
import { DownloadButton } from '@/components/social-studio/DownloadButton';
import { ThemeCustomizer, type ThemeConfig, colorPresets } from '@/components/social-studio/ThemeCustomizer';
import { captureNodeAsPng } from '@/components/social-studio/export-utils';
import { PublishPanel } from '@/components/social-studio/PublishPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Sparkles, ImagePlus, Layers, Loader2, Search, BookOpen, Upload, Archive } from 'lucide-react';
import { toast } from 'sonner';

type L = 'PT' | 'EN' | 'ES';

const headings: Record<L, {
  title: string; subtitle: string; verse: string; carousel: string;
  generate: string; customVerse: string; searchVerse: string;
  devotionalCheck: string; searching: string; generating: string;
  verseInput: string; orGenerate: string; uploadReady: string; zipDownload: string; zipLoading: string;
}> = {
  PT: {
    title: '🎨 Estúdio Social',
    subtitle: 'Crie artes profissionais para suas redes em segundos.',
    verse: '✨ Versículo',
    carousel: '📱 Carrossel',
    generate: 'Gerar Versículo do Dia',
    customVerse: 'Buscar Versículo',
    searchVerse: 'Qual versículo você quer desenhar hoje?',
    devotionalCheck: 'Gerar Devocional Mentes Brilhantes para este versículo',
    searching: 'Buscando...',
    generating: 'Gerando devocional...',
    verseInput: 'Ex: João 3:16',
    orGenerate: 'ou gere um versículo surpresa com IA',
    uploadReady: 'Imagem de fundo aplicada',
    zipDownload: 'Baixar carrossel em ZIP',
    zipLoading: 'Gerando ZIP...',
  },
  EN: {
    title: '🎨 Social Studio',
    subtitle: 'Create professional social media art in seconds.',
    verse: '✨ Verse',
    carousel: '📱 Carousel',
    generate: 'Generate Verse of the Day',
    customVerse: 'Search Verse',
    searchVerse: 'Which verse would you like to design today?',
    devotionalCheck: 'Generate Brilliant Minds Devotional for this verse',
    searching: 'Searching...',
    generating: 'Generating devotional...',
    verseInput: 'E.g.: John 3:16',
    orGenerate: 'or generate a surprise verse with AI',
    uploadReady: 'Background image applied',
    zipDownload: 'Download carousel as ZIP',
    zipLoading: 'Generating ZIP...',
  },
  ES: {
    title: '🎨 Estudio Social',
    subtitle: 'Crea artes profesionales para tus redes en segundos.',
    verse: '✨ Versículo',
    carousel: '📱 Carrusel',
    generate: 'Generar Versículo del Día',
    customVerse: 'Buscar Versículo',
    searchVerse: '¿Qué versículo quieres diseñar hoy?',
    devotionalCheck: 'Generar Devocional Mentes Brillantes para este versículo',
    searching: 'Buscando...',
    generating: 'Generando devocional...',
    verseInput: 'Ej: Juan 3:16',
    orGenerate: 'o genera un versículo sorpresa con IA',
    uploadReady: 'Imagen de fondo aplicada',
    zipDownload: 'Descargar carrusel en ZIP',
    zipLoading: 'Generando ZIP...',
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
  const { profile } = useAuth();
  const location = useLocation();
  const h = headings[lang];

  const [activeTab, setActiveTab] = useState<string>('verse');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [verse, setVerse] = useState<VerseData | null>(null);
  const [carousel, setCarousel] = useState<SlideData[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDevotional, setLoadingDevotional] = useState(false);
  const [customPassage, setCustomPassage] = useState('');
  const [wantDevotional, setWantDevotional] = useState(false);
  const [zipLoading, setZipLoading] = useState(false);
  const [theme, setTheme] = useState<ThemeConfig>({
    gradient: colorPresets[0].gradient,
    fontFamily: "'Cormorant Garamond', 'Georgia', serif",
    textColor: '#FFFFFF',
    overlayOpacity: 55,
    backgroundImageUrl: undefined,
  });

  const slideRef = useRef<HTMLDivElement>(null);
  const verseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const state = location.state as {
      prefilledSlides?: SlideData[];
      defaultTab?: string;
      defaultAspectRatio?: AspectRatio;
    } | null;

    if (state?.prefilledSlides && state.prefilledSlides.length > 0) {
      setCarousel(state.prefilledSlides);
      setCurrentSlide(0);
      if (state.defaultTab) setActiveTab(state.defaultTab);
      if (state.defaultAspectRatio) setAspectRatio(state.defaultAspectRatio);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleBackgroundUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setTheme((prev) => ({ ...prev, backgroundImageUrl: reader.result as string }));
      toast.success(h.uploadReady);
    };
    reader.readAsDataURL(file);
  }, [h.uploadReady]);

  const generateVerse = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-verse', {
        body: { language: lang },
      });
      if (error) throw error;
      if (data?.text && data?.book) {
        const verseData: VerseData = {
          text: data.text,
          book: data.book,
          topic_image: data.topic_image || 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&q=80',
        };
        setVerse(verseData);
        buildCarouselFromVerse(verseData);
        if (wantDevotional) {
          await generateDevotional(data.text, data.book);
        }
      }
    } catch (err) {
      console.error('Error generating verse:', err);
      toast.error(lang === 'PT' ? 'Erro ao gerar versículo' : lang === 'EN' ? 'Error generating verse' : 'Error al generar versículo');
      const fallback: VerseData = {
        text: lang === 'EN' ? 'The Lord is my shepherd; I shall not want.' : lang === 'ES' ? 'El Señor es mi pastor; nada me faltará.' : 'O Senhor é o meu pastor; nada me faltará.',
        book: lang === 'EN' ? 'Psalm 23:1' : lang === 'ES' ? 'Salmo 23:1' : 'Salmos 23:1',
        topic_image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80',
      };
      setVerse(fallback);
      buildCarouselFromVerse(fallback);
    } finally {
      setLoading(false);
    }
  }, [lang, wantDevotional]);

  const fetchCustomVerse = useCallback(async () => {
    if (!customPassage.trim()) return;
    setLoading(true);
    try {
      const version = profile?.bible_version || 'ARA';
      const { data, error } = await supabase.functions.invoke('fetch-bible-verse', {
        body: { passage: customPassage.trim(), version, language: lang },
      });
      if (error) throw error;
      if (data?.text && data?.book) {
        const verseData: VerseData = {
          text: data.text,
          book: data.book,
          topic_image: data.topic_image || 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&q=80',
        };
        setVerse(verseData);
        buildCarouselFromVerse(verseData);
        if (wantDevotional) {
          await generateDevotional(data.text, data.book);
        }
      }
    } catch (err) {
      console.error('Error fetching verse:', err);
      toast.error(lang === 'PT' ? 'Erro ao buscar versículo' : lang === 'EN' ? 'Error fetching verse' : 'Error al buscar versículo');
    } finally {
      setLoading(false);
    }
  }, [customPassage, lang, profile?.bible_version, wantDevotional]);

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
    } catch (err) {
      console.error('Error generating devotional:', err);
      toast.error(lang === 'PT' ? 'Erro ao gerar devocional' : lang === 'EN' ? 'Error generating devotional' : 'Error al generar devocional');
    } finally {
      setLoadingDevotional(false);
    }
  };

  const buildCarouselFromVerse = (v: VerseData) => {
    setCarousel([
      { text: `"${v.text}"`, subtitle: v.book, slideNumber: 1, totalSlides: 1 },
    ]);
    setCurrentSlide(0);
  };

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
    } catch (error) {
      console.error(error);
      toast.error(lang === 'PT' ? 'Erro ao gerar ZIP' : lang === 'EN' ? 'Error generating ZIP' : 'Error al generar ZIP');
    } finally {
      setZipLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl theme-app">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground">{h.title}</h1>
        <p className="text-muted-foreground text-sm mt-1 max-w-xl font-medium">{h.subtitle}</p>
      </div>

      <div className="space-y-3">
        <AspectRatioSelector value={aspectRatio} onChange={setAspectRatio} lang={lang} />
        <ThemeCustomizer value={theme} onChange={setTheme} lang={lang} onUploadBackground={handleBackgroundUpload} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-secondary border border-border shadow-sm">
          <TabsTrigger value="verse" className="gap-1.5 text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            {h.verse}
          </TabsTrigger>
          <TabsTrigger value="carousel" className="gap-1.5 text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground">
            <Layers className="h-3.5 w-3.5" />
            {h.carousel}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="verse" className="space-y-6">
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 text-base font-semibold text-foreground">
                <BookOpen className="h-4 w-4 text-primary" />
                {h.searchVerse}
              </div>
              <div className="flex gap-2">
                <Input
                  value={customPassage}
                  onChange={(e) => setCustomPassage(e.target.value)}
                  placeholder={h.verseInput}
                  className="flex-1 bg-background text-foreground placeholder:text-muted-foreground"
                  onKeyDown={(e) => e.key === 'Enter' && fetchCustomVerse()}
                />
                <Button onClick={fetchCustomVerse} disabled={loading || !customPassage.trim()} className="gap-2 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  {loading ? h.searching : h.customVerse}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="devotional-check"
                  checked={wantDevotional}
                  onCheckedChange={(c) => setWantDevotional(c === true)}
                />
                <label htmlFor="devotional-check" className="text-sm text-foreground font-medium cursor-pointer select-none">
                  {h.devotionalCheck}
                </label>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[11px] text-muted-foreground uppercase tracking-widest font-semibold">{h.orGenerate}</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <Button onClick={generateVerse} variant="outline" className="gap-2 w-full border-primary/40 text-primary hover:bg-primary/10 hover:text-primary font-semibold bg-background" disabled={loading}>
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> {h.searching}</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> {h.generate}</>
                )}
              </Button>
            </CardContent>
          </Card>

          {loadingDevotional && (
            <div className="flex items-center justify-center gap-2 text-sm text-foreground font-medium py-4">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              {h.generating}
            </div>
          )}

          {verse && (
            <div className="space-y-4">
              <VerseOfDayBanner
                ref={verseRef}
                verse={verse}
                aspectRatio={aspectRatio}
                fontFamily={theme.fontFamily}
                textColor={theme.textColor}
                backgroundImageUrl={theme.backgroundImageUrl}
              />
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <DownloadButton targetRef={verseRef} fileName="versiculo" lang={lang} />
                <Button variant="outline" onClick={generateVerse} className="gap-2 border-border text-foreground bg-card hover:bg-secondary font-semibold" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {lang === 'PT' ? 'Gerar Outro' : lang === 'EN' ? 'Generate Another' : 'Generar Otro'}
                </Button>
              </div>
              <PublishPanel targetRef={verseRef} lang={lang} />
            </div>
          )}

          {!verse && !loading && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <ImagePlus className="h-8 w-8 text-primary" />
              </div>
              <p className="text-sm text-foreground font-medium max-w-sm mx-auto">
                {lang === 'PT'
                  ? 'Busque um versículo específico ou gere um versículo surpresa para criar sua arte.'
                  : lang === 'EN'
                  ? 'Search for a specific verse or generate a surprise verse to create your art.'
                  : 'Busca un versículo específico o genera un versículo sorpresa para crear tu arte.'}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="carousel" className="space-y-4">
          {carousel.length === 0 ? (
            <Card className="border-dashed border-2 border-muted-foreground/30 bg-muted/10">
              <CardContent className="p-8 sm:p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <Layers className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm text-foreground font-medium max-w-sm mx-auto">
                  {lang === 'PT'
                    ? 'Busque um versículo na aba "Versículo" e ative "Gerar Devocional" para criar slides de carrossel automaticamente.'
                    : lang === 'EN'
                    ? 'Search for a verse in the "Verse" tab and enable "Generate Devotional" to auto-create carousel slides.'
                    : 'Busca un versículo en la pestaña "Versículo" y activa "Generar Devocional" para crear slides de carrusel automáticamente.'}
                </p>
                <Button
                  onClick={() => { setWantDevotional(true); setActiveTab('verse'); }}
                  className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                >
                  <Sparkles className="h-4 w-4" />
                  {lang === 'PT' ? 'Ir para Versículo e Gerar' : lang === 'EN' ? 'Go to Verse & Generate' : 'Ir a Versículo y Generar'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <SlideCanvas
                ref={slideRef}
                slide={carousel[currentSlide]}
                aspectRatio={aspectRatio}
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
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <DownloadButton targetRef={slideRef} fileName={`carrossel-slide-${currentSlide + 1}`} lang={lang} />
                <Button onClick={handleDownloadZip} disabled={zipLoading} size="lg" variant="outline" className="gap-2 bg-card text-foreground border-border hover:bg-secondary font-semibold">
                  {zipLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
                  {zipLoading ? h.zipLoading : h.zipDownload}
                </Button>
              </div>
              <PublishPanel targetRef={slideRef} lang={lang} />
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
