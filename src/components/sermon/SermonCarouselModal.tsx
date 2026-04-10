import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Share2, RefreshCw, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { openWhatsAppShare } from '@/lib/whatsapp';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';

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
  materialId?: string | null;
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
  downloading: { PT: 'Baixando...', EN: 'Downloading...', ES: 'Descargando...' },
  send: { PT: 'Enviar', EN: 'Send', ES: 'Enviar' },
  newVariation: { PT: 'Nova Variação', EN: 'New Variation', ES: 'Nueva Variación' },
  sermon: { PT: 'PREGAÇÃO', EN: 'SERMON', ES: 'PREDICACIÓN' },
  instagram: { PT: 'Instagram 4:5', EN: 'Instagram 4:5', ES: 'Instagram 4:5' },
  widescreen: { PT: 'Widescreen 16:9', EN: 'Widescreen 16:9', ES: 'Widescreen 16:9' },
  instagramRes: { PT: '1080×1350px JPEG', EN: '1080×1350px JPEG', ES: '1080×1350px JPEG' },
  widescreenRes: { PT: '1920×1080px JPEG', EN: '1920×1080px JPEG', ES: '1920×1080px JPEG' },
} satisfies Record<string, Record<L, string>>;

const typeLabels: Record<string, Record<L, string>> = {
  cover: { PT: 'PREGAÇÃO', EN: 'SERMON', ES: 'PREDICACIÓN' },
  verse: { PT: 'VERSÍCULO', EN: 'VERSE', ES: 'VERSÍCULO' },
  point: { PT: 'PONTO', EN: 'POINT', ES: 'PUNTO' },
  application: { PT: 'APLICAÇÃO', EN: 'APPLICATION', ES: 'APLICACIÓN' },
  conclusion: { PT: 'CONCLUSÃO', EN: 'CONCLUSION', ES: 'CONCLUSIÓN' },
};

/* ═══ Color palette rotation for visual variety ═══ */
const SLIDE_PALETTES = [
  { bg: 'linear-gradient(135deg, hsl(38,35%,92%) 0%, hsl(30,25%,88%) 100%)', text: '#3D2E1F', accent: '#B8935A' },   // warm cream
  { bg: 'linear-gradient(135deg, hsl(200,18%,18%) 0%, hsl(210,22%,14%) 100%)', text: '#E8DCC8', accent: '#D4A853' },   // dark petrol
  { bg: 'linear-gradient(135deg, hsl(35,30%,95%) 0%, hsl(40,20%,90%) 100%)', text: '#4A3728', accent: '#9B7E4F' },     // off-white warm
  { bg: 'linear-gradient(135deg, hsl(145,15%,18%) 0%, hsl(160,20%,14%) 100%)', text: '#D6CFC0', accent: '#8BAF7E' },   // forest dark
  { bg: 'linear-gradient(135deg, hsl(30,20%,88%) 0%, hsl(25,15%,82%) 100%)', text: '#3D2E1F', accent: '#A6845A' },     // light tan
  { bg: 'linear-gradient(135deg, hsl(220,20%,15%) 0%, hsl(230,25%,12%) 100%)', text: '#DDDAE0', accent: '#D4A853' },   // midnight blue
  { bg: 'linear-gradient(135deg, hsl(38,25%,90%) 0%, hsl(42,18%,85%) 100%)', text: '#3B3124', accent: '#C4A05C' },     // parchment
  { bg: 'linear-gradient(135deg, hsl(15,12%,16%) 0%, hsl(20,18%,12%) 100%)', text: '#E3D5C5', accent: '#C89B5E' },     // espresso dark
];

function getPalette(index: number) {
  return SLIDE_PALETTES[index % SLIDE_PALETTES.length];
}

/* ═══ Branding footer ═══ */
function BrandFooter({ size = 'normal', color }: { size?: 'small' | 'normal'; color?: string }) {
  const s = size === 'small';
  const c = color || 'currentColor';
  return (
    <div className={`flex items-center ${s ? 'gap-0.5' : 'gap-1.5'}`}>
      <span style={{ color: c, opacity: 0.5, fontSize: s ? 5 : 9 }}>✝</span>
      <span style={{ color: c, opacity: 0.4, fontSize: s ? 5 : 9, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' as const }}>
        Living Word
      </span>
    </div>
  );
}

/** Convert PNG data URL to JPEG blob with compression */
async function toJpegBlob(pngDataUrl: string, maxBytes = 280_000): Promise<Blob> {
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = pngDataUrl;
  });
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  let quality = 0.82;
  let blob: Blob | null = null;
  for (let i = 0; i < 6; i++) {
    blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', quality));
    if (blob && blob.size <= maxBytes) break;
    quality *= 0.7;
  }
  if (blob && blob.size > maxBytes) {
    const scale = Math.sqrt(maxBytes / blob.size) * 0.95;
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.80));
  }
  return blob || new Blob([], { type: 'image/jpeg' });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function SermonCarouselModal({ open, onOpenChange, sermonMarkdown, sermonTitle, materialId }: SermonCarouselModalProps) {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [aspect, setAspect] = useState<'4:5' | '16:9'>('4:5');
  const [variationCount, setVariationCount] = useState(1);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const offscreenRef = useRef<HTMLDivElement>(null);

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
      const newSlides = data?.slides || [];
      setSlides(newSlides);
      setActiveSlide(0);
      setVariationCount(prev => prev + 1);
      if (user && newSlides.length > 0) {
        await supabase.from('visual_outputs' as any).insert({
          user_id: user.id,
          material_id: materialId || null,
          output_type: 'carousel',
          format: aspect,
          language: lang,
          slides_data: newSlides,
          variation_number: variationCount,
        });
      }
    } catch (e) {
      console.error('carousel error', e);
    } finally {
      setLoading(false);
    }
  };

  /** Capture a single slide element as compressed JPEG */
  const captureSlideAsJpeg = async (el: HTMLElement): Promise<Blob> => {
    const pngDataUrl = await toPng(el, { width: slideW, height: slideH, pixelRatio: 1 });
    return toJpegBlob(pngDataUrl);
  };

  const downloadSlide = async (index: number) => {
    const el = document.getElementById(`carousel-slide-${index}`);
    if (!el) return;
    try {
      const blob = await captureSlideAsJpeg(el);
      downloadBlob(blob, `carousel-${index + 1}.jpg`);
    } catch (e) { console.error(e); }
  };

  const downloadAll = async () => {
    setDownloadingAll(true);
    try {
      for (let i = 0; i < slides.length; i++) {
        const el = document.getElementById(`carousel-offscreen-${i}`);
        if (!el) continue;
        const blob = await captureSlideAsJpeg(el);
        downloadBlob(blob, `carousel-${i + 1}.jpg`);
        await new Promise(r => setTimeout(r, 200));
      }
      toast.success(lang === 'PT' ? `${slides.length} imagens baixadas` : `${slides.length} images downloaded`);
    } catch (e) {
      console.error(e);
      toast.error(lang === 'PT' ? 'Erro ao baixar' : 'Download error');
    } finally {
      setDownloadingAll(false);
    }
  };

  const handleSend = () => {
    const text = slides.map((s, i) => `Slide ${i + 1}: ${s.title}\n${s.body}`).join('\n\n');
    openWhatsAppShare(text);
  };

  /** Render a slide with palette-based coloring */
  const renderSlideContent = (slide: Slide, index: number, opts: { preview?: boolean; offscreen?: boolean } = {}) => {
    const { preview = false, offscreen = false } = opts;
    const palette = getPalette(index);
    const isCover = slide.type === 'cover';

    const w = offscreen ? slideW : (preview ? (aspect === '4:5' ? 110 : 150) : (aspect === '4:5' ? 380 : 500));
    const h = offscreen ? slideH : (preview ? (aspect === '4:5' ? 138 : 84) : (aspect === '4:5' ? 475 : 281));
    const isPreviewSmall = preview;

    const padScale = offscreen ? (slideW / (aspect === '4:5' ? 380 : 500)) : 1;
    const padding = isPreviewSmall ? 8 : Math.round(24 * padScale);

    return (
      <div
        id={offscreen ? `carousel-offscreen-${index}` : (preview ? undefined : `carousel-slide-${index}`)}
        key={`${offscreen ? 'off' : preview ? 'prev' : 'main'}-${index}`}
        style={{
          width: w,
          height: h,
          background: palette.bg,
          color: palette.text,
          padding,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: offscreen ? 0 : 8,
          flexShrink: 0,
          cursor: preview ? 'pointer' : undefined,
          ...(isCover ? { justifyContent: 'center', alignItems: 'center', textAlign: 'center' as const } : { justifyContent: 'space-between' }),
        }}
        onClick={preview ? () => setActiveSlide(index) : undefined}
      >
        {/* Slide number */}
        <div style={{
          position: 'absolute',
          top: isPreviewSmall ? 4 : Math.round(12 * padScale),
          right: isPreviewSmall ? 4 : Math.round(12 * padScale),
          fontSize: isPreviewSmall ? 5 : Math.round(10 * padScale),
          opacity: 0.3,
          fontWeight: 500,
        }}>
          {index + 1}/{slides.length}
        </div>

        {/* Type badge */}
        {!isCover && (
          <div style={{
            fontSize: isPreviewSmall ? 5 : Math.round(10 * padScale),
            fontWeight: 700,
            letterSpacing: '0.15em',
            textTransform: 'uppercase' as const,
            color: palette.accent,
            opacity: 0.7,
          }}>
            {typeLabels[slide.type]?.[lang] || slide.type.toUpperCase()}
          </div>
        )}

        {/* Content */}
        <div style={isCover ? { padding: isPreviewSmall ? 4 : Math.round(8 * padScale) } : { flex: 1, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center', marginTop: isPreviewSmall ? 2 : Math.round(4 * padScale) }}>
          <h3 style={{
            fontWeight: 700,
            lineHeight: 1.2,
            fontSize: isPreviewSmall ? 8 : Math.round(isCover ? 20 * padScale : 16 * padScale),
            margin: 0,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: isPreviewSmall ? 2 : 3,
            WebkitBoxOrient: 'vertical' as any,
          }}>
            {slide.title}
          </h3>
          {!isPreviewSmall && (
            <p style={{
              fontSize: Math.round(14 * padScale),
              lineHeight: 1.6,
              marginTop: Math.round(8 * padScale),
              opacity: 0.8,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 5,
              WebkitBoxOrient: 'vertical' as any,
            }}>
              {slide.body}
            </p>
          )}
        </div>

        {/* Reference */}
        {slide.reference && !isPreviewSmall && (
          <div style={{
            fontSize: Math.round(10 * padScale),
            color: palette.accent,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            marginTop: Math.round(8 * padScale),
          }}>
            📖 {slide.reference}
          </div>
        )}

        {/* Branding */}
        <div style={{ marginTop: isPreviewSmall ? 'auto' : Math.round(12 * padScale), display: 'flex', justifyContent: 'flex-end' }}>
          <BrandFooter size={isPreviewSmall ? 'small' : 'normal'} color={palette.accent} />
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0 gap-0 bg-background">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-border flex flex-row items-center justify-between pr-14">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center text-primary text-sm">🎨</div>
            <div>
              <DialogTitle className="text-base font-bold">{labels.title[lang]}</DialogTitle>
              <p className="text-xs text-muted-foreground">{loading ? labels.generating[lang] : `${slides.length} slides`}</p>
            </div>
          </div>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-2 px-6 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            {!loading && slides.length > 0 && (
              <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={generateSlides}>
                <RefreshCw className="h-3.5 w-3.5" />
                {labels.newVariation[lang]}
              </Button>
            )}
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
        </div>

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

                  {renderSlideContent(slides[activeSlide], activeSlide)}

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
                <div className="flex gap-2 mt-4 flex-wrap justify-center">
                  <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => downloadSlide(activeSlide)}>
                    <Download className="h-3.5 w-3.5" />
                    {labels.downloadSlide[lang]}
                  </Button>
                  <Button size="sm" className="text-xs gap-1.5" onClick={downloadAll} disabled={downloadingAll}>
                    {downloadingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                    {downloadingAll ? labels.downloading[lang] : labels.downloadAll[lang]}
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
                      {renderSlideContent(s, i, { preview: true })}
                    </div>
                  ))}
                </div>

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

        {/* Offscreen rendering area for download-all — all slides rendered at export resolution */}
        {slides.length > 0 && (
          <div ref={offscreenRef} style={{ position: 'fixed', left: -20000, top: 0, pointerEvents: 'none', zIndex: -1 }}>
            {slides.map((s, i) => renderSlideContent(s, i, { offscreen: true }))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
