import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Share2, RefreshCw, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { openWhatsAppShare } from '@/lib/whatsapp';
import { toPng } from 'html-to-image';

type L = 'PT' | 'EN' | 'ES';

interface Slide {
  type: 'cover' | 'verse' | 'point' | 'application' | 'conclusion';
  title: string;
  body: string;
  reference?: string;
}

interface SermonCarouselModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sermonMarkdown: string;
  sermonTitle: string;
}

const labels = {
  title: { PT: 'Carrossel', EN: 'Carousel', ES: 'Carrusel' },
  generating: { PT: 'Gerando...', EN: 'Generating...', ES: 'Generando...' },
  analyzing: { PT: 'Analisando pregação...', EN: 'Analyzing sermon...', ES: 'Analizando predicación...' },
  creating: { PT: 'Resumindo com IA...', EN: 'Summarizing with AI...', ES: 'Resumiendo con IA...' },
  creatingSlides: { PT: 'Criando slides', EN: 'Creating slides', ES: 'Creando slides' },
  slidesOf: { PT: 'Slides do Carrossel', EN: 'Carousel Slides', ES: 'Slides del Carrusel' },
  slideLabel: { PT: 'Slide', EN: 'Slide', ES: 'Slide' },
  of: { PT: 'de', EN: 'of', ES: 'de' },
  downloadSlide: { PT: 'Slide', EN: 'Slide', ES: 'Slide' },
  downloadAll: { PT: 'Baixar Todos', EN: 'Download All', ES: 'Descargar Todo' },
  send: { PT: 'Enviar', EN: 'Send', ES: 'Enviar' },
  newVariation: { PT: 'Nova Variação', EN: 'New Variation', ES: 'Nueva Variación' },
  background: { PT: 'Background', EN: 'Background', ES: 'Fondo' },
  sermon: { PT: 'PREGAÇÃO', EN: 'SERMON', ES: 'PREDICACIÓN' },
  instagram: { PT: 'Instagram 4:5', EN: 'Instagram 4:5', ES: 'Instagram 4:5' },
  widescreen: { PT: 'Widescreen 16:9', EN: 'Widescreen 16:9', ES: 'Widescreen 16:9' },
  instagramRes: { PT: '1080x1350px PNG', EN: '1080x1350px PNG', ES: '1080x1350px PNG' },
  widescreenRes: { PT: '1920x1080px PNG', EN: '1920x1080px PNG', ES: '1920x1080px PNG' },
} satisfies Record<string, Record<L, string>>;

const typeLabels: Record<string, Record<L, string>> = {
  cover: { PT: 'PREGAÇÃO', EN: 'SERMON', ES: 'PREDICACIÓN' },
  verse: { PT: 'VERSÍCULO', EN: 'VERSE', ES: 'VERSÍCULO' },
  point: { PT: 'PONTO', EN: 'POINT', ES: 'PUNTO' },
  application: { PT: 'APLICAÇÃO', EN: 'APPLICATION', ES: 'APLICACIÓN' },
  conclusion: { PT: 'CONCLUSÃO', EN: 'CONCLUSION', ES: 'CONCLUSIÓN' },
};

export function SermonCarouselModal({ open, onOpenChange, sermonMarkdown, sermonTitle }: SermonCarouselModalProps) {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [aspect, setAspect] = useState<'4:5' | '16:9'>('4:5');

  const slideW = aspect === '4:5' ? 1080 : 1920;
  const slideH = aspect === '4:5' ? 1350 : 1080;

  useEffect(() => {
    if (open && slides.length === 0) generateSlides();
  }, [open]);

  const generateSlides = async () => {
    setLoading(true);
    setSlides([]);
    try {
      const { data, error } = await supabase.functions.invoke('generate-sermon-carousel', {
        body: { sermon: sermonMarkdown, language: lang },
      });
      if (error) throw error;
      setSlides(data?.slides || []);
      setActiveSlide(0);
    } catch (e) {
      console.error('carousel error', e);
    } finally {
      setLoading(false);
    }
  };

  const downloadSlide = async (index: number) => {
    const el = document.getElementById(`carousel-slide-${index}`);
    if (!el) return;
    try {
      const dataUrl = await toPng(el, { width: slideW, height: slideH, pixelRatio: 2 });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `slide-${index + 1}.png`;
      a.click();
    } catch (e) { console.error(e); }
  };

  const downloadAll = async () => {
    for (let i = 0; i < slides.length; i++) {
      await downloadSlide(i);
      await new Promise(r => setTimeout(r, 300));
    }
  };

  const handleSend = () => {
    const text = slides.map((s, i) => `Slide ${i + 1}: ${s.title}\n${s.body}`).join('\n\n');
    openWhatsAppShare(text);
  };

  const renderSlide = (slide: Slide, index: number, preview = false) => {
    const w = preview ? (aspect === '4:5' ? 120 : 160) : (aspect === '4:5' ? 400 : 500);
    const h = preview ? (aspect === '4:5' ? 150 : 90) : (aspect === '4:5' ? 500 : 281);
    const fontSize = preview ? 'text-[8px]' : 'text-sm';
    const titleSize = preview ? 'text-[9px]' : 'text-base';
    const typeSize = preview ? 'text-[6px]' : 'text-xs';

    return (
      <div
        id={preview ? undefined : `carousel-slide-${index}`}
        key={index}
        style={{ width: w, height: h }}
        className={`relative flex flex-col justify-between overflow-hidden rounded-lg bg-gradient-to-br from-[hsl(var(--primary)/0.15)] to-[hsl(var(--background))] border border-border/40 p-${preview ? '2' : '6'} shrink-0 ${preview ? 'cursor-pointer' : ''}`}
        onClick={preview ? () => setActiveSlide(index) : undefined}
      >
        {/* Brand watermark */}
        <div className={`${typeSize} font-bold text-primary/60 tracking-wider`}>Living Word</div>
        
        {/* Slide number */}
        <div className={`absolute top-${preview ? '1' : '3'} right-${preview ? '1' : '3'} ${typeSize} text-muted-foreground`}>
          {index + 1}/{slides.length}
        </div>

        {/* Type badge */}
        <div className={`${typeSize} font-bold tracking-widest text-primary mt-auto`}>
          {typeLabels[slide.type]?.[lang] || slide.type.toUpperCase()}
        </div>

        {/* Title */}
        <h3 className={`${titleSize} font-bold text-foreground leading-tight mt-1 line-clamp-${preview ? '2' : '3'}`}>
          {slide.title}
        </h3>

        {/* Body */}
        {!preview && (
          <p className={`${fontSize} text-muted-foreground mt-2 leading-relaxed line-clamp-6`}>{slide.body}</p>
        )}

        {/* Reference */}
        {slide.reference && (
          <div className={`pt-1 ${typeSize} text-primary/80 flex items-center gap-1`}>
            📖 {slide.reference}
          </div>
        )}

        {/* Branding footer */}
        <div className={`mt-auto pt-1 flex items-center justify-end`}>
          <span className={`${typeSize} font-semibold text-primary/40 tracking-wider`}>Living Word</span>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0 gap-0 bg-background">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-border flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">C</div>
            <div>
              <DialogTitle className="text-base font-bold">{labels.title[lang]}</DialogTitle>
              <p className="text-xs text-muted-foreground">{loading ? labels.generating[lang] : `${slides.length} slides`}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setAspect('4:5')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${aspect === '4:5' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >4:5</button>
            <button
              onClick={() => setAspect('16:9')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${aspect === '16:9' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >16:9</button>
          </div>
        </DialogHeader>

        {/* Toolbar */}
        {!loading && slides.length > 0 && (
          <div className="flex items-center gap-2 px-6 py-3 border-b border-border">
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              🖼️ {labels.background[lang]}
            </Button>
            <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={generateSlides}>
              <RefreshCw className="h-3.5 w-3.5" />
              {labels.newVariation[lang]}
            </Button>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex gap-6">
              {/* Preview placeholder */}
              <div className="flex-1 flex items-center justify-center" style={{ minHeight: 400 }}>
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
                  <p className="text-sm text-primary/80">{labels.creating[lang]}</p>
                  <p className="text-xs text-muted-foreground">{labels.creatingSlides[lang]}</p>
                </div>
              </div>
              {/* Right placeholder */}
              <div className="w-80 hidden md:flex flex-col items-center gap-3">
                <h3 className="text-sm font-bold text-foreground w-full">{labels.slidesOf[lang]}</h3>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-xs">{labels.analyzing[lang]}</span>
                </div>
              </div>
            </div>
          ) : slides.length > 0 ? (
            <div className="flex gap-6">
              {/* Main slide preview */}
              <div className="flex-1 flex flex-col items-center">
                <div className="relative w-full flex items-center justify-center" style={{ minHeight: aspect === '4:5' ? 500 : 300 }}>
                  <button
                    onClick={() => setActiveSlide(Math.max(0, activeSlide - 1))}
                    disabled={activeSlide === 0}
                    className="absolute left-0 z-10 p-2 rounded-full bg-background/80 border border-border disabled:opacity-30"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  {renderSlide(slides[activeSlide], activeSlide)}

                  <button
                    onClick={() => setActiveSlide(Math.min(slides.length - 1, activeSlide + 1))}
                    disabled={activeSlide === slides.length - 1}
                    className="absolute right-0 z-10 p-2 rounded-full bg-background/80 border border-border disabled:opacity-30"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                {/* Dots */}
                <div className="flex gap-1.5 mt-4">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveSlide(i)}
                      className={`w-2.5 h-2.5 rounded-full transition-colors ${i === activeSlide ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                    />
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => downloadSlide(activeSlide)}>
                    <Download className="h-3.5 w-3.5" />
                    {labels.downloadSlide[lang]}
                  </Button>
                  <Button size="sm" className="text-xs gap-1.5" onClick={downloadAll}>
                    <Download className="h-3.5 w-3.5" />
                    {labels.downloadAll[lang]}
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={handleSend}>
                    <Share2 className="h-3.5 w-3.5" />
                    {labels.send[lang]}
                  </Button>
                </div>
              </div>

              {/* Thumbnails grid */}
              <div className="w-80 hidden md:block">
                <h3 className="text-sm font-bold text-foreground mb-3">{labels.slidesOf[lang]}</h3>
                <div className="grid grid-cols-3 gap-2">
                  {slides.map((s, i) => (
                    <div key={i} className={`relative ${activeSlide === i ? 'ring-2 ring-primary rounded-lg' : ''}`}>
                      {activeSlide === i && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[8px] font-bold z-10">
                          {i + 1}
                        </div>
                      )}
                      {renderSlide(s, i, true)}
                      <p className="text-[8px] text-muted-foreground mt-1 text-center line-clamp-1">{s.title}</p>
                    </div>
                  ))}
                </div>

                {/* Slide info */}
                <div className="mt-4 p-3 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-primary tracking-wider">{labels.sermon[lang]}</span>
                    <span className="text-[10px] text-muted-foreground">{labels.slideLabel[lang]} {activeSlide + 1} {labels.of[lang]} {slides.length}</span>
                  </div>
                  <p className="text-xs font-medium text-foreground mt-1 line-clamp-2">{slides[activeSlide]?.title}</p>
                  {slides[activeSlide]?.reference && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">📖 {slides[activeSlide].reference}</p>
                  )}
                </div>

                {/* Format info */}
                <div className="mt-2 p-3 rounded-lg border border-primary/30 bg-primary/5">
                  <p className="text-xs text-primary font-medium">
                    {aspect === '4:5' ? labels.instagram[lang] : labels.widescreen[lang]}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {aspect === '4:5' ? labels.instagramRes[lang] : labels.widescreenRes[lang]}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
