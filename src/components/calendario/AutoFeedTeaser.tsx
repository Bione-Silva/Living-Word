import { Sparkles, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

type L = 'PT' | 'EN' | 'ES';

interface Props {
  lang: L;
  /** true se o usuário tem plano Pro+ mas não ativou ainda */
  canEnable: boolean;
}

const COPY = {
  title: {
    PT: 'AutoFeed: conteúdo social a cada sermão',
    EN: 'AutoFeed: social content for every sermon',
    ES: 'AutoFeed: contenido social en cada sermón',
  },
  descPro: {
    PT: 'Ative para gerar automaticamente 1 carrossel + 1 citação sempre que você criar um sermão.',
    EN: 'Enable to auto-generate 1 carousel + 1 quote every time you create a sermon.',
    ES: 'Activa para generar automáticamente 1 carrusel + 1 cita cada vez que crees un sermón.',
  },
  descFree: {
    PT: 'Disponível no plano Pro. Gere automaticamente 1 carrossel + 1 citação a partir de cada sermão.',
    EN: 'Available on the Pro plan. Auto-generate 1 carousel + 1 quote from every sermon.',
    ES: 'Disponible en el plan Pro. Genera automáticamente 1 carrusel + 1 cita de cada sermón.',
  },
  enable: { PT: 'Ativar AutoFeed', EN: 'Enable AutoFeed', ES: 'Activar AutoFeed' },
  upgrade: { PT: 'Fazer upgrade para Pro', EN: 'Upgrade to Pro', ES: 'Mejorar a Pro' },
} satisfies Record<string, Record<L, string>>;

export function AutoFeedTeaser({ lang, canEnable }: Props) {
  const t = (k: keyof typeof COPY) => COPY[k][lang];

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Sparkles className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display text-sm sm:text-base font-semibold text-foreground">
          {t('title')}
        </p>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          {canEnable ? t('descPro') : t('descFree')}
        </p>
      </div>
      <Link to={canEnable ? '/configuracoes?tab=plan' : '/upgrade?feature=autofeed'} className="w-full sm:w-auto">
        <Button size="sm" className="gap-1.5 w-full sm:w-auto">
          {canEnable ? <Sparkles className="h-3.5 w-3.5" /> : <Crown className="h-3.5 w-3.5" />}
          {canEnable ? t('enable') : t('upgrade')}
        </Button>
      </Link>
    </div>
  );
}
