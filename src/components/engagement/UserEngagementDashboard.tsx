// @ts-nocheck
import { useEffect, useState } from 'react';
import { Flame, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

type L = 'PT' | 'EN' | 'ES';

const labels = {
  streak: { PT: 'Sequência', EN: 'Streak', ES: 'Racha' },
  avg: { PT: 'Média', EN: 'Avg', ES: 'Media' },
  min: { PT: 'min', EN: 'min', ES: 'min' },
  days: { PT: 'dias', EN: 'days', ES: 'días' },
};

export function UserEngagementDashboard() {
  const { user } = useAuth();
  const { lang: currentLang } = useLanguage();
  const lang = (currentLang || 'PT') as L;
  const [streak, setStreak] = useState(0);
  const [avgMin, setAvgMin] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('devotional_user_profiles')
      .select('consecutive_days_engaged, average_time_spent')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setStreak(data.consecutive_days_engaged ?? 0);
          setAvgMin(Math.round((data.average_time_spent ?? 0) / 60));
        }
      });
  }, [user]);

  if (!user || (streak === 0 && avgMin === 0)) return null;

  return (
    <div className="flex items-center justify-center gap-6 py-2 text-xs text-muted-foreground">
      {streak > 0 && (
        <span className="flex items-center gap-1">
          <Flame className="h-3.5 w-3.5 text-orange-500" />
          <span className="font-semibold text-foreground">{streak}</span> {labels.days[lang]}
        </span>
      )}
      {avgMin > 0 && (
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 text-blue-500" />
          <span className="font-semibold text-foreground">{avgMin}</span> {labels.min[lang]}
        </span>
      )}
    </div>
  );
}
