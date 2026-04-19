import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Mic, Zap, Calendar, Clock, ArrowRight } from 'lucide-react';
import { PLAN_CREDITS, type PlanSlug } from '@/lib/plans';

type L = 'PT' | 'EN' | 'ES';

const COPY = {
  title: { PT: 'Este mês', EN: 'This month', ES: 'Este mes' } as Record<L, string>,
  sermons: { PT: 'Sermões criados', EN: 'Sermons created', ES: 'Sermones creados' } as Record<L, string>,
  credits: { PT: 'Créditos usados', EN: 'Credits used', ES: 'Créditos usados' } as Record<L, string>,
  next: { PT: 'Próximo evento', EN: 'Next event', ES: 'Próximo evento' } as Record<L, string>,
  noEvent: { PT: 'Nada agendado', EN: 'Nothing scheduled', ES: 'Nada agendado' } as Record<L, string>,
  studyTime: { PT: 'Tempo médio', EN: 'Avg time', ES: 'Tiempo medio' } as Record<L, string>,
  min: { PT: 'min', EN: 'min', ES: 'min' } as Record<L, string>,
  viewAll: { PT: 'Ver detalhes', EN: 'View details', ES: 'Ver detalles' } as Record<L, string>,
};

function startOfMonthISO() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

export function MonthlyOverviewCard() {
  const { user, profile } = useAuth();
  const { lang: cur } = useLanguage();
  const lang = (cur || 'PT') as L;

  const [sermons, setSermons] = useState(0);
  const [avgMin, setAvgMin] = useState(0);
  const [nextEvent, setNextEvent] = useState<{ title: string; when: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    const monthStart = startOfMonthISO();

    void (async () => {
      // Sermons created this month
      const { count } = await supabase
        .from('materials')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('type', ['sermon', 'pastoral'])
        .gte('created_at', monthStart);
      setSermons(count ?? 0);

      // Average study time (devotional engagement)
      const { data: devProfile } = await supabase
        .from('devotional_user_profiles')
        .select('average_time_spent')
        .eq('user_id', user.id)
        .maybeSingle();
      if (devProfile?.average_time_spent) {
        setAvgMin(Math.round((devProfile.average_time_spent ?? 0) / 60));
      }

      // Next scheduled item
      const { data: queue } = await supabase
        .from('editorial_queue')
        .select('scheduled_at, materials(title)')
        .eq('user_id', user.id)
        .eq('status', 'scheduled')
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (queue?.scheduled_at) {
        const dateLocale = lang === 'PT' ? 'pt-BR' : lang === 'ES' ? 'es-ES' : 'en-US';
        const when = new Date(queue.scheduled_at).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const title = (queue as any).materials?.title || '—';
        setNextEvent({ title, when });
      }
    })();
  }, [user, lang]);

  if (!user) return null;

  const userPlan = (profile?.plan as PlanSlug) || 'free';
  const limit = PLAN_CREDITS[userPlan] || 500;
  const used = profile?.generations_used || 0;
  const usedPct = limit > 0 ? Math.min(Math.round((used / limit) * 100), 100) : 0;

  const tiles: Array<{ icon: React.ElementType; label: string; value: string; sub?: string }> = [
    {
      icon: Mic,
      label: COPY.sermons[lang],
      value: String(sermons),
    },
    {
      icon: Zap,
      label: COPY.credits[lang],
      value: used.toLocaleString(),
      sub: `${usedPct}% / ${limit.toLocaleString()}`,
    },
    {
      icon: Calendar,
      label: COPY.next[lang],
      value: nextEvent ? nextEvent.when : COPY.noEvent[lang],
      sub: nextEvent?.title,
    },
    {
      icon: Clock,
      label: COPY.studyTime[lang],
      value: avgMin > 0 ? `${avgMin} ${COPY.min[lang]}` : '—',
    },
  ];

  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-foreground tracking-tight">{COPY.title[lang]}</h3>
        <Link
          to="/upgrade"
          className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
        >
          {COPY.viewAll[lang]} <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <div
              key={t.label}
              className="rounded-xl border border-border/60 bg-background/40 p-3 flex flex-col gap-1.5 min-h-[88px]"
            >
              <div className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-primary/80" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide truncate">
                  {t.label}
                </span>
              </div>
              <p className="text-lg font-bold text-foreground leading-tight truncate">{t.value}</p>
              {t.sub && <p className="text-[10px] text-muted-foreground truncate">{t.sub}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
