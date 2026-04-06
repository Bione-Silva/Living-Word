import { useState, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AspectRatioSelector, type AspectRatio } from '@/components/social-studio/AspectRatioSelector';
import { SlideCanvas, type SlideData } from '@/components/social-studio/SlideCanvas';
import { VerseOfDayBanner, type VerseData } from '@/components/social-studio/VerseOfDayBanner';
import { CarouselNavigator } from '@/components/social-studio/CarouselNavigator';
import { DownloadButton } from '@/components/social-studio/DownloadButton';
import { ThemeCustomizer, type ThemeConfig, colorPresets } from '@/components/social-studio/ThemeCustomizer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, ImagePlus, Layers, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type L = 'PT' | 'EN' | 'ES';

const MOCK_CAROUSEL: SlideData[] = [
  { text: '5 Verdades que vão transformar sua semana', subtitle: 'Deslize para ver →', slideNumber: 1, totalSlides: 5 },
  { text: 'A graça de Deus é suficiente para você. Pare de tentar ser forte sozinho.', subtitle: '2 Coríntios 12:9', slideNumber: 2, totalSlides: 5 },
  { text: 'Deus não te trouxe até aqui para te abandonar. Confie no processo.', subtitle: 'Deuteronômio 31:6', slideNumber: 3, totalSlides: 5 },
  { text: 'Sua identidade não está no que você faz, mas em quem Deus diz que você é.', subtitle: 'Efésios 2:10', slideNumber: 4, totalSlides: 5 },
  { text: 'Compartilhe com alguém que precisa ouvir isso hoje. ❤️', subtitle: '@seuministério', slideNumber: 5, totalSlides: 5 },
];

const headings: Record<L, { title: string; subtitle: string; verse: string; carousel: string; generate: string }> = {
  PT: { title: '🎨 Estúdio Social', subtitle: 'Crie artes profissionais para suas redes em segundos.', verse: '✨ Versículo do Dia', carousel: '📱 Carrossel', generate: 'Gerar Versículo do Dia' },
  EN: { title: '🎨 Social Studio', subtitle: 'Create professional social media art in seconds.', verse: '✨ Verse of the Day', carousel: '📱 Carousel', generate: 'Generate Verse of the Day' },
  ES: { title: '🎨 Estudio Social', subtitle: 'Crea artes profesionales para tus redes en segundos.', verse: '✨ Versículo del Día', carousel: '📱 Carrusel', generate: 'Generar Versículo del Día' },
};

export default function SocialStudio() {
  const { lang } = useLanguage();
  const { profile } = useAuth();
  const h = headings[lang];

  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [verse, setVerse] = useState<VerseData | null>(null);
  const [carousel] = useState<SlideData[]>(MOCK_CAROUSEL);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<ThemeConfig>({
    gradient: colorPresets[0].gradient,
    fontFamily: "'Cormorant Garamond', 'Georgia', serif",
  });

  const slideRef = useRef<HTMLDivElement>(null);
  const verseRef = useRef<HTMLDivElement>(null);

  const generateVerse = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-verse', {
        body: { language: lang },
      });

      if (error) throw error;

      if (data?.text && data?.book) {
        setVerse({
          text: data.text,
          book: data.book,
          topic_image: data.topic_image || 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&q=80',
        });
      }
    } catch (err) {
      console.error('Error generating verse:', err);
      toast.error(lang === 'PT' ? 'Erro ao gerar versículo' : lang === 'EN' ? 'Error generating verse' : 'Error al generar versículo');
      // Fallback local
      setVerse({
        text: lang === 'EN'
          ? 'The Lord is my shepherd; I shall not want.'
          : lang === 'ES'
          ? 'El Señor es mi pastor; nada me faltará.'
          : 'O Senhor é o meu pastor; nada me faltará.',
        book: lang === 'EN' ? 'Psalm 23:1' : lang === 'ES' ? 'Salmo 23:1' : 'Salmos 23:1',
        topic_image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80',
      });
    } finally {
      setLoading(false);
    }
  }, [lang]);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground">{h.title}</h1>
        <p className="text-muted-foreground text-sm mt-1 max-w-xl">{h.subtitle}</p>
      </div>

      {/* Controls row */}
      <div className="space-y-3">
        <AspectRatioSelector value={aspectRatio} onChange={setAspectRatio} lang={lang} />
        <ThemeCustomizer value={theme} onChange={setTheme} lang={lang} />
      </div>

      <Tabs defaultValue="verse" className="space-y-6">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="verse" className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            {h.verse}
          </TabsTrigger>
          <TabsTrigger value="carousel" className="gap-1.5">
            <Layers className="h-3.5 w-3.5" />
            {h.carousel}
          </TabsTrigger>
        </TabsList>

        {/* === VERSE OF THE DAY === */}
        <TabsContent value="verse" className="space-y-6">
          {!verse ? (
            <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
              <CardContent className="p-8 sm:p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <ImagePlus className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-display text-lg font-bold text-foreground mb-2">{h.verse}</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                  {lang === 'PT'
                    ? 'A IA vai escolher um versículo inspirador e criar um banner visual com imagem de fundo e tipografia elegante.'
                    : lang === 'EN'
                    ? 'AI will pick an inspiring verse and create a visual banner with background image and elegant typography.'
                    : 'La IA elegirá un versículo inspirador y creará un banner visual con imagen de fondo y tipografía elegante.'}
                </p>
                <Button onClick={generateVerse} size="lg" className="gap-2" disabled={loading}>
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> {lang === 'PT' ? 'Gerando...' : lang === 'EN' ? 'Generating...' : 'Generando...'}</>
                  ) : (
                    <><Sparkles className="h-4 w-4" /> {h.generate}</>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <VerseOfDayBanner ref={verseRef} verse={verse} aspectRatio={aspectRatio} fontFamily={theme.fontFamily} />
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <DownloadButton targetRef={verseRef} fileName="versiculo-do-dia" lang={lang} />
                <Button variant="outline" onClick={generateVerse} className="gap-2 border-border text-foreground" disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {lang === 'PT' ? 'Gerar Outro' : lang === 'EN' ? 'Generate Another' : 'Generar Otro'}
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* === CAROUSEL === */}
        <TabsContent value="carousel" className="space-y-4">
          <SlideCanvas
            ref={slideRef}
            slide={carousel[currentSlide]}
            aspectRatio={aspectRatio}
            themeColor={theme.gradient}
            fontFamily={theme.fontFamily}
          />
          <CarouselNavigator
            current={currentSlide}
            total={carousel.length}
            onPrev={() => setCurrentSlide((p) => Math.max(0, p - 1))}
            onNext={() => setCurrentSlide((p) => Math.min(carousel.length - 1, p + 1))}
          />
          <div className="flex justify-center">
            <DownloadButton targetRef={slideRef} fileName={`carrossel-slide-${currentSlide + 1}`} lang={lang} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
