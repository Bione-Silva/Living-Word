// @ts-nocheck
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MonthData { month: string; receita: number; despesas: number; }

const monthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function RevenueChart() {
  const [data, setData] = useState<MonthData[]>([]);

  useEffect(() => {
    loadRevenue();
  }, []);

  const loadRevenue = async () => {
    const { data: rows } = await supabase
      .from('monthly_financials')
      .select('month, revenue, expenses')
      .order('month', { ascending: true })
      .limit(12);

    if (rows && rows.length > 0) {
      setData(rows.map((r: any) => ({
        month: monthLabels[new Date(r.month).getMonth()] || r.month,
        receita: Number(r.revenue),
        despesas: Number(r.expenses),
      })));
    } else {
      // Show empty state with current month
      const now = new Date();
      const emptyData = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
        return { month: monthLabels[d.getMonth()], receita: 0, despesas: 0 };
      });
      setData(emptyData);
    }
  };

  return (
    <Card className="admin-card border-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold admin-text">Receita vs Despesas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
