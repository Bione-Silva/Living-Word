import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PLAN_CREDITS, type PlanSlug } from '@/lib/plans';

type L = 'PT' | 'EN' | 'ES';

const labels = {
  title: { PT: 'Capacidade de Produção', EN: 'Production Capacity', ES: 'Capacidad de Producción' } as Record<L, string>,
  used: { PT: 'usados', EN: 'used', ES: 'usados' } as Record<L, string>,
  of: { PT: 'de', EN: 'of', ES: 'de' } as Record<L, string>,
  contents: { PT: 'conteúdos este mês', EN: 'contents this month', ES: 'contenidos este mes' } as Record<L, string>,
  upgrade: { PT: 'Aumentar capacidade', EN: 'Increase capacity', ES: 'Aumentar capacidad' } as Record<L, string>,
  nearLimit: { PT: 'Você está perto do limite!', EN: 'You\'re near the limit!', ES: '¡Estás cerca del límite!' } as Record<L, string>,
};

export function ProductionCapacityBar() {
  const { profile } = useAuth();
  const { lang } = useLanguage();

  const plan = (profile?.plan || 'free') as PlanSlug;
  const used = profile?.generations_used || 0;
  const limit = PLAN_CREDITS[plan] || profile?.generations_limit || 500;
  const pct = Math.min((used / limit) * 100, 100);
  const isNearLimit = pct >= 80;

  return (
    <Card className={`border-border/60 ${isNearLimit ? 'border-amber-300/60 bg-amber-50/30' : 'bg-card'}`}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{labels.title[lang]}</h3>
              <p className="text-[11px] text-muted-foreground">
                {used.toLocaleString()} {labels.of[lang]} {limit.toLocaleString()} {labels.contents[lang]}
              </p>
            </div>
          </div>
          {plan === 'free' && (
            <Link to="/upgrade">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs min-h-[44px]">
                <TrendingUp className="h-3.5 w-3.5" />
                {labels.upgrade[lang]}
              </Button>
            </Link>
          )}
        </div>

        <Progress value={pct} className="h-2.5" />

        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px] font-mono text-muted-foreground">
            {pct.toFixed(0)}% {labels.used[lang]}
          </span>
          {isNearLimit && (
            <span className="text-[11px] font-semibold text-amber-600 flex items-center gap-1">
              ⚠️ {labels.nearLimit[lang]}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
