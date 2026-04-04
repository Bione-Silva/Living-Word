import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Check, Crown, Sparkles, Users, Plus, Minus, Brain, BookOpen, Zap, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

type L = 'PT' | 'EN' | 'ES';

const labels = {
  title: { PT: 'Escolha seu plano de produção', EN: 'Choose your production plan', ES: 'Elige tu plan de producción' } as Record<L, string>,
  subtitle: { PT: 'Escale sua produção pastoral. Sem créditos técnicos, sem complicação.', EN: 'Scale your pastoral production. No technical credits, no hassle.', ES: 'Escala tu producción pastoral. Sin créditos técnicos, sin complicación.' } as Record<L, string>,
  current: { PT: 'Plano atual', EN: 'Current plan', ES: 'Plan actual' } as Record<L, string>,
  popular: { PT: 'Mais escolhido', EN: 'Most popular', ES: 'Más elegido' } as Record<L, string>,
  cta: { PT: 'Começar teste grátis', EN: 'Start free trial', ES: 'Iniciar prueba gratis' } as Record<L, string>,
  ctaFree: { PT: 'Plano atual', EN: 'Current plan', ES: 'Plan actual' } as Record<L, string>,
  month: { PT: '/mês', EN: '/month', ES: '/mes' } as Record<L, string>,
  forever: { PT: 'Para sempre', EN: 'Forever', ES: 'Para siempre' } as Record<L, string>,
  users: { PT: 'usuários', EN: 'users', ES: 'usuarios' } as Record<L, string>,
  capacity: { PT: 'Capacidade', EN: 'Capacity', ES: 'Capacidad' } as Record<L, string>,
  addUser: { PT: 'Adicionar usuário', EN: 'Add user', ES: 'Agregar usuario' } as Record<L, string>,
  extraUserCost: { PT: '+R$9,90 por usuário extra', EN: '+R$9.90 per extra user', ES: '+R$9,90 por usuario extra' } as Record<L, string>,
  included: { PT: 'incluídos', EN: 'included', ES: 'incluidos' } as Record<L, string>,
  extra: { PT: 'extras', EN: 'extras', ES: 'extras' } as Record<L, string>,
  churchExpand: { PT: 'Adicione usuários extras conforme sua equipe cresce', EN: 'Add extra users as your team grows', ES: 'Agrega usuarios extras a medida que tu equipo crece' } as Record<L, string>,
  compare: { PT: 'Comparação completa', EN: 'Full comparison', ES: 'Comparación completa' } as Record<L, string>,
};

interface PlanData {
  id: string;
  name: Record<L, string>;
  price: string;
  priceNum: number;
  period: 'forever' | 'month';
  icon: React.ElementType;
  features: Record<L, string[]>;
  featured: boolean;
  capacity: Record<L, string>;
  sermonsMonth: Record<L, string>;
}

const plans: PlanData[] = [
  {
    id: 'free', name: { PT: 'Grátis', EN: 'Free', ES: 'Gratis' },
    price: 'R$0', priceNum: 0, period: 'forever', icon: BookOpen, featured: false,
    capacity: { PT: 'Uso básico', EN: 'Basic usage', ES: 'Uso básico' },
    sermonsMonth: { PT: '5 gerações/mês', EN: '5 generations/month', ES: '5 generaciones/mes' },
    features: {
      PT: ['5 gerações/mês', 'Sermão + esboço', '1 artigo devocional/mês', 'Blog cristão no ar'],
      EN: ['5 generations/month', 'Sermon + outline', '1 devotional article/month', 'Christian blog live'],
      ES: ['5 generaciones/mes', 'Sermón + bosquejo', '1 artículo devocional/mes', 'Blog cristiano en línea'],
    },
  },
  {
    id: 'starter', name: { PT: 'Starter', EN: 'Starter', ES: 'Starter' },
    price: 'R$9,90', priceNum: 9.90, period: 'month', icon: Zap, featured: false,
    capacity: { PT: 'Produção semanal', EN: 'Weekly production', ES: 'Producción semanal' },
    sermonsMonth: { PT: 'Até 15 sermões/mês', EN: 'Up to 15 sermons/month', ES: 'Hasta 15 sermones/mes' },
    features: {
      PT: ['Até 15 sermões/mês', 'Até 50 conteúdos', 'Todos os 7+ formatos', 'Publicação automática', 'Sem watermark'],
      EN: ['Up to 15 sermons/month', 'Up to 50 contents', 'All 7+ formats', 'Auto-publishing', 'No watermark'],
      ES: ['Hasta 15 sermones/mes', 'Hasta 50 contenidos', 'Los 7+ formatos', 'Publicación automática', 'Sin marca de agua'],
    },
  },
  {
    id: 'pro', name: { PT: 'Pro', EN: 'Pro', ES: 'Pro' },
    price: 'R$29,90', priceNum: 29.90, period: 'month', icon: Brain, featured: true,
    capacity: { PT: 'Produção completa', EN: 'Full production', ES: 'Producción completa' },
    sermonsMonth: { PT: 'Até 60 sermões/mês', EN: 'Up to 60 sermons/month', ES: 'Hasta 60 sermones/mes' },
    features: {
      PT: ['Até 60 sermões/mês', 'Produção completa semanal', 'Mentes Brilhantes', 'Estudo bíblico profundo', 'Séries automáticas', 'Calendário editorial'],
      EN: ['Up to 60 sermons/month', 'Full weekly production', 'Brilliant Minds', 'Deep Bible study', 'Automatic series', 'Editorial calendar'],
      ES: ['Hasta 60 sermones/mes', 'Producción completa semanal', 'Mentes Brillantes', 'Estudio bíblico profundo', 'Series automáticas', 'Calendario editorial'],
    },
  },
  {
    id: 'church', name: { PT: 'Igreja', EN: 'Church', ES: 'Iglesia' },
    price: 'R$79,90', priceNum: 79.90, period: 'month', icon: Users, featured: false,
    capacity: { PT: 'Escala ministerial', EN: 'Ministry scale', ES: 'Escala ministerial' },
    sermonsMonth: { PT: 'Produção compartilhada', EN: 'Shared production', ES: 'Producción compartida' },
    features: {
      PT: ['Até 10 usuários incluídos', 'Produção compartilhada', 'Fluxo editorial completo', 'Múltiplos blogs', 'Analytics da equipe'],
      EN: ['Up to 10 users included', 'Shared production', 'Full editorial workflow', 'Multiple blogs', 'Team analytics'],
      ES: ['Hasta 10 usuarios incluidos', 'Producción compartida', 'Flujo editorial completo', 'Múltiples blogs', 'Analytics del equipo'],
    },
  },
];

function ChurchExpansionCard({ lang }: { lang: L }) {
  const [extraUsers, setExtraUsers] = useState(0);
  const baseUsers = 10;
  const basePrice = 79.90;
  const perUser = 9.90;
  const totalUsers = baseUsers + extraUsers;
  const totalPrice = basePrice + (extraUsers * perUser);
  const capacityPct = (totalUsers / baseUsers) * 100;

  return (
    <Card className="border-primary/30 bg-primary/5 mt-6">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{lang === 'PT' ? 'Expansão do Plano Igreja' : lang === 'EN' ? 'Church Plan Expansion' : 'Expansión del Plan Iglesia'}</h3>
            <p className="text-xs text-muted-foreground">{labels.churchExpand[lang]}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <p className="text-xs text-muted-foreground mb-2">{labels.users[lang]}</p>
            <div className="flex items-center gap-3">
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 min-h-[44px] min-w-[44px]"
                onClick={() => setExtraUsers(Math.max(0, extraUsers - 1))}
                disabled={extraUsers === 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="text-center flex-1">
                <span className="text-2xl font-bold font-mono text-foreground">{totalUsers}</span>
                <p className="text-[10px] text-muted-foreground">
                  {baseUsers} {labels.included[lang]} {extraUsers > 0 && `+ ${extraUsers} ${labels.extra[lang]}`}
                </p>
              </div>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 min-h-[44px] min-w-[44px]"
                onClick={() => setExtraUsers(extraUsers + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-4">
            <p className="text-xs text-muted-foreground mb-2">{labels.capacity[lang]}</p>
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-foreground">{capacityPct.toFixed(0)}%</span>
                <span className="text-xs text-muted-foreground">{baseUsers} → {totalUsers}</span>
              </div>
              <Progress value={Math.min(capacityPct, 200) / 2} className="h-2" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{lang === 'PT' ? 'Preço total' : lang === 'EN' ? 'Total price' : 'Precio total'}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-foreground">R${totalPrice.toFixed(2).replace('.', ',')}</span>
              <span className="text-sm text-muted-foreground">{labels.month[lang]}</span>
            </div>
          </div>
          <Button className="gap-2 min-h-[48px]">
            <Crown className="h-4 w-4" />
            {labels.cta[lang]}
          </Button>
        </div>

        {extraUsers > 0 && (
          <p className="text-[11px] text-muted-foreground text-center mt-3">
            {labels.extraUserCost[lang]} · {extraUsers} {labels.extra[lang]} = +R${(extraUsers * perUser).toFixed(2).replace('.', ',')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function Upgrade() {
  const { lang } = useLanguage();
  const { profile } = useAuth();
  const currentPlan = profile?.plan || 'free';

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
                  <span className="text-3xl font-bold">{plan.price}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  {plan.period === 'forever' ? labels.forever[lang] : labels.month[lang]}
                </p>
                <Badge variant="secondary" className="text-[10px] mb-4 self-start gap-1">
                  <BarChart3 className="h-3 w-3" />
                  {plan.capacity[lang]}
                </Badge>

                <p className="text-sm font-semibold text-foreground mb-3">{plan.sermonsMonth[lang]}</p>

                <ul className="space-y-2 mb-5 flex-1">
                  {plan.features[lang].map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full gap-1.5 min-h-[48px] ${plan.featured ? '' : ''}`}
                  variant={plan.featured ? 'default' : isCurrent ? 'outline' : 'secondary'}
                  disabled={isCurrent}
                >
                  {isCurrent ? (
                    labels.ctaFree[lang]
                  ) : (
                    <>
                      <Crown className="h-4 w-4" />
                      {labels.cta[lang]}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Igreja expansion module */}
      <ChurchExpansionCard lang={lang} />
    </div>
  );
}
