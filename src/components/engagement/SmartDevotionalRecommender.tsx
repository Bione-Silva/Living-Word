// @ts-nocheck
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

type L = 'PT' | 'EN' | 'ES';

const labels = {
  title: { PT: 'Recomendado para Você', EN: 'Recommended for You', ES: 'Recomendado para Ti' },
  basedOn: { PT: 'Baseado em sua jornada', EN: 'Based on your journey', ES: 'Basado en tu camino' },
  series: { PT: 'Série dia', EN: 'Series day', ES: 'Serie día' },
  read: { PT: 'Ler agora', EN: 'Read now', ES: 'Leer ahora' },
  loading: { PT: 'Analisando...', EN: 'Analyzing...', ES: 'Analizando...' },
  noData: { PT: 'Continue lendo para receber recomendações personalizadas!', EN: 'Keep reading to get personalized recommendations!', ES: '¡Sigue leyendo para recibir recomendaciones personalizadas!' },
} satisfies Record<string, Record<L, string>>;

interface RecommendationData {
  devotionalId: string | null;
  theme: string;
  reasoning: string;
  seriesInfo: { day: number; totalDays: number } | null;
  topThemes: { theme: string; score: number }[];
}

export function SmartDevotionalRecommender() {
  const { user } = useAuth();
  const { lang: currentLang } = useLanguage();
  const lang = (currentLang || 'PT') as L;
  const navigate = useNavigate();
  const [data, setData] = useState<RecommendationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchRec = async () => {
      try {
        const { data: resp } = await supabase.functions.invoke('recommend-devotional', {
          body: { language: lang },
        });
        if (resp && !resp.error) setData(resp);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchRec();
  }, [user, lang]);

  if (!user) return null;

  if (loading) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center gap-3 py-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">{labels.loading[lang]}</span>
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.topThemes?.length) {
    return (
      <Card className="border-muted bg-muted/30">
        <CardContent className="flex items-center gap-3 py-4">
          <Sparkles className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{labels.noData[lang]}</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate('/devocional')}
    >
      <CardContent className="py-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              {labels.title[lang]}
            </span>
          </div>
          {data.seriesInfo && (
            <Badge variant="secondary" className="text-[10px]">
              {labels.series[lang]} {data.seriesInfo.day}/{data.seriesInfo.totalDays}
            </Badge>
          )}
        </div>

        <p className="text-sm font-medium text-foreground">{data.theme}</p>
        <p className="text-xs text-muted-foreground">{data.reasoning}</p>

        {data.topThemes.length > 1 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {data.topThemes.slice(0, 4).map((t) => (
              <Badge key={t.theme} variant="outline" className="text-[10px]">
                {t.theme}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1.5 pt-1 text-xs text-primary font-medium">
          <BookOpen className="h-3.5 w-3.5" />
          {labels.read[lang]}
        </div>
      </CardContent>
    </Card>
  );
}
