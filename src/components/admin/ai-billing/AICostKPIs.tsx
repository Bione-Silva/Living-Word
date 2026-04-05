import { DollarSign, Cpu, Zap, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { AIMetrics } from './types';

interface Props {
  data: AIMetrics;
}

export function AICostKPIs({ data }: Props) {
  const cards = [
    {
      label: 'Custo Total Acumulado',
      value: `$ ${data.total_cost_usd.toFixed(2)}`,
      icon: DollarSign,
      color: 'from-emerald-500/20 to-emerald-600/5',
      iconColor: 'text-emerald-500',
    },
    {
      label: 'Tokens Processados',
      value: data.total_tokens.toLocaleString('pt-BR'),
      icon: Cpu,
      color: 'from-blue-500/20 to-blue-600/5',
      iconColor: 'text-blue-500',
    },
    {
      label: 'Gerações Realizadas',
      value: data.total_generations.toLocaleString('pt-BR'),
      icon: Zap,
      color: 'from-violet-500/20 to-violet-600/5',
      iconColor: 'text-violet-500',
    },
    {
      label: 'Ferramenta Top',
      value: data.top_feature,
      icon: Star,
      color: 'from-amber-500/20 to-amber-600/5',
      iconColor: 'text-amber-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.label} className="admin-card border-0 overflow-hidden relative">
          <div className={`absolute inset-0 bg-gradient-to-br ${c.color} pointer-events-none`} />
          <CardContent className="p-5 relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider admin-muted">{c.label}</span>
              <div className={`w-9 h-9 rounded-xl bg-background/50 flex items-center justify-center ${c.iconColor}`}>
                <c.icon className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold admin-text">{c.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
