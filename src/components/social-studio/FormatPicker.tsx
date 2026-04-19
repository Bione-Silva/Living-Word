import { Instagram, Music2, Linkedin, MessageCircle, Layers } from 'lucide-react';
import type { AspectRatio } from './AspectRatioSelector';
import type { SlideCount } from './SlideCountPicker';

export type FormatId =
  | 'ig-post'
  | 'ig-story'
  | 'tiktok'
  | 'ig-carousel'
  | 'li-carousel'
  | 'whatsapp';

type L = 'PT' | 'EN' | 'ES';

interface FormatDef {
  id: FormatId;
  icon: React.ElementType;
  channel: Record<L, string>;
  type: Record<L, string>;
  size: string;
  aspectRatio: AspectRatio;
  slideCount: SlideCount;
  group: 'social' | 'carousel' | 'message';
}

const FORMATS: FormatDef[] = [
  {
    id: 'ig-post',
    icon: Instagram,
    channel: { PT: 'Instagram', EN: 'Instagram', ES: 'Instagram' },
    type: { PT: 'Post', EN: 'Post', ES: 'Post' },
    size: '1080 × 1080',
    aspectRatio: '1:1',
    slideCount: 1,
    group: 'social',
  },
  {
    id: 'ig-story',
    icon: Instagram,
    channel: { PT: 'Instagram', EN: 'Instagram', ES: 'Instagram' },
    type: { PT: 'Story', EN: 'Story', ES: 'Story' },
    size: '1080 × 1920',
    aspectRatio: '9:16',
    slideCount: 1,
    group: 'social',
  },
  {
    id: 'tiktok',
    icon: Music2,
    channel: { PT: 'TikTok / Shorts', EN: 'TikTok / Shorts', ES: 'TikTok / Shorts' },
    type: { PT: 'Vertical', EN: 'Vertical', ES: 'Vertical' },
    size: '1080 × 1920',
    aspectRatio: '9:16-tiktok',
    slideCount: 1,
    group: 'social',
  },
  {
    id: 'ig-carousel',
    icon: Instagram,
    channel: { PT: 'Instagram', EN: 'Instagram', ES: 'Instagram' },
    type: { PT: 'Carrossel', EN: 'Carousel', ES: 'Carrusel' },
    size: '1080 × 1080',
    aspectRatio: '1:1',
    slideCount: 5,
    group: 'carousel',
  },
  {
    id: 'li-carousel',
    icon: Linkedin,
    channel: { PT: 'LinkedIn', EN: 'LinkedIn', ES: 'LinkedIn' },
    type: { PT: 'Carrossel', EN: 'Carousel', ES: 'Carrusel' },
    size: '1080 × 1080',
    aspectRatio: '1:1',
    slideCount: 5,
    group: 'carousel',
  },
  {
    id: 'whatsapp',
    icon: MessageCircle,
    channel: { PT: 'WhatsApp', EN: 'WhatsApp', ES: 'WhatsApp' },
    type: { PT: 'Status / Imagem', EN: 'Status / Image', ES: 'Estado / Imagen' },
    size: '1080 × 1080',
    aspectRatio: '1:1',
    slideCount: 1,
    group: 'message',
  },
];

const GROUP_LABELS: Record<'social' | 'carousel' | 'message', Record<L, string>> = {
  social: { PT: 'Redes sociais', EN: 'Social networks', ES: 'Redes sociales' },
  carousel: { PT: 'Carrosséis', EN: 'Carousels', ES: 'Carruseles' },
  message: { PT: 'Mensagens', EN: 'Messaging', ES: 'Mensajes' },
};

export function getFormatById(id: FormatId): FormatDef | undefined {
  return FORMATS.find((f) => f.id === id);
}

export function findFormatByAspect(aspectRatio: AspectRatio, slideCount: SlideCount): FormatId {
  // Match carousel preference when slideCount > 1
  if (slideCount > 1) {
    const carousel = FORMATS.find((f) => f.group === 'carousel' && f.aspectRatio === aspectRatio);
    if (carousel) return carousel.id;
  }
  return FORMATS.find((f) => f.aspectRatio === aspectRatio)?.id ?? 'ig-post';
}

interface Props {
  value: FormatId;
  onChange: (id: FormatId, def: FormatDef) => void;
  lang: L;
}

export function FormatPicker({ value, onChange, lang }: Props) {
  const groups: Array<'social' | 'carousel' | 'message'> = ['social', 'carousel', 'message'];

  return (
    <div className="space-y-4">
      {groups.map((g) => {
        const items = FORMATS.filter((f) => f.group === g);
        return (
          <div key={g} className="space-y-2">
            <div className="flex items-center gap-1.5 px-0.5">
              {g === 'carousel' && <Layers className="h-3 w-3 text-muted-foreground" />}
              <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-muted-foreground">
                {GROUP_LABELS[g][lang]}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {items.map((f) => {
                const Icon = f.icon;
                const active = value === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => onChange(f.id, f)}
                    className={`flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left transition-all ${
                      active
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border bg-card hover:border-primary/30 hover:bg-secondary/40'
                    }`}
                  >
                    <div
                      className={`h-9 w-9 shrink-0 rounded-lg flex items-center justify-center ${
                        active ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-foreground leading-tight">
                        {f.channel[lang]} <span className="text-muted-foreground font-normal">({f.type[lang]})</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">{f.size}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
