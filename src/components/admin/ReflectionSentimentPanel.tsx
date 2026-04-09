import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, SmilePlus, Frown, HelpCircle, TrendingUp, MessageSquareText } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface SentimentStats {
  positive: number;
  negative: number;
  mixed: number;
  total: number;
  recentReflections: { text: string; sentiment: string; created_at: string }[];
  dailyCounts: { date: string; count: number }[];
}

const COLORS = {
  positive: '#22c55e',
  negative: '#ef4444',
  mixed: '#f59e0b',
};

const SENTIMENT_EMOJI: Record<string, string> = {
  positive: '😊',
  negative: '😔',
  mixed: '🤔',
};

export function ReflectionSentimentPanel() {
  const [stats, setStats] = useState<SentimentStats>({
    positive: 0, negative: 0, mixed: 0, total: 0,
    recentReflections: [], dailyCounts: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Get all reflection engagements
      const { data: reflections } = await supabase
        .from('devotional_engagements')
        .select('reflection_sentiment, reflection_text, created_at')
        .eq('action', 'complete_reflection')
        .not('reflection_sentiment', 'is', null)
        .order('created_at', { ascending: false })
        .limit(500);

      if (!reflections) return;

      const positive = reflections.filter(r => r.reflection_sentiment === 'positive').length;
      const negative = reflections.filter(r => r.reflection_sentiment === 'negative').length;
      const mixed = reflections.filter(r => r.reflection_sentiment === 'mixed').length;

      // Recent reflections with text
      const recentReflections = reflections
        .filter(r => r.reflection_text)
        .slice(0, 10)
        .map(r => ({
          text: r.reflection_text!,
          sentiment: r.reflection_sentiment!,
          created_at: r.created_at,
        }));

      // Daily counts (last 14 days)
      const dailyMap: Record<string, number> = {};
      const now = new Date();
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        dailyMap[d.toISOString().slice(0, 10)] = 0;
      }
      reflections.forEach(r => {
        const day = r.created_at.slice(0, 10);
        if (dailyMap[day] !== undefined) dailyMap[day]++;
      });
      const dailyCounts = Object.entries(dailyMap).map(([date, count]) => ({
        date: date.slice(5), // MM-DD
        count,
      }));

      setStats({ positive, negative, mixed, total: reflections.length, recentReflections, dailyCounts });
    } catch (e) {
      console.error('Error loading sentiment stats:', e);
    } finally {
      setLoading(false);
    }
  };

  const pieData = [
    { name: 'Positivo', value: stats.positive, color: COLORS.positive },
    { name: 'Negativo', value: stats.negative, color: COLORS.negative },
    { name: 'Misto', value: stats.mixed, color: COLORS.mixed },
  ].filter(d => d.value > 0);

  const pct = (n: number) => stats.total > 0 ? Math.round((n / stats.total) * 100) : 0;

  if (loading) {
    return (
      <Card className="admin-card animate-pulse">
        <CardHeader><CardTitle className="admin-text">Carregando...</CardTitle></CardHeader>
        <CardContent><div className="h-48 bg-muted rounded-lg" /></CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Brain className="h-5 w-5 text-violet-500" />
        <h2 className="text-lg font-display font-bold admin-text">Análise de Sentimentos — Reflexões</h2>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="admin-card">
          <CardContent className="p-4 text-center">
            <MessageSquareText className="h-5 w-5 mx-auto mb-1 text-violet-500" />
            <p className="text-2xl font-bold admin-text">{stats.total}</p>
            <p className="text-xs admin-muted">Total Reflexões</p>
          </CardContent>
        </Card>
        <Card className="admin-card">
          <CardContent className="p-4 text-center">
            <SmilePlus className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
            <p className="text-2xl font-bold text-emerald-500">{pct(stats.positive)}%</p>
            <p className="text-xs admin-muted">Positivas ({stats.positive})</p>
          </CardContent>
        </Card>
        <Card className="admin-card">
          <CardContent className="p-4 text-center">
            <Frown className="h-5 w-5 mx-auto mb-1 text-red-500" />
            <p className="text-2xl font-bold text-red-500">{pct(stats.negative)}%</p>
            <p className="text-xs admin-muted">Difíceis ({stats.negative})</p>
          </CardContent>
        </Card>
        <Card className="admin-card">
          <CardContent className="p-4 text-center">
            <HelpCircle className="h-5 w-5 mx-auto mb-1 text-amber-500" />
            <p className="text-2xl font-bold text-amber-500">{pct(stats.mixed)}%</p>
            <p className="text-xs admin-muted">Mistos ({stats.mixed})</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie chart */}
        <Card className="admin-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm admin-text">Distribuição de Sentimentos</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                    {pieData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string) => [`${value} (${pct(value)}%)`, name]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center admin-muted py-12">Nenhuma reflexão registrada ainda.</p>
            )}
            <div className="flex justify-center gap-4 mt-2">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs admin-muted">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  {d.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Daily bar chart */}
        <Card className="admin-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm admin-text flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Reflexões / Dia (14d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.dailyCounts}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Reflexões" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent reflections */}
      {stats.recentReflections.length > 0 && (
        <Card className="admin-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm admin-text">Últimas Reflexões</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
            {stats.recentReflections.map((r, i) => (
              <div key={i} className="flex gap-2 p-2.5 rounded-lg bg-muted/40 text-sm">
                <span className="text-lg shrink-0">{SENTIMENT_EMOJI[r.sentiment] || '🤔'}</span>
                <div className="min-w-0">
                  <p className="admin-text line-clamp-2">{r.text}</p>
                  <p className="text-[10px] admin-muted mt-0.5">
                    {new Date(r.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
