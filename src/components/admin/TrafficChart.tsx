import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DayData { day: string; visitas: number; }
interface DeviceData { name: string; value: number; color: string; }

const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const deviceColors: Record<string, string> = {
  Mobile: '#8b5cf6', Desktop: '#06b6d4', Tablet: '#f59e0b', Other: '#94a3b8',
};

export function TrafficChart() {
  const [weeklyData, setWeeklyData] = useState<DayData[]>([]);
  const [deviceData, setDeviceData] = useState<DeviceData[]>([]);

  useEffect(() => {
    loadTraffic();
  }, []);

  const loadTraffic = async () => {
    try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: rows, error } = await supabase
      .from('page_views')
      .select('created_at, device')
      .gte('created_at', sevenDaysAgo.toISOString());

    if (error || !rows || rows.length === 0) {
      setWeeklyData(dayNames.map((d) => ({ day: d, visitas: 0 })));
      setDeviceData([]);
      return;
    }

    const dayCounts: Record<number, number> = {};
    const devCounts: Record<string, number> = {};

    rows.forEach((r: any) => {
      const d = new Date(r.created_at).getDay();
      dayCounts[d] = (dayCounts[d] || 0) + 1;
      const dev = r.device || 'Other';
      devCounts[dev] = (devCounts[dev] || 0) + 1;
    });

    const total = rows.length;
    setWeeklyData(dayNames.map((name, i) => ({ day: name, visitas: dayCounts[i] || 0 })));
    setDeviceData(
      Object.entries(devCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([name, val]) => ({
          name,
          value: Math.round((val / total) * 100),
          color: deviceColors[name] || '#94a3b8',
        }))
    );
    } catch {
      // silently fail for admin chart
    }
  };

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
            {deviceData.length === 0 ? (
              <p className="text-sm admin-muted italic w-full text-center">Sem dados ainda</p>
            ) : (
              <>
                <div className="w-1/2">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={deviceData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
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
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
