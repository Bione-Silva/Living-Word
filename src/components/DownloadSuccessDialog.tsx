import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Folder, Smartphone, Monitor, CheckCircle2 } from 'lucide-react';

const AUTO_CLOSE_MS = 5000;

type L = 'PT' | 'EN' | 'ES';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  lang: L;
}

const copy: Record<L, {
  title: string;
  subtitle: string;
  fileLabel: string;
  desktopTitle: string;
  desktopBody: string;
  desktopHint: string;
  mobileTitle: string;
  mobileBody: string;
  mobileHint: string;
  cta: string;
}> = {
  PT: {
    title: 'Pronto! Seu arquivo foi salvo',
    subtitle: 'Onde encontrar:',
    fileLabel: 'Nome do arquivo',
    desktopTitle: 'No computador (Mac / Windows)',
    desktopBody: 'O arquivo foi salvo na sua pasta Downloads.',
    desktopHint: 'No Mac: Finder → Downloads (atalho ⌘ + ⌥ + L). No Windows: Explorador → Downloads.',
    mobileTitle: 'No celular (iPhone / Android)',
    mobileBody: 'O arquivo foi salvo na pasta Downloads do seu celular.',
    mobileHint: 'iPhone: app Arquivos → Downloads → iCloud Drive. Android: app Arquivos ou Downloads → pasta Download.',
    cta: 'Entendi',
  },
  EN: {
    title: 'Done! Your file was saved',
    subtitle: 'Where to find it:',
    fileLabel: 'File name',
    desktopTitle: 'On computer (Mac / Windows)',
    desktopBody: 'The file was saved to your Downloads folder.',
    desktopHint: 'Mac: Finder → Downloads (shortcut ⌘ + ⌥ + L). Windows: File Explorer → Downloads.',
    mobileTitle: 'On phone (iPhone / Android)',
    mobileBody: 'The file was saved to your phone\'s Downloads folder.',
    mobileHint: 'iPhone: Files app → Downloads → iCloud Drive. Android: Files or Downloads app → Download folder.',
    cta: 'Got it',
  },
  ES: {
    title: '¡Listo! Tu archivo se guardó',
    subtitle: 'Dónde encontrarlo:',
    fileLabel: 'Nombre del archivo',
    desktopTitle: 'En la computadora (Mac / Windows)',
    desktopBody: 'El archivo se guardó en tu carpeta Descargas.',
    desktopHint: 'Mac: Finder → Descargas (atajo ⌘ + ⌥ + L). Windows: Explorador → Descargas.',
    mobileTitle: 'En el celular (iPhone / Android)',
    mobileBody: 'El archivo se guardó en la carpeta Descargas de tu celular.',
    mobileHint: 'iPhone: app Archivos → Descargas → iCloud Drive. Android: app Archivos o Descargas → carpeta Download.',
    cta: 'Entendido',
  },
};

export function DownloadSuccessDialog({ open, onOpenChange, fileName, lang }: Props) {
  const t = copy[lang];
  const [progress, setProgress] = useState(100);

  // Auto-close after 5s with a smooth countdown bar.
  // Pauses if the user hovers the dialog so they can finish reading.
  useEffect(() => {
    if (!open) {
      setProgress(100);
      return;
    }
    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, 100 - (elapsed / AUTO_CLOSE_MS) * 100);
      setProgress(remaining);
      if (elapsed >= AUTO_CLOSE_MS) {
        window.clearInterval(interval);
        onOpenChange(false);
      }
    }, 60);
    return () => window.clearInterval(interval);
  }, [open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden">
        {/* Auto-close countdown bar */}
        <div
          className="absolute top-0 left-0 h-1 bg-primary transition-[width] duration-75 ease-linear"
          style={{ width: `${progress}%` }}
          aria-hidden
        />

        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-left text-lg">{t.title}</DialogTitle>
          </div>
          <DialogDescription className="text-left pt-1">
            {t.subtitle}
          </DialogDescription>
        </DialogHeader>

        {/* File name pill */}
        <div className="rounded-lg bg-muted/60 border border-border px-3 py-2 flex items-center gap-2">
          <Folder className="h-4 w-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
              {t.fileLabel}
            </p>
            <p className="text-xs font-mono text-foreground truncate">{fileName}</p>
          </div>
        </div>

        {/* Desktop block */}
        <div className="rounded-lg border border-border p-3 space-y-1.5">
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-primary" />
            <h4 className="font-semibold text-sm text-foreground">{t.desktopTitle}</h4>
          </div>
          <p className="text-sm text-foreground/90">{t.desktopBody}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{t.desktopHint}</p>
        </div>

        {/* Mobile block */}
        <div className="rounded-lg border border-border p-3 space-y-1.5">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-primary" />
            <h4 className="font-semibold text-sm text-foreground">{t.mobileTitle}</h4>
          </div>
          <p className="text-sm text-foreground/90">{t.mobileBody}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{t.mobileHint}</p>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            {t.cta}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
