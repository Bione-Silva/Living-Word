import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Receipt } from 'lucide-react';
import { TOOL_CREDITS } from '@/lib/plans';

type L = 'PT' | 'EN' | 'ES';

interface UsageEntry {
  id: string;
  feature: string;
  total_tokens: number;
  cost_usd: number;
  created_at: string;
  model: string;
}

const FEATURE_LABELS: Record<string, Record<L, string>> = {
  studio: { PT: 'Sermão', EN: 'Sermon', ES: 'Sermón' },
  'biblical-study': { PT: 'Estudo Bíblico', EN: 'Bible Study', ES: 'Estudio Bíblico' },
  'free-article': { PT: 'Artigo de Blog', EN: 'Blog Article', ES: 'Artículo de Blog' },
  'free-article-universal': { PT: 'Artigo Universal', EN: 'Universal Article', ES: 'Artículo Universal' },
  'title-gen': { PT: 'Títulos Criativos', EN: 'Creative Titles', ES: 'Títulos Creativos' },
  'topic-explorer': { PT: 'Explorador de Temas', EN: 'Topic Explorer', ES: 'Explorador de Temas' },
  'verse-finder': { PT: 'Busca de Versículos', EN: 'Verse Finder', ES: 'Buscador de Versículos' },
  'historical-context': { PT: 'Contexto Histórico', EN: 'Historical Context', ES: 'Contexto Histórico' },
  'quote-finder': { PT: 'Citações', EN: 'Quotes', ES: 'Citas' },
  'original-text': { PT: 'Texto Original', EN: 'Original Text', ES: 'Texto Original' },
  'lexical': { PT: 'Pesquisa Lexical', EN: 'Lexical Research', ES: 'Investigación Léxica' },
  'metaphor-creator': { PT: 'Metáforas', EN: 'Metaphors', ES: 'Metáforas' },
  'bible-modernizer': { PT: 'Modernizador', EN: 'Modernizer', ES: 'Modernizador' },
  'illustrations': { PT: 'Ilustrações', EN: 'Illustrations', ES: 'Ilustraciones' },
  'youtube-blog': { PT: 'YouTube → Blog', EN: 'YouTube → Blog', ES: 'YouTube → Blog' },
  'reels-script': { PT: 'Roteiro Reels', EN: 'Reels Script', ES: 'Guión Reels' },
  'cell-group': { PT: 'Célula', EN: 'Cell Group', ES: 'Célula' },
  'social-caption': { PT: 'Legendas Social', EN: 'Social Captions', ES: 'Leyendas Social' },
  'newsletter': { PT: 'Newsletter', EN: 'Newsletter', ES: 'Newsletter' },
  'announcements': { PT: 'Avisos', EN: 'Announcements', ES: 'Avisos' },
  'trivia': { PT: 'Quiz Bíblico', EN: 'Bible Trivia', ES: 'Trivia Bíblica' },
  'poetry': { PT: 'Poesia', EN: 'Poetry', ES: 'Poesía' },
  'kids-story': { PT: 'Infantil', EN: 'Kids Story', ES: 'Infantil' },
  'deep-translation': { PT: 'Tradução', EN: 'Translation', ES: 'Traducción' },
  'mind-chat': { PT: 'Mentes Brilhantes', EN: 'Brilliant Minds', ES: 'Mentes Brillantes' },
  'deep-search': { PT: 'Pesquisa Profunda', EN: 'Deep Search', ES: 'Búsqueda Profunda' },
  'social-studio': { PT: 'Estúdio Social', EN: 'Social Studio', ES: 'Estudio Social' },
  'pastoral-material': { PT: 'Material Pastoral', EN: 'Pastoral Material', ES: 'Material Pastoral' },
};

const labels = {
  title: { PT: 'Relatório de Uso', EN: 'Usage Report', ES: 'Informe de Uso' } as Record<L, string>,
  subtitle: { PT: 'Extrato detalhado dos seus créditos', EN: 'Detailed credit statement', ES: 'Extracto detallado de tus créditos' } as Record<L, string>,
  empty: { PT: 'Nenhuma geração registrada ainda.', EN: 'No generations recorded yet.', ES: 'Ninguna generación registrada aún.' } as Record<L, string>,
  credits: { PT: 'créditos', EN: 'credits', ES: 'créditos' } as Record<L, string>,
};

export function CreditUsageReport() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const l = lang as L;
  const [entries, setEntries] = useState<UsageEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from('generation_logs')
        .select('id, feature, total_tokens, cost_usd, created_at, model')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (!error && data) setEntries(data);
      setLoading(false);
    })();
  }, [user]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(lang === 'PT' ? 'pt-BR' : lang === 'ES' ? 'es' : 'en', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  };

  const getCreditsUsed = (feature: string) => {
    return TOOL_CREDITS[feature] || 10;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-primary" />
          <CardTitle className="font-display text-lg">{labels.title[l]}</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground">{labels.subtitle[l]}</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">{labels.empty[l]}</p>
        ) : (
          <ScrollArea className="h-[320px] pr-2">
            <div className="space-y-1">
              {entries.map((entry) => {
                const featureLabel = FEATURE_LABELS[entry.feature]?.[l] || entry.feature;
                const credits = getCreditsUsed(entry.feature);
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors border-b border-border/30 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{featureLabel}</p>
                      <p className="text-[10px] text-muted-foreground">{formatDate(entry.created_at)}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-destructive border-destructive/30 text-xs font-mono">
                      −{credits} {labels.credits[l]}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
