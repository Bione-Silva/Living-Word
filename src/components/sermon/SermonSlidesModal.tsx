import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Share2, RefreshCw, Loader2, ChevronLeft, ChevronRight, FileDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { openWhatsAppShare } from '@/lib/whatsapp';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

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
  downloadAll: { PT: 'Baixar Todos (ZIP)', EN: 'Download All (ZIP)', ES: 'Descargar Todo (ZIP)' },
  downloadPptx: { PT: 'Baixar PowerPoint', EN: 'Download PowerPoint', ES: 'Descargar PowerPoint' },
  downloading: { PT: 'Preparando...', EN: 'Preparing...', ES: 'Preparando...' },
  send: { PT: 'Enviar', EN: 'Send', ES: 'Enviar' },
  newVariation: { PT: 'Nova Variação', EN: 'New Variation', ES: 'Nueva Variación' },
  format: { PT: 'Apresentação 16:9', EN: 'Presentation 16:9', ES: 'Presentación 16:9' },
  resolution: { PT: '1920×1080px JPEG', EN: '1920×1080px JPEG', ES: '1920×1080px JPEG' },
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

/* ═══ Color palette rotation ═══ */
const SLIDE_PALETTES = [
  { bg: '#1E2A3A', bgEnd: '#162030', text: '#E8DCC8', accent: '#6D28D9' },       // dark navy
  { bg: '#E8E0F5', bgEnd: '#EDE6DA', text: '#3D2E1F', accent: '#B8935A' },       // warm parchment
  { bg: '#1A2F26', bgEnd: '#142820', text: '#D6CFC0', accent: '#8BAF7E' },       // forest dark
  { bg: '#FAF6F0', bgEnd: '#F0EBE2', text: '#4A3728', accent: '#9B7E4F' },       // off-white
  { bg: '#2C1F1A', bgEnd: '#201510', text: '#E3D5C5', accent: '#C89B5E' },       // espresso
  { bg: '#F2EDE5', bgEnd: '#E8E0D5', text: '#3B3124', accent: '#A6845A' },       // light tan
  { bg: '#1A2540', bgEnd: '#121B30', text: '#DDDAE0', accent: '#6D28D9' },       // midnight blue
  { bg: '#EDE8DF', bgEnd: '#E0DAD0', text: '#3D2E1F', accent: '#C4A05C' },       // cream
];

function getPalette(index: number) {
  return SLIDE_PALETTES[index % SLIDE_PALETTES.length];
}

/* ═══ Branding footer ═══ */
function BrandFooter({ size = 'normal', color }: { size?: 'small' | 'normal'; color?: string }) {
  const s = size === 'small';
  const c = color || 'currentColor';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: s ? 2 : 6 }}>
      <span style={{ color: c, opacity: 0.5, fontSize: s ? 4 : 9 }}>✝</span>
      <span style={{ color: c, opacity: 0.4, fontSize: s ? 4 : 9, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' as const }}>
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

export function SermonSlidesModal({ open, onOpenChange, sermonMarkdown, sermonTitle, materialId }: SermonSlidesModalProps) {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [variationCount, setVariationCount] = useState(1);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadingPptx, setDownloadingPptx] = useState(false);

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

  const captureSlideAsJpeg = async (el: HTMLElement): Promise<Blob> => {
    const pngDataUrl = await toPng(el, { width: slideW, height: slideH, pixelRatio: 1 });
    return toJpegBlob(pngDataUrl);
  };

  const downloadSlide = async (index: number) => {
    const el = document.getElementById(`presentation-slide-${index}`);
    if (!el) return;
    try {
      const blob = await captureSlideAsJpeg(el);
      downloadBlob(blob, `slide-${index + 1}.jpg`);
    } catch (e) { console.error(e); }
  };

  const downloadAll = async () => {
    setDownloadingAll(true);
    try {
      const zip = new JSZip();
      const typeSlugMap: Record<string, string> = {
        cover: 'capa', verse: 'versiculo', intro: 'introducao', point: 'ponto',
        application: 'aplicacao', conclusion: 'conclusao', prayer: 'oracao',
      };
      for (let i = 0; i < slides.length; i++) {
        const el = document.getElementById(`slides-offscreen-${i}`);
        if (!el) continue;
        const blob = await captureSlideAsJpeg(el);
        const slug = typeSlugMap[slides[i].type] || slides[i].type;
        const name = `${String(i + 1).padStart(2, '0')}-${slug}.jpg`;
        zip.file(name, blob);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipName = `slides-16x9-${slides.length}slides.zip`;
      saveAs(zipBlob, zipName);
      toast.success(lang === 'PT' ? `ZIP com ${slides.length} slides baixado` : `ZIP with ${slides.length} slides downloaded`);
    } catch (e) {
      console.error(e);
      toast.error(lang === 'PT' ? 'Erro ao baixar' : 'Download error');
    } finally {
      setDownloadingAll(false);
    }
  };

  /** Generate and download a PPTX file */
  const downloadPptx = async () => {
    setDownloadingPptx(true);
    try {
      const PptxGenJS = (await import('pptxgenjs')).default;
      const pres = new PptxGenJS();
      pres.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 inches (16:9)
      pres.author = 'Living Word';
      pres.title = sermonTitle || 'Sermon Presentation';

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const palette = getPalette(i);
        const pptSlide = pres.addSlide();

        pptSlide.background = { color: palette.bg.replace('#', '') };

        const isCover = slide.type === 'cover';
        const typeLabel = typeLabels[slide.type]?.[lang] || slide.type.toUpperCase();

        if (!isCover) {
          // Type badge
          pptSlide.addText(typeLabel, {
            x: 0.8, y: 0.5, w: 4, h: 0.4,
            fontSize: 10, bold: true, color: palette.accent.replace('#', ''),
            fontFace: 'Arial',
            charSpacing: 3,
          });
        }

        // Title
        pptSlide.addText(slide.title, {
          x: isCover ? 1.5 : 0.8,
          y: isCover ? 2.0 : 1.2,
          w: isCover ? 10 : 11,
          h: isCover ? 2 : 1.5,
          fontSize: isCover ? 36 : 28,
          bold: true,
          color: palette.text.replace('#', ''),
          fontFace: 'Arial',
          align: isCover ? 'center' : 'left',
          valign: 'middle',
        });

        // Body
        if (slide.body) {
          pptSlide.addText(slide.body, {
            x: isCover ? 2 : 0.8,
            y: isCover ? 4.0 : 3.0,
            w: isCover ? 9 : 11,
            h: isCover ? 1.5 : 3.0,
            fontSize: isCover ? 16 : 18,
            color: palette.text.replace('#', ''),
            fontFace: 'Arial',
            align: isCover ? 'center' : 'left',
            valign: 'top',
            lineSpacingMultiple: 1.3,
          });
        }

        // Reference
        if (slide.reference) {
          pptSlide.addText(`📖 ${slide.reference}`, {
            x: 0.8, y: 6.2, w: 8, h: 0.4,
            fontSize: 12, color: palette.accent.replace('#', ''),
            fontFace: 'Arial',
          });
        }

        // Branding footer
        pptSlide.addText('✝ LIVING WORD', {
          x: 9.5, y: 6.8, w: 3, h: 0.4,
          fontSize: 8, color: palette.accent.replace('#', ''),
          fontFace: 'Arial',
          align: 'right',
          charSpacing: 2,
        });

        // Slide number
        pptSlide.addText(`${i + 1}/${slides.length}`, {
          x: 12, y: 0.3, w: 0.8, h: 0.3,
          fontSize: 9, color: palette.text.replace('#', ''),
          fontFace: 'Arial',
          align: 'right',
          transparency: 60,
        });
      }

      const filename = `${(sermonTitle || 'sermon').replace(/[^a-zA-Z0-9À-ÿ ]/g, '').trim().replace(/\s+/g, '-').substring(0, 40)}.pptx`;
      await pres.writeFile({ fileName: filename });
      toast.success(lang === 'PT' ? 'PowerPoint gerado!' : 'PowerPoint generated!');
    } catch (e) {
      console.error('PPTX error', e);
      toast.error(lang === 'PT' ? 'Erro ao gerar PowerPoint' : 'PowerPoint generation error');
    } finally {
      setDownloadingPptx(false);
    }
  };

  const handleSend = () => {
    const text = slides.map((s, i) => `Slide ${i + 1}: ${s.title}\n${s.body}`).join('\n\n');
    openWhatsAppShare(text);
  };

  const renderSlideContent = (slide: Slide, index: number, opts: { preview?: boolean; offscreen?: boolean } = {}) => {
    const { preview = false, offscreen = false } = opts;
    const palette = getPalette(index);
    const isCover = slide.type === 'cover';
    const isVerse = slide.type === 'verse';
    const isPrayer = slide.type === 'prayer';

    const w = offscreen ? slideW : (preview ? 160 : 580);
    const h = offscreen ? slideH : (preview ? 90 : 326);
    const isPreview = preview;
    const padScale = offscreen ? (slideW / 580) : 1;
    const padding = isPreview ? 8 : Math.round(40 * padScale);

    return (
      <div
        id={offscreen ? `slides-offscreen-${index}` : (preview ? undefined : `presentation-slide-${index}`)}
        key={`${offscreen ? 'off' : preview ? 'prev' : 'main'}-${index}`}
        style={{
          width: w,
          height: h,
          background: `linear-gradient(135deg, ${palette.bg} 0%, ${palette.bgEnd} 100%)`,
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
          top: isPreview ? 4 : Math.round(20 * padScale),
          right: isPreview ? 4 : Math.round(24 * padScale),
          fontSize: isPreview ? 4 : Math.round(10 * padScale),
          opacity: 0.3,
          fontFamily: 'monospace',
        }}>
          {index + 1}/{slides.length}
        </div>

        {/* Type badge */}
        {!isCover && (
          <div style={{
            fontSize: isPreview ? 4 : Math.round(10 * padScale),
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase' as const,
            color: palette.accent,
            opacity: 0.6,
            marginBottom: isPreview ? 2 : Math.round(8 * padScale),
          }}>
            {typeLabels[slide.type]?.[lang] || slide.type.toUpperCase()}
          </div>
        )}

        {/* Content */}
        <div style={isCover ? {} : { flex: 1, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }}>
          <h3 style={{
            fontWeight: 700,
            lineHeight: 1.2,
            fontSize: isPreview ? (isCover ? 9 : 7) : Math.round((isCover ? 28 : 22) * padScale),
            margin: 0,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: isPreview ? 2 : 3,
            WebkitBoxOrient: 'vertical' as any,
          }}>
            {slide.title}
          </h3>

          {!isPreview && (
            <p style={{
              fontSize: Math.round((isVerse ? 18 : 16) * padScale),
              lineHeight: 1.6,
              marginTop: Math.round(12 * padScale),
              opacity: 0.8,
              fontStyle: isVerse ? 'italic' : 'normal',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical' as any,
            }}>
              {slide.body}
            </p>
          )}

          {slide.reference && !isPreview && (
            <div style={{
              marginTop: Math.round(16 * padScale),
              fontSize: Math.round(12 * padScale),
              color: palette.accent,
              fontWeight: 500,
            }}>
              📖 {slide.reference}
            </div>
          )}
        </div>

        {/* Branding footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: isPreview ? 'auto' : Math.round(16 * padScale) }}>
          <BrandFooter size={isPreview ? 'small' : 'normal'} color={palette.accent} />
          {slide.reference && isPreview && (
            <span style={{ fontSize: 4, color: palette.accent, opacity: 0.5 }}>📖</span>
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
                    <button key={i} onClick={() => setActiveSlide(i)}
                      className={`w-2 h-2 rounded-full transition-all ${i === activeSlide ? 'bg-primary w-5' : 'bg-muted-foreground/30'}`}
                    />
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4 flex-wrap justify-center">
                  <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => downloadSlide(activeSlide)}>
                    <Download className="h-3.5 w-3.5" />
                    {labels.downloadSlide[lang]}
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={downloadAll} disabled={downloadingAll}>
                    {downloadingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                    {downloadingAll ? labels.downloading[lang] : labels.downloadAll[lang]}
                  </Button>
                  <Button size="sm" className="text-xs gap-1.5" onClick={downloadPptx} disabled={downloadingPptx}>
                    {downloadingPptx ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
                    {downloadingPptx ? labels.downloading[lang] : labels.downloadPptx[lang]}
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
                      {renderSlideContent(s, i, { preview: true })}
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

        {/* Offscreen rendering area for download-all */}
        {slides.length > 0 && (
          <div style={{ position: 'fixed', left: -20000, top: 0, pointerEvents: 'none', zIndex: -1 }}>
            {slides.map((s, i) => renderSlideContent(s, i, { offscreen: true }))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
