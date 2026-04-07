import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Check, Crown, Sparkles, Users, Brain, BookOpen, Zap, BarChart3, Loader2, Building2 } from 'lucide-react';
import { formatPrice } from '@/utils/geoPricing';
import { useGeoRegion } from '@/hooks/useGeoRegion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useForceLightTheme } from '@/hooks/useForceLightTheme';
import { PLAN_CREDITS, PLAN_DISPLAY_NAMES, PLAN_PRICES_BRL, type PlanSlug } from '@/lib/plans';

type L = 'PT' | 'EN' | 'ES';
type PlanKey = 'starter' | 'pro' | 'igreja';

const labels = {
  title: { PT: 'Escolha seu plano de produção', EN: 'Choose your production plan', ES: 'Elige tu plan de producción' } as Record<L, string>,
  subtitle: { PT: 'Escale sua produção pastoral. Sem créditos técnicos, sem complicação.', EN: 'Scale your pastoral production. No technical credits, no hassle.', ES: 'Escala tu producción pastoral. Sin créditos técnicos, sin complicación.' } as Record<L, string>,
  current: { PT: 'Plano atual', EN: 'Current plan', ES: 'Plan actual' } as Record<L, string>,
  popular: { PT: 'Mais escolhido', EN: 'Most popular', ES: 'Más elegido' } as Record<L, string>,
  cta: { PT: 'Começar agora', EN: 'Start now', ES: 'Comenzar ahora' } as Record<L, string>,
  ctaFree: { PT: 'Plano atual', EN: 'Current plan', ES: 'Plan actual' } as Record<L, string>,
  ctaTrial: { PT: '7 dias grátis →', EN: '7 days free →', ES: '7 días gratis →' } as Record<L, string>,
  ctaIgreja: { PT: 'Começar', EN: 'Get started', ES: 'Comenzar' } as Record<L, string>,
  month: { PT: '/mês', EN: '/month', ES: '/mes' } as Record<L, string>,
  forever: { PT: 'Para sempre', EN: 'Forever', ES: 'Para siempre' } as Record<L, string>,
  extraSeats: { PT: 'Membros da equipe extras', EN: 'Extra team members', ES: 'Miembros del equipo extras' } as Record<L, string>,
  perSeat: { PT: 'por assento extra', EN: 'per extra seat', ES: 'por asiento extra' } as Record<L, string>,
  included: { PT: '10 incluídos', EN: '10 included', ES: '10 incluidos' } as Record<L, string>,
  capacityBoost: { PT: 'de capacidade extra', EN: 'extra capacity', ES: 'de capacidad extra' } as Record<L, string>,
  monthly: { PT: 'Mensal', EN: 'Monthly', ES: 'Mensual' } as Record<L, string>,
  annual: { PT: 'Anual', EN: 'Annual', ES: 'Anual' } as Record<L, string>,
  annualSave: { PT: '2 meses grátis', EN: '2 months free', ES: '2 meses gratis' } as Record<L, string>,
  credits: { PT: 'créditos/mês', EN: 'credits/month', ES: 'créditos/mes' } as Record<L, string>,
};

interface PlanData {
  id: string;
  planKey: PlanKey | null;
  name: Record<L, string>;
  icon: React.ElementType;
  features: Record<L, string[]>;
  featured: boolean;
  capacity: Record<L, string>;
  sermonsMonth: Record<L, string>;
  isFree: boolean;
  credits: number;
}

const plans: PlanData[] = [
  {
    id: 'free', planKey: null,
    name: PLAN_DISPLAY_NAMES.free,
    icon: BookOpen, featured: false, isFree: true,
    credits: PLAN_CREDITS.free,
    capacity: { PT: 'Uso básico', EN: 'Basic usage', ES: 'Uso básico' },
    sermonsMonth: { PT: '1 uso/mês por ferramenta', EN: '1 use/month per tool', ES: '1 uso/mes por herramienta' },
    features: {
      PT: ['150 créditos/mês', '1 uso/mês por ferramenta', '6 ferramentas de pesquisa', '8 ferramentas de criação', 'Blog cristão básico'],
      EN: ['150 credits/month', '1 use/month per tool', '6 research tools', '8 creation tools', 'Basic Christian blog'],
      ES: ['150 créditos/mes', '1 uso/mes por herramienta', '6 herramientas de investigación', '8 herramientas de creación', 'Blog cristiano básico'],
    },
  },
  {
    id: 'starter', planKey: 'starter',
    name: PLAN_DISPLAY_NAMES.starter,
    icon: Zap, featured: false, isFree: false,
    credits: PLAN_CREDITS.starter,
    capacity: { PT: 'Produção semanal', EN: 'Weekly production', ES: 'Producción semanal' },
    sermonsMonth: { PT: '3.000 créditos/mês', EN: '3,000 credits/month', ES: '3.000 créditos/mes' },
    features: {
      PT: ['3.000 créditos/mês', 'Todas as ferramentas core', '+ 9 ferramentas extras', 'Uso ilimitado por ferramenta', 'Sem watermark', 'Biblioteca com 100 itens'],
      EN: ['3,000 credits/month', 'All core tools', '+ 9 extra tools', 'Unlimited use per tool', 'No watermark', 'Library with 100 items'],
      ES: ['3.000 créditos/mes', 'Todas las herramientas core', '+ 9 herramientas extras', 'Uso ilimitado por herramienta', 'Sin marca de agua', 'Biblioteca con 100 ítems'],
    },
  },
  {
    id: 'pro', planKey: 'pro',
    name: PLAN_DISPLAY_NAMES.pro,
    icon: Brain, featured: true, isFree: false,
    credits: PLAN_CREDITS.pro,
    capacity: { PT: 'Produção completa', EN: 'Full production', ES: 'Producción completa' },
    sermonsMonth: { PT: '10.000 créditos/mês', EN: '10,000 credits/month', ES: '10.000 créditos/mes' },
    features: {
      PT: ['10.000 créditos/mês', 'Tudo do Starter +', '🧠 Mentes Brilhantes', 'Ilustrações para sermões', 'Calendário editorial', 'YouTube → Blog', 'Até 3 workspaces', 'Equipe até 3 usuários'],
      EN: ['10,000 credits/month', 'Everything in Starter +', '🧠 Brilliant Minds', 'Sermon illustrations', 'Editorial calendar', 'YouTube → Blog', 'Up to 3 workspaces', 'Team up to 3 users'],
      ES: ['10.000 créditos/mes', 'Todo del Starter +', '🧠 Mentes Brillantes', 'Ilustraciones para sermones', 'Calendario editorial', 'YouTube → Blog', 'Hasta 3 workspaces', 'Equipo hasta 3 usuarios'],
    },
  },
  {
    id: 'igreja', planKey: 'igreja',
    name: PLAN_DISPLAY_NAMES.igreja,
    icon: Building2, featured: false, isFree: false,
    credits: PLAN_CREDITS.igreja,
    capacity: { PT: 'Escala ministerial', EN: 'Ministry scale', ES: 'Escala ministerial' },
    sermonsMonth: { PT: '30.000 créditos/mês', EN: '30,000 credits/month', ES: '30.000 créditos/mes' },
    features: {
      PT: ['30.000 créditos/mês', 'Tudo do Pro +', 'Até 10 usuários incluídos', 'Workspaces ilimitados', 'Multiportal (5 portais)', 'White-label parcial', 'Automação avançada', 'Suporte VIP (4h)'],
      EN: ['30,000 credits/month', 'Everything in Pro +', 'Up to 10 users included', 'Unlimited workspaces', 'Multi-portal (5 portals)', 'Partial white-label', 'Advanced automation', 'VIP Support (4h)'],
      ES: ['30.000 créditos/mes', 'Todo del Pro +', 'Hasta 10 usuarios incluidos', 'Workspaces ilimitados', 'Multiportal (5 portales)', 'White-label parcial', 'Automatización avanzada', 'Soporte VIP (4h)'],
    },
  },
];

export default function Upgrade() {
  useForceLightTheme();
  const { lang } = useLanguage();
  const { profile } = useAuth();
  const { pricing, loading: regionLoading } = useGeoRegion();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPlan = (profile?.plan as PlanSlug) || 'free';
  const [extraSeats, setExtraSeats] = useState(0);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [isAnnual, setIsAnnual] = useState(false);
  const autoCheckoutFired = useRef(false);

  const igrejaTotal = useMemo(() => {
    if (!pricing) return 0;
    const base = pricing.plans.igreja.amount;
    return base + extraSeats * pricing.addon.amount;
  }, [extraSeats, pricing]);

  const autoCheckoutPlan = searchParams.get('autoCheckout');
  const isAutoCheckout = !!autoCheckoutPlan && !autoCheckoutFired.current;

  useEffect(() => {
    if (!autoCheckoutPlan || autoCheckoutFired.current || !pricing) return;
    autoCheckoutFired.current = true;
    const targetPlan = plans.find(p => p.planKey === autoCheckoutPlan);
    if (targetPlan && !targetPlan.isFree) {
      setSearchParams({}, { replace: true });
      setTimeout(() => handleSubscribe(targetPlan), 300);
    }
  }, [searchParams, pricing]);

  const handleSubscribe = async (plan: PlanData) => {
    if (!plan.planKey || plan.isFree || !pricing) return;

    setLoadingPlan(plan.id);
    try {
      const priceSource = isAnnual ? pricing.annual : pricing.plans;
      const body: Record<string, unknown> = {
        priceId: priceSource[plan.planKey].id,
        successUrl: `${window.location.origin}/dashboard?checkout_success=true`,
        cancelUrl: `${window.location.origin}/upgrade`,
      };

      if (plan.planKey === 'igreja' && extraSeats > 0) {
        body.extraSeats = extraSeats;
        body.stripeAddonPriceId = pricing.addon.id;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', { body });

      if (error) {
        const errMsg: Record<L, { title: string; desc: string }> = {
          PT: { title: 'Ops, contratempo na tesouraria', desc: 'Nosso sistema de pagamento encontrou um problema. Você pode tentar novamente ou assinar depois em Configurações > Assinatura.' },
          EN: { title: 'Oops, payment hiccup', desc: 'Our payment system encountered an issue. You can try again or subscribe later in Settings > Subscription.' },
          ES: { title: 'Ups, contratiempo en el pago', desc: 'Nuestro sistema de pago encontró un problema. Puedes intentar de nuevo o suscribirte después en Configuraciones > Suscripción.' },
        };
        toast({ title: errMsg[lang].title, description: errMsg[lang].desc, variant: 'destructive' });
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Checkout error';
      toast({ title: 'Erro', description: message, variant: 'destructive' });
    } finally {
      setLoadingPlan(null);
    }
  };

  if (regionLoading || isAutoCheckout || loadingPlan) {
    const loadingLabels = {
      PT: 'Preparando sua assinatura Living Word…',
      EN: 'Preparing your Living Word subscription…',
      ES: 'Preparando tu suscripción Living Word…',
    };
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4" style={{ backgroundColor: 'hsl(37, 33%, 96%)' }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'hsl(28, 42%, 42%, 0.1)' }}>
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'hsl(28, 42%, 42%)' }} />
        </div>
        <p className="text-lg font-medium animate-pulse" style={{ color: 'hsl(24, 30%, 30%)' }}>{loadingLabels[lang]}</p>
      </div>
    );
  }

  const getDisplayPrice = (plan: PlanData) => {
    if (plan.isFree) return `${pricing.symbol}0`;
    if (!plan.planKey) return '';
    const isBRL = pricing.currency === 'BRL';

    if (plan.planKey === 'igreja') {
      const addonAmt = isBRL ? 19.00 : pricing.addon.amount;
      let base: number;
      if (isBRL) {
        base = isAnnual ? PLAN_PRICES_BRL.annual.igreja / 12 : PLAN_PRICES_BRL.monthly.igreja;
        base += extraSeats * addonAmt;
      } else {
        base = isAnnual ? igrejaTotal * 10 / 12 : igrejaTotal;
      }
      return formatPrice(base, pricing.symbol, pricing.currency);
    }

    const amount = isBRL
      ? isAnnual ? PLAN_PRICES_BRL.annual[plan.planKey] / 12 : PLAN_PRICES_BRL.monthly[plan.planKey]
      : isAnnual ? pricing.plans[plan.planKey].amount * 10 / 12 : pricing.plans[plan.planKey].amount;
    return formatPrice(amount, pricing.symbol, pricing.currency);
  };

  const getCta = (plan: PlanData) => {
    if (plan.planKey === 'starter') return labels.ctaTrial[lang];
    if (plan.planKey === 'igreja') return labels.ctaIgreja[lang];
    if (plan.planKey === 'pro') return labels.cta[lang];
    return labels.ctaFree[lang];
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="text-center">
        <Sparkles className="h-10 w-10 text-primary mx-auto mb-4" />
        <h1 className="font-display text-2xl sm:text-4xl font-bold text-foreground">{labels.title[lang]}</h1>
        <p className="text-muted-foreground mt-2 max-w-lg mx-auto">{labels.subtitle[lang]}</p>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3">
        <span className={`text-sm font-medium ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>{labels.monthly[lang]}</span>
        <Switch checked={isAnnual} onCheckedChange={setIsAnnual} />
        <span className={`text-sm font-medium ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>{labels.annual[lang]}</span>
        {isAnnual && (
          <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">{labels.annualSave[lang]}</Badge>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = currentPlan === plan.id;
          const isLoading = loadingPlan === plan.id;

          return (
            <Card
              key={plan.id}
              className={`relative overflow-hidden flex flex-col ${
                plan.featured
                  ? 'border-primary ring-1 ring-primary/30 shadow-lg'
                  : isCurrent
                  ? 'border-accent/50'
                  : 'border-border/60'
              }`}
            >
              {plan.featured && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent" />
              )}
              <CardContent className="p-5 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="font-display text-lg font-semibold">{plan.name[lang]}</h3>
                  </div>
                  {plan.featured && (
                    <Badge className="text-[10px] bg-primary text-primary-foreground">{labels.popular[lang]}</Badge>
                  )}
                  {isCurrent && (
                    <Badge variant="outline" className="text-[10px]">{labels.current[lang]}</Badge>
                  )}
                </div>

                <div className="flex items-baseline gap-0.5 mb-1">
                  <span className="text-3xl font-bold">{getDisplayPrice(plan)}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  {plan.isFree ? labels.forever[lang] : labels.month[lang]}
                </p>

                <Badge variant="secondary" className="text-[10px] mb-4 self-start gap-1">
                  <BarChart3 className="h-3 w-3" />
                  {plan.credits.toLocaleString()} {labels.credits[lang]}
                </Badge>

                {/* Igreja plan slider */}
                {plan.planKey === 'igreja' && (
                  <div className="rounded-lg border border-border/60 bg-muted/30 p-3 mb-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">{labels.extraSeats[lang]}</span>
                      <span className="font-mono font-bold text-foreground">{extraSeats}</span>
                    </div>
                    <Slider
                      value={[extraSeats]}
                      onValueChange={([v]) => setExtraSeats(v)}
                      min={0}
                      max={40}
                      step={1}
                      className="py-1"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{labels.included[lang]}</span>
                      {extraSeats > 0 && (
                        <span className="text-primary font-semibold">
                          +{extraSeats * 10}% {labels.capacityBoost[lang]}
                        </span>
                      )}
                    </div>
                    {extraSeats > 0 && (() => {
                      const addonAmount = pricing.currency === 'BRL' ? 19.00 : pricing.addon.amount;
                      return (
                        <p className="text-[11px] text-muted-foreground">
                          +{formatPrice(addonAmount, pricing.symbol, pricing.currency)} {labels.perSeat[lang]} × {extraSeats} = +{formatPrice(extraSeats * addonAmount, pricing.symbol, pricing.currency)}
                        </p>
                      );
                    })()}
                  </div>
                )}

                <ul className="space-y-2 mb-5 flex-1">
                  {plan.features[lang].map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full gap-1.5 min-h-[48px]"
                  variant={plan.featured ? 'default' : isCurrent ? 'outline' : 'secondary'}
                  disabled={isCurrent || isLoading}
                  onClick={() => handleSubscribe(plan)}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isCurrent ? (
                    labels.ctaFree[lang]
                  ) : plan.isFree ? (
                    labels.ctaFree[lang]
                  ) : (
                    <>
                      <Crown className="h-4 w-4" />
                      {getCta(plan)}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
