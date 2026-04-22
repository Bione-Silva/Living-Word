import { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import JSZip from 'jszip';
import PptxGenJS from 'pptxgenjs';
import { SlideCanvas, type SlideData } from './SlideCanvas';
import { getThemePalette } from './ThemeCustomizer';
import type { CanvasTemplate } from './TemplatePicker';
import type { AspectRatio } from './AspectRatioSelector';
import type { ThemeConfig } from './ThemeCustomizer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Image as ImageIcon, FileImage, Loader2, Archive, Presentation, Sparkles, Share2 } from 'lucide-react';
import { captureNodeAsPng, compressToJpeg } from './export-utils';
import { toast } from 'sonner';
import { DownloadSuccessDialog } from '@/components/DownloadSuccessDialog';
import { openWhatsAppShare } from '@/lib/whatsapp';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { type CarouselApi } from '@/components/ui/carousel';

type L = 'PT' | 'EN' | 'ES';

const labels = {
  PT: {
    empty: 'Suas artes aparecerão aqui',
    emptyHint: 'Escolha um conteúdo no painel ao lado e gere os slides. As artes vão aparecer aqui no estilo selecionado.',
    downloadAll: 'Baixar Todas (ZIP)',
    downloadPptx: 'Apresentação PPTX',
    downloading: 'Preparando...',
    png: 'PNG',
    jpg: 'JPG',
    slides: 'slides',
    slide: 'slide',
    whatsapp: 'WhatsApp',
    sharingError: 'Não foi possível compartilhar.',
    shareCaption: 'Confira essa arte feita no Living Word ✨',
  },
  EN: {
    empty: 'Your artworks will appear here',
    emptyHint: 'Pick content on the left panel and generate the slides. They will appear here in the selected style.',
    downloadAll: 'Download All (ZIP)',
    downloadPptx: 'PPTX Presentation',
    downloading: 'Preparing...',
    png: 'PNG',
    jpg: 'JPG',
    slides: 'slides',
    slide: 'slide',
    whatsapp: 'WhatsApp',
    sharingError: 'Could not share.',
    shareCaption: 'Check out this artwork made on Living Word ✨',
  },
  ES: {
    empty: 'Tus artes aparecerán aquí',
    emptyHint: 'Elige un contenido en el panel lateral y genera los slides. Aparecerán aquí en el estilo seleccionado.',
    downloadAll: 'Descargar Todas (ZIP)',
    downloadPptx: 'Presentación PPTX',
    downloading: 'Preparando...',
    png: 'PNG',
    jpg: 'JPG',
    slides: 'slides',
    slide: 'slide',
    whatsapp: 'WhatsApp',
    sharingError: 'No se pudo compartir.',
    shareCaption: 'Mira este arte hecho en Living Word ✨',
  },
};

export interface VariationGridProps {
  slides: SlideData[];
  aspectRatio: AspectRatio;
  theme: ThemeConfig;
  lang: L;
  template: CanvasTemplate;
  presentationMode?: boolean; // true => PPTX export available (sermão/estudo)
  selectedIndex?: number;
  onSelectIndex?: (idx: number) => void;
}

export interface VariationGridHandle {
  refresh: () => void;
  downloadSlide: (idx: number, format?: 'png' | 'jpg') => Promise<void>;
  downloadAllZip: () => Promise<void>;
}

function dataUrlToBlob(dataUrl: string) {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
  const binary = atob(parts[1]);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
  return new Blob([array], { type: mime });
}

export const VariationGrid = forwardRef<VariationGridHandle, VariationGridProps>(
  ({ slides, aspectRatio, theme, lang, template, presentationMode = false, selectedIndex, onSelectIndex }, ref) => {
    const l = labels[lang];
    const [busyKey, setBusyKey] = useState<string | null>(null);
    const [zipBusy, setZipBusy] = useState(false);
    const [pptxBusy, setPptxBusy] = useState(false);
    const [savedDialog, setSavedDialog] = useState<{ open: boolean; fileName: string }>({ open: false, fileName: '' });
    const [api, setApi] = useState<CarouselApi>();
    const [currentSlide, setCurrentSlide] = useState(0);

    const refsMap = useRef<Map<number, HTMLDivElement | null>>(new Map());
    const setRef = (idx: number) => (el: HTMLDivElement | null) => {
      refsMap.current.set(idx, el);
    };
    const getNode = (idx: number) => refsMap.current.get(idx) || null;

    useImperativeHandle(ref, () => ({
      refresh: () => {},
      downloadSlide: (idx: number, format: 'png' | 'jpg' = 'png') => handleDownload(idx, format),
      downloadAllZip: () => handleDownloadAllZip(),
    }));

    // Update current slide index when carousel changes
    useEffect(() => {
      if (!api) return;
      
      const onSelect = () => {
        try {
          const snap = api.selectedScrollSnap();
          setCurrentSlide(snap);
          onSelectIndex?.(snap);
        } catch (e) {
          console.warn('Carousel error', e);
        }
      };
      
      onSelect();
      api.on("select", onSelect);
      
      return () => {
        api.off("select", onSelect);
      };
    }, [api, onSelectIndex]);

    const handleDownload = async (slideIdx: number, format: 'png' | 'jpg') => {
      const node = getNode(slideIdx);
      if (!node) return;
      setBusyKey(`${slideIdx}-${format}`);
      try {
        const pngDataUrl = await captureNodeAsPng(node);
        let blob: Blob;
        let ext: string;
        if (format === 'jpg') {
          blob = await compressToJpeg(pngDataUrl, 400_000); // MAX 400KB
          ext = 'jpg';
        } else {
          blob = dataUrlToBlob(pngDataUrl);
          ext = 'png';
        }
        const fname = `living-word-${template}-${slideIdx + 1}.${ext}`;
        const link = document.createElement('a');
        link.download = fname;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
        setSavedDialog({ open: true, fileName: fname });
      } catch (err) {
        console.error(err);
        toast.error('Erro ao baixar');
      } finally {
        setBusyKey(null);
      }
    };

    const handleShareWhatsApp = async (slideIdx: number) => {
      const node = getNode(slideIdx);
      if (!node) return;
      setBusyKey(`${slideIdx}-share`);
      try {
        const pngDataUrl = await captureNodeAsPng(node);
        const blob = await compressToJpeg(pngDataUrl, 350_000); // 350KB optimizado WhatsApp
        const fname = `living-word-${template}-${slideIdx + 1}.jpg`;
        const file = new File([blob], fname, { type: 'image/jpeg' });

        const nav: any = navigator;
        if (nav.canShare && nav.canShare({ files: [file] })) {
          await nav.share({
            files: [file],
            text: l.shareCaption,
          });
        } else {
          // Fallback: download + open WhatsApp with caption
          const link = document.createElement('a');
          link.download = fname;
          link.href = URL.createObjectURL(blob);
          link.click();
          URL.revokeObjectURL(link.href);
          openWhatsAppShare(l.shareCaption);
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.error(err);
          toast.error(l.sharingError);
        }
      } finally {
        setBusyKey(null);
      }
    };

    const handleDownloadAllZip = async () => {
      if (slides.length === 0) return;
      setZipBusy(true);
      try {
        const zip = new JSZip();
        for (let i = 0; i < slides.length; i++) {
          const node = getNode(i);
          if (!node) continue;
          const dataUrl = await captureNodeAsPng(node);
          const jpgBlob = await compressToJpeg(dataUrl, 400_000);
          zip.file(`slide-${i + 1}.jpg`, jpgBlob);
        }
        const blob = await zip.generateAsync({ type: 'blob' });
        const fname = `living-word-artes-${Date.now()}.zip`;
        const link = document.createElement('a');
        link.download = fname;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
        setSavedDialog({ open: true, fileName: fname });
      } catch (err) {
        console.error(err);
        toast.error('Erro ao gerar ZIP');
      } finally {
        setZipBusy(false);
      }
    };

    const handleDownloadPptx = async () => {
      if (slides.length === 0) return;
      setPptxBusy(true);
      try {
        const pptx = new PptxGenJS();
        pptx.layout = 'LAYOUT_16x9';
        pptx.title = 'Living Word';

        for (let i = 0; i < slides.length; i++) {
          const node = getNode(i);
          if (!node) continue;
          const dataUrl = await captureNodeAsPng(node);
          const slide = pptx.addSlide();
          slide.background = { color: '0A0A0A' };
          slide.addImage({
            data: dataUrl,
            x: 0.5,
            y: 0.3,
            w: 9,
            h: 7,
            sizing: { type: 'contain', w: 9, h: 7 },
          });
          slide.addText('living-word.app', {
            x: 0,
            y: 7.2,
            w: 10,
            h: 0.3,
            align: 'center',
            fontSize: 9,
            color: '888888',
            fontFace: 'Helvetica',
          });
        }

        const pptxName = `living-word-apresentacao-${Date.now()}.pptx`;
        await pptx.writeFile({ fileName: pptxName });
        setSavedDialog({ open: true, fileName: pptxName });
      } catch (err) {
        console.error(err);
        toast.error('Erro ao gerar PPTX');
      } finally {
        setPptxBusy(false);
      }
    };

    if (slides.length === 0) {
      return (
        <Card className="border-dashed border-2 border-border bg-card/50 min-h-[480px]">
          <CardContent className="flex flex-col items-center justify-center text-center px-8 py-16 h-full">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-5">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <h3 className="font-display text-xl font-bold text-foreground mb-2">{l.empty}</h3>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">{l.emptyHint}</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-5">
        {/* Bulk action bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl bg-card border border-border shadow-sm">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-foreground">{slides.length}</span>
            <span className="text-muted-foreground">{slides.length === 1 ? l.slide : l.slides}</span>
          </div>
          <div className="flex items-center gap-2">
            {slides.length > 1 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownloadAllZip}
                disabled={zipBusy || pptxBusy}
                className="gap-1.5 border-border"
              >
                {zipBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />}
                {zipBusy ? l.downloading : l.downloadAll}
              </Button>
            )}
            {presentationMode && (
              <Button
                size="sm"
                onClick={handleDownloadPptx}
                disabled={pptxBusy || zipBusy}
                className="gap-1.5"
              >
                {pptxBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Presentation className="h-3.5 w-3.5" />}
                {pptxBusy ? l.downloading : l.downloadPptx}
              </Button>
            )}
          </div>
        </div>

        {/* Single-template Carousel: one card per slide on the viewport horizontally */}
        <div className="relative px-4 sm:px-12 w-full max-w-[640px] mx-auto">
          <Carousel
            setApi={setApi}
            opts={{
              align: 'center',
              loop: false,
            }}
            className="w-full"
          >
            <CarouselContent>
              {slides.map((slide, slideIdx) => {
                const downloading = busyKey?.startsWith(`${slideIdx}-`);
                return (
                  <CarouselItem key={slideIdx}>
                    <div className="group relative w-full h-full">
                      <div
                        onClick={() => {
                          onSelectIndex?.(slideIdx);
                          api?.scrollTo(slideIdx);
                        }}
                        className={`relative rounded-xl overflow-hidden bg-muted/30 border-2 shadow-sm transition-all hover:shadow-lg cursor-pointer ${
                          selectedIndex === slideIdx || currentSlide === slideIdx
                            ? 'border-primary ring-2 ring-primary/30'
                            : 'border-border hover:border-primary/40'
                        }`}
                      >
                        <SlideCanvas
                          ref={setRef(slideIdx)}
                          slide={slide}
                          aspectRatio={aspectRatio}
                          template={template}
                          bgImageUrl={slide.bgImageUrl ?? theme.backgroundImageUrl}
                          themeColor={theme.gradient}
                          themeColors={getThemePalette(theme.gradient)}
                          slideIndex={slideIdx}
                          fontFamily={theme.fontFamily}
                          textColor={theme.textColor}
                          showWatermark
                        />
                        {/* Hover overlay with download buttons */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100">
                          <div className="flex gap-1.5 flex-wrap justify-center px-4">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={(e) => { e.stopPropagation(); handleDownload(slideIdx, 'png'); }}
                              disabled={downloading}
                              className="h-8 px-2.5 text-xs gap-1 shadow-lg"
                            >
                              {downloading && busyKey?.endsWith('png') ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <ImageIcon className="h-3 w-3" />
                              )}
                              {l.png}
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={(e) => { e.stopPropagation(); handleDownload(slideIdx, 'jpg'); }}
                              disabled={downloading}
                              className="h-8 px-2.5 text-xs gap-1 shadow-lg"
                            >
                              {downloading && busyKey?.endsWith('jpg') ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <FileImage className="h-3 w-3" />
                              )}
                              {l.jpg}
                            </Button>
                            <Button
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleShareWhatsApp(slideIdx); }}
                              disabled={downloading}
                              className="h-8 px-2.5 text-xs gap-1 shadow-lg bg-[#25D366] hover:bg-[#20BD5A] text-white"
                            >
                              {downloading && busyKey?.endsWith('share') ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Share2 className="h-3 w-3" />
                              )}
                              {l.whatsapp}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            
            {slides.length > 1 && (
              <>
                <CarouselPrevious className="hidden sm:flex -left-12 h-10 w-10 border-2 border-[hsl(270,35%,78%)] text-[hsl(257,61%,32%)] shadow-sm hover:bg-[hsl(252,100%,99%)]" />
                <CarouselNext className="hidden sm:flex -right-12 h-10 w-10 border-2 border-[hsl(270,35%,78%)] text-[hsl(257,61%,32%)] shadow-sm hover:bg-[hsl(252,100%,99%)]" />
              </>
            )}
          </Carousel>
          
          {slides.length > 1 && (
            <div className="flex items-center justify-between px-2 mt-4">
              <span className="text-xs font-semibold text-muted-foreground">
                {l.slide.charAt(0).toUpperCase() + l.slide.slice(1)} {currentSlide + 1} / {slides.length}
              </span>
              <div className="flex items-center gap-1.5">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => api?.scrollTo(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${i === currentSlide ? 'w-6 bg-[hsl(263,70%,50%)]' : 'w-2 bg-[hsl(270,35%,78%)] hover:bg-[hsl(263,70%,50%)]/50'}`}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>
              <Download className="h-4 w-4 text-transparent pointer-events-none" /> {/* Para balancear flex space-between */}
            </div>
          )}
        </div>

        <DownloadSuccessDialog
          open={savedDialog.open}
          onOpenChange={(open) => setSavedDialog((s) => ({ ...s, open }))}
          fileName={savedDialog.fileName}
          lang={lang}
        />
      </div>
    );
  }
);

VariationGrid.displayName = 'VariationGrid';
