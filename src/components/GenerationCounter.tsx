import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PLAN_CREDITS } from '@/lib/plans';
import { Info } from 'lucide-react';

interface GenerationCounterProps {
  compact?: boolean;
}

type L = 'PT' | 'EN' | 'ES';

const TOOLTIP_COPY = {
  title: { PT: 'Custo médio por ação', EN: 'Average cost per action', ES: 'Coste medio por acción' } as Record<L, string>,
  rows: {
    PT: [
      ['Sermão completo', '~120 créditos'],
      ['Estudo bíblico', '~80 créditos'],
      ['Devocional', '~30 créditos'],
      ['Artigo de blog', '~60 créditos'],
      ['Carrossel social', '~40 créditos'],
      ['Imagem (Studio)', '~50 créditos'],
    ],
    EN: [
      ['Full sermon', '~120 credits'],
      ['Bible study', '~80 credits'],
      ['Devotional', '~30 credits'],
      ['Blog article', '~60 credits'],
      ['Social carousel', '~40 credits'],
      ['Image (Studio)', '~50 credits'],
    ],
    ES: [
      ['Sermón completo', '~120 créditos'],
      ['Estudio bíblico', '~80 créditos'],
      ['Devocional', '~30 créditos'],
      ['Artículo de blog', '~60 créditos'],
      ['Carrusel social', '~40 créditos'],
      ['Imagen (Studio)', '~50 créditos'],
    ],
  } as Record<L, ReadonlyArray<readonly [string, string]>>,
  footer: {
    PT: 'Valores aproximados — variam por modelo e tamanho.',
    EN: 'Approximate — varies by model and length.',
    ES: 'Valores aproximados — varían por modelo y tamaño.',
  } as Record<L, string>,
};

export function GenerationCounter({ compact }: GenerationCounterProps) {
  const { profile } = useAuth();
  const { t, lang: cur } = useLanguage();
  const lang = (cur || 'PT') as L;

  if (!profile) return null;

  const used = profile.generations_used;
  const limit = PLAN_CREDITS[profile.plan as keyof typeof PLAN_CREDITS] || 500;
  const pct = limit > 0 ? Math.round((used / limit) * 100) : 0;
  const remaining = Math.max(limit - used, 0);

  const tooltipBody = (
    <div className="text-xs space-y-2 max-w-[240px]">
      <p className="font-bold text-foreground">{TOOLTIP_COPY.title[lang]}</p>
      <ul className="space-y-1">
        {TOOLTIP_COPY.rows[lang].map(([action, cost]) => (
          <li key={action} className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">{action}</span>
            <span className="font-mono font-semibold text-foreground">{cost}</span>
          </li>
        ))}
      </ul>
      <p className="text-[10px] text-muted-foreground/80 italic pt-1 border-t border-border">
        {TOOLTIP_COPY.footer[lang]}
      </p>
    </div>
  );

  if (compact) {
    return (
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1.5 bg-primary-foreground/10 rounded-full px-2.5 py-1 hover:bg-primary-foreground/15 transition-colors cursor-help"
              aria-label="Ver custos por ação"
            >
              <div className={`w-2 h-2 rounded-full shrink-0 ${remaining < 100 ? 'bg-destructive' : remaining < 500 ? 'bg-yellow-500' : 'bg-emerald-500'}`} />
              <span className="text-[11px] font-mono whitespace-nowrap">
                {remaining.toLocaleString()}
              </span>
              <Info className="h-2.5 w-2.5 opacity-60" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="end">{tooltipBody}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="text-[11px] text-sidebar-foreground/60 flex items-center gap-1 cursor-help hover:text-sidebar-foreground/80 transition-colors"
              >
                {t('dashboard.generations')}
                <Info className="h-2.5 w-2.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{tooltipBody}</TooltipContent>
          </Tooltip>
          <span className="text-[11px] font-mono text-sidebar-foreground/80">{remaining.toLocaleString()}/{limit.toLocaleString()}</span>
        </div>
        <Progress value={pct} className="h-1.5 [&>div]:transition-all" />
      </div>
    </TooltipProvider>
  );
}
