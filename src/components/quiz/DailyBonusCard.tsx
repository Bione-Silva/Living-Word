import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Gift, Check } from 'lucide-react';

type L = 'PT' | 'EN' | 'ES';

const XP_PER_DAY = [10, 15, 20, 25, 35, 50, 100];

const labels = {
  title: { PT: '🎁 Bônus Diário', EN: '🎁 Daily Bonus', ES: '🎁 Bono Diario' },
  subtitle: { PT: 'Resgate seu XP hoje!', EN: 'Claim your XP today!', ES: '¡Reclama tu XP hoy!' },
  claim: { PT: 'RESGATAR DIA', EN: 'CLAIM DAY', ES: 'RECLAMAR DÍA' },
  claimed: { PT: '✓ Resgatado hoje', EN: '✓ Claimed today', ES: '✓ Reclamado hoy' },
  success: { PT: 'XP resgatado!', EN: 'XP claimed!', ES: '¡XP reclamado!' },
} satisfies Record<string, Record<L, string>>;

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

interface Props {
  onXpClaimed?: (xp: number) => void;
}

export function DailyBonusCard({ onXpClaimed }: Props) {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [dayCount, setDayCount] = useState(0);
  const [claimedToday, setClaimedToday] = useState(false);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('bonus_last_claimed, bonus_day_count')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (!data) { setLoading(false); return; }
        const last = data.bonus_last_claimed as string | null;
        const count = (data.bonus_day_count as number) || 0;
        const today = todayStr();
        const yesterday = yesterdayStr();

        if (last === today) {
          setDayCount(count);
          setClaimedToday(true);
        } else if (last === yesterday) {
          // streak continues
          setDayCount(Math.min(count, 6)); // next will be count+1, max 7
          setClaimedToday(false);
        } else {
          // streak broken
          setDayCount(0);
          setClaimedToday(false);
        }
        setLoading(false);
      });
  }, [user]);

  const currentDay = claimedToday ? dayCount : dayCount + 1; // 1-indexed day to claim
  const currentXp = XP_PER_DAY[Math.min(currentDay - 1, 6)];

  const handleClaim = async () => {
    if (!user || claimedToday || claiming) return;
    setClaiming(true);
    try {
      const newCount = dayCount + 1;
      const xp = XP_PER_DAY[Math.min(newCount - 1, 6)];

      // Update bonus fields
      await supabase.from('profiles').update({
        bonus_last_claimed: todayStr(),
        bonus_day_count: newCount > 7 ? 1 : newCount,
      }).eq('id', user.id);

      // Update quiz_scores XP
      const { data: existing } = await supabase.from('quiz_scores').select('total_xp, level').eq('user_id', user.id).maybeSingle();
      if (existing) {
        const newXp = existing.total_xp + xp;
        await supabase.from('quiz_scores').update({ total_xp: newXp, level: Math.floor(newXp / 100) + 1 }).eq('user_id', user.id);
      } else {
        await supabase.from('quiz_scores').insert({ user_id: user.id, total_xp: xp, level: 1 });
      }

      setDayCount(newCount > 7 ? 1 : newCount);
      setClaimedToday(true);
      toast.success(`+${xp} XP! ${labels.success[lang]}`);
      onXpClaimed?.(xp);
    } catch {
      toast.error('Erro');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) return null;

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 space-y-4">
      <div className="text-center">
        <h3 className="text-base font-bold text-foreground">{labels.title[lang]}</h3>
        <p className="text-xs text-muted-foreground">{labels.subtitle[lang]}</p>
      </div>

      {/* 7 day circles */}
      <div className="flex items-center justify-between gap-1">
        {XP_PER_DAY.map((xp, i) => {
          const dayNum = i + 1;
          const isClaimed = claimedToday ? dayNum <= dayCount : dayNum <= dayCount;
          const isCurrent = dayNum === currentDay && !claimedToday;
          const isFuture = claimedToday ? dayNum > dayCount : dayNum > currentDay;

          let circleClass = 'border border-border bg-card text-muted-foreground';
          if (isClaimed) circleClass = 'bg-primary text-primary-foreground';
          else if (isCurrent) circleClass = 'border-2 border-primary bg-primary/10 text-primary';

          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${circleClass}`}>
                {isClaimed ? <Check className="h-3.5 w-3.5" /> : dayNum === 7 ? <Gift className="h-3.5 w-3.5" /> : `+${xp}`}
              </div>
              <span className="text-[9px] text-muted-foreground">
                {dayNum === 7 ? '🎁' : `D${dayNum}`}
              </span>
            </div>
          );
        })}
      </div>

      {/* Claim button */}
      <button
        onClick={handleClaim}
        disabled={claimedToday || claiming}
        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {claimedToday
          ? labels.claimed[lang]
          : `${labels.claim[lang]} ${currentDay} (+${currentXp} XP)`}
      </button>
    </div>
  );
}
