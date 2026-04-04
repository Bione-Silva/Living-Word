import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const mockData = [
  { month: 'Jan', receita: 890, despesas: 420 },
  { month: 'Fev', receita: 1200, despesas: 480 },
  { month: 'Mar', receita: 1800, despesas: 520 },
  { month: 'Abr', receita: 2400, despesas: 580 },
  { month: 'Mai', receita: 3100, despesas: 640 },
  { month: 'Jun', receita: 3800, despesas: 700 },
  { month: 'Jul', receita: 4200, despesas: 750 },
  { month: 'Ago', receita: 4800, despesas: 800 },
  { month: 'Set', receita: 5200, despesas: 820 },
  { month: 'Out', receita: 5900, despesas: 880 },
  { month: 'Nov', receita: 6400, despesas: 920 },
  { month: 'Dez', receita: 7200, despesas: 980 },
];

export function RevenueChart() {
  return (
    <Card className="admin-card border-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold admin-text">Receita vs Despesas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `R$${v}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: 12,
                }}
                formatter={(value: number, name: string) => [
                  `R$ ${value.toLocaleString('pt-BR')}`,
                  name === 'receita' ? 'Receita' : 'Despesas',
                ]}
              />
              <Legend formatter={(v) => (v === 'receita' ? 'Receita' : 'Despesas')} />
              <Area type="monotone" dataKey="receita" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorReceita)" />
              <Area type="monotone" dataKey="despesas" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorDespesas)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
