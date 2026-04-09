import { useState } from 'react';
import { captureNodeAsPng } from './export-utils';
import { Button } from '@/components/ui/button';
import { Download, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  targetRef: React.RefObject<HTMLDivElement>;
  fileName?: string;
  lang: 'PT' | 'EN' | 'ES';
  onDownloaded?: () => void;
}

const labels = {
  PT: { download: 'Baixar Imagem (Pronto para Postar)', downloading: 'Gerando...', done: 'Salvo!', error: 'Erro ao gerar imagem' },
  EN: { download: 'Download Image (Ready to Post)', downloading: 'Generating...', done: 'Saved!', error: 'Error generating image' },
  ES: { download: 'Descargar Imagen (Lista para Publicar)', downloading: 'Generando...', done: '¡Guardado!', error: 'Error generating image' },
};

export function DownloadButton({ targetRef, fileName = 'social-post', lang, onDownloaded }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const l = labels[lang];

  const handleDownload = async () => {
    if (!targetRef.current) return;

    setState('loading');

    try {
      const dataUrl = await captureNodeAsPng(targetRef.current);
      const link = document.createElement('a');
      link.download = `${fileName}.png`;
      link.href = dataUrl;
      link.click();

      setState('done');
      toast.success(l.done);
      onDownloaded?.();
      setTimeout(() => setState('idle'), 2000);
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
      className="gap-2 w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
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
