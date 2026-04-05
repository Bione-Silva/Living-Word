import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { AIMetrics } from './types';

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

interface Props {
  data: AIMetrics;
}

export function AICharts({ data }: Props) {
  const donutData = data.models_usage.map((m) => ({
    name: m.model,
    value: Number(m.cost_usd.toFixed(2)),
  }));

  const barData = data.features_usage.map((f) => ({
    name: f.feature,
    tokens: Math.round(f.tokens / 1000),
    custo: Number(f.cost_usd.toFixed(2)),
  }));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {/* Donut - Custos por Modelo */}
      <Card className="admin-card border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base admin-text">Custo por Modelo de IA</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={110}
                paddingAngle={3}
                dataKey="value"
                label={({ name, value }) => `${name}: $${value}`}
                labelLine={false}
              >
                {donutData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => `$${v.toFixed(2)}`}
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Barras - Consumo por Feature */}
      <Card className="admin-card border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base admin-text">Consumo por Ferramenta</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} margin={{ left: 0, right: 0 }}>
              <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <YAxis yAxisId="tokens" orientation="left" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} label={{ value: 'Tokens (k)', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
              <YAxis yAxisId="custo" orientation="right" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} label={{ value: 'Custo ($)', angle: 90, position: 'insideRight', fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend />
              <Bar yAxisId="tokens" dataKey="tokens" name="Tokens (k)" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="custo" dataKey="custo" name="Custo ($)" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
