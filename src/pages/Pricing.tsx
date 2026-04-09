import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Check, Crown, Zap, Brain, BookOpen, Building2, Sparkles, HelpCircle, Minus, Plus, Users } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useState } from 'react';
import { PLAN_CREDITS, PLAN_DISPLAY_NAMES, PLAN_GENERATION_POTENTIAL, PLAN_PRICES, PLAN_PRICES_BRL, type PlanSlug } from '@/lib/plans';
import { useForceLightTheme } from '@/hooks/useForceLightTheme';
import { useGeoRegion } from '@/hooks/useGeoRegion';
import { formatPrice } from '@/utils/geoPricing';

type L = 'PT' | 'EN' | 'ES';

const labels = {
  title: { PT: 'Planos e Preços', EN: 'Plans & Pricing', ES: 'Planes y Precios' } as Record<L, string>,
  subtitle: { PT: 'Sua carteira de créditos. Use livremente em qualquer ferramenta.', EN: 'Your credit wallet. Use freely on any tool.', ES: 'Tu cartera de créditos. Usa libremente en cualquier herramienta.' } as Record<L, string>,
  monthly: { PT: 'Mensal', EN: 'Monthly', ES: 'Mensual' } as Record<L, string>,
  annual: { PT: 'Anual', EN: 'Annual', ES: 'Anual' } as Record<L, string>,
  annualSave: { PT: '2 meses grátis', EN: '2 months free', ES: '2 meses gratis' } as Record<L, string>,
  month: { PT: '/mês', EN: '/month', ES: '/mes' } as Record<L, string>,
  forever: { PT: 'Para sempre', EN: 'Forever', ES: 'Para siempre' } as Record<L, string>,
  popular: { PT: 'Mais Popular', EN: 'Most Popular', ES: 'Más Popular' } as Record<L, string>,
  credits: { PT: 'créditos/mês', EN: 'credits/month', ES: 'créditos/mes' } as Record<L, string>,
  tooltipTitle: { PT: 'Equivalente a gerar:', EN: 'Equivalent to generating:', ES: 'Equivalente a generar:' } as Record<L, string>,
  titles: { PT: 'Títulos e Ideias', EN: 'Titles & Ideas', ES: 'Títulos e Ideas' } as Record<L, string>,
  outlines: { PT: 'Esboços Médios', EN: 'Medium Outlines', ES: 'Esquemas Medios' } as Record<L, string>,
  sermons: { PT: 'Sermões Completos', EN: 'Full Sermons', ES: 'Sermones Completos' } as Record<L, string>,
  studies: { PT: 'Estudos Aprofundados', EN: 'Deep Studies', ES: 'Estudios Profundos' } as Record<L, string>,
  teamExtras: { PT: 'Membros da equipe extras', EN: 'Extra team members', ES: 'Miembros del equipo extras' } as Record<L, string>,
  included: { PT: 'incluídos', EN: 'included', ES: 'incluidos' } as Record<L, string>,
  perSeat: { PT: 'por membro extra/mês', EN: 'per extra member/month', ES: 'por miembro extra/mes' } as Record<L, string>,
};

const IGREJA_BASE_SEATS = 10;
const EXTRA_SEAT_PRICE_USD = 5.00;
const EXTRA_SEAT_PRICE_BRL = 15.00;
const EXTRA_SEAT_CREDITS = 2_000;

const plans = [
  {
    slug: 'free' as const, icon: BookOpen, featured: false,
    price: { monthly: 0, annual: 0 },
    cta: { PT: 'Começar grátis', EN: 'Start free', ES: 'Comenzar gratis' },
    href: '/cadastro',
    features: {
      PT: ['500 créditos/mês', 'Todas as ferramentas básicas', '14 ferramentas', 'Blog cristão básico'],
      EN: ['500 credits/month', 'All basic tools', '14 tools', 'Basic Christian blog'],
      ES: ['500 créditos/mes', 'Todas las herramientas básicas', '14 herramientas', 'Blog cristiano básico'],
    },
  },
  {
    slug: 'starter' as const, icon: Zap, featured: false,
    price: { monthly: 9.90, annual: 8.25 },
    cta: { PT: '7 dias grátis →', EN: '7 days free →', ES: '7 días gratis →' },
    href: '/cadastro',
    features: {
      PT: ['4.000 créditos/mês', 'Todas as ferramentas core + extras', 'Liberdade total de uso', 'Sem watermark'],
      EN: ['4,000 credits/month', 'All core + extra tools', 'Total freedom of use', 'No watermark'],
      ES: ['4.000 créditos/mes', 'Todas las herramientas core + extras', 'Libertad total de uso', 'Sin marca de agua'],
    },
  },
  {
    slug: 'pro' as const, icon: Brain, featured: true,
    price: { monthly: 29.90, annual: 24.92 },
    cta: { PT: 'Começar agora →', EN: 'Start now →', ES: 'Comenzar ahora →' },
    href: '/cadastro',
    features: {
      PT: ['8.000 créditos/mês', '🧠 Mentes Brilhantes', 'Ilustrações + Calendário', 'YouTube → Blog', 'Até 3 workspaces'],
      EN: ['8,000 credits/month', '🧠 Brilliant Minds', 'Illustrations + Calendar', 'YouTube → Blog', 'Up to 3 workspaces'],
      ES: ['8.000 créditos/mes', '🧠 Mentes Brillantes', 'Ilustraciones + Calendario', 'YouTube → Blog', 'Hasta 3 workspaces'],
    },
  },
  {
    slug: 'igreja' as const, icon: Building2, featured: false,
    price: { monthly: 79.90, annual: 66.58 },
    cta: { PT: 'Começar', EN: 'Get started', ES: 'Comenzar' },
    href: '/cadastro',
    features: {
      PT: ['20.000 créditos/mês', 'Até 10 usuários', 'Workspaces ilimitados', 'Multiportal', 'Suporte VIP'],
      EN: ['20,000 credits/month', 'Up to 10 users', 'Unlimited workspaces', 'Multi-portal', 'VIP Support'],
      ES: ['20.000 créditos/mes', 'Hasta 10 usuarios', 'Workspaces ilimitados', 'Multiportal', 'Soporte VIP'],
    },
  },
];

function CreditPotentialTooltip({ planSlug, lang }: { planSlug: PlanSlug; lang: L }) {
  const potential = PLAN_GENERATION_POTENTIAL[planSlug];
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted hover:bg-muted-foreground/20 transition-colors">
            <HelpCircle className="h-3 w-3 text-muted-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px] p-3 space-y-1.5">
          <p className="text-xs font-semibold">{labels.tooltipTitle[lang]}</p>
          <ul className="text-[11px] space-y-0.5 text-muted-foreground">
            <li>📝 {potential.titles.toLocaleString()} {labels.titles[lang]}</li>
            <li>📋 {potential.outlines.toLocaleString()} {labels.outlines[lang]}</li>
            <li>🎤 {potential.sermons.toLocaleString()} {labels.sermons[lang]}</li>
            <li>📖 {potential.studies.toLocaleString()} {labels.studies[lang]}</li>
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function TeamSeatsSelector({ lang, isBRL }: { lang: L; isBRL: boolean }) {
  const [extraSeats, setExtraSeats] = useState(0);
  const seatPrice = isBRL ? EXTRA_SEAT_PRICE_BRL : EXTRA_SEAT_PRICE_USD;
  const symbol = isBRL ? 'R$' : '$';
  const currency = isBRL ? 'BRL' : 'USD';
  const totalSeats = IGREJA_BASE_SEATS + extraSeats;
  const extraCredits = extraSeats * EXTRA_SEAT_CREDITS;

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Users className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-semibold">{labels.teamExtras[lang]}</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExtraSeats(Math.max(0, extraSeats - 1))}
            disabled={extraSeats === 0}
            className="w-7 h-7 rounded-lg border border-border bg-background flex items-center justify-center hover:bg-muted disabled:opacity-30 transition-colors"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="text-lg font-bold font-mono w-8 text-center">{totalSeats}</span>
          <button
            onClick={() => setExtraSeats(Math.min(40, extraSeats + 1))}
            className="w-7 h-7 rounded-lg border border-border bg-background flex items-center justify-center hover:bg-muted transition-colors"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
        <span className="text-[10px] text-muted-foreground">
          {IGREJA_BASE_SEATS} {labels.included[lang]}
        </span>
      </div>
      {extraSeats > 0 && (
        <div className="text-[10px] text-muted-foreground space-y-0.5 pt-1 border-t border-border/50">
          <p>+{extraSeats} × {formatPrice(seatPrice, symbol, currency)} {labels.perSeat[lang]}</p>
          <p className="text-primary font-semibold">+{extraCredits.toLocaleString()} {lang === 'PT' ? 'créditos extras' : lang === 'EN' ? 'extra credits' : 'créditos extras'}</p>
        </div>
      )}
    </div>
  );
}

export default function Pricing() {
  useForceLightTheme();
  const { lang } = useLanguage();
  const [isAnnual, setIsAnnual] = useState(false);
  const { pricing: geoPricing } = useGeoRegion();
  const pricing = geoPricing || { currency: 'USD', symbol: '$' };
  const isBRL = pricing.currency === 'BRL';

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
            const planKey = plan.slug as PlanSlug;
            const credits = PLAN_CREDITS[planKey];

            // Geo-aware pricing
            let displayPrice: string;
            if (plan.slug === 'free') {
              displayPrice = `${pricing.symbol}0`;
            } else {
              const key = plan.slug as 'starter' | 'pro' | 'igreja';
              const priceTable = isBRL ? PLAN_PRICES_BRL : PLAN_PRICES;
              const amount = isAnnual
                ? priceTable.annual[key] / 12
                : priceTable.monthly[key];
              displayPrice = formatPrice(amount, pricing.symbol, pricing.currency);
            }

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
                    <span className="text-3xl font-bold">{displayPrice}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{plan.slug === 'free' ? labels.forever[lang] : labels.month[lang]}</p>

                  {/* Credits badge + tooltip */}
                  <div className="flex items-center gap-1.5 mb-4">
                    <Badge variant="secondary" className="text-[10px]">{credits.toLocaleString()} {labels.credits[lang]}</Badge>
                    <CreditPotentialTooltip planSlug={plan.slug} lang={lang} />
                  </div>

                  <ul className="space-y-2 mb-4 flex-1">
                    {plan.features[lang].map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Team seats selector — only for Igreja */}
                  {plan.slug === 'igreja' && (
                    <div className="mb-4">
                      <TeamSeatsSelector lang={lang} isBRL={isBRL} />
                    </div>
                  )}

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
