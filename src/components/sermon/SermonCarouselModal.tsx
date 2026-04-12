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
import { Loader2, Download, Send, RefreshCw, ChevronLeft, ChevronRight, X, MonitorPlay, Instagram } from 'lucide-react';

interface Slide {
  title: string;
  body: string;
  type: string;
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
  downloadAll: { PT: 'Baixar Todos (ZIP)', EN: 'Download All (ZIP)', ES: 'Descargar Todo (ZIP)' },
  downloading: { PT: 'Preparando ZIP...', EN: 'Preparing ZIP...', ES: 'Preparando ZIP...' },
  send: { PT: 'Enviar', EN: 'Send', ES: 'Enviar' },
  newVariation: { PT: 'Nova Variação', EN: 'New Variation', ES: 'Nueva Variación' },
  sermon: { PT: 'PREGAÇÃO', EN: 'SERMON', ES: 'PREDICACIÓN' },
  instagram: { PT: 'Instagram 4:5', EN: 'Instagram 4:5', ES: 'Instagram 4:5' },
  widescreen: { PT: 'Widescreen 16:9', EN: 'Widescreen 16:9', ES: 'Widescreen 16:9' },
  instagramRes: { PT: '1080×1350px JPEG', EN: '1080×1350px JPEG', ES: '1080×1350px JPEG' },
  widescreenRes: { PT: '1920×1080px JPEG', EN: '1920×1080px JPEG', ES: '1920×1080px JPEG' },
} satisfies Record<string, Record<string, string>>;

const typeLabels: Record<string, Record<string, string>> = {
  cover: { PT: 'PREGAÇÃO', EN: 'SERMON', ES: 'PREDICACIÓN' },
  verse: { PT: 'VERSÍCULO', EN: 'VERSE', ES: 'VERSÍCULO' },
  point: { PT: 'PONTO', EN: 'POINT', ES: 'PUNTO' },
  application: { PT: 'APLICAÇÃO', EN: 'APPLICATION', ES: 'APLICACIÓN' },
  conclusion: { PT: 'CONCLUSÃO', EN: 'CONCLUSION', ES: 'CONCLUSIÓN' },
};

const SLIDE_PALETTES = [
  { bg: 'linear-gradient(135deg, hsl(38,35%,92%) 0%, hsl(30,25%,88%) 100%)', text: '#3D2E1F', accent: '#B8935A' },
  { bg: 'linear-gradient(135deg, hsl(200,18%,18%) 0%, hsl(210,22%,14%) 100%)', text: '#E8DCC8', accent: '#D4A853' },
  { bg: 'linear-gradient(135deg, hsl(35,30%,95%) 0%, hsl(40,20%,90%) 100%)', text: '#4A3728', accent: '#9B7E4F' },
  { bg: 'linear-gradient(135deg, hsl(145,15%,18%) 0%, hsl(160,20%,14%) 100%)', text: '#D6CFC0', accent: '#8BAF7E' },
  { bg: 'linear-gradient(135deg, hsl(30,20%,88%) 0%, hsl(25,15%,82%) 100%)', text: '#3D2E1F', accent: '#A6845A' },
  { bg: 'linear-gradient(135deg, hsl(220,20%,15%) 0%, hsl(230,25%,12%) 100%)', text: '#DDDAE0', accent: '#D4A853' },
  { bg: 'linear-gradient(135deg, hsl(38,25%,90%) 0%, hsl(42,18%,85%) 100%)', text: '#3B3124', accent: '#C4A05C' },
  { bg: 'linear-gradient(135deg, hsl(15,12%,16%) 0%, hsl(20,18%,12%) 100%)', text: '#E3D5C5', accent: '#C89B5E' },
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

export function SermonCarouselModal({ open, onOpenChange, sermonMarkdown, sermonTitle, materialId }: SermonCarouselModalProps) {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [aspect, setAspect] = useState<'4:5' | '16:9'>('4:5');
  const [variationCount, setVariationCount] = useState(1);
  const [downloadingAll, setDownloadingAll] = useState(false);
  
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
      const zip = new JSZip();
      for (let i = 0; i < slides.length; i++) {
        const el = document.getElementById(`carousel-offscreen-${i}`);
        if (!el) continue;
        const blob = await captureSlideAsJpeg(el);
        const name = `${String(i + 1).padStart(2, '0')}-${slides[i].type}.jpg`;
        zip.file(name, blob);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipName = `carousel-${aspect.replace(':', 'x')}-${slides.length}slides.zip`;
      saveAs(zipBlob, zipName);
      toast.success(lang === 'PT' ? `ZIP com ${slides.length} imagens baixado` : `ZIP with ${slides.length} images downloaded`);
    } catch (e) {
      console.error(e);
      toast.error(lang === 'PT' ? 'Erro ao baixar' : 'Download error');
    } finally {
      setDownloadingAll(false);
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

    const isPreviewSmall = preview;
    const padding = isPreviewSmall ? 8 : (offscreen ? 80 : 32);

    return (
      <div 
        id={offscreen ? `carousel-offscreen-${index}` : (preview ? undefined : `carousel-slide-${index}`)}
        className={`relative flex flex-col justify-center items-center text-center overflow-hidden transition-all
          ${preview ? 'cursor-pointer hover:ring-2 hover:ring-primary' : ''}
          ${(!offscreen && preview && activeSlide === index) ? 'ring-2 ring-primary ring-offset-2' : ''}
        `}
        style={{ 
          background: palette.bg,
          color: palette.text,
          width: offscreen ? slideW : (preview ? (aspect === '4:5' ? 110 : 150) : '100%'),
          height: offscreen ? slideH : (preview ? (aspect === '4:5' ? 138 : 84) : '100%'),
          aspectRatio: offscreen ? undefined : (aspect === '4:5' ? '4/5' : '16/9'),
          padding: `${padding}px`,
          position: offscreen ? 'absolute' : 'relative',
          top: offscreen ? '-9999px' : 'auto',
          left: offscreen ? '-9999px' : 'auto',
          borderRadius: offscreen ? 0 : '0.5rem',
          boxShadow: offscreen ? 'none' : 'inset 0 0 20px rgba(0,0,0,0.05)',
        }}
        onClick={() => preview ? setActiveSlide(index) : undefined}
      >
        <div className="absolute top-4 left-4" style={{ fontSize: isPreviewSmall ? '8px' : '14px', opacity: 0.6 }}>
          {index + 1}/{slides.length}
        </div>

        {!isCover && (
          <div className="mb-4" style={{ color: palette.accent, fontWeight: 'bold', fontSize: isPreviewSmall ? '8px' : '12px', letterSpacing: '0.1em' }}>
            {typeLabels[slide.type]?.[lang] || slide.type.toUpperCase()}
          </div>
        )}

        <h2 className="font-bold leading-tight" style={{ 
          fontSize: isCover ? (isPreviewSmall ? '16px' : (offscreen ? '80px' : '36px')) : (isPreviewSmall ? '12px' : (offscreen ? '60px' : '28px')),
          marginBottom: slide.body ? '1rem' : '0'
        }}>
          {slide.title}
        </h2>

        {!isPreviewSmall && slide.body && (
          <p style={{ 
            fontSize: offscreen ? '32px' : '18px', 
            opacity: 0.9, 
            maxWidth: '90%',
            lineHeight: 1.5
          }}>
            {slide.body}
          </p>
        )}

        {slide.reference && !isPreviewSmall && (
          <div className="mt-8" style={{ color: palette.accent, fontSize: offscreen ? '24px' : '14px', fontWeight: 'bold' }}>
            📖 {slide.reference}
          </div>
        )}

        {slide.reference && isPreviewSmall && (
          <div className="mt-2" style={{ color: palette.accent, fontSize: '10px' }}>
            📖
          </div>
        )}
        
        <div className="absolute bottom-4 right-4" style={{ color: palette.accent, fontSize: isPreviewSmall ? '6px' : '12px', opacity: 0.8, letterSpacing: '1px' }}>
          ✝ LIVING WORD
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1000px] w-[95vw] max-h-[90vh] flex flex-col p-0 overflow-hidden bg-background">
        <DialogHeader className="p-4 border-b bg-card">
          <DialogTitle className="flex items-center gap-2">
            🎨 {labels.title[lang as keyof typeof labels.title]}
            <span className="text-sm font-normal text-muted-foreground ml-2">
              {loading ? labels.generating[lang as keyof typeof labels.generating] : `${slides.length} slides`}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-muted/20">
          <div className="p-4">
            <div className="flex items-center gap-4 mb-6">
              {!loading && slides.length > 0 && (
                <Button variant="outline" size="sm" onClick={generateSlides}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {labels.newVariation[lang as keyof typeof labels.newVariation]}
                </Button>
              )}
              
              <div className="bg-muted p-1 rounded-md flex">
                <button 
                  onClick={() => setAspect('4:5')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-1 ${aspect === '4:5' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Instagram className="w-3.5 h-3.5" /> 4:5
                </button>
                <button 
                  onClick={() => setAspect('16:9')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-1 ${aspect === '16:9' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <MonitorPlay className="w-3.5 h-3.5" /> 16:9
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center p-20 text-muted-foreground h-[400px]">
                <Loader2 className="w-12 h-12 animate-spin mb-4 text-primary" />
                <p>{labels.creating[lang as keyof typeof labels.creating]}</p>
              </div>
            ) : slides.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Main Slide Preview */}
                <div className="lg:col-span-2 flex flex-col items-center">
                  <div className="relative w-full max-w-lg flex items-center justify-center">
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

                  <div className="flex gap-3 mt-6">
                    <Button variant="default" onClick={() => downloadSlide(activeSlide)}>
                      <Download className="w-4 h-4 mr-2" />
                      {labels.downloadSlide[lang as keyof typeof labels.downloadSlide]}
                    </Button>
                    <Button variant="secondary" onClick={downloadAll} disabled={downloadingAll}>
                      {downloadingAll ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                      {downloadingAll ? labels.downloading[lang as keyof typeof labels.downloading] : labels.downloadAll[lang as keyof typeof labels.downloadAll]}
                    </Button>
                    <Button variant="outline" onClick={handleSend}>
                      <Send className="w-4 h-4 mr-2" />
                      {labels.send[lang as keyof typeof labels.send]}
                    </Button>
                  </div>
                </div>

                {/* Thumbnails Sidebar */}
                <div className="flex flex-col bg-card border rounded-lg overflow-hidden h-fit">
                  <div className="bg-muted p-2 font-semibold text-sm border-b text-center">
                    {labels.slidesOf[lang as keyof typeof labels.slidesOf]}
                  </div>
                  <div className="p-3 grid grid-cols-2 lg:grid-cols-1 gap-3 max-h-[500px] overflow-y-auto">
                    {slides.map((s, i) => (
                      <div key={i} className="flex justify-center">
                        {renderSlideContent(s, i, { preview: true })}
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
