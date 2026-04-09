import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Brain, Flame, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

type L = 'PT' | 'EN' | 'ES';

const labels = {
  title: { PT: 'Seu Dashboard de Engajamento', EN: 'Your Engagement Dashboard', ES: 'Tu Panel de Engagement' },
  themes: { PT: 'Seus Temas de 2025', EN: 'Your 2025 Themes', ES: 'Tus Temas de 2025' },
  insights: { PT: 'Como a IA te conhece', EN: 'How AI knows you', ES: 'Cómo la IA te conoce' },
  streak: { PT: 'Dias consecutivos', EN: 'Consecutive days', ES: 'Días consecutivos' },
  avgTime: { PT: 'Tempo médio', EN: 'Average time', ES: 'Tiempo promedio' },
  minutes: { PT: 'min', EN: 'min', ES: 'min' },
  trending: { PT: 'Tendências', EN: 'Trending', ES: 'Tendencias' },
  noData: { PT: 'Comece a ler devocionais para ver insights!', EN: 'Start reading devotionals to see insights!', ES: '¡Empieza a leer devocionales para ver insights!' },
} satisfies Record<string, Record<L, string>>;

const CHART_COLORS = [
  'hsl(38, 70%, 55%)',
  'hsl(38, 60%, 65%)',
  'hsl(38, 50%, 72%)',
  'hsl(38, 40%, 78%)',
  'hsl(38, 30%, 82%)',
];

interface ProfileData {
  favorite_themes: string[];
  consecutive_days_engaged: number;
  average_time_spent: number;
  last_devotional_theme: string | null;
}

interface TrendingData {
  topics: string[];
  reason: string;
  sentimentCounts: { positive: number; negative: number; mixed: number };
  totalEngagements: number;
}

export function UserEngagementDashboard() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const lang = (language || 'PT') as L;
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [trending, setTrending] = useState<TrendingData | null>(null);
  const [themeStats, setThemeStats] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      // Load profile
      const { data: p } = await supabase
        .from('devotional_user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (p) setProfile(p as ProfileData);

      // Load trending
      try {
        const { data: t } = await supabase.functions.invoke('trending-topics', { body: {} });
        if (t && !t.error) setTrending(t);
      } catch { /* silent */ }

      // Load theme stats from engagements
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
        const sorted = Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => ({ name, count }));
        setThemeStats(sorted);
      }
    };

    load();
  }, [user]);

  if (!user) return null;

  const hasData = profile || themeStats.length > 0;

  if (!hasData) {
    return (
      <Card className="border-muted">
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          <Brain className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          {labels.noData[lang]}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
        <Brain className="h-5 w-5 text-primary" />
        {labels.title[lang]}
      </h2>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-muted">
          <CardContent className="py-4 text-center">
            <Flame className="h-5 w-5 mx-auto mb-1 text-orange-500" />
            <p className="text-2xl font-bold text-foreground">{profile?.consecutive_days_engaged || 0}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{labels.streak[lang]}</p>
          </CardContent>
        </Card>
        <Card className="border-muted">
          <CardContent className="py-4 text-center">
            <Clock className="h-5 w-5 mx-auto mb-1 text-blue-500" />
            <p className="text-2xl font-bold text-foreground">
              {Math.round((profile?.average_time_spent || 0) / 60)}
              <span className="text-sm font-normal text-muted-foreground ml-1">{labels.minutes[lang]}</span>
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{labels.avgTime[lang]}</p>
          </CardContent>
        </Card>
      </div>

      {/* Theme chart */}
      {themeStats.length > 0 && (
        <Card className="border-muted">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">{labels.themes[lang]}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={themeStats} layout="vertical" margin={{ left: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {themeStats.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Trending topics */}
      {trending && trending.topics.length > 0 && (
        <Card className="border-muted">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              {labels.trending[lang]}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {trending.topics.map((t) => (
                <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{trending.reason}</p>
          </CardContent>
        </Card>
      )}

      {/* AI insights */}
      {profile && profile.favorite_themes.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Sparkle className="h-4 w-4" />
              {labels.insights[lang]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {profile.favorite_themes.slice(0, 8).map((t) => (
                <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Sparkle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" />
    </svg>
  );
}
