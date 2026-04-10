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

interface SermonSlidesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sermonMarkdown: string;
  sermonTitle: string;
  materialId?: string | null;
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
  format: { PT: 'Apresentação 16:9', EN: 'Presentation 16:9', ES: 'Presentación 16:9' },
  resolution: { PT: '1920×1080px PNG', EN: '1920×1080px PNG', ES: '1920×1080px PNG' },
  projectable: { PT: 'Otimizado para telão', EN: 'Optimized for projection', ES: 'Optimizado para pantalla' },
} satisfies Record<string, Record<L, string>>;

const typeLabels: Record<string, Record<L, string>> = {
  cover: { PT: 'CAPA', EN: 'COVER', ES: 'PORTADA' },
  verse: { PT: 'VERSÍCULO-CHAVE', EN: 'KEY VERSE', ES: 'VERSÍCULO CLAVE' },
  intro: { PT: 'INTRODUÇÃO', EN: 'INTRODUCTION', ES: 'INTRODUCCIÓN' },
  point: { PT: 'PONTO', EN: 'POINT', ES: 'PUNTO' },
  application: { PT: 'APLICAÇÕES', EN: 'APPLICATIONS', ES: 'APLICACIONES' },
  conclusion: { PT: 'CONCLUSÃO', EN: 'CONCLUSION', ES: 'CONCLUSIÓN' },
  prayer: { PT: 'ORAÇÃO FINAL', EN: 'CLOSING PRAYER', ES: 'ORACIÓN FINAL' },
};

/* ═══ Unified branding footer ═══ */
function BrandFooter({ size = 'normal' }: { size?: 'small' | 'normal' }) {
  const s = size === 'small';
  return (
    <div className={`flex items-center ${s ? 'gap-0.5' : 'gap-1.5'}`}>
      <span className={`${s ? 'text-[4px]' : 'text-[9px]'} text-primary/50`}>✝</span>
      <span className={`${s ? 'text-[4px]' : 'text-[9px]'} font-semibold tracking-[0.15em] text-primary/40 uppercase`}>
        Living Word
      </span>
    </div>
  );
}

export function SermonSlidesModal({ open, onOpenChange, sermonMarkdown, sermonTitle, materialId }: SermonSlidesModalProps) {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [variationCount, setVariationCount] = useState(1);

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
      const newSlides = data?.slides || [];
      setSlides(newSlides);
      setActiveSlide(0);
      setVariationCount(prev => prev + 1);

      // Persist to visual_outputs
      if (user && newSlides.length > 0) {
        await supabase.from('visual_outputs' as any).insert({
          user_id: user.id,
          material_id: materialId || null,
          output_type: 'slides',
          format: '16:9',
          language: lang,
          slides_data: newSlides,
          variation_number: variationCount,
        });
      }
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
    const w = preview ? 160 : 580;
    const h = preview ? 90 : 326;
    const isCover = slide.type === 'cover';
    const isVerse = slide.type === 'verse';
    const isPrayer = slide.type === 'prayer';
    const isPreview = preview;

    // Different visual treatment for cover vs content slides
    let bgClass = 'bg-gradient-to-br from-card via-background to-muted/20';
    if (isCover) bgClass = 'bg-gradient-to-br from-primary/20 via-primary/8 to-background';
    if (isVerse) bgClass = 'bg-gradient-to-br from-primary/10 via-background to-primary/5';
    if (isPrayer) bgClass = 'bg-gradient-to-br from-muted/30 via-background to-primary/10';

    return (
      <div
        id={preview ? undefined : `presentation-slide-${index}`}
        key={index}
        style={{ width: w, height: h }}
        className={`relative flex flex-col overflow-hidden rounded-lg shrink-0 border border-border/30
          ${bgClass}
          ${isCover ? 'justify-center items-center text-center' : 'justify-between'}
          ${isPreview ? 'p-2 cursor-pointer' : 'p-10'}
        `}
        onClick={preview ? () => setActiveSlide(index) : undefined}
      >
        {/* Slide number — top right, subtle */}
        <div className={`absolute ${isPreview ? 'top-1 right-1 text-[4px]' : 'top-5 right-6 text-[10px]'} text-muted-foreground/30 font-mono`}>
          {index + 1}/{slides.length}
        </div>

        {/* Top: Type badge (not on cover) */}
        {!isCover && !isPreview && (
          <div className="text-[10px] font-bold tracking-[0.2em] text-primary/50 uppercase mb-2">
            {typeLabels[slide.type]?.[lang] || slide.type.toUpperCase()}
          </div>
        )}
        {!isCover && isPreview && (
          <div className="text-[4px] font-bold tracking-widest text-primary/50 uppercase">
            {typeLabels[slide.type]?.[lang] || slide.type.toUpperCase()}
          </div>
        )}

        {/* Content — centered for projection readability */}
        <div className={`${isCover ? '' : 'flex-1 flex flex-col justify-center'}`}>
          <h3 className={`font-bold text-foreground leading-tight ${
            isPreview
              ? (isCover ? 'text-[9px]' : 'text-[7px]')
              : (isCover ? 'text-2xl' : 'text-xl')
          } ${isPreview ? 'line-clamp-2' : 'line-clamp-3'}`}>
            {slide.title}
          </h3>

          {!isPreview && (
            <p className={`text-muted-foreground leading-relaxed mt-3 ${
              isCover ? 'text-sm' : isVerse ? 'text-base italic' : 'text-sm'
            } line-clamp-4`}>
              {slide.body}
            </p>
          )}

          {slide.reference && !isPreview && (
            <div className="mt-4 text-xs text-primary/70 flex items-center gap-1.5 font-medium">
              📖 {slide.reference}
            </div>
          )}
        </div>

        {/* Bottom: Branding footer */}
        <div className={`flex items-center justify-between ${isPreview ? 'mt-auto' : 'mt-4'}`}>
          <BrandFooter size={isPreview ? 'small' : 'normal'} />
          {slide.reference && isPreview && (
            <span className="text-[4px] text-primary/50">📖</span>
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
            <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center text-primary text-sm">📽️</div>
            <div>
              <DialogTitle className="text-base font-bold">{labels.title[lang]}</DialogTitle>
              <p className="text-xs text-muted-foreground">{loading ? labels.generating[lang] : `${slides.length} slides • 16:9`}</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-primary/5 rounded-lg px-3 py-1.5 border border-primary/20">
            <span className="text-[10px] text-primary font-medium">{labels.projectable[lang]}</span>
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
                <div className="relative w-full flex items-center justify-center" style={{ minHeight: 330 }}>
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

                {/* Dots — pill style */}
                <div className="flex gap-1.5 mt-4">
                  {slides.map((_, i) => (
                    <button key={i} onClick={() => setActiveSlide(i)}
                      className={`w-2 h-2 rounded-full transition-all ${i === activeSlide ? 'bg-primary w-5' : 'bg-muted-foreground/30'}`}
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
              <div className="w-72 hidden md:block">
                <h3 className="text-xs font-bold text-muted-foreground tracking-wide mb-3">{labels.slidesOf[lang]}</h3>
                <div className="grid grid-cols-2 gap-1.5">
                  {slides.map((s, i) => (
                    <div key={i} className={`relative ${activeSlide === i ? 'ring-2 ring-primary ring-offset-1 ring-offset-background rounded-lg' : ''}`}>
                      {renderSlide(s, i, true)}
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 rounded-lg border border-border bg-card">
                  <p className="text-[10px] font-bold text-primary tracking-wider">{labels.slideLabel[lang]} {activeSlide + 1} {labels.of[lang]} {slides.length}</p>
                  <p className="text-xs font-medium text-foreground mt-1 line-clamp-2">{slides[activeSlide]?.title}</p>
                </div>

                <div className="mt-2 p-3 rounded-lg border border-primary/20 bg-primary/5">
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
