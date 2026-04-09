import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Check, Crown, Sparkles, Brain, BookOpen, Zap, BarChart3, Loader2, Building2, HelpCircle, Minus, Plus, Users } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { formatPrice } from '@/utils/geoPricing';
import { useGeoRegion } from '@/hooks/useGeoRegion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useForceLightTheme } from '@/hooks/useForceLightTheme';
import { PLAN_CREDITS, PLAN_DISPLAY_NAMES, PLAN_GENERATION_POTENTIAL, LOW_CREDITS_THRESHOLD, type PlanSlug } from '@/lib/plans';
import { CreditUsageReport } from '@/components/dashboard/CreditUsageReport';
import { CreditTopUpButton } from '@/components/dashboard/CreditTopUpButton';

type L = 'PT' | 'EN' | 'ES';
type PlanKey = 'starter' | 'pro' | 'igreja';

const labels = {
  title: { PT: 'Sua Carteira de Créditos', EN: 'Your Credit Wallet', ES: 'Tu Cartera de Créditos' } as Record<L, string>,
  subtitle: { PT: 'Use seus créditos livremente em qualquer ferramenta.', EN: 'Use your credits freely on any tool.', ES: 'Usa tus créditos libremente en cualquier herramienta.' } as Record<L, string>,
  current: { PT: 'Plano atual', EN: 'Current plan', ES: 'Plan actual' } as Record<L, string>,
  popular: { PT: 'Mais escolhido', EN: 'Most popular', ES: 'Más elegido' } as Record<L, string>,
  cta: { PT: 'Começar agora', EN: 'Start now', ES: 'Comenzar ahora' } as Record<L, string>,
  ctaFree: { PT: 'Plano atual', EN: 'Current plan', ES: 'Plan actual' } as Record<L, string>,
  ctaTrial: { PT: '7 dias grátis →', EN: '7 days free →', ES: '7 días gratis →' } as Record<L, string>,
  ctaIgreja: { PT: 'Começar', EN: 'Get started', ES: 'Comenzar' } as Record<L, string>,
  month: { PT: '/mês', EN: '/month', ES: '/mes' } as Record<L, string>,
  forever: { PT: 'Para sempre', EN: 'Forever', ES: 'Para siempre' } as Record<L, string>,
  monthly: { PT: 'Mensal', EN: 'Monthly', ES: 'Mensual' } as Record<L, string>,
  annual: { PT: 'Anual', EN: 'Annual', ES: 'Anual' } as Record<L, string>,
  annualSave: { PT: '2 meses grátis', EN: '2 months free', ES: '2 meses gratis' } as Record<L, string>,
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

interface PlanData {
  id: string;
  planKey: PlanKey | null;
  name: Record<L, string>;
  icon: React.ElementType;
  features: Record<L, string[]>;
  featured: boolean;
  isFree: boolean;
  credits: number;
}

const plans: PlanData[] = [
  {
    id: 'free', planKey: null,
    name: PLAN_DISPLAY_NAMES.free,
    icon: BookOpen, featured: false, isFree: true,
    credits: PLAN_CREDITS.free,
    features: {
      PT: ['500 créditos/mês', 'Todas as ferramentas básicas', '6 ferramentas de pesquisa', '8 ferramentas de criação', 'Blog cristão básico'],
      EN: ['500 credits/month', 'All basic tools', '6 research tools', '8 creation tools', 'Basic Christian blog'],
      ES: ['500 créditos/mes', 'Todas las herramientas básicas', '6 herramientas de investigación', '8 herramientas de creación', 'Blog cristiano básico'],
    },
  },
  {
    id: 'starter', planKey: 'starter',
    name: PLAN_DISPLAY_NAMES.starter,
    icon: Zap, featured: false, isFree: false,
    credits: PLAN_CREDITS.starter,
    features: {
      PT: ['4.000 créditos/mês', 'Todas as ferramentas core + extras', 'Liberdade total de uso', 'Sem watermark', 'Biblioteca com 100 itens'],
      EN: ['4,000 credits/month', 'All core + extra tools', 'Total freedom of use', 'No watermark', 'Library with 100 items'],
      ES: ['4.000 créditos/mes', 'Todas las herramientas core + extras', 'Libertad total de uso', 'Sin marca de agua', 'Biblioteca con 100 ítems'],
    },
  },
  {
    id: 'pro', planKey: 'pro',
    name: PLAN_DISPLAY_NAMES.pro,
    icon: Brain, featured: true, isFree: false,
    credits: PLAN_CREDITS.pro,
    features: {
      PT: ['8.000 créditos/mês', 'Tudo do Starter +', '🧠 Mentes Brilhantes', 'Ilustrações para sermões', 'Calendário editorial', 'YouTube → Blog', 'Até 3 workspaces', 'Equipe até 3 usuários'],
      EN: ['8,000 credits/month', 'Everything in Starter +', '🧠 Brilliant Minds', 'Sermon illustrations', 'Editorial calendar', 'YouTube → Blog', 'Up to 3 workspaces', 'Team up to 3 users'],
      ES: ['8.000 créditos/mes', 'Todo del Starter +', '🧠 Mentes Brillantes', 'Ilustraciones para sermones', 'Calendario editorial', 'YouTube → Blog', 'Hasta 3 workspaces', 'Equipo hasta 3 usuarios'],
    },
  },
  {
    id: 'igreja', planKey: 'igreja',
    name: PLAN_DISPLAY_NAMES.igreja,
    icon: Building2, featured: false, isFree: false,
    credits: PLAN_CREDITS.igreja,
    features: {
      PT: ['20.000 créditos/mês', 'Tudo do Pro +', 'Até 10 usuários incluídos', 'Workspaces ilimitados', 'Multiportal (5 portais)', 'White-label parcial', 'Automação avançada', 'Suporte VIP (4h)'],
      EN: ['20,000 credits/month', 'Everything in Pro +', 'Up to 10 users included', 'Unlimited workspaces', 'Multi-portal (5 portals)', 'Partial white-label', 'Advanced automation', 'VIP Support (4h)'],
      ES: ['20.000 créditos/mes', 'Todo del Pro +', 'Hasta 10 usuarios incluidos', 'Workspaces ilimitados', 'Multiportal (5 portales)', 'White-label parcial', 'Automatización avanzada', 'Soporte VIP (4h)'],
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

export default function Upgrade() {
  useForceLightTheme();
  const { lang } = useLanguage();
  const { profile } = useAuth();
  const { pricing, loading: regionLoading } = useGeoRegion();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPlan = (profile?.plan as PlanSlug) || 'free';
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [isAnnual, setIsAnnual] = useState(false);
  const autoCheckoutFired = useRef(false);

  const used = profile?.generations_used || 0;
  const limit = PLAN_CREDITS[currentPlan] || 500;
  const remaining = Math.max(limit - used, 0);
  const showTopUp = remaining < LOW_CREDITS_THRESHOLD;

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
      const interval = isAnnual ? 'annual' : 'monthly';
      const priceSource = isAnnual ? pricing.annual : pricing.plans;
      const priceId = priceSource[plan.planKey].id;

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId,
          plan: plan.planKey,
          interval,
          success_url: `${window.location.origin}/dashboard?upgraded=true`,
          cancel_url: `${window.location.origin}/upgrade`,
        },
      });

      if (error) {
        const errMsg: Record<L, { title: string; desc: string }> = {
          PT: { title: 'Ops, contratempo na tesouraria', desc: 'Nosso sistema de pagamento encontrou um problema. Tente novamente.' },
          EN: { title: 'Oops, payment hiccup', desc: 'Our payment system encountered an issue. Please try again.' },
          ES: { title: 'Ups, contratiempo en el pago', desc: 'Nuestro sistema de pago encontró un problema. Intenta de nuevo.' },
        };
        toast({ title: errMsg[lang].title, description: errMsg[lang].desc, variant: 'destructive' });
        return;
      }
      if (data?.checkout_url) window.location.href = data.checkout_url;
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
    const priceSource = isAnnual ? pricing.annual : pricing.plans;
    const amount = isAnnual
      ? priceSource[plan.planKey].amount / 12
      : priceSource[plan.planKey].amount;
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

                <div className="flex items-center gap-1.5 mb-4">
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <BarChart3 className="h-3 w-3" />
                    {plan.credits.toLocaleString()} {labels.credits[lang]}
                  </Badge>
                  <CreditPotentialTooltip planSlug={plan.id as PlanSlug} lang={lang} />
                </div>

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

      {showTopUp && (
        <div className="max-w-md mx-auto mt-6">
          <CreditTopUpButton />
        </div>
      )}

      <div className="mt-8">
        <CreditUsageReport />
      </div>
    </div>
  );
}
