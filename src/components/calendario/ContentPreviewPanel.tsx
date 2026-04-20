import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, Share2, Trash2, Calendar, Clock, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { NETWORK_META } from './NetworkFilterBar';
import type { CalendarItem } from './CalendarGrid';

type L = 'PT' | 'EN' | 'ES';

const COPY = {
  scheduled: { PT: 'Agendado', EN: 'Scheduled', ES: 'Programado' },
  published: { PT: 'Publicado', EN: 'Published', ES: 'Publicado' },
  draft: { PT: 'Rascunho', EN: 'Draft', ES: 'Borrador' },
  caption: { PT: 'Legenda', EN: 'Caption', ES: 'Leyenda' },
  hashtags: { PT: 'Hashtags', EN: 'Hashtags', ES: 'Hashtags' },
  copyCaption: { PT: 'Copiar legenda', EN: 'Copy caption', ES: 'Copiar leyenda' },
  download: { PT: 'Baixar imagem', EN: 'Download image', ES: 'Descargar imagen' },
  share: { PT: 'Compartilhar link', EN: 'Share link', ES: 'Compartir enlace' },
  remove: { PT: 'Remover', EN: 'Remove', ES: 'Eliminar' },
  copied: { PT: 'Copiado!', EN: 'Copied!', ES: '¡Copiado!' },
  noImage: { PT: 'Sem imagem', EN: 'No image', ES: 'Sin imagen' },
} satisfies Record<string, Record<L, string>>;

interface Props {
  item: CalendarItem | null;
  lang: L;
  onDelete: (item: CalendarItem) => void;
  emptyText: string;
}

export function ContentPreviewPanel({ item, lang, onDelete, emptyText }: Props) {
  const t = (k: keyof typeof COPY) => COPY[k][lang];

  if (!item) {
    return (
      <aside className="rounded-2xl border border-border bg-card shadow-sm p-8 flex flex-col items-center justify-center text-center min-h-[400px] xl:sticky xl:top-4 xl:self-start">
        <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
          <Calendar className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground max-w-[220px]">{emptyText}</p>
      </aside>
    );
  }

  const meta = item.kind === 'editorial' ? NETWORK_META.editorial : NETWORK_META[item.network!];
  const Icon = meta.icon;
  const date = item.scheduled_at ? new Date(item.scheduled_at) : null;

  const copyCaption = async () => {
    const text = `${item.caption}${item.hashtags ? `\n\n${item.hashtags}` : ''}`;
    await navigator.clipboard.writeText(text);
    toast.success(t('copied'));
  };

  const downloadImage = async () => {
    if (!item.image_url) return;
    const a = document.createElement('a');
    a.href = item.image_url;
    a.download = `${item.title.slice(0, 40) || 'post'}.png`;
    a.target = '_blank';
    a.click();
  };

  const shareLink = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: item.title, text: item.caption, url });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success(t('copied'));
    }
  };

  return (
    <aside className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden xl:sticky xl:top-4 xl:self-start max-h-[calc(100vh-2rem)] flex flex-col">
      {/* Header strip */}
      <div className={`px-4 py-3 ${meta.bg} border-b border-border flex items-center gap-2.5`}>
        <div className={`h-8 w-8 rounded-lg bg-background/70 flex items-center justify-center ${meta.color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-bold uppercase tracking-wide ${meta.color}`}>
            {meta.label}
          </p>
        </div>
        <Badge variant="outline" className="bg-background/60 text-[10px] capitalize">
          {t(item.status as 'scheduled' | 'published' | 'draft') || item.status}
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Image preview */}
        <div className="aspect-square bg-muted/30 border-b border-border flex items-center justify-center overflow-hidden">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center text-muted-foreground">
              <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-xs">{t('noImage')}</p>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          <h3 className="font-display text-base font-semibold text-foreground leading-snug">
            {item.title}
          </h3>

          {date && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {date.toLocaleDateString(lang === 'PT' ? 'pt-BR' : lang === 'ES' ? 'es-ES' : 'en-US', {
                  day: '2-digit',
                  month: 'short',
                })}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
              </span>
            </div>
          )}

          {item.caption && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                {t('caption')}
              </p>
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap line-clamp-6">
                {item.caption}
              </p>
            </div>
          )}

          {item.hashtags && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                {t('hashtags')}
              </p>
              <p className="text-xs text-primary leading-relaxed">{item.hashtags}</p>
            </div>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div className="border-t border-border p-3 grid grid-cols-2 gap-2 bg-muted/20">
        <Button variant="outline" size="sm" onClick={copyCaption} className="gap-1.5">
          <Copy className="h-3.5 w-3.5" />
          <span className="truncate">{t('copyCaption')}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={downloadImage}
          disabled={!item.image_url}
          className="gap-1.5"
        >
          <Download className="h-3.5 w-3.5" />
          <span className="truncate">{t('download')}</span>
        </Button>
        <Button variant="outline" size="sm" onClick={shareLink} className="gap-1.5">
          <Share2 className="h-3.5 w-3.5" />
          <span className="truncate">{t('share')}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(item)}
          className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span className="truncate">{t('remove')}</span>
        </Button>
      </div>
    </aside>
  );
}
