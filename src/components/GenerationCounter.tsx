import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Progress } from '@/components/ui/progress';

export function GenerationCounter() {
  const { profile } = useAuth();
  const { t } = useLanguage();

  if (!profile) return null;

  const used = profile.generations_used;
  const limit = profile.generations_limit;
  const pct = Math.round((used / limit) * 100);

  const colorClass = pct >= 80 ? 'bg-destructive' : pct >= 60 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="flex items-center gap-3 px-3">
      <div className="flex-1 min-w-[100px]">
        <Progress value={pct} className="h-2 [&>div]:transition-all" />
      </div>
      <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
        {used}/{limit} {t('dashboard.generations')}
      </span>
    </div>
  );
}
