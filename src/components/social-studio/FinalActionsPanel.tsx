import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Copy, Share2, Loader2, Package, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { SlideData } from './SlideCanvas';

type L = 'PT' | 'EN' | 'ES';

export interface DestinationInfo {
  id: string;
  label: string;
  size: string;
}

interface Props {
  slides: SlideData[];
  selectedIndex: number;
  formatLabel: string;
  formatSize: string;
  /** All destinations the user marked. When >1, batch ZIP exports per channel. */
  destinations?: DestinationInfo[];
  caption?: string;
  lang: L;
  /** Receives the selected slide index and triggers PNG download via parent */
  onDownloadSingle: (slideIndex: number) => Promise<void> | void;
  /** Triggers ZIP download via parent (only available when slides.length > 1) */
  onDownloadZip: () => Promise<void> | void;
  onShareLink?: () => Promise<void> | void;
}

const T: Record<L, Record<string, string>> = {
  PT: {
    selected: 'Arte selecionada',
    format: 'Canal/Formato',
    destinations: 'Destinos selecionados',
    download: 'Baixar imagem (JPG)',
    downloadZip: 'Baixar em lote (ZIP)',
    downloadZipHint: 'Todas as variações',
    downloadZipMulti: 'Pacote completo por canal',
    copyCaption: 'Copiar legenda',
    shareLink: 'Compartilhar link',
    copied: 'Legenda copiada!',
    copyEmpty: 'Sem legenda para copiar',
    noSlide: 'Nenhuma arte gerada ainda',
    zipNoticeTitle: 'Vários canais selecionados?',
    zipNoticeBody: 'O ZIP traz uma pasta por rede, no tamanho ideal de cada uma.',
  },
  EN: {
    selected: 'Selected art',
    format: 'Channel/Format',
    destinations: 'Selected destinations',
    download: 'Download image (JPG)',
    downloadZip: 'Download batch (ZIP)',
    downloadZipHint: 'All variations',
    downloadZipMulti: 'Full pack, one folder per channel',
    copyCaption: 'Copy caption',
    shareLink: 'Share link',
    copied: 'Caption copied!',
    copyEmpty: 'No caption to copy',
    noSlide: 'No art generated yet',
    zipNoticeTitle: 'Multiple channels picked?',
    zipNoticeBody: 'The ZIP includes one folder per network at the ideal size for each.',
  },
  ES: {
    selected: 'Arte seleccionado',
    format: 'Canal/Formato',
    destinations: 'Destinos seleccionados',
    download: 'Descargar imagen (JPG)',
    downloadZip: 'Descargar lote (ZIP)',
    downloadZipHint: 'Todas las variaciones',
    downloadZipMulti: 'Pack completo por canal',
    copyCaption: 'Copiar leyenda',
    shareLink: 'Compartir enlace',
    copied: '¡Leyenda copiada!',
    copyEmpty: 'Sin leyenda para copiar',
    noSlide: 'Aún no hay arte generado',
    zipNoticeTitle: '¿Varios canales elegidos?',
    zipNoticeBody: 'El ZIP incluye una carpeta por red en el tamaño ideal de cada una.',
  },
};

export function FinalActionsPanel({
  slides,
  selectedIndex,
  formatLabel,
  formatSize,
  destinations = [],
  caption,
  lang,
  onDownloadSingle,
  onDownloadZip,
  onShareLink,
}: Props) {
  const t = T[lang];
  const [busy, setBusy] = useState<'png' | 'zip' | 'share' | null>(null);
  const isCarousel = slides.length > 1;
  const hasSlides = slides.length > 0;
  const multiDestinations = destinations.length > 1;
  // ZIP is enabled when carousel OR multiple destinations selected
  const zipEnabled = isCarousel || multiDestinations;

  const handlePng = async () => {
    if (!hasSlides) return;
    setBusy('png');
    try {
      await onDownloadSingle(selectedIndex);
    } finally {
      setBusy(null);
    }
  };

  const handleZip = async () => {
    if (!zipEnabled) return;
    setBusy('zip');
    try {
      await onDownloadZip();
    } finally {
      setBusy(null);
    }
  };

  const handleCopy = async () => {
    if (!caption) {
      toast.error(t.copyEmpty);
      return;
    }
    await navigator.clipboard.writeText(caption);
    toast.success(t.copied);
  };

  const handleShare = async () => {
    if (!onShareLink) return;
    setBusy('share');
    try {
      await onShareLink();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-muted-foreground mb-1.5">
          {t.selected}
        </div>
        {hasSlides ? (
          <div className="text-sm font-bold text-foreground leading-tight">
            {slides[selectedIndex]?.text?.slice(0, 60) || '—'}
            {slides[selectedIndex]?.text && slides[selectedIndex].text.length > 60 ? '…' : ''}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-3 text-center">
            <ImageIcon className="h-5 w-5 mx-auto text-muted-foreground/60 mb-1" />
            <p className="text-[11px] text-muted-foreground">{t.noSlide}</p>
          </div>
        )}
      </div>

      {destinations.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-muted-foreground">
              {t.destinations}
            </div>
            <span className="text-[10px] font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5">
              {destinations.length}
            </span>
          </div>
          <div className="space-y-1">
            {destinations.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between text-[11px] rounded-md bg-secondary/40 border border-border px-2 py-1.5"
              >
                <span className="font-medium text-foreground truncate">{d.label}</span>
                <span className="text-muted-foreground tabular-nums shrink-0 ml-2">{d.size}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-muted-foreground mb-1.5">
          {t.format}
        </div>
        <div className="text-sm font-medium text-foreground">{formatLabel}</div>
        <div className="text-[11px] text-muted-foreground">{formatSize}</div>
      </div>

      <div className="space-y-2 pt-2 border-t border-border">
        <Button
          onClick={handlePng}
          disabled={!hasSlides || busy !== null}
          className="w-full justify-start gap-2"
          size="sm"
        >
          {busy === 'png' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {t.download}
        </Button>

        <Button
          onClick={handleZip}
          disabled={!zipEnabled || busy !== null || !hasSlides}
          variant="outline"
          className="w-full justify-start gap-2"
          size="sm"
        >
          {busy === 'zip' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
          <span className="flex-1 text-left">
            {t.downloadZip}
            <span className="block text-[10px] text-muted-foreground font-normal">
              {multiDestinations ? t.downloadZipMulti : t.downloadZipHint}
            </span>
          </span>
        </Button>

        <Button
          onClick={handleCopy}
          disabled={!caption}
          variant="outline"
          className="w-full justify-start gap-2"
          size="sm"
        >
          <Copy className="h-4 w-4" />
          {t.copyCaption}
        </Button>

        {onShareLink && (
          <Button
            onClick={handleShare}
            disabled={!hasSlides || busy !== null}
            variant="outline"
            className="w-full justify-start gap-2"
            size="sm"
          >
            {busy === 'share' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
            {t.shareLink}
          </Button>
        )}
      </div>

      {multiDestinations && (
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
          <div className="text-[11px] font-bold text-foreground leading-tight">{t.zipNoticeTitle}</div>
          <p className="text-[11px] text-muted-foreground leading-snug mt-1">{t.zipNoticeBody}</p>
        </div>
      )}
    </div>
  );
}
