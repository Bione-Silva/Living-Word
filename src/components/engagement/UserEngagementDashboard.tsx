import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Flame, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

type L = 'PT' | 'EN' | 'ES';

const labels = {
  title: { PT: 'Seus Temas Favoritos', EN: 'Your Top Themes', ES: 'Tus Temas Favoritos' },
  streak: { PT: 'Sequência', EN: 'Streak', ES: 'Racha' },
  avgTime: { PT: 'Média', EN: 'Avg', ES: 'Media' },
  min: { PT: 'min', EN: 'min', ES: 'min' },
  days: { PT: 'dias', EN: 'days', ES: 'días' },
  noData: { PT: 'Comece a ler devocionais para ver insights!', EN: 'Start reading devotionals to see insights!', ES: '¡Empieza a leer devocionales para ver insights!' },
};

const THEME_COLORS = [
  'bg-primary/15 text-primary',
  'bg-accent/20 text-accent-foreground',
  'bg-muted text-muted-foreground',
  'bg-secondary text-secondary-foreground',
  'bg-primary/10 text-primary/80',
];

interface ProfileData {
  favorite_themes: string[];
  consecutive_days_engaged: number;
  average_time_spent: number;
}

export function UserEngagementDashboard() {
  const { user } = useAuth();
  const { lang: currentLang } = useLanguage();
  const lang = (currentLang || 'PT') as L;
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [topThemes, setTopThemes] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: p } = await supabase
        .from('devotional_user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (p) setProfile(p as ProfileData);

      const { data: engagements } = await supabase
        .from('devotional_engagements')
        .select('theme')
        .eq('user_id', user.id)
        .not('theme', 'is', null);

      if (engagements) {
        const counts: Record<string, number> = {};
        for (const e of engagements) {
          if (e.theme) counts[e.theme] = (counts[e.theme] || 0) + 1;
        }
        setTopThemes(
          Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }))
        );
      }
    };
    load();
  }, [user]);

  if (!user) return null;

  const hasData = profile || topThemes.length > 0;
  if (!hasData) {
    return (
      <Card className="border-muted">
        <CardContent className="py-5 text-center text-sm text-muted-foreground">
          <Brain className="h-6 w-6 mx-auto mb-1.5 text-muted-foreground/50" />
          {labels.noData[lang]}
        </CardContent>
      </Card>
    );
  }

  const streakDays = profile?.consecutive_days_engaged || 0;
  const avgMin = Math.round((profile?.average_time_spent || 0) / 60);

  return (
    <Card className="border-muted">
      <CardContent className="py-4 space-y-3">
        {/* Header row: title + compact stats */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <Brain className="h-4 w-4 text-primary" />
            {labels.title[lang]}
          </h3>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {streakDays > 0 && (
              <span className="flex items-center gap-1">
                <Flame className="h-3.5 w-3.5 text-orange-500" />
                {streakDays} {labels.days[lang]}
              </span>
            )}
            {avgMin > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-blue-500" />
                {avgMin} {labels.min[lang]}
              </span>
            )}
          </div>
        </div>

        {/* Theme badges */}
        {topThemes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {topThemes.map((t, i) => (
              <Badge
                key={t.name}
                variant="secondary"
                className={`text-xs font-medium px-2.5 py-1 ${THEME_COLORS[i % THEME_COLORS.length]}`}
              >
                {t.name}
                <span className="ml-1 opacity-60">×{t.count}</span>
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
