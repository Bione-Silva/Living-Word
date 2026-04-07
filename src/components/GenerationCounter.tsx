import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Progress } from '@/components/ui/progress';
import { PLAN_CREDITS } from '@/lib/plans';

interface GenerationCounterProps {
  compact?: boolean;
}

export function GenerationCounter({ compact }: GenerationCounterProps) {
  const { profile } = useAuth();
  const { t } = useLanguage();

  if (!profile) return null;

  // Hide credits entirely for free users
  if (profile.plan === 'free') return null;

  const used = profile.generations_used;
  const limit = PLAN_CREDITS[profile.plan] || profile.generations_limit || 150;
  const pct = limit > 0 ? Math.round((used / limit) * 100) : 0;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 bg-primary-foreground/10 rounded-full px-2.5 py-1">
        <div className={`w-2 h-2 rounded-full shrink-0 ${pct >= 80 ? 'bg-destructive' : pct >= 60 ? 'bg-yellow-500' : 'bg-emerald-500'}`} />
        <span className="text-[11px] font-mono whitespace-nowrap">
          {used}/{limit}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-sidebar-foreground/60">{t('dashboard.generations')}</span>
        <span className="text-[11px] font-mono text-sidebar-foreground/80">{used}/{limit}</span>
      </div>
      <Progress value={pct} className="h-1.5 [&>div]:transition-all" />
    </div>
  );
}
