import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type L = 'PT' | 'EN' | 'ES';

const streakLabels: Record<L, { suffix: string }> = {
  PT: { suffix: 'dias seguidos' },
  EN: { suffix: 'day streak' },
  ES: { suffix: 'días seguidos' },
};

function getTimeGreeting(lang: L): string {
  const h = new Date().getHours();
  if (h < 12) return lang === 'PT' ? 'Bom dia' : lang === 'EN' ? 'Good morning' : 'Buenos días';
  if (h < 18) return lang === 'PT' ? 'Boa tarde' : lang === 'EN' ? 'Good afternoon' : 'Buenas tardes';
  return lang === 'PT' ? 'Boa noite' : lang === 'EN' ? 'Good evening' : 'Buenas noches';
}

export function DashboardGreeting() {
  const { profile, user } = useAuth();
  const { lang } = useLanguage();
  const name = profile?.full_name?.split(' ')[0] || (lang === 'PT' ? 'Amigo' : lang === 'EN' ? 'Friend' : 'Amigo');
  const [streak, setStreak] = useState<number>(0);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('devotional_user_profiles')
      .select('consecutive_days_engaged')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setStreak(data?.consecutive_days_engaged ?? 0);
      });
  }, [user]);

  const subtitle = lang === 'PT'
    ? 'Que tal ouvir a Palavra de Deus e espalhar esperança hoje?'
    : lang === 'EN'
    ? 'How about hearing the Word of God and spreading hope today?'
    : '¿Qué tal escuchar la Palabra de Dios y esparcir esperanza hoy?';

  const StreakBadge = (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium whitespace-nowrap">
      <Flame className="h-3.5 w-3.5" />
      {streak} {streakLabels[lang].suffix}
    </span>
  );

  return (
    <div className="px-1 space-y-1.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="font-display text-2xl md:text-[1.9rem] font-bold text-foreground leading-tight">
          {getTimeGreeting(lang)}, <span className="text-primary">{name}</span>! 👋
        </h1>
        {/* Desktop: badge inline */}
        <span className="hidden md:inline-flex">{StreakBadge}</span>
      </div>
      {/* Mobile: badge below greeting */}
      <div className="md:hidden">{StreakBadge}</div>
      <p className="text-sm text-muted-foreground leading-snug max-w-2xl">
        {subtitle}
      </p>
    </div>
  );
}
