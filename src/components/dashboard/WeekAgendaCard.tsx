import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { ChevronRight } from 'lucide-react';

type L = 'PT' | 'EN' | 'ES';

interface AgendaItem {
  id: string;
  title: string;
  scheduled_at: string;
  end_at?: string | null;
}

const L10N = {
  title: { PT: 'AGENDA DA SEMANA', EN: 'WEEK AGENDA', ES: 'AGENDA DE LA SEMANA' },
  viewAll: { PT: 'Ver calendário', EN: 'View calendar', ES: 'Ver calendario' },
  full: { PT: 'Ver agenda completa', EN: 'View full agenda', ES: 'Ver agenda completa' },
  empty: { PT: 'Nada agendado nesta semana.', EN: 'Nothing scheduled this week.', ES: 'Nada agendado esta semana.' },
} satisfies Record<string, Record<L, string>>;

const WEEKDAYS: Record<L, string[]> = {
  PT: ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'],
  EN: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
  ES: ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'],
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatRange(startIso: string, endIso?: string | null): string {
  const start = formatTime(startIso);
  if (!endIso) {
    // Default: 1h30 window — keeps the layout balanced
    const end = new Date(new Date(startIso).getTime() + 90 * 60 * 1000).toISOString();
    return `${start} - ${formatTime(end)}`;
  }
  return `${start} - ${formatTime(endIso)}`;
}

/** Color cycle for the bullet next to each event title (matches mockup). */
const BULLETS = ['bg-violet-500', 'bg-orange-400', 'bg-emerald-500', 'bg-sky-500'];

export function WeekAgendaCard() {
  const { user } = useAuth();
  const { lang: cur } = useLanguage();
  const lang = (cur || 'PT') as L;
  const [items, setItems] = useState<AgendaItem[]>([]);

  useEffect(() => {
    if (!user) return;
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + 7);

    void (async () => {
      const { data } = await supabase
        .from('editorial_queue')
        .select('id, scheduled_at, materials(title)')
        .eq('user_id', user.id)
        .eq('status', 'scheduled')
        .gte('scheduled_at', now.toISOString())
        .lte('scheduled_at', weekEnd.toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(3);

      if (data) {
        setItems(
          data
            .filter((d: any) => d.scheduled_at)
            .map((d: any) => ({
              id: d.id,
              scheduled_at: d.scheduled_at,
              title: d.materials?.title || '—',
            })),
        );
      }
    })();
  }, [user]);

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[11px] font-bold tracking-[0.18em] uppercase text-foreground">
          {L10N.title[lang]}
        </h3>
        <Link
          to="/calendario"
          className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-0.5"
        >
          {L10N.viewAll[lang]} <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">{L10N.empty[lang]}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((it, idx) => {
            const d = new Date(it.scheduled_at);
            const day = d.getDate();
            const wd = WEEKDAYS[lang][d.getDay()];
            const bullet = BULLETS[idx % BULLETS.length];
            return (
              <li key={it.id}>
                <Link
                  to="/calendario"
                  className="group flex items-center gap-3 rounded-xl px-1 -mx-1 py-1 hover:bg-muted/40 transition-colors"
                >
                  {/* Date pill */}
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-muted/60 border border-border flex flex-col items-center justify-center">
                    <span className="text-[9px] font-bold tracking-wider text-muted-foreground leading-none">
                      {wd}
                    </span>
                    <span className="text-base font-bold text-foreground leading-none mt-1">
                      {day}
                    </span>
                  </div>

                  {/* Title + time */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full shrink-0 ${bullet}`} />
                      <p className="text-sm font-semibold text-foreground truncate">
                        {it.title}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 ml-4">
                      {formatRange(it.scheduled_at, it.end_at)}
                    </p>
                  </div>

                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Link
        to="/calendario"
        className="mt-4 w-full h-10 rounded-xl border border-border text-sm font-semibold text-primary hover:bg-primary/5 transition-colors flex items-center justify-center"
      >
        {L10N.full[lang]}
      </Link>
    </section>
  );
}
