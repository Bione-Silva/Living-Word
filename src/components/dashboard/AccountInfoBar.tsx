import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { Crown } from 'lucide-react';
import { PLAN_CREDITS, PLAN_DISPLAY_NAMES } from '@/lib/plans';

export function AccountInfoBar() {
  const { profile } = useAuth();
  const { lang } = useLanguage();

  const plan = profile?.plan || 'free';
  const isFree = plan === 'free';
  const used = profile?.generations_used || 0;
  const limit = PLAN_CREDITS[plan] || profile?.generations_limit || 150;
  const pct = Math.min(Math.round((used / limit) * 100), 100);
  const remaining = Math.max(limit - used, 0);

  const labels = {
    PT: { credits: 'Créditos disponíveis', upgrade: 'Fazer upgrade', plan: 'Plano' },
    EN: { credits: 'Credits available', upgrade: 'Upgrade', plan: 'Plan' },
    ES: { credits: 'Créditos disponibles', upgrade: 'Hacer upgrade', plan: 'Plan' },
  };
  const l = labels[lang as 'PT' | 'EN' | 'ES'];

  // Credit color
  const creditColor = remaining > 500 ? 'text-emerald-600' : remaining > 100 ? 'text-yellow-600' : 'text-destructive';

  return (
    <section className="rounded-xl p-4 bg-card border border-border shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-muted-foreground capitalize">
          {l.plan}: {PLAN_DISPLAY_NAMES[plan]?.[lang as 'PT' | 'EN' | 'ES'] || plan}
        </p>
        {!isFree && (
          <p className={`text-xs font-semibold ${creditColor}`}>
            {remaining.toLocaleString()} {l.credits}
          </p>
        )}
      </div>

      {!isFree && <Progress value={pct} className="h-1.5 mb-2" />}

      <div className="flex items-center justify-end">
        {isFree && (
          <Link to="/upgrade" className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline">
            <Crown className="h-3 w-3" />
            {l.upgrade}
          </Link>
        )}
      </div>
    </section>
  );
}
