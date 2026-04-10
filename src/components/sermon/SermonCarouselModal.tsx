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
  type: string;
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
  generating: { PT: 'Gerando carrossel...', EN: 'Generating carousel...', ES: 'Generando carrusel...' },
  creating: { PT: 'Resumindo com IA...', EN: 'Summarizing with AI...', ES: 'Resumiendo con IA...' },
  slidesOf: { PT: 'Slides do Carrossel', EN: 'Carousel Slides', ES: 'Slides del Carrusel' },
  slideLabel: { PT: 'Slide', EN: 'Slide', ES: 'Slide' },
  of: { PT: 'de', EN: 'of', ES: 'de' },
  downloadSlide: { PT: 'Baixar Slide', EN: 'Download Slide', ES: 'Descargar Slide' },
  downloadAll: { PT: 'Baixar Todos', EN: 'Download All', ES: 'Descargar Todo' },
  send: { PT: 'Enviar', EN: 'Send', ES: 'Enviar' },
  newVariation: { PT: 'Nova Variação', EN: 'New Variation', ES: 'Nueva Variación' },
  sermon: { PT: 'PREGAÇÃO', EN: 'SERMON', ES: 'PREDICACIÓN' },
  instagram: { PT: 'Instagram 4:5', EN: 'Instagram 4:5', ES: 'Instagram 4:5' },
  widescreen: { PT: 'Widescreen 16:9', EN: 'Widescreen 16:9', ES: 'Widescreen 16:9' },
  instagramRes: { PT: '1080×1350px PNG', EN: '1080×1350px PNG', ES: '1080×1350px PNG' },
  widescreenRes: { PT: '1920×1080px PNG', EN: '1920×1080px PNG', ES: '1920×1080px PNG' },
} satisfies Record<string, Record<L, string>>;

const typeLabels: Record<string, Record<L, string>> = {
  cover: { PT: 'PREGAÇÃO', EN: 'SERMON', ES: 'PREDICACIÓN' },
  verse: { PT: 'VERSÍCULO', EN: 'VERSE', ES: 'VERSÍCULO' },
  point: { PT: 'PONTO', EN: 'POINT', ES: 'PUNTO' },
  application: { PT: 'APLICAÇÃO', EN: 'APPLICATION', ES: 'APLICACIÓN' },
  conclusion: { PT: 'CONCLUSÃO', EN: 'CONCLUSION', ES: 'CONCLUSIÓN' },
};

/* ═══ Unified branding footer component ═══ */
function BrandFooter({ size = 'normal' }: { size?: 'small' | 'normal' }) {
  const s = size === 'small';
  return (
    <div className={`flex items-center gap-1 ${s ? 'gap-0.5' : 'gap-1.5'}`}>
      <span className={`${s ? 'text-[5px]' : 'text-[9px]'} text-primary/50`}>✝</span>
      <span className={`${s ? 'text-[5px]' : 'text-[9px]'} font-semibold tracking-[0.15em] text-primary/40 uppercase`}>
        Living Word
      </span>
    </div>
  );
}

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
      a.download = `carousel-${index + 1}.png`;
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
    const w = preview ? (aspect === '4:5' ? 110 : 150) : (aspect === '4:5' ? 380 : 500);
    const h = preview ? (aspect === '4:5' ? 138 : 84) : (aspect === '4:5' ? 475 : 281);
    const isCover = slide.type === 'cover';
    const isPreviewSmall = preview;

    return (
      <div
        id={preview ? undefined : `carousel-slide-${index}`}
        key={index}
        style={{ width: w, height: h }}
        className={`relative flex flex-col overflow-hidden rounded-lg shrink-0
          ${isCover
            ? 'bg-gradient-to-br from-primary/25 via-primary/10 to-background justify-center items-center text-center'
            : 'bg-gradient-to-br from-[hsl(var(--primary)/0.08)] to-background justify-between'
          }
          border border-border/40
          ${isPreviewSmall ? 'p-2 cursor-pointer' : 'p-6'}
        `}
        onClick={preview ? () => setActiveSlide(index) : undefined}
      >
        {/* Slide number */}
        <div className={`absolute ${isPreviewSmall ? 'top-1 right-1 text-[5px]' : 'top-3 right-3 text-[10px]'} text-muted-foreground/40 font-medium`}>
          {index + 1}/{slides.length}
        </div>

        {/* Type badge */}
        {!isCover && (
          <div className={`${isPreviewSmall ? 'text-[5px]' : 'text-[10px]'} font-bold tracking-widest text-primary/60 uppercase`}>
            {typeLabels[slide.type]?.[lang] || slide.type.toUpperCase()}
          </div>
        )}

        {/* Content */}
        <div className={isCover ? 'px-2' : 'flex-1 flex flex-col justify-center mt-1'}>
          <h3 className={`${isPreviewSmall ? 'text-[8px]' : 'text-base'} font-bold text-foreground leading-tight ${isPreviewSmall ? 'line-clamp-2' : 'line-clamp-3'}`}>
            {slide.title}
          </h3>
          {!preview && (
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-5">{slide.body}</p>
          )}
        </div>

        {/* Reference */}
        {slide.reference && !isPreviewSmall && (
          <div className="text-[10px] text-primary/70 flex items-center gap-1 mt-2">
            📖 {slide.reference}
          </div>
        )}

        {/* Branding footer */}
        <div className={`${isPreviewSmall ? 'mt-auto' : 'mt-3'} flex items-center justify-end`}>
          <BrandFooter size={isPreviewSmall ? 'small' : 'normal'} />
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
            <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center text-primary text-sm">🎨</div>
            <div>
              <DialogTitle className="text-base font-bold">{labels.title[lang]}</DialogTitle>
              <p className="text-xs text-muted-foreground">{loading ? labels.generating[lang] : `${slides.length} slides`}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            <button
              onClick={() => setAspect('4:5')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${aspect === '4:5' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >4:5</button>
            <button
              onClick={() => setAspect('16:9')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${aspect === '16:9' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >16:9</button>
          </div>
        </DialogHeader>

        {/* Toolbar */}
        {!loading && slides.length > 0 && (
          <div className="flex items-center gap-2 px-6 py-3 border-b border-border">
            <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={generateSlides}>
              <RefreshCw className="h-3.5 w-3.5" />
              {labels.newVariation[lang]}
            </Button>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center" style={{ minHeight: 400 }}>
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
                <p className="text-sm text-primary/80">{labels.creating[lang]}</p>
              </div>
            </div>
          ) : slides.length > 0 ? (
            <div className="flex gap-6">
              {/* Main slide preview */}
              <div className="flex-1 flex flex-col items-center">
                <div className="relative w-full flex items-center justify-center" style={{ minHeight: aspect === '4:5' ? 480 : 290 }}>
                  <button
                    onClick={() => setActiveSlide(Math.max(0, activeSlide - 1))}
                    disabled={activeSlide === 0}
                    className="absolute left-0 z-10 p-2 rounded-full bg-background/80 border border-border disabled:opacity-30 hover:bg-muted/50 transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  {renderSlide(slides[activeSlide], activeSlide)}

                  <button
                    onClick={() => setActiveSlide(Math.min(slides.length - 1, activeSlide + 1))}
                    disabled={activeSlide === slides.length - 1}
                    className="absolute right-0 z-10 p-2 rounded-full bg-background/80 border border-border disabled:opacity-30 hover:bg-muted/50 transition-colors"
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
                      className={`w-2 h-2 rounded-full transition-all ${i === activeSlide ? 'bg-primary w-5' : 'bg-muted-foreground/30'}`}
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
              <div className="w-72 hidden md:block">
                <h3 className="text-xs font-bold text-muted-foreground tracking-wide mb-3">{labels.slidesOf[lang]}</h3>
                <div className="grid grid-cols-3 gap-1.5">
                  {slides.map((s, i) => (
                    <div key={i} className={`relative ${activeSlide === i ? 'ring-2 ring-primary ring-offset-1 ring-offset-background rounded-lg' : ''}`}>
                      {renderSlide(s, i, true)}
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
                <div className="mt-2 p-3 rounded-lg border border-primary/20 bg-primary/5">
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
