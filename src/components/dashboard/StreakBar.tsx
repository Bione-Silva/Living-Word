import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Flame, Calendar, Trophy, Gamepad2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

type L = 'PT' | 'EN' | 'ES';

const labels = {
  streak: { PT: 'Sequência', EN: 'Streak', ES: 'Racha' },
  days: { PT: 'dias', EN: 'days', ES: 'días' },
  day: { PT: 'dia', EN: 'day', ES: 'día' },
  thisWeek: { PT: 'Esta semana', EN: 'This week', ES: 'Esta semana' },
  keepGoing: { PT: 'Continue assim! 🔥', EN: 'Keep going! 🔥', ES: '¡Sigue así! 🔥' },
  startToday: { PT: 'Comece hoje!', EN: 'Start today!', ES: '¡Empieza hoy!' },
  ranking: { PT: 'no ranking', EN: 'in ranking', ES: 'en ranking' },
  playQuiz: { PT: 'Jogar Quiz', EN: 'Play Quiz', ES: 'Jugar Quiz' },
  ofStreak: { PT: 'de sequência', EN: 'streak', ES: 'de racha' },
  global: { PT: 'global', EN: 'global', ES: 'global' },
} satisfies Record<string, Record<L, string>>;

const WEEKDAY_LABELS: Record<L, string[]> = {
  PT: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'],
  EN: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  ES: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
};

interface WeekDay {
  label: string;
  date: string;
  active: boolean;
  isToday: boolean;
}

function getWeekDays(activeDates: Set<string>, lang: L): WeekDay[] {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const result: WeekDay[] = [];
  const todayStr = now.toISOString().slice(0, 10);

  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - dayOfWeek + i);
    const dateStr = d.toISOString().slice(0, 10);
    result.push({
      label: WEEKDAY_LABELS[lang][i],
      date: dateStr,
      active: activeDates.has(dateStr),
      isToday: dateStr === todayStr,
    });
  }
  return result;
}

function calculateStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const sorted = [...new Set(dates)].sort().reverse();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + 'T12:00:00');
    const curr = new Date(sorted[i] + 'T12:00:00');
    const diffDays = (prev.getTime() - curr.getTime()) / 86400000;
    if (Math.round(diffDays) === 1) streak++;
    else break;
  }
  return streak;
}

export function StreakBar() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [weekDays, setWeekDays] = useState<WeekDay[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
        const { data: logs } = await supabase
          .from('generation_logs')
          .select('created_at')
          .eq('user_id', user.id)
          .gte('created_at', thirtyDaysAgo)
          .order('created_at', { ascending: false });
        const dates = (logs || []).map((l) => l.created_at.slice(0, 10));
        const activeDatesSet = new Set(dates);
        setStreak(calculateStreak(dates));
        setWeekDays(getWeekDays(activeDatesSet, lang));
      } catch {
        setWeekDays(getWeekDays(new Set(), lang));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, lang]);

  if (loading) {
    return (
      <div className="rounded-2xl bg-card p-4 flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-24" />
          <div className="flex gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-8 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Streak + Ranking + Quiz row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Streak pill */}
        <div className="flex items-center gap-2 bg-card rounded-xl px-4 py-2.5 border border-border shadow-sm">
          <Flame className={`h-4 w-4 ${streak > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
          <div>
            <p className="text-sm font-bold text-foreground leading-none">
              🔥 {streak} {streak === 1 ? labels.day[lang] : labels.days[lang]}
            </p>
            <p className="text-[10px] text-muted-foreground">{labels.ofStreak[lang]}</p>
          </div>
        </div>

        {/* Ranking pill */}
        <div className="flex items-center gap-2 bg-card rounded-xl px-4 py-2.5 border border-border shadow-sm">
          <Trophy className="h-4 w-4 text-primary" />
          <div>
            <p className="text-sm font-bold text-foreground leading-none">🏆 #—</p>
            <p className="text-[10px] text-muted-foreground">{labels.ranking[lang]}</p>
          </div>
        </div>

        {/* Quiz button */}
        <Link
          to="/quiz"
          className="flex items-center gap-2 bg-primary/10 text-primary rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-primary/20 transition-colors ml-auto"
        >
          <Gamepad2 className="h-4 w-4" />
          {labels.playQuiz[lang]} →
        </Link>
      </div>

      {/* Week dots card */}
      <div className="rounded-2xl bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">
            {streak > 0 ? labels.keepGoing[lang] : labels.startToday[lang]}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {labels.thisWeek[lang]}
          </div>
        </div>

        <div className="flex justify-between gap-1">
          {weekDays.map((day) => (
            <div key={day.date} className="flex flex-col items-center gap-1 flex-1">
              <span className="text-[10px] text-muted-foreground font-medium">{day.label}</span>
              <div
                className={`
                  h-8 w-full max-w-[36px] rounded-lg flex items-center justify-center text-[11px] font-semibold transition-colors
                  ${day.active
                    ? 'bg-primary text-primary-foreground'
                    : day.isToday
                      ? 'border-2 border-primary/40 text-primary'
                      : 'bg-muted/50 text-muted-foreground/50'
                  }
                `}
              >
                {day.active ? '✓' : day.date.slice(8)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
