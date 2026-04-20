import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Lock, Crown, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getMinPlanForTool, getUpgradeBadge, PLAN_DISPLAY_NAMES } from '@/lib/plans';
import { normalizePlan } from '@/lib/plan-normalization';
import { useAuth } from '@/contexts/AuthContext';

type L = 'PT' | 'EN' | 'ES';

interface LockedTabProps {
  formatName: string;
  toolId?: string;
}

export function LockedTab({ formatName, toolId }: LockedTabProps) {
  const { lang } = useLanguage();
  const { profile } = useAuth();

  const currentPlan = normalizePlan(profile?.plan);
  const requiredPlan = toolId ? getMinPlanForTool(toolId) : 'starter';
  const planName = PLAN_DISPLAY_NAMES[requiredPlan][lang as L];
  const badgeType = getUpgradeBadge(currentPlan, requiredPlan);

  const BadgeIcon = badgeType === 'church' ? Building2 : badgeType === 'crown' ? Crown : Lock;

  const labels = {
    PT: {
      desc: `Este formato está disponível no plano ${planName}. Teste grátis por 7 dias, sem cartão.`,
      cta: 'Fazer upgrade',
    },
    EN: {
      desc: `This format is available on the ${planName} plan. Try free for 7 days, no card required.`,
      cta: 'Upgrade',
    },
    ES: {
      desc: `Este formato está disponible en el plan ${planName}. Prueba gratis por 7 días, sin tarjeta.`,
      cta: 'Hacer upgrade',
    },
  };

  const l = labels[lang as L];

  return (
    <div className="text-center py-12 px-4">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <BadgeIcon className="h-8 w-8 text-primary/60" />
      </div>
      <h3 className="font-display text-lg font-semibold mb-2">
        {formatName}
      </h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
        {l.desc}
      </p>
      <Link to={`/upgrade?feature=${toolId || ''}&from_plan=${currentPlan}`}>
        <Button className="bg-primary text-primary-foreground gap-2">
          <Crown className="h-4 w-4" />
          {l.cta}
        </Button>
      </Link>
    </div>
  );
}
