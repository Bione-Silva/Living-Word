import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { toPng } from 'html-to-image';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Send, RefreshCw, ChevronLeft, ChevronRight, Projector, FileVideo } from 'lucide-react';

interface Slide {
  title: string;
  body: string;
  type: string;
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
} satisfies Record<string, Record<string, string>>;

const typeLabels: Record<string, Record<string, string>> = {
  cover: { PT: 'CAPA', EN: 'COVER', ES: 'PORTADA' },
  verse: { PT: 'VERSÍCULO-CHAVE', EN: 'KEY VERSE', ES: 'VERSÍCULO CLAVE' },
  intro: { PT: 'INTRODUÇÃO', EN: 'INTRODUCTION', ES: 'INTRODUCCIÓN' },
  point: { PT: 'PONTO', EN: 'POINT', ES: 'PUNTO' },
  application: { PT: 'APLICAÇÕES', EN: 'APPLICATIONS', ES: 'APLICACIONES' },
  conclusion: { PT: 'CONCLUSÃO', EN: 'CONCLUSION', ES: 'CONCLUSIÓN' },
  prayer: { PT: 'ORAÇÃO FINAL', EN: 'CLOSING PRAYER', ES: 'ORACIÓN FINAL' },
};

const SLIDE_PALETTES = [
  { bg: '#1E2A3A', bgEnd: '#162030', text: '#E8DCC8', accent: '#D4A853' },
  { bg: '#F5F0E8', bgEnd: '#EDE6DA', text: '#3D2E1F', accent: '#B8935A' },
  { bg: '#1A2F26', bgEnd: '#142820', text: '#D6CFC0', accent: '#8BAF7E' },
  { bg: '#FAF6F0', bgEnd: '#F0EBE2', text: '#4A3728', accent: '#9B7E4F' },
  { bg: '#2C1F1A', bgEnd: '#201510', text: '#E3D5C5', accent: '#C89B5E' },
  { bg: '#F2EDE5', bgEnd: '#E8E0D5', text: '#3B3124', accent: '#A6845A' },
  { bg: '#1A2540', bgEnd: '#121B30', text: '#DDDAE0', accent: '#D4A853' },
  { bg: '#EDE8DF', bgEnd: '#E0DAD0', text: '#3D2E1F', accent: '#C4A05C' },
];

function getPalette(index: number) {
  return SLIDE_PALETTES[index % SLIDE_PALETTES.length];
}

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
    blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', quality));
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
    blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.80));
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
      toast.error("Failed to generate slides.");
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
      saveAs(zipBlob, `slides-16x9-${slides.length}slides.zip`);
      toast.success(lang === 'PT' ? `ZIP com ${slides.length} slides baixado` : `ZIP with ${slides.length} slides downloaded`);
    } catch (e) {
      console.error(e);
      toast.error(lang === 'PT' ? 'Erro ao baixar' : 'Download error');
    } finally {
      setDownloadingAll(false);
    }
  };

  const downloadPptx = async () => {
    setDownloadingPptx(true);
    try {
      const PptxGenJS = (await import('pptxgenjs')).default;
      const pres = new PptxGenJS();
      pres.layout = 'LAYOUT_WIDE';
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
          pptSlide.addText(typeLabel, {
            x: 0.8, y: 0.5, w: 4, h: 0.4,
            fontSize: 10, bold: true, color: palette.accent.replace('#', ''),
            fontFace: 'Arial', charSpacing: 3,
          });
        }

        pptSlide.addText(slide.title, {
          x: isCover ? 1.5 : 0.8, y: isCover ? 2.0 : 1.2,
          w: isCover ? 10 : 11, h: isCover ? 2 : 1.5,
          fontSize: isCover ? 36 : 28, bold: true,
          color: palette.text.replace('#', ''), fontFace: 'Arial',
          align: isCover ? 'center' : 'left', valign: 'middle',
        });

        if (slide.body) {
          pptSlide.addText(slide.body, {
            x: isCover ? 2 : 0.8, y: isCover ? 4.0 : 3.0,
            w: isCover ? 9 : 11, h: isCover ? 1.5 : 3.0,
            fontSize: isCover ? 16 : 18,
            color: palette.text.replace('#', ''), fontFace: 'Arial',
            align: isCover ? 'center' : 'left', valign: 'top',
            lineSpacingMultiple: 1.3,
          });
        }

        if (slide.reference) {
          pptSlide.addText(`📖 ${slide.reference}`, {
            x: 0.8, y: 6.2, w: 8, h: 0.4,
            fontSize: 12, color: palette.accent.replace('#', ''), fontFace: 'Arial',
          });
        }

        pptSlide.addText('✝ LIVING WORD', {
          x: 9.5, y: 6.8, w: 3, h: 0.4,
          fontSize: 8, color: palette.accent.replace('#', ''),
          fontFace: 'Arial', align: 'right', charSpacing: 2,
        });

        pptSlide.addText(`${i + 1}/${slides.length}`, {
          x: 12, y: 0.3, w: 0.8, h: 0.3,
          fontSize: 9, color: palette.text.replace('#', ''),
          fontFace: 'Arial', align: 'right', transparency: 60,
        });
      }

      const filename = `${(sermonTitle || 'sermon').replace(/[^a-zA-Z0-9À-ÿ ]/g, '').trim().replace(/\\s+/g, '-').substring(0, 40)}.pptx`;
      await pres.writeFile({ fileName: filename });
      toast.success(lang === 'PT' ? 'PowerPoint gerado!' : 'PowerPoint generated!');
    } catch (e) {
      console.error('PPTX error', e);
      toast.error(lang === 'PT' ? 'Erro ao baixar PowerPoint. Isso ocorre porque o pacote "pptxgenjs" precia ser instalado. Tente no console de Dev.' : 'PowerPoint download error. Requires pptxgenjs package.');
    } finally {
      setDownloadingPptx(false);
    }
  };

  const handleSend = () => {
    const text = slides.map((s, i) => `Slide ${i + 1}: ${s.title}\n${s.body}`).join('\n\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const renderSlideContent = (slide: Slide, index: number, opts: { preview?: boolean; offscreen?: boolean } = {}) => {
    const { preview = false, offscreen = false } = opts;
    const palette = getPalette(index);
    const isCover = slide.type === 'cover';

    const isPreview = preview;
    const padding = isPreview ? 12 : (offscreen ? 80 : 40);

    return (
      <div 
        id={offscreen ? `slides-offscreen-${index}` : (preview ? undefined : `presentation-slide-${index}`)}
        className={`relative flex flex-col justify-center items-center text-center overflow-hidden transition-all
          ${preview ? 'cursor-pointer hover:ring-2 hover:ring-primary' : ''}
          ${(!offscreen && preview && activeSlide === index) ? 'ring-2 ring-primary ring-offset-2' : ''}
        `}
        style={{ 
          background: `linear-gradient(135deg, ${palette.bg} 0%, ${palette.bgEnd} 100%)`,
          color: palette.text,
          width: offscreen ? slideW : (preview ? 240 : '100%'),
          height: offscreen ? slideH : (preview ? 135 : '100%'),
          aspectRatio: offscreen ? undefined : '16/9',
          padding: `${padding}px`,
          position: offscreen ? 'absolute' : 'relative',
          top: offscreen ? '-9999px' : 'auto',
          left: offscreen ? '-9999px' : 'auto',
          borderRadius: offscreen ? 0 : '0.5rem',
          boxShadow: offscreen ? 'none' : 'inset 0 0 20px rgba(0,0,0,0.2)',
        }}
        onClick={() => preview ? setActiveSlide(index) : undefined}
      >
        <div className="absolute top-4 left-4" style={{ fontSize: isPreview ? '8px' : '16px', opacity: 0.6 }}>
          {index + 1}/{slides.length}
        </div>

        {!isCover && (
          <div className="absolute top-8 left-8 text-left max-w-full" style={{ color: palette.accent, fontWeight: 'bold', fontSize: isPreview ? '8px' : '16px', letterSpacing: '0.2em' }}>
            {typeLabels[slide.type]?.[lang] || slide.type.toUpperCase()}
          </div>
        )}

        <h2 className="font-bold leading-tight z-10" style={{ 
          fontSize: isCover ? (isPreview ? '18px' : (offscreen ? '90px' : '48px')) : (isPreview ? '14px' : (offscreen ? '64px' : '36px')),
          marginBottom: slide.body ? '1.5rem' : '0',
          marginTop: isCover ? '0' : '2rem'
        }}>
          {slide.title}
        </h2>

        {!isPreview && slide.body && (
          <p className="z-10" style={{ 
            fontSize: offscreen ? '36px' : '20px', 
            opacity: 0.9, 
            maxWidth: '90%',
            lineHeight: 1.5
          }}>
            {slide.body}
          </p>
        )}

        {slide.reference && !isPreview && (
          <div className="absolute bottom-8 left-8" style={{ color: palette.accent, fontSize: offscreen ? '28px' : '16px', fontWeight: 'bold' }}>
            📖 {slide.reference}
          </div>
        )}

        {slide.reference && isPreview && (
          <div className="absolute bottom-2 left-2" style={{ color: palette.accent, fontSize: '10px' }}>
            📖
          </div>
        )}
        
        <div className="absolute bottom-6 right-6 font-bold" style={{ color: palette.accent, fontSize: isPreview ? '6px' : '12px', opacity: 0.8, letterSpacing: '2px' }}>
          ✝ LIVING WORD
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1100px] w-[95vw] max-h-[90vh] flex flex-col p-0 overflow-hidden bg-background">
        <DialogHeader className="p-4 border-b bg-card">
          <DialogTitle className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <Projector className="w-5 h-5 text-primary" />
              {labels.title[lang as keyof typeof labels.title]}
              <span className="text-sm font-normal text-muted-foreground ml-2">
                {loading ? labels.generating[lang as keyof typeof labels.generating] : `${slides.length} slides • 16:9`}
              </span>
            </div>
            {!loading && slides.length > 0 && (
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
                <Projector className="w-3 h-3" />
                {labels.projectable[lang as keyof typeof labels.projectable]}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-muted/20">
          <div className="p-4">
            <div className="flex justify-start mb-6">
              {!loading && slides.length > 0 && (
                <Button variant="outline" size="sm" onClick={generateSlides}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {labels.newVariation[lang as keyof typeof labels.newVariation]}
                </Button>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center p-20 text-muted-foreground h-[400px]">
                <Loader2 className="w-12 h-12 animate-spin mb-4 text-primary" />
                <p>{labels.creating[lang as keyof typeof labels.creating]}</p>
              </div>
            ) : slides.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                {/* Main Slide Preview */}
                <div className="lg:col-span-3 flex flex-col items-center">
                  <div className="relative w-full flex items-center justify-center">
                    <Button
                      variant="ghost" 
                      size="icon"
                      onClick={() => setActiveSlide(Math.max(0, activeSlide - 1))}
                      disabled={activeSlide === 0}
                      className="absolute left-0 z-10 -ml-4 bg-background/80 shadow rounded-full hover:bg-background"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </Button>

                    <div className="w-full flex justify-center">
                      {renderSlideContent(slides[activeSlide], activeSlide)}
                    </div>

                    <Button
                      variant="ghost" 
                      size="icon"
                      onClick={() => setActiveSlide(Math.min(slides.length - 1, activeSlide + 1))}
                      disabled={activeSlide === slides.length - 1}
                      className="absolute right-0 z-10 -mr-4 bg-background/80 shadow rounded-full hover:bg-background"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </Button>
                  </div>

                  {/* Dots */}
                  <div className="flex gap-2 mt-6">
                    {slides.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveSlide(i)}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${i === activeSlide ? 'bg-primary w-8' : 'bg-primary/30 hover:bg-primary/50'}`}
                      />
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                    <Button variant="default" onClick={() => downloadSlide(activeSlide)}>
                      <Download className="w-4 h-4 mr-2" />
                      {labels.downloadSlide[lang as keyof typeof labels.downloadSlide]}
                    </Button>
                    <Button variant="secondary" onClick={downloadAll} disabled={downloadingAll}>
                      {downloadingAll ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                      {downloadingAll ? labels.downloading[lang as keyof typeof labels.downloading] : labels.downloadAll[lang as keyof typeof labels.downloadAll]}
                    </Button>
                    <Button variant="outline" className="border-primary text-primary hover:bg-primary/10" onClick={downloadPptx} disabled={downloadingPptx}>
                      {downloadingPptx ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileVideo className="w-4 h-4 mr-2" />}
                      {downloadingPptx ? labels.downloading[lang as keyof typeof labels.downloading] : labels.downloadPptx[lang as keyof typeof labels.downloadPptx]}
                    </Button>
                    <Button variant="outline" onClick={handleSend}>
                      <Send className="w-4 h-4 mr-2" />
                      {labels.send[lang as keyof typeof labels.send]}
                    </Button>
                  </div>
                </div>

                {/* Thumbnails Sidebar */}
                <div className="flex flex-col bg-card border rounded-lg overflow-hidden h-fit">
                  <div className="bg-muted p-2 font-semibold text-sm border-b text-center sticky top-0 z-10">
                    {labels.slidesOf[lang as keyof typeof labels.slidesOf]}
                  </div>
                  <div className="p-3 grid grid-cols-2 lg:grid-cols-1 gap-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {slides.map((s, i) => (
                      <div key={i} className="flex flex-col items-center">
                        {renderSlideContent(s, i, { preview: true })}
                        <span className="text-[10px] text-muted-foreground mt-1 font-medium bg-muted/50 px-2 py-0.5 rounded">
                          Slide {i + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Offscreen rendering area */}
        {slides.length > 0 && (
          <div className="hidden">
            {slides.map((s, i) => renderSlideContent(s, i, { offscreen: true }))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
