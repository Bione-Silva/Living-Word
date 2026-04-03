import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Crown, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const plans = [
  {
    name: 'Pastoral',
    price: '$9',
    features: ['40 gerações/mês', 'Todos os 7 formatos', 'Sem watermark', 'Domínio próprio', 'Vozes pastorais premium', 'Calendário editorial'],
    featured: true,
  },
  {
    name: 'Church',
    price: '$29',
    features: ['150 gerações/mês', 'Equipe + multi-autor', 'API WordPress', 'Calendário editorial', 'Suporte prioritário'],
    featured: false,
  },
  {
    name: 'Ministry',
    price: '$79',
    features: ['Gerações ilimitadas', 'White label', 'Treinamento personalizado', 'Suporte dedicado', 'API completa'],
    featured: false,
  },
];

export default function Upgrade() {
  const { t } = useLanguage();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <Sparkles className="h-10 w-10 text-primary mx-auto mb-4" />
        <h1 className="font-display text-4xl font-bold">{t('upgrade.title')}</h1>
        <p className="text-muted-foreground mt-2">{t('upgrade.trial')}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <Card key={plan.name} className={`relative overflow-hidden ${plan.featured ? 'border-primary ring-1 ring-primary/30' : ''}`}>
            {plan.featured && (
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                Recomendado
              </div>
            )}
            <CardContent className="p-6">
              <h3 className="font-display text-xl font-semibold">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mt-2 mb-6">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-sm text-muted-foreground">/mês</span>
              </div>
              <ul className="space-y-3 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button className={`w-full gap-1 ${plan.featured ? 'bg-primary text-primary-foreground' : ''}`} variant={plan.featured ? 'default' : 'outline'}>
                <Crown className="h-4 w-4" />
                {t('upgrade.cta')}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
