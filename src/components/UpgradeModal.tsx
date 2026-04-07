import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { Lock, Crown, Building2 } from 'lucide-react';
import { type PlanSlug, PLAN_DISPLAY_NAMES, PLAN_PRICES, getUpgradeBadge, type UpgradeBadgeType } from '@/lib/plans';

type L = 'PT' | 'EN' | 'ES';

const BADGE_ICONS: Record<UpgradeBadgeType, React.ElementType> = {
  lock: Lock,
  crown: Crown,
  church: Building2,
};

const BADGE_COLORS: Record<UpgradeBadgeType, string> = {
  lock: 'bg-muted text-muted-foreground',
  crown: 'bg-primary/10 text-primary',
  church: 'bg-blue-900/10 text-blue-900 dark:text-blue-300',
};

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName: string;
  toolId?: string;
  currentPlan: PlanSlug;
  requiredPlan: PlanSlug;
}

export function UpgradeModal({ open, onOpenChange, featureName, toolId, currentPlan, requiredPlan }: UpgradeModalProps) {
  const { lang } = useLanguage();

  const badgeType = getUpgradeBadge(currentPlan, requiredPlan);
  const BadgeIcon = BADGE_ICONS[badgeType];
  const planName = PLAN_DISPLAY_NAMES[requiredPlan][lang as L];
  const price = requiredPlan !== 'free' ? PLAN_PRICES.monthly[requiredPlan as keyof typeof PLAN_PRICES.monthly] : 0;

  const labels = {
    PT: {
      title: `Esta ferramenta está disponível no plano ${planName}`,
      subtitle: `Desbloqueie "${featureName}" e mais ferramentas por apenas $${price?.toFixed(2)}/mês`,
      cta: 'Fazer upgrade agora',
      secondary: 'Comparar todos os planos',
    },
    EN: {
      title: `This tool is available on the ${planName} plan`,
      subtitle: `Unlock "${featureName}" and more tools for just $${price?.toFixed(2)}/month`,
      cta: 'Upgrade now',
      secondary: 'Compare all plans',
    },
    ES: {
      title: `Esta herramienta está disponible en el plan ${planName}`,
      subtitle: `Desbloquea "${featureName}" y más herramientas por solo $${price?.toFixed(2)}/mes`,
      cta: 'Hacer upgrade ahora',
      secondary: 'Comparar todos los planes',
    },
  };

  const l = labels[lang as L];

  const upgradeUrl = `/upgrade?feature=${toolId || ''}&from_plan=${currentPlan}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center items-center">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-2 ${BADGE_COLORS[badgeType]}`}>
            <BadgeIcon className="h-8 w-8" />
          </div>
          <DialogTitle className="font-display text-lg">{l.title}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">{l.subtitle}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 mt-4">
          <Link to={upgradeUrl} onClick={() => onOpenChange(false)}>
            <Button className="w-full gap-2">
              <Crown className="h-4 w-4" />
              {l.cta}
            </Button>
          </Link>
          <Link to="/upgrade" onClick={() => onOpenChange(false)}>
            <Button variant="outline" className="w-full">
              {l.secondary}
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
