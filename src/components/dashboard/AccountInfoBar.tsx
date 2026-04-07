import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { Crown } from 'lucide-react';

export function AccountInfoBar() {
  const { profile } = useAuth();
  const { lang } = useLanguage();

  const planCredits: Record<string, number> = { free: 500, pastoral: 2000, church: 5000, ministry: 15000 };
  const used = profile?.generations_used || 0;
  const limit = planCredits[profile?.plan || 'free'] || profile?.generations_limit || 500;
  const pct = Math.min(Math.round((used / limit) * 100), 100);
  const isFree = profile?.plan === 'free';

  const labels = {
    PT: { title: 'Créditos', of: 'de', contents: 'créditos', upgrade: 'Fazer upgrade' },
    EN: { title: 'Monthly usage', of: 'of', contents: 'contents', upgrade: 'Upgrade' },
    ES: { title: 'Uso del mes', of: 'de', contents: 'contenidos', upgrade: 'Hacer upgrade' },
  };
  const l = labels[lang];

  return (
    <section className="rounded-xl p-4 bg-card border border-border shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-muted-foreground">{l.title}</p>
        <p className="text-xs text-muted-foreground">
          {used} {l.of} {limit} · {pct}%
        </p>
      </div>
      <Progress value={pct} className="h-1.5 mb-2" />
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground capitalize">
          {lang === 'PT' ? 'Plano' : 'Plan'}: {profile?.plan || 'free'}
        </p>
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
