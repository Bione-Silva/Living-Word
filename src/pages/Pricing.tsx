import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Check, Crown, Zap, Brain, BookOpen, Building2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { PLAN_CREDITS, PLAN_DISPLAY_NAMES } from '@/lib/plans';
import { useForceLightTheme } from '@/hooks/useForceLightTheme';

type L = 'PT' | 'EN' | 'ES';

const labels = {
  title: { PT: 'Planos e Preços', EN: 'Plans & Pricing', ES: 'Planes y Precios' } as Record<L, string>,
  subtitle: { PT: 'Escale sua produção pastoral com a Living Word.', EN: 'Scale your pastoral production with Living Word.', ES: 'Escala tu producción pastoral con Living Word.' } as Record<L, string>,
  monthly: { PT: 'Mensal', EN: 'Monthly', ES: 'Mensual' } as Record<L, string>,
  annual: { PT: 'Anual', EN: 'Annual', ES: 'Anual' } as Record<L, string>,
  annualSave: { PT: '2 meses grátis', EN: '2 months free', ES: '2 meses gratis' } as Record<L, string>,
  month: { PT: '/mês', EN: '/month', ES: '/mes' } as Record<L, string>,
  forever: { PT: 'Para sempre', EN: 'Forever', ES: 'Para siempre' } as Record<L, string>,
  popular: { PT: 'Mais Popular', EN: 'Most Popular', ES: 'Más Popular' } as Record<L, string>,
  credits: { PT: 'créditos/mês', EN: 'credits/month', ES: 'créditos/mes' } as Record<L, string>,
};

const plans = [
  {
    slug: 'free' as const, icon: BookOpen, featured: false,
    price: { monthly: 0, annual: 0 },
    cta: { PT: 'Começar grátis', EN: 'Start free', ES: 'Comenzar gratis' },
    href: '/cadastro',
    features: {
      PT: ['150 créditos/mês', '1 uso/mês por ferramenta', '14 ferramentas', 'Blog cristão básico'],
      EN: ['150 credits/month', '1 use/month per tool', '14 tools', 'Basic Christian blog'],
      ES: ['150 créditos/mes', '1 uso/mes por herramienta', '14 herramientas', 'Blog cristiano básico'],
    },
  },
  {
    slug: 'starter' as const, icon: Zap, featured: false,
    price: { monthly: 9.90, annual: 8.25 },
    cta: { PT: '7 dias grátis →', EN: '7 days free →', ES: '7 días gratis →' },
    href: '/cadastro',
    features: {
      PT: ['3.000 créditos/mês', 'Todas as ferramentas core + extras', 'Uso ilimitado', 'Sem watermark'],
      EN: ['3,000 credits/month', 'All core + extra tools', 'Unlimited use', 'No watermark'],
      ES: ['3.000 créditos/mes', 'Todas las herramientas core + extras', 'Uso ilimitado', 'Sin marca de agua'],
    },
  },
  {
    slug: 'pro' as const, icon: Brain, featured: true,
    price: { monthly: 29.90, annual: 24.92 },
    cta: { PT: 'Começar agora →', EN: 'Start now →', ES: 'Comenzar ahora →' },
    href: '/cadastro',
    features: {
      PT: ['10.000 créditos/mês', '🧠 Mentes Brilhantes', 'Ilustrações + Calendário', 'YouTube → Blog', 'Até 3 workspaces'],
      EN: ['10,000 credits/month', '🧠 Brilliant Minds', 'Illustrations + Calendar', 'YouTube → Blog', 'Up to 3 workspaces'],
      ES: ['10.000 créditos/mes', '🧠 Mentes Brillantes', 'Ilustraciones + Calendario', 'YouTube → Blog', 'Hasta 3 workspaces'],
    },
  },
  {
    slug: 'igreja' as const, icon: Building2, featured: false,
    price: { monthly: 79.90, annual: 66.58 },
    cta: { PT: 'Começar', EN: 'Get started', ES: 'Comenzar' },
    href: '/cadastro',
    features: {
      PT: ['30.000 créditos/mês', 'Até 10 usuários', 'Workspaces ilimitados', 'Multiportal', 'Suporte VIP'],
      EN: ['30,000 credits/month', 'Up to 10 users', 'Unlimited workspaces', 'Multi-portal', 'VIP Support'],
      ES: ['30.000 créditos/mes', 'Hasta 10 usuarios', 'Workspaces ilimitados', 'Multiportal', 'Soporte VIP'],
    },
  },
];

export default function Pricing() {
  useForceLightTheme();
  const { lang } = useLanguage();
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-16 space-y-10">
        <div className="text-center">
          <Sparkles className="h-10 w-10 text-primary mx-auto mb-4" />
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground">{labels.title[lang]}</h1>
          <p className="text-muted-foreground mt-2 max-w-lg mx-auto">{labels.subtitle[lang]}</p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <span className={`text-sm font-medium ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>{labels.monthly[lang]}</span>
          <Switch checked={isAnnual} onCheckedChange={setIsAnnual} />
          <span className={`text-sm font-medium ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>{labels.annual[lang]}</span>
          {isAnnual && <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">{labels.annualSave[lang]}</Badge>}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-2">
          {lang === 'PT' && 'Preços em R$ disponíveis no checkout para usuários do Brasil.'}
          {lang === 'EN' && 'BRL pricing available at checkout for Brazil users.'}
          {lang === 'ES' && 'Precios en R$ disponibles en el pago para usuarios de Brasil.'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const price = isAnnual ? plan.price.annual : plan.price.monthly;
            const credits = PLAN_CREDITS[plan.slug];

            return (
              <Card key={plan.slug} className={`relative overflow-hidden flex flex-col ${plan.featured ? 'border-primary ring-1 ring-primary/30 shadow-lg' : 'border-border/60'}`}>
                {plan.featured && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent" />}
                <CardContent className="p-5 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <h3 className="font-display text-lg font-semibold">{PLAN_DISPLAY_NAMES[plan.slug][lang]}</h3>
                    </div>
                    {plan.featured && <Badge className="text-[10px] bg-primary text-primary-foreground">{labels.popular[lang]}</Badge>}
                  </div>

                  <div className="flex items-baseline gap-0.5 mb-1">
                    <span className="text-3xl font-bold">${price.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{price === 0 ? labels.forever[lang] : labels.month[lang]}</p>

                  <Badge variant="secondary" className="text-[10px] mb-4 self-start">{credits.toLocaleString()} {labels.credits[lang]}</Badge>

                  <ul className="space-y-2 mb-5 flex-1">
                    {plan.features[lang].map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link to={plan.href}>
                    <Button className="w-full gap-1.5 min-h-[48px]" variant={plan.featured ? 'default' : 'secondary'}>
                      {plan.slug !== 'free' && <Crown className="h-4 w-4" />}
                      {plan.cta[lang]}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
