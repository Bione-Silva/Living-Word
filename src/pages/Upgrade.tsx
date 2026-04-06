import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Check, Crown, Sparkles, Users, Brain, BookOpen, Zap, BarChart3, Loader2, AlertCircle } from 'lucide-react';
import { formatPrice } from '@/utils/geoPricing';
import { useGeoRegion } from '@/hooks/useGeoRegion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useForceLightTheme } from '@/hooks/useForceLightTheme';

type L = 'PT' | 'EN' | 'ES';
type PlanKey = 'starter' | 'pro' | 'church';

const labels = {
  title: { PT: 'Escolha seu plano de produção', EN: 'Choose your production plan', ES: 'Elige tu plan de producción' } as Record<L, string>,
  subtitle: { PT: 'Escale sua produção pastoral. Sem créditos técnicos, sem complicação.', EN: 'Scale your pastoral production. No technical credits, no hassle.', ES: 'Escala tu producción pastoral. Sin créditos técnicos, sin complicación.' } as Record<L, string>,
  current: { PT: 'Plano atual', EN: 'Current plan', ES: 'Plan actual' } as Record<L, string>,
  popular: { PT: 'Mais escolhido', EN: 'Most popular', ES: 'Más elegido' } as Record<L, string>,
  cta: { PT: 'Assinar agora', EN: 'Subscribe now', ES: 'Suscribirse ahora' } as Record<L, string>,
  ctaFree: { PT: 'Plano atual', EN: 'Current plan', ES: 'Plan actual' } as Record<L, string>,
  ctaTrial: { PT: '7 dias grátis', EN: '7 days free', ES: '7 días gratis' } as Record<L, string>,
  month: { PT: '/mês', EN: '/month', ES: '/mes' } as Record<L, string>,
  forever: { PT: 'Para sempre', EN: 'Forever', ES: 'Para siempre' } as Record<L, string>,
  extraSeats: { PT: 'Membros da equipe extras', EN: 'Extra team members', ES: 'Miembros del equipo extras' } as Record<L, string>,
  perSeat: { PT: 'por assento extra', EN: 'per extra seat', ES: 'por asiento extra' } as Record<L, string>,
  totalPrice: { PT: 'Preço total', EN: 'Total price', ES: 'Precio total' } as Record<L, string>,
  included: { PT: '10 incluídos', EN: '10 included', ES: '10 incluidos' } as Record<L, string>,
  capacityBoost: { PT: 'de capacidade extra', EN: 'extra capacity', ES: 'de capacidad extra' } as Record<L, string>,
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
}

const plans: PlanData[] = [
  {
    id: 'free', planKey: null,
    name: { PT: 'Grátis', EN: 'Free', ES: 'Gratis' },
    icon: BookOpen, featured: false, isFree: true,
    capacity: { PT: 'Uso básico', EN: 'Basic usage', ES: 'Uso básico' },
    sermonsMonth: { PT: '5 gerações/mês', EN: '5 generations/month', ES: '5 generaciones/mes' },
    features: {
      PT: ['5 gerações/mês', 'Sermão + esboço', '1 artigo devocional/mês', 'Blog cristão no ar'],
      EN: ['5 generations/month', 'Sermon + outline', '1 devotional article/month', 'Christian blog live'],
      ES: ['5 generaciones/mes', 'Sermón + bosquejo', '1 artículo devocional/mes', 'Blog cristiano en línea'],
    },
  },
  {
    id: 'starter', planKey: 'starter',
    name: { PT: 'Starter', EN: 'Starter', ES: 'Starter' },
    icon: Zap, featured: false, isFree: false,
    capacity: { PT: 'Produção semanal', EN: 'Weekly production', ES: 'Producción semanal' },
    sermonsMonth: { PT: 'Até 15 sermões/mês', EN: 'Up to 15 sermons/month', ES: 'Hasta 15 sermones/mes' },
    features: {
      PT: ['Até 15 sermões/mês', 'Até 50 conteúdos', 'Todos os 7+ formatos', 'Publicação automática', 'Sem watermark'],
      EN: ['Up to 15 sermons/month', 'Up to 50 contents', 'All 7+ formats', 'Auto-publishing', 'No watermark'],
      ES: ['Hasta 15 sermones/mes', 'Hasta 50 contenidos', 'Los 7+ formatos', 'Publicación automática', 'Sin marca de agua'],
    },
  },
  {
    id: 'pro', planKey: 'pro',
    name: { PT: 'Pro', EN: 'Pro', ES: 'Pro' },
    icon: Brain, featured: true, isFree: false,
    capacity: { PT: 'Produção completa', EN: 'Full production', ES: 'Producción completa' },
    sermonsMonth: { PT: 'Até 60 sermões/mês', EN: 'Up to 60 sermons/month', ES: 'Hasta 60 sermones/mes' },
    features: {
      PT: ['Até 60 sermões/mês', 'Produção completa semanal', 'Mentes Brilhantes', 'Estudo bíblico profundo', 'Séries automáticas', 'Calendário editorial'],
      EN: ['Up to 60 sermons/month', 'Full weekly production', 'Brilliant Minds', 'Deep Bible study', 'Automatic series', 'Editorial calendar'],
      ES: ['Hasta 60 sermones/mes', 'Producción completa semanal', 'Mentes Brillantes', 'Estudio bíblico profundo', 'Series automáticas', 'Calendario editorial'],
    },
  },
  {
    id: 'church', planKey: 'church',
    name: { PT: 'Igreja', EN: 'Church', ES: 'Iglesia' },
    icon: Users, featured: false, isFree: false,
    capacity: { PT: 'Escala ministerial', EN: 'Ministry scale', ES: 'Escala ministerial' },
    sermonsMonth: { PT: 'Produção compartilhada', EN: 'Shared production', ES: 'Producción compartida' },
    features: {
      PT: ['Até 10 usuários incluídos', 'Produção compartilhada', 'Fluxo editorial completo', 'Múltiplos blogs', 'Analytics da equipe'],
      EN: ['Up to 10 users included', 'Shared production', 'Full editorial workflow', 'Multiple blogs', 'Team analytics'],
      ES: ['Hasta 10 usuarios incluidos', 'Producción compartida', 'Flujo editorial completo', 'Múltiples blogs', 'Analytics del equipo'],
    },
  },
];

export default function Upgrade() {
  useForceLightTheme();
  const { lang } = useLanguage();
  const { profile } = useAuth();
  const { pricing, loading: regionLoading } = useGeoRegion();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPlan = profile?.plan || 'free';
  const [extraSeats, setExtraSeats] = useState(0);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const autoCheckoutFired = useRef(false);

  const churchTotal = useMemo(() => {
    if (!pricing) return 0;
    const base = pricing.plans.church.amount;
    return base + extraSeats * pricing.addon.amount;
  }, [extraSeats, pricing]);

  const autoCheckoutPlan = searchParams.get('autoCheckout');
  const isAutoCheckout = !!autoCheckoutPlan && !autoCheckoutFired.current;

  // Auto-checkout from landing page flow (wait for pricing to load)
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
      const body: Record<string, unknown> = {
        priceId: pricing.plans[plan.planKey].id,
        successUrl: `${window.location.origin}/dashboard?checkout_success=true`,
        cancelUrl: `${window.location.origin}/upgrade`,
      };

      if (plan.planKey === 'church' && extraSeats > 0) {
        body.extraSeats = extraSeats;
        body.stripeAddonPriceId = pricing.addon.id;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', { body });

      if (error) {
        console.warn('[Stripe Bypass] Checkout failed:', error);
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

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="text-center">
        <Sparkles className="h-10 w-10 text-primary mx-auto mb-4" />
        <h1 className="font-display text-3xl sm:text-4xl font-bold">{labels.title[lang]}</h1>
        <p className="text-muted-foreground mt-2 max-w-lg mx-auto">{labels.subtitle[lang]}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = currentPlan === plan.id;
          const isLoading = loadingPlan === plan.id;

          const displayPrice = plan.isFree
            ? `${pricing.symbol}0`
            : plan.planKey
            ? formatPrice(
                plan.planKey === 'church' ? churchTotal : pricing.plans[plan.planKey].amount,
                pricing.symbol,
                pricing.currency
              )
            : '';

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
                  <span className="text-3xl font-bold">{displayPrice}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  {plan.isFree ? labels.forever[lang] : labels.month[lang]}
                </p>
                <Badge variant="secondary" className="text-[10px] mb-4 self-start gap-1">
                  <BarChart3 className="h-3 w-3" />
                  {plan.capacity[lang]}
                </Badge>

                <p className="text-sm font-semibold text-foreground mb-3">{plan.sermonsMonth[lang]}</p>

                {/* Church plan slider */}
                {plan.planKey === 'church' && (
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
                    {extraSeats > 0 && (
                      <p className="text-[11px] text-muted-foreground">
                        +{formatPrice(pricing.addon.amount, pricing.symbol, pricing.currency)} {labels.perSeat[lang]} × {extraSeats} = +{formatPrice(extraSeats * pricing.addon.amount, pricing.symbol, pricing.currency)}
                      </p>
                    )}
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
                      {plan.planKey === 'starter' ? labels.ctaTrial[lang] : labels.cta[lang]}
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
