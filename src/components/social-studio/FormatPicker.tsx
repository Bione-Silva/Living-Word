import { Instagram, Music2, Linkedin, MessageCircle, Layers, Facebook, Eye, Check } from 'lucide-react';
import type { AspectRatio } from './AspectRatioSelector';
import type { SlideCount } from './SlideCountPicker';

export type FormatId =
  | 'ig-post'
  | 'ig-story'
  | 'tiktok'
  | 'fb-post'
  | 'ig-carousel'
  | 'li-carousel'
  | 'tiktok-carousel'
  | 'whatsapp';

type L = 'PT' | 'EN' | 'ES';

export interface FormatDef {
  id: FormatId;
  icon: React.ElementType;
  channel: Record<L, string>;
  type: Record<L, string>;
  size: string;
  /** Pixel dimensions for export */
  width: number;
  height: number;
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
    width: 1080,
    height: 1080,
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
    width: 1080,
    height: 1920,
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
    width: 1080,
    height: 1920,
    aspectRatio: '9:16-tiktok',
    slideCount: 1,
    group: 'social',
  },
  {
    id: 'fb-post',
    icon: Facebook,
    channel: { PT: 'Facebook', EN: 'Facebook', ES: 'Facebook' },
    type: { PT: 'Post', EN: 'Post', ES: 'Post' },
    size: '1200 × 630',
    width: 1200,
    height: 630,
    aspectRatio: '1.91:1',
    slideCount: 1,
    group: 'social',
  },
  {
    id: 'ig-carousel',
    icon: Instagram,
    channel: { PT: 'Instagram', EN: 'Instagram', ES: 'Instagram' },
    type: { PT: 'Carrossel', EN: 'Carousel', ES: 'Carrusel' },
    size: '1080 × 1080',
    width: 1080,
    height: 1080,
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
    width: 1080,
    height: 1080,
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
    width: 1080,
    height: 1080,
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

const HINT: Record<L, { multi: string; preview: string; previewing: string }> = {
  PT: {
    multi: 'Marque vários destinos. A IA gera para todos.',
    preview: 'Ver preview',
    previewing: 'No preview',
  },
  EN: {
    multi: 'Pick multiple destinations. AI generates for all.',
    preview: 'Preview',
    previewing: 'In preview',
  },
  ES: {
    multi: 'Marca varios destinos. La IA genera para todos.',
    preview: 'Vista',
    previewing: 'En vista',
  },
};

export function getFormatById(id: FormatId): FormatDef | undefined {
  return FORMATS.find((f) => f.id === id);
}

export function getAllFormats(): FormatDef[] {
  return FORMATS;
}

export function findFormatByAspect(aspectRatio: AspectRatio, slideCount: SlideCount): FormatId {
  if (slideCount > 1) {
    const carousel = FORMATS.find((f) => f.group === 'carousel' && f.aspectRatio === aspectRatio);
    if (carousel) return carousel.id;
  }
  return FORMATS.find((f) => f.aspectRatio === aspectRatio)?.id ?? 'ig-post';
}

interface Props {
  /** Active format = drives center preview */
  value: FormatId;
  /** All selected destinations (multi-select). Must always include `value`. */
  selected: FormatId[];
  /** Toggle a destination on/off. */
  onToggle: (id: FormatId) => void;
  /** Set the active format (preview). Also adds it to selected if absent. */
  onSetActive: (id: FormatId, def: FormatDef) => void;
  lang: L;
}

export function FormatPicker({ value, selected, onToggle, onSetActive, lang }: Props) {
  const groups: Array<'social' | 'carousel' | 'message'> = ['social', 'carousel', 'message'];
  const hint = HINT[lang];
  const selectedSet = new Set(selected);

  return (
    <div className="space-y-3.5">
      <p className="text-[11px] text-muted-foreground leading-snug px-0.5">{hint.multi}</p>

      {groups.map((g) => {
        const items = FORMATS.filter((f) => f.group === g);
        return (
          <div key={g} className="space-y-1.5">
            <div className="flex items-center gap-1 px-0.5">
              {g === 'carousel' && <Layers className="h-3 w-3 text-muted-foreground" />}
              <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
                {GROUP_LABELS[g][lang]}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {items.map((f) => {
                const Icon = f.icon;
                const isActive = value === f.id;
                const isSelected = selectedSet.has(f.id);
                return (
                  <div
                    key={f.id}
                    className={`group flex items-stretch rounded-lg border transition-all ${
                      isActive
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : isSelected
                          ? 'border-primary/40 bg-primary/[0.02]'
                          : 'border-border bg-card hover:border-primary/30'
                    }`}
                  >
                    {/* Checkbox area — toggles destination on/off */}
                    <button
                      type="button"
                      onClick={() => onToggle(f.id)}
                      aria-label={`Toggle ${f.channel[lang]}`}
                      className="flex items-center pl-2 pr-1.5"
                    >
                      <span
                        className={`h-4 w-4 rounded border-2 flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-primary border-primary'
                            : 'border-muted-foreground/40 group-hover:border-primary/50'
                        }`}
                      >
                        {isSelected && <Check className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={4} />}
                      </span>
                    </button>

                    {/* Main label area — sets active (preview) */}
                    <button
                      type="button"
                      onClick={() => onSetActive(f.id, f)}
                      className="flex items-center gap-2 py-2 pr-2 text-left flex-1 min-w-0"
                      title={isActive ? hint.previewing : hint.preview}
                    >
                      <div
                        className={`h-7 w-7 shrink-0 rounded-md flex items-center justify-center ${
                          isActive ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[12px] font-semibold text-foreground leading-tight">
                          {f.channel[lang]}
                          <span className="text-muted-foreground font-normal ml-1">({f.type[lang]})</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{f.size}</div>
                      </div>
                      {isActive && (
                        <Eye className="h-3 w-3 text-primary shrink-0" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
