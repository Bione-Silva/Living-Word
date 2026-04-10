import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Share2, RefreshCw, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
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

interface SermonSlidesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sermonMarkdown: string;
  sermonTitle: string;
}

const labels = {
  title: { PT: 'Slides de Apresentação', EN: 'Presentation Slides', ES: 'Diapositivas de Presentación' },
  generating: { PT: 'Gerando slides...', EN: 'Generating slides...', ES: 'Generando diapositivas...' },
  creating: { PT: 'Resumindo com IA...', EN: 'Summarizing with AI...', ES: 'Resumiendo con IA...' },
  slidesOf: { PT: 'Slides da Apresentação', EN: 'Presentation Slides', ES: 'Diapositivas de la Presentación' },
  slideLabel: { PT: 'Slide', EN: 'Slide', ES: 'Slide' },
  of: { PT: 'de', EN: 'of', ES: 'de' },
  downloadSlide: { PT: 'Baixar Slide', EN: 'Download Slide', ES: 'Descargar Slide' },
  downloadAll: { PT: 'Baixar Todos', EN: 'Download All', ES: 'Descargar Todo' },
  send: { PT: 'Enviar', EN: 'Send', ES: 'Enviar' },
  newVariation: { PT: 'Nova Variação', EN: 'New Variation', ES: 'Nueva Variación' },
  format: { PT: 'Widescreen 16:9', EN: 'Widescreen 16:9', ES: 'Widescreen 16:9' },
  resolution: { PT: '1920×1080px PNG', EN: '1920×1080px PNG', ES: '1920×1080px PNG' },
} satisfies Record<string, Record<L, string>>;

const typeLabels: Record<string, Record<L, string>> = {
  cover: { PT: 'CAPA', EN: 'COVER', ES: 'PORTADA' },
  verse: { PT: 'VERSÍCULO', EN: 'VERSE', ES: 'VERSÍCULO' },
  intro: { PT: 'INTRODUÇÃO', EN: 'INTRODUCTION', ES: 'INTRODUCCIÓN' },
  point: { PT: 'PONTO', EN: 'POINT', ES: 'PUNTO' },
  application: { PT: 'APLICAÇÃO', EN: 'APPLICATION', ES: 'APLICACIÓN' },
  conclusion: { PT: 'CONCLUSÃO', EN: 'CONCLUSION', ES: 'CONCLUSIÓN' },
  prayer: { PT: 'ORAÇÃO', EN: 'PRAYER', ES: 'ORACIÓN' },
};

export function SermonSlidesModal({ open, onOpenChange, sermonMarkdown, sermonTitle }: SermonSlidesModalProps) {
  const { lang } = useLanguage();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  const slideW = 1920;
  const slideH = 1080;

  useEffect(() => {
    if (open && slides.length === 0) generateSlides();
  }, [open]);

  const generateSlides = async () => {
    setLoading(true);
    setSlides([]);
    try {
      const { data, error } = await supabase.functions.invoke('generate-sermon-carousel', {
        body: { sermon: sermonMarkdown, language: lang, mode: 'slides' },
      });
      if (error) throw error;
      setSlides(data?.slides || []);
      setActiveSlide(0);
    } catch (e) {
      console.error('slides error', e);
    } finally {
      setLoading(false);
    }
  };

  const downloadSlide = async (index: number) => {
    const el = document.getElementById(`presentation-slide-${index}`);
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
    const w = preview ? 160 : 560;
    const h = preview ? 90 : 315;
    const fontSize = preview ? 'text-[7px]' : 'text-sm';
    const titleSize = preview ? 'text-[9px]' : 'text-lg';
    const typeSize = preview ? 'text-[5px]' : 'text-xs';
    const isCover = slide.type === 'cover';

    return (
      <div
        id={preview ? undefined : `presentation-slide-${index}`}
        key={index}
        style={{ width: w, height: h }}
        className={`relative flex flex-col overflow-hidden rounded-lg shrink-0 ${
          isCover
            ? 'bg-gradient-to-br from-primary/30 via-primary/10 to-background justify-center items-center text-center'
            : 'bg-gradient-to-br from-background via-card to-muted/30 justify-between'
        } border border-border/40 ${preview ? 'p-2 cursor-pointer' : 'p-8'}`}
        onClick={preview ? () => setActiveSlide(index) : undefined}
      >
        {/* Type badge top-left */}
        {!isCover && (
          <div className={`${typeSize} font-bold tracking-widest text-primary/70`}>
            {typeLabels[slide.type]?.[lang] || slide.type.toUpperCase()}
          </div>
        )}

        {/* Slide number top-right */}
        <div className={`absolute top-${preview ? '1' : '4'} right-${preview ? '1' : '4'} ${typeSize} text-muted-foreground/50`}>
          {index + 1}/{slides.length}
        </div>

        {/* Content */}
        <div className={isCover ? '' : 'flex-1 flex flex-col justify-center'}>
          <h3 className={`${titleSize} font-bold text-foreground leading-tight ${isCover ? '' : 'mb-2'}`}>
            {slide.title}
          </h3>
          {!preview && (
            <p className={`${fontSize} text-muted-foreground leading-relaxed ${isCover ? 'mt-2' : ''} line-clamp-4`}>
              {slide.body}
            </p>
          )}
          {slide.reference && !preview && (
            <div className={`mt-auto pt-2 ${typeSize} text-primary/80 flex items-center gap-1`}>
              📖 {slide.reference}
            </div>
          )}
        </div>

        {/* Branding footer */}
        <div className={`${preview ? 'mt-auto' : ''} flex items-center justify-between`}>
          <div className={`${typeSize} font-semibold text-primary/40 tracking-wider`}>
            Living Word
          </div>
          {slide.reference && preview && (
            <div className={`${typeSize} text-primary/60`}>📖</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0 gap-0 bg-background">
        <DialogHeader className="px-6 py-4 border-b border-border flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">📽️</div>
            <div>
              <DialogTitle className="text-base font-bold">{labels.title[lang]}</DialogTitle>
              <p className="text-xs text-muted-foreground">{loading ? labels.generating[lang] : `${slides.length} slides • 16:9`}</p>
            </div>
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

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center" style={{ minHeight: 350 }}>
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
                <p className="text-sm text-primary/80">{labels.creating[lang]}</p>
              </div>
            </div>
          ) : slides.length > 0 ? (
            <div className="flex gap-6">
              {/* Main slide */}
              <div className="flex-1 flex flex-col items-center">
                <div className="relative w-full flex items-center justify-center" style={{ minHeight: 320 }}>
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
                    <button key={i} onClick={() => setActiveSlide(i)}
                      className={`w-2.5 h-2.5 rounded-full transition-colors ${i === activeSlide ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                    />
                  ))}
                </div>

                {/* Actions */}
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

              {/* Thumbnails */}
              <div className="w-80 hidden md:block">
                <h3 className="text-sm font-bold text-foreground mb-3">{labels.slidesOf[lang]}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {slides.map((s, i) => (
                    <div key={i} className={`relative ${activeSlide === i ? 'ring-2 ring-primary rounded-lg' : ''}`}>
                      {activeSlide === i && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[8px] font-bold z-10">
                          {i + 1}
                        </div>
                      )}
                      {renderSlide(s, i, true)}
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 rounded-lg border border-border bg-card">
                  <p className="text-[10px] font-bold text-primary tracking-wider">{labels.slideLabel[lang]} {activeSlide + 1} {labels.of[lang]} {slides.length}</p>
                  <p className="text-xs font-medium text-foreground mt-1 line-clamp-2">{slides[activeSlide]?.title}</p>
                </div>

                <div className="mt-2 p-3 rounded-lg border border-primary/30 bg-primary/5">
                  <p className="text-xs text-primary font-medium">{labels.format[lang]}</p>
                  <p className="text-[10px] text-muted-foreground">{labels.resolution[lang]}</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
