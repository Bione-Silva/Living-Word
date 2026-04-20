import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, ChevronRight } from 'lucide-react';

type L = 'PT' | 'EN' | 'ES';

interface AgendaItem {
  id: string;
  title: string;
  scheduled_at: string;
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
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

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
        .limit(4);

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
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-foreground inline-flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-primary" /> {L10N.title[lang]}
        </p>
        <Link
          to="/calendario"
          className="text-[10px] font-semibold text-primary hover:underline inline-flex items-center gap-0.5"
        >
          {L10N.viewAll[lang]} <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">{L10N.empty[lang]}</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((it) => {
            const d = new Date(it.scheduled_at);
            const day = d.getDate();
            const wd = WEEKDAYS[lang][d.getDay()];
            return (
              <li key={it.id} className="flex items-center gap-3">
                <div className="shrink-0 w-11 h-11 rounded-lg bg-primary/10 flex flex-col items-center justify-center">
                  <span className="text-[8px] font-bold tracking-wider text-primary leading-none">{wd}</span>
                  <span className="text-sm font-bold text-primary leading-none mt-0.5">{day}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{it.title}</p>
                  <p className="text-[10px] text-muted-foreground">{formatTime(it.scheduled_at)}</p>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </li>
            );
          })}
        </ul>
      )}

      <Link
        to="/calendario"
        className="mt-3 w-full h-9 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors flex items-center justify-center"
      >
        {L10N.full[lang]}
      </Link>
    </section>
  );
}
