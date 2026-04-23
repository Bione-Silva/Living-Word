import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';
import type { CalendarItem } from './CalendarGrid';

type L = 'PT' | 'EN' | 'ES';

interface Props {
  item: CalendarItem;
  handle?: string;
  avatarUrl?: string | null;
  lang: L;
}

const COPY = {
  likes: { PT: 'curtidas', EN: 'likes', ES: 'me gusta' },
  ago: { PT: 'agora', EN: 'just now', ES: 'ahora' },
} satisfies Record<string, Record<L, string>>;

export function InstagramMockup({ item, handle, avatarUrl, lang }: Props) {
  const t = (k: keyof typeof COPY) => COPY[k][lang];
  const username = (handle || 'pastor').replace(/^@/, '').toLowerCase();
  const initial = username.charAt(0).toUpperCase();

  return (
    <div className="rounded-xl overflow-hidden border border-border bg-card max-w-[340px] mx-auto shadow-sm">
      {/* IG Header */}
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 via-rose-500 to-fuchsia-600 p-0.5">
          <div className="h-full w-full rounded-full bg-card flex items-center justify-center overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={username} className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs font-semibold text-foreground">{initial}</span>
            )}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{username}</p>
        </div>
        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Image / Placeholder */}
      <div className="aspect-square bg-gradient-to-br from-muted/40 to-muted flex items-center justify-center overflow-hidden">
        {item.image_url ? (
          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="text-center px-6">
            <p className="font-display text-base text-foreground/80 leading-snug line-clamp-5">
              {item.title}
            </p>
          </div>
        )}
      </div>

      {/* Action bar */}
      <div className="px-3 py-2.5 flex items-center gap-3">
        <Heart className="h-5 w-5 text-foreground" />
        <MessageCircle className="h-5 w-5 text-foreground" />
        <Send className="h-5 w-5 text-foreground" />
        <Bookmark className="h-5 w-5 text-foreground ml-auto" />
      </div>

      {/* Likes + caption */}
      <div className="px-3 pb-3 space-y-1">
        <p className="text-xs font-semibold text-foreground">128 {t('likes')}</p>
        {item.caption && (
          <p className="text-xs text-foreground/90 leading-relaxed line-clamp-3">
            <span className="font-semibold mr-1">{username}</span>
            {item.caption}
          </p>
        )}
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground pt-0.5">
          {t('ago')}
        </p>
      </div>
    </div>
  );
}
