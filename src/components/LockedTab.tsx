import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Lock, Crown, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LockedTabProps {
  formatName: string;
}

export function LockedTab({ formatName }: LockedTabProps) {
  const { t } = useLanguage();

  return (
    <div className="text-center py-12 px-4">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <Lock className="h-8 w-8 text-primary/60" />
      </div>
      <h3 className="font-display text-lg font-semibold mb-2">
        {formatName}
      </h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
        Este formato está disponível no plano Pastoral. Teste grátis por 7 dias, sem cartão.
      </p>
      <Link to="/upgrade">
        <Button className="bg-primary text-primary-foreground gap-2">
          <Crown className="h-4 w-4" />
          {t('upgrade.cta')}
        </Button>
      </Link>
    </div>
  );
}
