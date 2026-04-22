import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { NETWORK_META, type NetworkKey } from './NetworkFilterBar';

type L = 'PT' | 'EN' | 'ES';

export interface CalendarItem {
  id: string;
  kind: 'social' | 'editorial';
  network: NetworkKey | null;
  title: string;
  caption: string;
  hashtags: string;
  image_url: string | null;
  scheduled_at: string | null;
  status: string;
  editorial_type?: string;
  auto_generated?: boolean;
  slides_data?: Array<{ text: string; subtitle?: string; slideNumber?: number; totalSlides?: number }> | null;
  slide_count?: number | null;
  topic?: string | null;
  canvas_template?: string | null;
  theme_config?: any | null;
}

const WEEKDAYS: Record<L, string[]> = {
  PT: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  EN: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  ES: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
};

interface Props {
  year: number;
  month: number;
  items: CalendarItem[];
  selectedId: string | null;
  onSelect: (item: CalendarItem) => void;
  lang: L;
}

export function CalendarGrid({ year, month, items, selectedId, onSelect, lang }: Props) {
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysPrev = new Date(year, month, 0).getDate();
  const today = new Date();

  // Build 6x7 grid
  const cells = useMemo(() => {
    const result: { day: number; inMonth: boolean; date: Date }[] = [];
    // Leading from prev month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = daysPrev - i;
      result.push({ day, inMonth: false, date: new Date(year, month - 1, day) });
    }
    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      result.push({ day: d, inMonth: true, date: new Date(year, month, d) });
    }
    // Trailing
    while (result.length % 7 !== 0 || result.length < 42) {
      const offset = result.length - (firstDayOfWeek + daysInMonth);
      const day = offset + 1;
      result.push({ day, inMonth: false, date: new Date(year, month + 1, day) });
      if (result.length >= 42) break;
    }
    return result;
  }, [year, month, firstDayOfWeek, daysInMonth, daysPrev]);

  // Group items by date key
  const itemsByDay = useMemo(() => {
    const map: Record<string, CalendarItem[]> = {};
    items.forEach((it) => {
      if (!it.scheduled_at) return;
      const d = new Date(it.scheduled_at);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(it);
    });
    return map;
  }, [items]);

  return (
    <div className="p-2 sm:p-4">
      {/* Weekdays */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
        {WEEKDAYS[lang].map((d) => (
          <div
            key={d}
            className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground text-center py-1.5"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {cells.map((cell, idx) => {
          const key = `${cell.date.getFullYear()}-${cell.date.getMonth()}-${cell.date.getDate()}`;
          const dayItems = itemsByDay[key] || [];
          const isToday =
            cell.inMonth &&
            cell.date.getDate() === today.getDate() &&
            cell.date.getMonth() === today.getMonth() &&
            cell.date.getFullYear() === today.getFullYear();

          // The first item with an image gets a visual thumbnail cover
          const coverItem = dayItems.find((it) => it.image_url);

          return (
            <div
              key={idx}
              className={cn(
                'relative min-h-[88px] sm:min-h-[110px] rounded-xl border overflow-hidden flex flex-col transition-colors cursor-default',
                cell.inMonth
                  ? 'bg-background border-border hover:bg-muted/30'
                  : 'bg-muted/20 border-transparent',
              )}
            >
              {/* Background thumbnail */}
              {coverItem && cell.inMonth && (
                <div
                  className="absolute inset-0 z-0 opacity-20 hover:opacity-30 transition-opacity"
                  style={{
                    backgroundImage: `url(${coverItem.image_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
              )}

              {/* Day number */}
              <div className="relative z-10 p-1.5 sm:p-2">
                <div
                  className={cn(
                    'flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 text-[11px] sm:text-xs font-semibold rounded-full',
                    isToday
                      ? 'bg-primary text-primary-foreground'
                      : cell.inMonth
                        ? 'text-foreground'
                        : 'text-muted-foreground/50',
                  )}
                >
                  {cell.day}
                </div>
              </div>

              {/* Item pills */}
              <div className="relative z-10 flex-1 flex flex-col gap-1 overflow-hidden px-1.5 pb-1.5">
                {dayItems.slice(0, 3).map((it) => (
                  <ItemPill
                    key={it.id}
                    item={it}
                    selected={selectedId === it.id}
                    onClick={() => onSelect(it)}
                  />
                ))}
                {dayItems.length > 3 && (
                  <button
                    type="button"
                    onClick={() => onSelect(dayItems[3])}
                    className="text-[10px] font-medium text-muted-foreground hover:text-foreground text-left px-1"
                  >
                    +{dayItems.length - 3}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ItemPill({
  item,
  selected,
  onClick,
}: {
  item: CalendarItem;
  selected: boolean;
  onClick: () => void;
}) {
  const editorialKey: 'sermon' | 'blog' =
    item.editorial_type && /sermon|pastoral|sermao|sermão/i.test(item.editorial_type)
      ? 'sermon'
      : 'blog';
  const meta =
    item.kind === 'editorial' ? NETWORK_META[editorialKey] : NETWORK_META[item.network!];
  const Icon = meta.icon;
  const time = item.scheduled_at
    ? new Date(item.scheduled_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    : '';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-lg px-1.5 py-1 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-medium leading-tight transition-all',
        meta.bg,
        meta.color,
        selected ? `ring-2 ${meta.ring} shadow-sm` : 'hover:ring-1 hover:ring-foreground/10',
      )}
      title={item.title}
    >
      <Icon className="h-3 w-3 shrink-0" />
      <span className="truncate flex-1">{item.title}</span>
      {time && <span className="hidden sm:inline opacity-70 shrink-0">{time}</span>}
    </button>
  );
}
