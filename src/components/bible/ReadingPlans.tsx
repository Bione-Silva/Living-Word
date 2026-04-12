import { useEffect, useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { BookMarked, CheckCircle2, Calendar, Trophy } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { bibleBooks, getBookName } from '@/lib/bible-data';

type L = 'PT' | 'EN' | 'ES';

const labels = {
  title: { PT: 'Planos de Leitura', EN: 'Reading Plans', ES: 'Planes de Lectura' },
  day: { PT: 'Dia', EN: 'Day', ES: 'Día' },
  markDone: { PT: 'Marcar como lido', EN: 'Mark as read', ES: 'Marcar como leído' },
  done: { PT: 'Lido ✓', EN: 'Read ✓', ES: 'Leído ✓' },
  progress: { PT: 'progresso', EN: 'progress', ES: 'progreso' },
  days: { PT: 'dias', EN: 'days', ES: 'días' },
  today: { PT: 'Hoje', EN: 'Today', ES: 'Hoy' },
  completed: { PT: 'Completo!', EN: 'Completed!', ES: '¡Completo!' },
} satisfies Record<string, Record<L, string>>;

interface PlanDef {
  id: string;
  emoji: string;
  name: Record<L, string>;
  totalDays: number;
}

const planDefs: PlanDef[] = [
  { id: 'bible-30', emoji: '⚡', totalDays: 30, name: { PT: 'Bíblia em 30 dias', EN: 'Bible in 30 days', ES: 'Biblia en 30 días' } },
  { id: 'bible-90', emoji: '📖', totalDays: 90, name: { PT: 'Bíblia em 90 dias', EN: 'Bible in 90 days', ES: 'Biblia en 90 días' } },
  { id: 'bible-365', emoji: '🕊️', totalDays: 365, name: { PT: 'Bíblia em 1 ano', EN: 'Bible in 1 year', ES: 'Biblia en 1 año' } },
];

// Build daily assignments: distribute all 1189 chapters across N days
function buildDailyAssignments(totalDays: number, lang: L): { bookId: string; chapters: number[]; label: string }[] {
  const allChapters: { bookId: string; chapter: number }[] = [];
  bibleBooks.forEach(b => {
    for (let c = 1; c <= b.chapters; c++) {
      allChapters.push({ bookId: b.id, chapter: c });
    }
  });

  const perDay = Math.ceil(allChapters.length / totalDays);
  const days: { bookId: string; chapters: number[]; label: string }[] = [];

  for (let d = 0; d < totalDays; d++) {
    const slice = allChapters.slice(d * perDay, (d + 1) * perDay);
    if (slice.length === 0) break;

    // Group by book for display
    const grouped: Record<string, number[]> = {};
    slice.forEach(s => {
      if (!grouped[s.bookId]) grouped[s.bookId] = [];
      grouped[s.bookId].push(s.chapter);
    });

    const parts = Object.entries(grouped).map(([bookId, chs]) => {
      const name = getBookName(bookId, lang);
      const min = Math.min(...chs);
      const max = Math.max(...chs);
      return min === max ? `${name} ${min}` : `${name} ${min}–${max}`;
    });

    const firstBookId = slice[0].bookId;
    days.push({
      bookId: firstBookId,
      chapters: slice.map(s => s.chapter),
      label: parts.join(', '),
    });
  }

  return days;
}

interface Props {
  onNavigate?: (bookId: string, chapter: number) => void;
}

export function ReadingPlans({ onNavigate }: Props) {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [progress, setProgress] = useState<Record<string, Set<number>>>({});
  const [activePlan, setActivePlan] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(7);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('reading_plan_progress')
      .select('plan_id, day_number')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, Set<number>> = {};
        data.forEach(d => {
          if (!map[d.plan_id]) map[d.plan_id] = new Set();
          map[d.plan_id].add(d.day_number);
        });
        setProgress(map);
      });
  }, [user]);

  const dailyAssignments = useMemo(() => {
    if (!activePlan) return [];
    const plan = planDefs.find(p => p.id === activePlan);
    if (!plan) return [];
    return buildDailyAssignments(plan.totalDays, lang);
  }, [activePlan, lang]);

  const toggleDay = async (planId: string, dayNum: number) => {
    if (!user) return;
    const current = progress[planId] || new Set();
    if (current.has(dayNum)) {
      await (supabase as any).from('reading_plan_progress')
        .delete()
        .eq('user_id', user.id)
        .eq('plan_id', planId)
        .eq('day_number', dayNum);
      current.delete(dayNum);
    } else {
      await (supabase as any).from('reading_plan_progress').insert({
        user_id: user.id,
        plan_id: planId,
        day_number: dayNum,
      });
      current.add(dayNum);
      toast.success(labels.done[lang]);
    }
    setProgress(prev => ({ ...prev, [planId]: new Set(current) }));
  };

  // Find next unread day for the active plan
  const nextUnreadDay = useMemo(() => {
    if (!activePlan) return 1;
    const done = progress[activePlan] || new Set();
    for (let i = 1; i <= dailyAssignments.length; i++) {
      if (!done.has(i)) return i;
    }
    return dailyAssignments.length;
  }, [activePlan, progress, dailyAssignments]);

  // Auto-scroll visible range to show the next unread day
  useEffect(() => {
    if (activePlan) {
      setVisibleCount(Math.max(7, nextUnreadDay + 3));
    }
  }, [activePlan, nextUnreadDay]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <BookMarked className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">{labels.title[lang]}</h3>
      </div>

      {/* Plan selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {planDefs.map(p => {
          const done = progress[p.id]?.size || 0;
          const pct = Math.round((done / p.totalDays) * 100);
          return (
            <button
              key={p.id}
              onClick={() => { setActivePlan(activePlan === p.id ? null : p.id); setVisibleCount(7); }}
              className={`shrink-0 flex flex-col items-center gap-1 px-4 py-3 rounded-xl border transition-all ${
                activePlan === p.id
                  ? 'bg-primary/10 border-primary/50'
                  : 'bg-card border-border hover:border-primary/30'
              }`}
            >
              <span className="text-xl">{p.emoji}</span>
              <span className="text-[10px] font-semibold text-foreground whitespace-nowrap">{p.name[lang]}</span>
              <span className="text-[9px] text-muted-foreground">{pct}% · {done}/{p.totalDays} {labels.days[lang]}</span>
            </button>
          );
        })}
      </div>

      {/* Active plan days */}
      {activePlan && (() => {
        const plan = planDefs.find(p => p.id === activePlan)!;
        const done = progress[plan.id] || new Set();
        const pct = Math.round((done.size / plan.totalDays) * 100);
        const isComplete = done.size >= plan.totalDays;

        return (
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">{plan.name[lang]}</span>
              <div className="flex items-center gap-2">
                {isComplete && <Trophy className="h-3.5 w-3.5 text-yellow-500" />}
                <span className="text-[10px] text-muted-foreground">{done.size}/{plan.totalDays}</span>
              </div>
            </div>
            <Progress value={pct} className="h-2" />

            <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-1">
              {dailyAssignments.slice(0, visibleCount).map((day, i) => {
                const dayNum = i + 1;
                const isDone = done.has(dayNum);
                const isToday = dayNum === nextUnreadDay && !isComplete;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isToday ? 'bg-primary/10 ring-1 ring-primary/30' : isDone ? 'bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                  >
                    <button
                      onClick={() => toggleDay(plan.id, dayNum)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isDone
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {isDone && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </button>
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => onNavigate?.(day.bookId, day.chapters[0])}
                    >
                      <p className={`text-xs font-medium ${isDone ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                        {isToday && <span className="text-primary font-bold mr-1">▸ {labels.today[lang]}:</span>}
                        {labels.day[lang]} {dayNum}: {day.label}
                      </p>
                    </div>
                    {isToday && <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />}
                  </div>
                );
              })}
            </div>

            {visibleCount < dailyAssignments.length && (
              <button
                onClick={() => setVisibleCount(prev => Math.min(prev + 14, dailyAssignments.length))}
                className="w-full text-center text-xs text-primary hover:underline py-1"
              >
                {lang === 'PT' ? 'Ver mais dias...' : lang === 'EN' ? 'Show more days...' : 'Ver más días...'}
              </button>
            )}

            {isComplete && (
              <div className="text-center py-2">
                <span className="text-sm font-bold text-primary">🎉 {labels.completed[lang]}</span>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
