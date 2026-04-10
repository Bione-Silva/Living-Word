import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  PLAN_CREDITS,
  PLAN_DISPLAY_NAMES,
  type PlanSlug,
} from '@/lib/plans';
import {
  Crown,
  BookOpen,
  FileText,
  Mic,
  Search,
  Lightbulb,
  Sparkles,
  PenTool,
  Info,
  Zap,
} from 'lucide-react';

type L = 'PT' | 'EN' | 'ES';

interface ToolRow {
  id: string;
  icon: React.ElementType;
  label: Record<L, string>;
  cost: number;
  category: 'research' | 'create' | 'extras';
}

const TOOL_ROWS: ToolRow[] = [
  { id: 'studio', icon: Mic, cost: 20, category: 'create', label: { PT: 'Sermão / Esboço', EN: 'Sermon / Outline', ES: 'Sermón / Bosquejo' } },
  { id: 'biblical-study', icon: BookOpen, cost: 30, category: 'create', label: { PT: 'Estudo Bíblico', EN: 'Biblical Study', ES: 'Estudio Bíblico' } },
  { id: 'free-article', icon: FileText, cost: 15, category: 'create', label: { PT: 'Artigo de Blog', EN: 'Blog Article', ES: 'Artículo de Blog' } },
  { id: 'topic-explorer', icon: Search, cost: 5, category: 'research', label: { PT: 'Explorador de Temas', EN: 'Topic Explorer', ES: 'Explorador de Temas' } },
  { id: 'verse-finder', icon: Lightbulb, cost: 3, category: 'research', label: { PT: 'Localizador de Versículos', EN: 'Verse Finder', ES: 'Buscador de Versículos' } },
  { id: 'historical-context', icon: BookOpen, cost: 5, category: 'research', label: { PT: 'Contexto Histórico', EN: 'Historical Context', ES: 'Contexto Histórico' } },
  { id: 'illustrations', icon: Sparkles, cost: 10, category: 'extras', label: { PT: 'Ilustrações', EN: 'Illustrations', ES: 'Ilustraciones' } },
  { id: 'newsletter', icon: PenTool, cost: 30, category: 'extras', label: { PT: 'Newsletter', EN: 'Newsletter', ES: 'Newsletter' } },
];

const CATEGORY_LABELS: Record<string, Record<L, string>> = {
  research: { PT: '🔍 Pesquisa', EN: '🔍 Research', ES: '🔍 Investigación' },
  create: { PT: '✨ Criação', EN: '✨ Creation', ES: '✨ Creación' },
  extras: { PT: '🎨 Extras', EN: '🎨 Extras', ES: '🎨 Extras' },
};

const PLAN_ICONS: Record<PlanSlug, string> = {
  free: '🆓',
  starter: '⭐',
  pro: '👑',
  igreja: '⛪',
};

export function PlanOverviewCard() {
  const { profile } = useAuth();
  const { lang } = useLanguage();
  const l = lang as L;

  const userPlan = (profile?.plan as PlanSlug) || 'free';
  const totalCredits = PLAN_CREDITS[userPlan] || 500;
  const usedCredits = profile?.generations_used || 0;
  const remaining = Math.max(totalCredits - usedCredits, 0);
  const pct = Math.min(Math.round((usedCredits / totalCredits) * 100), 100);
  

  const planName = PLAN_DISPLAY_NAMES[userPlan]?.[l] || userPlan;

  const labels = {
    title: { PT: 'Visão Geral do Plano', EN: 'Plan Overview', ES: 'Resumen del Plan' },
    credits: { PT: 'Créditos', EN: 'Credits', ES: 'Créditos' },
    used: { PT: 'usados', EN: 'used', ES: 'usados' },
    available: { PT: 'disponíveis', EN: 'available', ES: 'disponibles' },
    potential: { PT: 'Com seus créditos você pode gerar até:', EN: 'With your credits you can generate up to:', ES: 'Con tus créditos puedes generar hasta:' },
    sermons: { PT: 'Sermões', EN: 'Sermons', ES: 'Sermones' },
    studies: { PT: 'Estudos', EN: 'Studies', ES: 'Estudios' },
    outlines: { PT: 'Esboços', EN: 'Outlines', ES: 'Bosquejos' },
    titles: { PT: 'Títulos', EN: 'Titles', ES: 'Títulos' },
    costLabel: { PT: 'créditos por uso', EN: 'credits per use', ES: 'créditos por uso' },
    toolsTitle: { PT: 'Ferramentas e Custos', EN: 'Tools & Costs', ES: 'Herramientas y Costos' },
    estimateLabel: { PT: '≈ usos restantes', EN: '≈ uses remaining', ES: '≈ usos restantes' },
  };

  const isLow = pct >= 80;
  const isMid = pct >= 50 && pct < 80;

  const categories = ['research', 'create', 'extras'] as const;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            {labels.title[l]}
          </CardTitle>
          <Badge variant="secondary" className="text-sm px-3 py-1 gap-1.5">
            <span>{PLAN_ICONS[userPlan]}</span>
            {planName}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Credit meter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{labels.credits[l]}</span>
            <span className={`font-mono font-bold ${isLow ? 'text-destructive' : isMid ? 'text-amber-600' : 'text-emerald-600'}`}>
              {remaining.toLocaleString()} {labels.available[l]}
            </span>
          </div>
          <Progress
            value={pct}
            className="h-3"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{usedCredits.toLocaleString()} {labels.used[l]}</span>
            <span>{totalCredits.toLocaleString()} total</span>
          </div>
        </div>

        {/* Generation potential cards — dynamic based on remaining credits */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { key: 'sermons', cost: 20, icon: Mic, color: 'text-violet-600 bg-violet-50' },
            { key: 'studies', cost: 30, icon: BookOpen, color: 'text-blue-600 bg-blue-50' },
            { key: 'outlines', cost: 15, icon: FileText, color: 'text-emerald-600 bg-emerald-50' },
            { key: 'titles', cost: 3, icon: Lightbulb, color: 'text-amber-600 bg-amber-50' },
          ].map(({ key, cost, icon: Icon, color }) => {
            const value = remaining > 0 ? Math.floor(remaining / cost) : 0;
            return (
              <div key={key} className="rounded-xl border border-border/50 p-3 text-center space-y-1">
                <div className={`mx-auto w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-xl font-bold font-mono">{value.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {labels[key as keyof typeof labels]?.[l] || key}
                </p>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground text-center italic">{labels.potential[l]}</p>

        {/* Tools & costs table */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            {labels.toolsTitle[l]}
          </h4>
          {categories.map((cat) => {
            const tools = TOOL_ROWS.filter((t) => t.category === cat);
            if (tools.length === 0) return null;
            return (
              <div key={cat} className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {CATEGORY_LABELS[cat][l]}
                </p>
                <div className="space-y-1">
                  {tools.map((tool) => {
                    const estUses = remaining > 0 ? Math.floor(remaining / tool.cost) : 0;
                    return (
                      <div
                        key={tool.id}
                        className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-secondary/50 transition-colors"
                      >
                        <tool.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm flex-1">{tool.label[l]}</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs font-mono px-2 py-0.5">
                                {tool.cost} cr
                              </Badge>
                              <span className="text-xs text-muted-foreground font-mono w-16 text-right">
                                ≈ {estUses.toLocaleString()}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{tool.cost} {labels.costLabel[l]}</p>
                            <p className="text-muted-foreground">≈ {estUses.toLocaleString()} {labels.estimateLabel[l]}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
