import { Users, TrendingUp, CreditCard, Eye, ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface KpiData {
  totalUsers: number;
  activeUsers: number;
  mrr: number;
  pageViews: number;
  userGrowth: number;
  mrrGrowth: number;
  viewsGrowth: number;
}

interface Props {
  data: KpiData;
}

export function KpiCards({ data }: Props) {
  const cards = [
    {
      label: 'Total de Usuários',
      value: data.totalUsers.toLocaleString('pt-BR'),
      change: data.userGrowth,
      icon: Users,
      color: 'from-blue-500/20 to-blue-600/5',
      iconColor: 'text-blue-500',
    },
    {
      label: 'Usuários Ativos',
      value: data.activeUsers.toLocaleString('pt-BR'),
      change: 12.5,
      icon: TrendingUp,
      color: 'from-emerald-500/20 to-emerald-600/5',
      iconColor: 'text-emerald-500',
    },
    {
      label: 'Receita Mensal (MRR)',
      value: `R$ ${data.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      change: data.mrrGrowth,
      icon: CreditCard,
      color: 'from-violet-500/20 to-violet-600/5',
      iconColor: 'text-violet-500',
    },
    {
      label: 'Visualizações (30d)',
      value: data.pageViews.toLocaleString('pt-BR'),
      change: data.viewsGrowth,
      icon: Eye,
      color: 'from-amber-500/20 to-amber-600/5',
      iconColor: 'text-amber-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card
          key={c.label}
          className="admin-card border-0 overflow-hidden relative"
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${c.color} pointer-events-none`} />
          <CardContent className="p-5 relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider admin-muted">{c.label}</span>
              <div className={`w-9 h-9 rounded-xl bg-background/50 flex items-center justify-center ${c.iconColor}`}>
                <c.icon className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold admin-text">{c.value}</p>
            <div className="flex items-center gap-1 mt-2">
              {c.change >= 0 ? (
                <ArrowUp className="h-3 w-3 text-emerald-500" />
              ) : (
                <ArrowDown className="h-3 w-3 text-red-500" />
              )}
              <span className={`text-xs font-medium ${c.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {Math.abs(c.change).toFixed(1)}%
              </span>
              <span className="text-xs admin-muted ml-1">vs mês anterior</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
