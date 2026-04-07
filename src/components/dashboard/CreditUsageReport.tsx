import { useEffect, useState, useMemo } from 'react';
import { CreditUsageCharts } from './CreditUsageCharts';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ChevronDown, Wallet, Filter } from 'lucide-react';
import { TOOL_CREDITS, PLAN_CREDITS, type PlanSlug } from '@/lib/plans';

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
  studio: { PT: 'Sermão Pastoral', EN: 'Pastoral Sermon', ES: 'Sermón Pastoral' },
  'biblical-study': { PT: 'Estudo Bíblico Aprofundado', EN: 'Deep Bible Study', ES: 'Estudio Bíblico Profundo' },
  'free-article': { PT: 'Artigo de Blog', EN: 'Blog Article', ES: 'Artículo de Blog' },
  'free-article-universal': { PT: 'Redator Universal', EN: 'Universal Writer', ES: 'Redactor Universal' },
  'title-gen': { PT: 'Títulos Criativos', EN: 'Creative Titles', ES: 'Títulos Creativos' },
  'topic-explorer': { PT: 'Explorador de Temas', EN: 'Topic Explorer', ES: 'Explorador de Temas' },
  'verse-finder': { PT: 'Busca de Versículos', EN: 'Verse Finder', ES: 'Buscador de Versículos' },
  'historical-context': { PT: 'Contexto Histórico', EN: 'Historical Context', ES: 'Contexto Histórico' },
  'quote-finder': { PT: 'Localizador de Citações', EN: 'Quote Finder', ES: 'Buscador de Citas' },
  'original-text': { PT: 'Texto Original', EN: 'Original Text', ES: 'Texto Original' },
  'lexical': { PT: 'Pesquisa Lexical', EN: 'Lexical Research', ES: 'Investigación Léxica' },
  'metaphor-creator': { PT: 'Criador de Metáforas', EN: 'Metaphor Creator', ES: 'Creador de Metáforas' },
  'bible-modernizer': { PT: 'Modernizador Bíblico', EN: 'Bible Modernizer', ES: 'Modernizador Bíblico' },
  'illustrations': { PT: 'Ilustrações para Sermão', EN: 'Sermon Illustrations', ES: 'Ilustraciones para Sermón' },
  'youtube-blog': { PT: 'YouTube → Blog', EN: 'YouTube → Blog', ES: 'YouTube → Blog' },
  'reels-script': { PT: 'Roteiro para Reels', EN: 'Reels Script', ES: 'Guión para Reels' },
  'cell-group': { PT: 'Material de Célula', EN: 'Cell Group Material', ES: 'Material de Célula' },
  'social-caption': { PT: 'Legenda para Redes', EN: 'Social Caption', ES: 'Leyenda para Redes' },
  'newsletter': { PT: 'Newsletter', EN: 'Newsletter', ES: 'Newsletter' },
  'announcements': { PT: 'Avisos da Igreja', EN: 'Church Announcements', ES: 'Avisos de la Iglesia' },
  'trivia': { PT: 'Quiz Bíblico', EN: 'Bible Trivia', ES: 'Trivia Bíblica' },
  'poetry': { PT: 'Poesia Devocional', EN: 'Devotional Poetry', ES: 'Poesía Devocional' },
  'kids-story': { PT: 'História Infantil', EN: 'Kids Story', ES: 'Historia Infantil' },
  'deep-translation': { PT: 'Tradução Profunda', EN: 'Deep Translation', ES: 'Traducción Profunda' },
  'mind-chat': { PT: 'Mentes Brilhantes', EN: 'Brilliant Minds', ES: 'Mentes Brillantes' },
  'deep-search': { PT: 'Pesquisa Profunda', EN: 'Deep Search', ES: 'Búsqueda Profunda' },
  'social-studio': { PT: 'Estúdio Social', EN: 'Social Studio', ES: 'Estudio Social' },
  'pastoral-material': { PT: 'Material Pastoral', EN: 'Pastoral Material', ES: 'Material Pastoral' },
  'devotional': { PT: 'Devocional', EN: 'Devotional', ES: 'Devocional' },
  'outline': { PT: 'Esboço de Sermão', EN: 'Sermon Outline', ES: 'Esquema de Sermón' },
  'sermon': { PT: 'Sermão Completo', EN: 'Full Sermon', ES: 'Sermón Completo' },
  'Blog Creator': { PT: 'Criador de Blog', EN: 'Blog Creator', ES: 'Creador de Blog' },
};

const FEATURE_ICONS: Record<string, string> = {
  studio: '🎤', 'biblical-study': '📖', 'free-article': '✍️', 'free-article-universal': '📝',
  'title-gen': '💡', 'topic-explorer': '🔍', 'verse-finder': '📜', 'historical-context': '🏛️',
  'quote-finder': '💬', 'original-text': '📃', 'lexical': '🔤', 'metaphor-creator': '🎨',
  'bible-modernizer': '✨', 'illustrations': '🖼️', 'youtube-blog': '▶️', 'reels-script': '🎬',
  'cell-group': '👥', 'social-caption': '📱', 'newsletter': '📧', 'announcements': '📢',
  'trivia': '🎮', 'poetry': '🪶', 'kids-story': '👶', 'deep-translation': '🌐',
  'mind-chat': '🧠', 'deep-search': '🔎', 'social-studio': '🎨', 'pastoral-material': '⛪',
  'devotional': '🙏', 'outline': '📋', 'sermon': '🎤', 'Blog Creator': '✍️',
};

const filterAllLabel = { PT: 'Todas as ferramentas', EN: 'All tools', ES: 'Todas las herramientas' } as Record<L, string>;

const labels = {
  title: { PT: 'Extrato de Créditos', EN: 'Credit Statement', ES: 'Extracto de Créditos' } as Record<L, string>,
  period: { PT: 'Período do plano atual', EN: 'Current plan period', ES: 'Período del plan actual' } as Record<L, string>,
  empty: { PT: 'Nenhuma geração neste período.', EN: 'No generations in this period.', ES: 'Ninguna generación en este período.' } as Record<L, string>,
  seeMore: { PT: 'Ver mais', EN: 'See more', ES: 'Ver más' } as Record<L, string>,
  balance: { PT: 'Saldo disponível', EN: 'Available balance', ES: 'Saldo disponible' } as Record<L, string>,
  used: { PT: 'Total consumido', EN: 'Total consumed', ES: 'Total consumido' } as Record<L, string>,
  of: { PT: 'de', EN: 'of', ES: 'de' } as Record<L, string>,
};

export function CreditUsageReport() {
  const { user, profile } = useAuth();
  const { lang } = useLanguage();
  const l = lang as L;
  const [entries, setEntries] = useState<UsageEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(10);
  const [featureFilter, setFeatureFilter] = useState('all');
  const userPlan = (profile?.plan as PlanSlug) || 'free';
  const totalCredits = PLAN_CREDITS[userPlan] || 500;
  const usedCredits = profile?.generations_used || 0;
  const remaining = Math.max(totalCredits - usedCredits, 0);

  // Calculate 30-day billing period based on profile creation
  const periodStart = (() => {
    const now = new Date();
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    return d;
  })();

  const periodEnd = new Date();

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from('generation_logs')
        .select('id, feature, total_tokens, cost_usd, created_at, model')
        .eq('user_id', user.id)
        .gte('created_at', periodStart.toISOString())
        .lte('created_at', periodEnd.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);
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

  const formatPeriod = (d: Date) => {
    return d.toLocaleDateString(lang === 'PT' ? 'pt-BR' : lang === 'ES' ? 'es' : 'en', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  const getCreditsUsed = (feature: string) => {
    return TOOL_CREDITS[feature] || 10;
  };

  const visibleEntries = entries.slice(0, visibleCount);
  const hasMore = entries.length > visibleCount;

  // Running balance calculation
  let runningBalance = totalCredits;
  const entriesWithBalance = entries.map((entry) => {
    const credits = getCreditsUsed(entry.feature);
    runningBalance -= credits;
    return { ...entry, balance: Math.max(runningBalance, 0), credits };
  });
  const visibleWithBalance = entriesWithBalance.slice(0, visibleCount);

  // Total consumed in this period
  const totalConsumed = entries.reduce((sum, e) => sum + getCreditsUsed(e.feature), 0);

  return (
    <div className="w-full space-y-4">
      {/* Statement Header */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Top bar */}
        <div className="bg-muted/40 px-5 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-foreground">{labels.title[l]}</h2>
                <p className="text-xs text-muted-foreground">
                  {labels.period[l]}: {formatPeriod(periodStart)} — {formatPeriod(periodEnd)}
                </p>
              </div>
            </div>
          </div>

          {/* Summary row */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="rounded-lg bg-background border border-border p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{labels.balance[l]}</p>
              <p className="text-2xl font-bold font-mono text-emerald-600">{remaining.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">{labels.of[l]} {totalCredits.toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-background border border-border p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{labels.used[l]}</p>
              <p className="text-2xl font-bold font-mono text-foreground">{totalConsumed.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">
                {entries.length} {lang === 'PT' ? 'gerações' : lang === 'EN' ? 'generations' : 'generaciones'}
              </p>
            </div>
          </div>

          {/* Charts */}
          {!loading && entries.length > 0 && (
            <div className="px-5 py-4">
              <CreditUsageCharts entries={entries} />
            </div>
          )}
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-5 py-2.5 bg-muted/20 border-b border-border text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
          <span>{lang === 'PT' ? 'Descrição' : lang === 'EN' ? 'Description' : 'Descripción'}</span>
          <span className="text-right w-24">{lang === 'PT' ? 'Créditos' : 'Credits'}</span>
          <span className="text-right w-24">{lang === 'PT' ? 'Saldo' : lang === 'EN' ? 'Balance' : 'Saldo'}</span>
        </div>

        {/* Entries */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">{labels.empty[l]}</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {visibleWithBalance.map((entry, i) => {
              const featureLabel = FEATURE_LABELS[entry.feature]?.[l] || entry.feature;
              const icon = FEATURE_ICONS[entry.feature] || '⚡';
              return (
                <div
                  key={entry.id}
                  className={`grid grid-cols-[1fr_auto_auto] gap-2 items-center px-5 py-3 transition-colors hover:bg-muted/30 ${i % 2 === 0 ? '' : 'bg-muted/10'}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-base shrink-0">{icon}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{featureLabel}</p>
                      <p className="text-[10px] text-muted-foreground">{formatDate(entry.created_at)}</p>
                    </div>
                  </div>
                  <div className="w-24 text-right">
                    <Badge variant="outline" className="text-destructive border-destructive/30 text-xs font-mono px-2">
                      −{entry.credits}
                    </Badge>
                  </div>
                  <div className="w-24 text-right">
                    <span className="text-xs font-mono text-muted-foreground">{entry.balance.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* See more */}
        {hasMore && (
          <div className="px-5 py-3 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              className="w-full gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => setVisibleCount((c) => c + 20)}
            >
              <ChevronDown className="h-4 w-4" />
              {labels.seeMore[l]} ({entries.length - visibleCount} {lang === 'PT' ? 'restantes' : 'remaining'})
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
