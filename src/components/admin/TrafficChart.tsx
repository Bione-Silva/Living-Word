import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const weeklyData = [
  { day: 'Seg', visitas: 320 },
  { day: 'Ter', visitas: 450 },
  { day: 'Qua', visitas: 380 },
  { day: 'Qui', visitas: 520 },
  { day: 'Sex', visitas: 480 },
  { day: 'Sáb', visitas: 280 },
  { day: 'Dom', visitas: 610 },
];

const deviceData = [
  { name: 'Mobile', value: 62, color: '#8b5cf6' },
  { name: 'Desktop', value: 28, color: '#06b6d4' },
  { name: 'Tablet', value: 10, color: '#f59e0b' },
];

export function TrafficChart() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="admin-card border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold admin-text">Tráfego Semanal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="visitas" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="admin-card border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold admin-text">Dispositivos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center">
            <div className="w-1/2">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {deviceData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: 12,
                    }}
                    formatter={(value: number) => [`${value}%`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-3">
              {deviceData.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-sm admin-muted flex-1">{d.name}</span>
                  <span className="text-sm font-semibold admin-text">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
