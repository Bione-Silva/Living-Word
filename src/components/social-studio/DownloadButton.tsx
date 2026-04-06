import { useState } from 'react';
import { getFontEmbedCSS, toPng } from 'html-to-image';
import { Button } from '@/components/ui/button';
import { Download, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  targetRef: React.RefObject<HTMLDivElement>;
  fileName?: string;
  lang: 'PT' | 'EN' | 'ES';
}

const labels = {
  PT: { download: 'Baixar Imagem (Pronto para Postar)', downloading: 'Gerando...', done: 'Salvo!', error: 'Erro ao gerar imagem' },
  EN: { download: 'Download Image (Ready to Post)', downloading: 'Generating...', done: 'Saved!', error: 'Error generating image' },
  ES: { download: 'Descargar Imagen (Lista para Publicar)', downloading: 'Generando...', done: '¡Guardado!', error: 'Error generating image' },
};

const EXPORT_SCALE = 3;

const waitForNextPaint = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

async function inlineExternalImages(node: HTMLElement) {
  const images = Array.from(node.querySelectorAll('img'));

  await Promise.all(
    images.map(async (img) => {
      if (!img.complete) {
        await new Promise<void>((resolve) => {
          img.addEventListener('load', () => resolve(), { once: true });
          img.addEventListener('error', () => resolve(), { once: true });
        });
      }

      // Convert external images to data URLs to avoid CORS canvas tainting
      if (img.src && !img.src.startsWith('data:')) {
        try {
          const resp = await fetch(img.src, { mode: 'cors' });
          const blob = await resp.blob();
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          img.src = dataUrl;
        } catch {
          // If fetch fails, try proxy or just leave it
          try {
            const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(img.src)}&w=1200&output=jpg`;
            const resp = await fetch(proxyUrl);
            const blob = await resp.blob();
            const dataUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
            img.src = dataUrl;
          } catch {
            // last resort: hide the image to avoid tainting
          }
        }
      }
    })
  );
}

function getCaptureDimensions(node: HTMLDivElement) {
  const width = Number(node.dataset.captureWidth) || Math.round(node.scrollWidth || node.getBoundingClientRect().width);
  const height = Number(node.dataset.captureHeight) || Math.round(node.scrollHeight || node.getBoundingClientRect().height);

  return { width, height };
}

function createSandboxClone(node: HTMLDivElement, width: number, height: number) {
  const sandbox = document.createElement('div');
  sandbox.style.position = 'fixed';
  sandbox.style.left = '-10000px';
  sandbox.style.top = '0';
  sandbox.style.width = `${width}px`;
  sandbox.style.height = `${height}px`;
  sandbox.style.overflow = 'hidden';
  sandbox.style.pointerEvents = 'none';
  sandbox.style.zIndex = '-1';

  const clone = node.cloneNode(true) as HTMLDivElement;
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  clone.style.margin = '0';
  clone.style.transform = 'none';
  clone.style.transformOrigin = 'top left';
  clone.style.maxWidth = 'none';
  clone.style.maxHeight = 'none';

  sandbox.appendChild(clone);
  document.body.appendChild(sandbox);

  return { sandbox, clone };
}

export function DownloadButton({ targetRef, fileName = 'social-post', lang }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const l = labels[lang];

  const handleDownload = async () => {
    if (!targetRef.current) return;

    setState('loading');

    try {
      const node = targetRef.current;
      const { width, height } = getCaptureDimensions(node);
      const { sandbox, clone } = createSandboxClone(node, width, height);

      try {
        if ('fonts' in document) {
          await document.fonts.ready;
        }

        await inlineExternalImages(clone);
        await waitForNextPaint();

        let fontEmbedCSS: string | undefined;
        try {
          fontEmbedCSS = await getFontEmbedCSS(clone);
        } catch {
          fontEmbedCSS = undefined;
        }

        const dataUrl = await toPng(clone, {
          cacheBust: true,
          pixelRatio: 1,
          backgroundColor: '#000000',
          width,
          height,
          canvasWidth: width * EXPORT_SCALE,
          canvasHeight: height * EXPORT_SCALE,
          skipAutoScale: true,
          fontEmbedCSS,
          style: {
            margin: '0',
            transform: 'none',
            transformOrigin: 'top left',
          },
        });

        const link = document.createElement('a');
        link.download = `${fileName}.png`;
        link.href = dataUrl;
        link.click();

        setState('done');
        toast.success(l.done);
        setTimeout(() => setState('idle'), 2000);
      } finally {
        sandbox.remove();
      }
    } catch (err) {
      console.error(err);
      toast.error(l.error);
      setState('idle');
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={state === 'loading'}
      size="lg"
      className="gap-2 w-full sm:w-auto"
    >
      {state === 'loading' ? (
        <><Loader2 className="h-4 w-4 animate-spin" /> {l.downloading}</>
      ) : state === 'done' ? (
        <><Check className="h-4 w-4" /> {l.done}</>
      ) : (
        <><Download className="h-4 w-4" /> {l.download}</>
      )}
    </Button>
  );
}
