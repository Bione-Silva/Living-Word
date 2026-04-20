import { Instagram, Facebook, Linkedin, Youtube, Mic, PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';

type L = 'PT' | 'EN' | 'ES';

export type NetworkKey = 'instagram' | 'facebook' | 'x' | 'linkedin' | 'tiktok' | 'youtube';
export type EditorialKey = 'sermon' | 'blog';
export type FilterKey = NetworkKey | EditorialKey;

export const NETWORK_META: Record<
  FilterKey,
  { label: string; icon: React.ElementType; color: string; bg: string; ring: string; dot: string }
> = {
  instagram: {
    label: 'Instagram',
    icon: Instagram,
    color: 'text-pink-600',
    bg: 'bg-gradient-to-br from-pink-500/10 via-fuchsia-500/10 to-orange-400/10',
    ring: 'ring-pink-500/30',
    dot: 'bg-pink-500',
  },
  facebook: {
    label: 'Facebook',
    icon: Facebook,
    color: 'text-blue-600',
    bg: 'bg-blue-500/10',
    ring: 'ring-blue-500/30',
    dot: 'bg-blue-500',
  },
  x: {
    label: 'X / Twitter',
    icon: XIcon,
    color: 'text-foreground',
    bg: 'bg-foreground/5',
    ring: 'ring-foreground/30',
    dot: 'bg-foreground',
  },
  linkedin: {
    label: 'LinkedIn',
    icon: Linkedin,
    color: 'text-sky-700',
    bg: 'bg-sky-500/10',
    ring: 'ring-sky-500/30',
    dot: 'bg-sky-600',
  },
  tiktok: {
    label: 'TikTok',
    icon: TikTokIcon,
    color: 'text-foreground',
    bg: 'bg-foreground/5',
    ring: 'ring-foreground/30',
    dot: 'bg-foreground',
  },
  youtube: {
    label: 'YouTube',
    icon: Youtube,
    color: 'text-red-600',
    bg: 'bg-red-500/10',
    ring: 'ring-red-500/30',
    dot: 'bg-red-500',
  },
  sermon: {
    label: 'Sermons',
    icon: Mic,
    color: 'text-emerald-700',
    bg: 'bg-emerald-500/10',
    ring: 'ring-emerald-500/30',
    dot: 'bg-emerald-500',
  },
  blog: {
    label: 'Blog',
    icon: PenLine,
    color: 'text-violet-700',
    bg: 'bg-violet-500/10',
    ring: 'ring-violet-500/30',
    dot: 'bg-violet-500',
  },
};

const SERMON_LABEL: Record<L, string> = {
  PT: 'Sermões',
  EN: 'Sermons',
  ES: 'Sermones',
};
const BLOG_LABEL: Record<L, string> = {
  PT: 'Blog & Artigos',
  EN: 'Blog & Articles',
  ES: 'Blog y Artículos',
};

interface Props {
  active: Set<FilterKey>;
  onToggle: (key: FilterKey) => void;
  lang: L;
}

export function NetworkFilterBar({ active, onToggle, lang }: Props) {
  const keys: FilterKey[] = [
    'instagram',
    'facebook',
    'x',
    'linkedin',
    'tiktok',
    'youtube',
    'sermon',
    'blog',
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
      {keys.map((k) => {
        const meta = NETWORK_META[k];
        const Icon = meta.icon;
        const isActive = active.has(k);
        const label = k === 'editorial' ? EDITORIAL_LABEL[lang] : meta.label;
        return (
          <button
            key={k}
            type="button"
            onClick={() => onToggle(k)}
            className={cn(
              'shrink-0 inline-flex items-center gap-2 h-9 px-3.5 rounded-full text-sm font-medium border transition-all',
              isActive
                ? `${meta.bg} ${meta.color} border-transparent ring-1 ${meta.ring}`
                : 'bg-card text-muted-foreground border-border hover:border-foreground/20 hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.41a8.16 8.16 0 0 0 4.77 1.52V6.49a4.85 4.85 0 0 1-1.84-.2z" />
    </svg>
  );
}
