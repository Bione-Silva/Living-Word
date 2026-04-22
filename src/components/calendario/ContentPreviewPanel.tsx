import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, Trash2, Calendar, Clock, ImageIcon, Instagram, Sparkles, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { NETWORK_META } from './NetworkFilterBar';
import { InstagramMockup } from './InstagramMockup';
import type { CalendarItem } from './CalendarGrid';

type L = 'PT' | 'EN' | 'ES';

interface ProfileLite {
  blog_handle?: string | null;
  avatar_url?: string | null;
  church_name?: string | null;
}

const COPY = {
  scheduled: { PT: 'Agendado', EN: 'Scheduled', ES: 'Programado' },
  published: { PT: 'Publicado', EN: 'Published', ES: 'Publicado' },
  draft: { PT: 'Rascunho', EN: 'Draft', ES: 'Borrador' },
  approved: { PT: 'Aprovado', EN: 'Approved', ES: 'Aprobado' },
  caption: { PT: 'Legenda', EN: 'Caption', ES: 'Leyenda' },
  hashtags: { PT: 'Hashtags', EN: 'Hashtags', ES: 'Hashtags' },
  copyCaption: { PT: 'Copiar legenda', EN: 'Copy caption', ES: 'Copiar leyenda' },
  download: { PT: 'Baixar imagem', EN: 'Download image', ES: 'Descargar imagen' },
  downloadAll: { PT: 'Baixar carrossel', EN: 'Download carousel', ES: 'Descargar carrusel' },
  openInsta: { PT: 'Abrir no Instagram', EN: 'Open in Instagram', ES: 'Abrir en Instagram' },
  remove: { PT: 'Remover', EN: 'Remove', ES: 'Eliminar' },
  copied: { PT: 'Copiado!', EN: 'Copied!', ES: '¡Copiado!' },
  noImage: { PT: 'Sem imagem', EN: 'No image', ES: 'Sin imagen' },
  prepared: {
    PT: 'Imagem baixada e legenda copiada. Cole no Instagram.',
    EN: 'Image downloaded and caption copied. Paste in Instagram.',
    ES: 'Imagen descargada y leyenda copiada. Pega en Instagram.',
  },
  preparedNoImg: {
    PT: 'Legenda copiada. Cole no Instagram.',
    EN: 'Caption copied. Paste in Instagram.',
    ES: 'Leyenda copiada. Pega en Instagram.',
  },
  autoFeed: { PT: 'Gerado por AutoFeed', EN: 'AutoFeed generated', ES: 'Generado por AutoFeed' },
  preview: { PT: 'Pré-visualização', EN: 'Preview', ES: 'Vista previa' },
} satisfies Record<string, Record<L, string>>;

interface Props {
  item: CalendarItem | null;
  lang: L;
  onDelete: (item: CalendarItem) => void;
  emptyText: string;
  profile?: ProfileLite;
}

export function ContentPreviewPanel({ item, lang, onDelete, emptyText, profile }: Props) {
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

  const editorialKey: 'sermon' | 'blog' =
    item.editorial_type && /sermon|pastoral|sermao|sermão/i.test(item.editorial_type)
      ? 'sermon'
      : 'blog';
  const meta =
    item.kind === 'editorial' ? NETWORK_META[editorialKey] : NETWORK_META[item.network!];
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

  const openInInstagram = async () => {
    const text = `${item.caption}${item.hashtags ? `\n\n${item.hashtags}` : ''}`;
    let downloaded = false;
    if (item.image_url) {
      try {
        const a = document.createElement('a');
        a.href = item.image_url;
        a.download = `${item.title.slice(0, 40) || 'post'}.png`;
        a.target = '_blank';
        a.click();
        downloaded = true;
      } catch {
        // ignore
      }
    }
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
    toast.success(downloaded ? t('prepared') : t('preparedNoImg'));
    // Open Instagram (deep link on mobile, web fallback elsewhere)
    setTimeout(() => {
      window.open('https://www.instagram.com/', '_blank', 'noopener');
    }, 250);
  };

  const isInstagram = item.kind === 'social' && item.network === 'instagram';

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
        {item.auto_generated && (
          <Badge variant="outline" className="bg-background/60 text-[10px] gap-1">
            <Sparkles className="h-2.5 w-2.5" />
            {t('autoFeed')}
          </Badge>
        )}
        <Badge variant="outline" className="bg-background/60 text-[10px] capitalize">
          {t((item.status as 'scheduled' | 'published' | 'draft' | 'approved')) || item.status}
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isInstagram ? (
          <div className="p-4 bg-muted/10">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 text-center">
              {t('preview')}
            </p>
            <InstagramMockup
              item={item}
              handle={profile?.blog_handle || profile?.church_name || undefined}
              avatarUrl={profile?.avatar_url || null}
              lang={lang}
            />
          </div>
        ) : (
          <div className="aspect-square bg-muted/30 border-b border-border flex items-center justify-center overflow-hidden relative">
            {item.slides_data && item.slides_data.length > 0 && item.canvas_template && item.theme_config ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-full transform origin-top-left" style={{ scale: '1' }}>
                   <SlideCanvas 
                     slide={item.slides_data[0] as any} 
                     template={item.canvas_template as CanvasTemplate} 
                     theme={item.theme_config} 
                     bgImageUrl={item.image_url || undefined}
                     lang={lang}
                     aspectRatio="1:1"
                   />
                </div>
              </div>
            ) : item.image_url ? (
              <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <div className="text-center text-muted-foreground">
                <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-xs">{t('noImage')}</p>
              </div>
            )}
          </div>
        )}

        {/* Carousel slides strip */}
        {item.slides_data && item.slides_data.length > 1 && (
          <div className="px-4 pb-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Layers className="h-3 w-3" />
              {lang === 'PT' ? 'Slides do Carrossel' : lang === 'EN' ? 'Carousel Slides' : 'Diapositivas'}
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">
                {item.slides_data.length}
              </Badge>
            </p>
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
              {item.slides_data.map((slide, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/40 border border-border/50">
                  <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    {slide.subtitle && (
                      <p className="text-[10px] text-muted-foreground font-medium truncate mb-0.5">{slide.subtitle}</p>
                    )}
                    <p className="text-xs text-foreground/90 leading-snug line-clamp-2">{slide.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
        {item.slides_data && item.slides_data.length > 1 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Download individually as separate links for each slide image placeholder
              toast.info(lang === 'PT' ? 'Abra o Estúdio para baixar o carrossel completo em JPG' : 'Open Studio to download the full carousel as JPG', { duration: 4000 });
            }}
            className="gap-1.5"
          >
            <Layers className="h-3.5 w-3.5" />
            <span className="truncate">{t('downloadAll')}</span>
          </Button>
        ) : (
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
        )}
        <Button
          size="sm"
          onClick={openInInstagram}
          className="gap-1.5 col-span-1 bg-gradient-to-r from-amber-500 via-rose-500 to-fuchsia-600 text-primary-foreground hover:opacity-90"
        >
          <Instagram className="h-3.5 w-3.5" />
          <span className="truncate">{t('openInsta')}</span>
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
