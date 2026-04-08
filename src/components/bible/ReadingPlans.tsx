import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { BookMarked, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

type L = 'PT' | 'EN' | 'ES';

const labels = {
  title: { PT: 'Planos de Leitura', EN: 'Reading Plans', ES: 'Planes de Lectura' },
  day: { PT: 'Dia', EN: 'Day', ES: 'Día' },
  markDone: { PT: 'Marcar como lido', EN: 'Mark as read', ES: 'Marcar como leído' },
  done: { PT: 'Lido ✓', EN: 'Read ✓', ES: 'Leído ✓' },
  progress: { PT: 'progresso', EN: 'progress', ES: 'progreso' },
} satisfies Record<string, Record<L, string>>;

interface PlanDef {
  id: string;
  emoji: string;
  name: Record<L, string>;
  days: { ref: string; label: Record<L, string> }[];
}

const plans: PlanDef[] = [
  {
    id: 'psalms-7', emoji: '🕊️',
    name: { PT: 'Salmos em 7 dias', EN: 'Psalms in 7 days', ES: 'Salmos en 7 días' },
    days: [
      { ref: 'Psalms 1-5', label: { PT: 'Salmos 1–5', EN: 'Psalms 1–5', ES: 'Salmos 1–5' } },
      { ref: 'Psalms 23-27', label: { PT: 'Salmos 23–27', EN: 'Psalms 23–27', ES: 'Salmos 23–27' } },
      { ref: 'Psalms 37-41', label: { PT: 'Salmos 37–41', EN: 'Psalms 37–41', ES: 'Salmos 37–41' } },
      { ref: 'Psalms 51-55', label: { PT: 'Salmos 51–55', EN: 'Psalms 51–55', ES: 'Salmos 51–55' } },
      { ref: 'Psalms 90-95', label: { PT: 'Salmos 90–95', EN: 'Psalms 90–95', ES: 'Salmos 90–95' } },
      { ref: 'Psalms 103-107', label: { PT: 'Salmos 103–107', EN: 'Psalms 103–107', ES: 'Salmos 103–107' } },
      { ref: 'Psalms 145-150', label: { PT: 'Salmos 145–150', EN: 'Psalms 145–150', ES: 'Salmos 145–150' } },
    ],
  },
  {
    id: 'gospel-john-7', emoji: '✝️',
    name: { PT: 'João em 7 dias', EN: 'John in 7 days', ES: 'Juan en 7 días' },
    days: [
      { ref: 'John 1-3', label: { PT: 'João 1–3', EN: 'John 1–3', ES: 'Juan 1–3' } },
      { ref: 'John 4-6', label: { PT: 'João 4–6', EN: 'John 4–6', ES: 'Juan 4–6' } },
      { ref: 'John 7-9', label: { PT: 'João 7–9', EN: 'John 7–9', ES: 'Juan 7–9' } },
      { ref: 'John 10-12', label: { PT: 'João 10–12', EN: 'John 10–12', ES: 'Juan 10–12' } },
      { ref: 'John 13-15', label: { PT: 'João 13–15', EN: 'John 13–15', ES: 'Juan 13–15' } },
      { ref: 'John 16-18', label: { PT: 'João 16–18', EN: 'John 16–18', ES: 'Juan 16–18' } },
      { ref: 'John 19-21', label: { PT: 'João 19–21', EN: 'John 19–21', ES: 'Juan 19–21' } },
    ],
  },
  {
    id: 'proverbs-7', emoji: '📖',
    name: { PT: 'Provérbios em 7 dias', EN: 'Proverbs in 7 days', ES: 'Proverbios en 7 días' },
    days: [
      { ref: 'Proverbs 1-4', label: { PT: 'Provérbios 1–4', EN: 'Proverbs 1–4', ES: 'Proverbios 1–4' } },
      { ref: 'Proverbs 5-8', label: { PT: 'Provérbios 5–8', EN: 'Proverbs 5–8', ES: 'Proverbios 5–8' } },
      { ref: 'Proverbs 9-12', label: { PT: 'Provérbios 9–12', EN: 'Proverbs 9–12', ES: 'Proverbios 9–12' } },
      { ref: 'Proverbs 13-16', label: { PT: 'Provérbios 13–16', EN: 'Proverbs 13–16', ES: 'Proverbios 13–16' } },
      { ref: 'Proverbs 17-21', label: { PT: 'Provérbios 17–21', EN: 'Proverbs 17–21', ES: 'Proverbios 17–21' } },
      { ref: 'Proverbs 22-26', label: { PT: 'Provérbios 22–26', EN: 'Proverbs 22–26', ES: 'Proverbios 22–26' } },
      { ref: 'Proverbs 27-31', label: { PT: 'Provérbios 27–31', EN: 'Proverbs 27–31', ES: 'Proverbios 27–31' } },
    ],
  },
];

interface Props {
  onNavigate?: (bookId: string, chapter: number) => void;
}

export function ReadingPlans({ onNavigate }: Props) {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [progress, setProgress] = useState<Record<string, Set<number>>>({});
  const [activePlan, setActivePlan] = useState<string | null>(null);

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

  const toggleDay = async (planId: string, dayNum: number) => {
    if (!user) return;
    const current = progress[planId] || new Set();
    if (current.has(dayNum)) {
      await supabase.from('reading_plan_progress')
        .delete()
        .eq('user_id', user.id)
        .eq('plan_id', planId)
        .eq('day_number', dayNum);
      current.delete(dayNum);
    } else {
      await supabase.from('reading_plan_progress').insert({
        user_id: user.id,
        plan_id: planId,
        day_number: dayNum,
      });
      current.add(dayNum);
      toast.success(labels.done[lang]);
    }
    setProgress(prev => ({ ...prev, [planId]: new Set(current) }));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <BookMarked className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">{labels.title[lang]}</h3>
      </div>

      {/* Plan selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {plans.map(p => {
          const done = progress[p.id]?.size || 0;
          const total = p.days.length;
          const pct = Math.round((done / total) * 100);
          return (
            <button
              key={p.id}
              onClick={() => setActivePlan(activePlan === p.id ? null : p.id)}
              className={`shrink-0 flex flex-col items-center gap-1 px-4 py-3 rounded-xl border transition-all ${
                activePlan === p.id
                  ? 'bg-primary/10 border-primary/50'
                  : 'bg-card border-border hover:border-primary/30'
              }`}
            >
              <span className="text-xl">{p.emoji}</span>
              <span className="text-[10px] font-semibold text-foreground whitespace-nowrap">{p.name[lang]}</span>
              <span className="text-[9px] text-muted-foreground">{pct}% {labels.progress[lang]}</span>
            </button>
          );
        })}
      </div>

      {/* Active plan days */}
      {activePlan && (() => {
        const plan = plans.find(p => p.id === activePlan)!;
        const done = progress[plan.id] || new Set();
        const pct = Math.round((done.size / plan.days.length) * 100);

        return (
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">{plan.name[lang]}</span>
              <span className="text-[10px] text-muted-foreground">{done.size}/{plan.days.length}</span>
            </div>
            <Progress value={pct} className="h-2" />

            <div className="space-y-1.5">
              {plan.days.map((day, i) => {
                const isDone = done.has(i + 1);
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isDone ? 'bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                  >
                    <button
                      onClick={() => toggleDay(plan.id, i + 1)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isDone
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {isDone && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium ${isDone ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                        {labels.day[lang]} {i + 1}: {day.label[lang]}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
