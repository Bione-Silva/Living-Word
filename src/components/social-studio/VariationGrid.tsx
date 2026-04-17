import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import JSZip from 'jszip';
import PptxGenJS from 'pptxgenjs';
import { SlideCanvas, type SlideData } from './SlideCanvas';
import type { CanvasTemplate } from './TemplatePicker';
import type { AspectRatio } from './AspectRatioSelector';
import type { ThemeConfig } from './ThemeCustomizer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Image as ImageIcon, FileImage, Loader2, Archive, Presentation, Sparkles } from 'lucide-react';
import { captureNodeAsPng, compressToJpeg } from './export-utils';
import { toast } from 'sonner';
import { DownloadSuccessDialog } from '@/components/DownloadSuccessDialog';

type L = 'PT' | 'EN' | 'ES';

const TEMPLATE_LABELS: Record<CanvasTemplate, Record<L, string>> = {
  editorial: { PT: 'Editorial', EN: 'Editorial', ES: 'Editorial' },
  swiss: { PT: 'Tipografia', EN: 'Typography', ES: 'Tipografía' },
  cinematic: { PT: 'Cinematográfico', EN: 'Cinematic', ES: 'Cinematográfico' },
  gradient: { PT: 'Gradiente', EN: 'Gradient', ES: 'Gradiente' },
  'lw-amber': { PT: 'Living Word', EN: 'Living Word', ES: 'Living Word' },
};

const ALL_TEMPLATES: CanvasTemplate[] = ['editorial', 'cinematic', 'gradient', 'lw-amber', 'swiss'];

const labels = {
  PT: {
    empty: 'Suas artes aparecerão aqui',
    emptyHint: 'Escolha um conteúdo no painel ao lado e clique em "Gerar Artes" para criar variações em todos os estilos automaticamente.',
    downloadAll: 'Baixar Todas (ZIP)',
    downloadPptx: 'Apresentação PPTX',
    downloading: 'Preparando...',
    png: 'PNG',
    jpg: 'JPG',
    saved: 'Arte salva!',
    zipReady: 'ZIP pronto para download',
    pptxReady: 'Apresentação pronta',
    variations: 'variações',
    of: 'de',
  },
  EN: {
    empty: 'Your artworks will appear here',
    emptyHint: 'Pick content on the left panel and click "Generate Arts" to create variations in every style automatically.',
    downloadAll: 'Download All (ZIP)',
    downloadPptx: 'PPTX Presentation',
    downloading: 'Preparing...',
    png: 'PNG',
    jpg: 'JPG',
    saved: 'Art saved!',
    zipReady: 'ZIP ready',
    pptxReady: 'Presentation ready',
    variations: 'variations',
    of: 'of',
  },
  ES: {
    empty: 'Tus artes aparecerán aquí',
    emptyHint: 'Elige un contenido en el panel lateral y haz clic en "Generar Artes" para crear variaciones en todos los estilos.',
    downloadAll: 'Descargar Todas (ZIP)',
    downloadPptx: 'Presentación PPTX',
    downloading: 'Preparando...',
    png: 'PNG',
    jpg: 'JPG',
    saved: '¡Arte guardado!',
    zipReady: 'ZIP listo',
    pptxReady: 'Presentación lista',
    variations: 'variaciones',
    of: 'de',
  },
};

export interface VariationGridProps {
  slides: SlideData[];
  aspectRatio: AspectRatio;
  theme: ThemeConfig;
  lang: L;
  presentationMode?: boolean; // true => PPTX export available (sermão/estudo)
}

export interface VariationGridHandle {
  refresh: () => void;
}

interface VariationItem {
  id: string;
  template: CanvasTemplate;
  slideIdx: number;
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
  ({ slides, aspectRatio, theme, lang, presentationMode = false }, ref) => {
    const l = labels[lang];
    const [busyKey, setBusyKey] = useState<string | null>(null);
    const [zipBusy, setZipBusy] = useState(false);
    const [pptxBusy, setPptxBusy] = useState(false);
    const [savedDialog, setSavedDialog] = useState<{ open: boolean; fileName: string }>({ open: false, fileName: '' });

    // Build a flat matrix of variations: each slide × each template
    const items: VariationItem[] = useMemo(() => {
      const list: VariationItem[] = [];
      slides.forEach((_, slideIdx) => {
        ALL_TEMPLATES.forEach((tpl) => {
          list.push({ id: `${slideIdx}-${tpl}`, template: tpl, slideIdx });
        });
      });
      return list;
    }, [slides]);

    // Map of refs keyed by item id (stable across renders)
    const refsMap = useRef<Map<string, HTMLDivElement | null>>(new Map());
    const setRef = (id: string) => (el: HTMLDivElement | null) => {
      refsMap.current.set(id, el);
    };
    const getNode = (id: string) => refsMap.current.get(id) || null;

    useImperativeHandle(ref, () => ({ refresh: () => {} }));

    const handleDownload = async (item: VariationItem, format: 'png' | 'jpg') => {
      const node = getNode(item.id);
      if (!node) return;
      setBusyKey(`${item.id}-${format}`);
      try {
        const pngDataUrl = await captureNodeAsPng(node);
        let blob: Blob;
        let ext: string;
        if (format === 'jpg') {
          blob = await compressToJpeg(pngDataUrl, 1_500_000);
          ext = 'jpg';
        } else {
          blob = dataUrlToBlob(pngDataUrl);
          ext = 'png';
        }
        const fname = `living-word-${item.template}-${item.slideIdx + 1}.${ext}`;
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

    const handleDownloadAllZip = async () => {
      if (items.length === 0) return;
      setZipBusy(true);
      try {
        const zip = new JSZip();
        for (const item of items) {
          const node = getNode(item.id);
          if (!node) continue;
          const dataUrl = await captureNodeAsPng(node);
          const folder = `slide-${item.slideIdx + 1}`;
          zip.file(`${folder}/${item.template}.png`, dataUrlToBlob(dataUrl));
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

        // Use the first template (editorial) for each slide as the presentation base
        for (let i = 0; i < slides.length; i++) {
          const item = items.find((it) => it.slideIdx === i && it.template === 'cinematic');
          if (!item) continue;
          const node = getNode(item.id);
          if (!node) continue;
          const dataUrl = await captureNodeAsPng(node);
          const slide = pptx.addSlide();
          slide.background = { color: '0A0A0A' };
          // Center the captured image with margin
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

        await pptx.writeFile({ fileName: `living-word-apresentacao-${Date.now()}.pptx` });
        toast.success(l.pptxReady);
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
            <span className="font-semibold text-foreground">{items.length}</span>
            <span className="text-muted-foreground">{l.variations}</span>
            <span className="text-muted-foreground/60">·</span>
            <span className="text-muted-foreground">
              {slides.length} {l.of} {slides.length === 1 ? 'arte' : 'artes'} × {ALL_TEMPLATES.length} estilos
            </span>
          </div>
          <div className="flex items-center gap-2">
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

        {/* Variation grid grouped by slide */}
        <div className="space-y-8">
          {slides.map((slide, slideIdx) => (
            <div key={slideIdx} className="space-y-3">
              {slides.length > 1 && (
                <div className="flex items-center gap-2 px-1">
                  <div className="h-6 w-6 rounded-md bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                    {slideIdx + 1}
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Slide {slideIdx + 1}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {items
                  .filter((it) => it.slideIdx === slideIdx)
                  .map((item) => {
                    const downloading = busyKey?.startsWith(item.id);
                    return (
                      <div key={item.id} className="group relative">
                        <div className="relative rounded-xl overflow-hidden bg-muted/30 border border-border shadow-sm transition-all hover:shadow-lg hover:border-primary/40">
                          <SlideCanvas
                            ref={setRef(item.id)}
                            slide={slide}
                            aspectRatio={aspectRatio}
                            template={item.template}
                            bgImageUrl={theme.backgroundImageUrl}
                            themeColor={theme.gradient}
                            fontFamily={theme.fontFamily}
                            textColor={theme.textColor}
                            showWatermark
                          />
                          {/* Hover overlay with download buttons */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100">
                            <div className="flex gap-1.5">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleDownload(item, 'png')}
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
                                onClick={() => handleDownload(item, 'jpg')}
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
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between px-1">
                          <span className="text-xs font-semibold text-foreground truncate">
                            {TEMPLATE_LABELS[item.template][lang]}
                          </span>
                          <Download className="h-3 w-3 text-muted-foreground/40" />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

VariationGrid.displayName = 'VariationGrid';
