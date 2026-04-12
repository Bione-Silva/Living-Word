import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ThumbsUp, ThumbsDown, MessageSquare, TrendingUp, Download, CalendarIcon } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface FeedbackRow {
  id: string;
  rating: string;
  comment: string | null;
  material_type: string;
  material_title: string | null;
  tool_id: string | null;
  created_at: string;
}

const COLORS = [
  'hsl(142, 71%, 45%)',
  'hsl(0, 84%, 60%)',
  'hsl(38, 52%, 58%)',
  'hsl(210, 60%, 50%)',
  'hsl(280, 50%, 55%)',
  'hsl(180, 50%, 45%)',
];

const toolLabels: Record<string, string> = {
  sermon: 'Sermão',
  outline: 'Esboço',
  devotional: 'Devocional',
  illustration: 'Ilustração',
  prayer: 'Oração',
  'blog_article': 'Blog',
  'bible-study': 'Estudo Bíblico',
  'topic-explorer': 'Explorador',
  'verse-finder': 'Buscador de Versículos',
  'historical-context': 'Contexto Histórico',
  'theology-map': 'Mapa Teológico',
  'social-media': 'Redes Sociais',
  'children-lesson': 'Aula Infantil',
  'worship-liturgy': 'Liturgia',
};

export function FeedbackPanel() {
  const [feedbacks, setFeedbacks] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  useEffect(() => {
    loadFeedbacks();
  }, [dateFrom, dateTo]);

  const loadFeedbacks = async () => {
    setLoading(true);
    let query = (supabase as any)
      .from('material_feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (dateFrom) {
      query = query.gte('created_at', dateFrom.toISOString());
    }
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      query = query.lte('created_at', end.toISOString());
    }

    const { data } = await query;
    if (data) setFeedbacks(data as FeedbackRow[]);
    setLoading(false);
  };

  const exportCSV = () => {
    if (feedbacks.length === 0) return;
    const headers = ['Data', 'Ferramenta', 'Título', 'Avaliação', 'Comentário'];
    const rows = feedbacks.map(f => [
      new Date(f.created_at).toLocaleDateString('pt-BR'),
      toolLabels[f.tool_id || f.material_type] || f.material_type,
      f.material_title || '',
      f.rating === 'positive' ? 'Positivo' : 'Negativo',
      (f.comment || '').replace(/"/g, '""'),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedbacks_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPositive = feedbacks.filter(f => f.rating === 'positive').length;
  const totalNegative = feedbacks.filter(f => f.rating === 'negative').length;
  const total = feedbacks.length;
  const satisfactionRate = total > 0 ? Math.round((totalPositive / total) * 100) : 0;

  const byTool: Record<string, { positive: number; negative: number }> = {};
  feedbacks.forEach(f => {
    const key = f.tool_id || f.material_type || 'outro';
    if (!byTool[key]) byTool[key] = { positive: 0, negative: 0 };
    if (f.rating === 'positive') byTool[key].positive++;
    else byTool[key].negative++;
  });

  const barData = Object.entries(byTool).map(([key, val]) => ({
    name: toolLabels[key] || key,
    positive: val.positive,
    negative: val.negative,
  }));

  const pieData = [
    { name: 'Positivo', value: totalPositive },
    { name: 'Negativo', value: totalNegative },
  ];

  const recentComments = feedbacks.filter(f => f.comment).slice(0, 8);

  const barConfig = {
    positive: { label: 'Positivo', color: 'hsl(142, 71%, 45%)' },
    negative: { label: 'Negativo', color: 'hsl(0, 84%, 60%)' },
  };

  if (loading) {
    return <div className="admin-card rounded-xl p-6 text-center admin-muted">Carregando feedbacks...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-bold admin-text flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Satisfação dos Usuários
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Date From */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("text-xs gap-1", !dateFrom && "text-muted-foreground")}>
                <CalendarIcon className="h-3.5 w-3.5" />
                {dateFrom ? format(dateFrom, 'dd/MM/yyyy') : 'De'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>

          {/* Date To */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("text-xs gap-1", !dateTo && "text-muted-foreground")}>
                <CalendarIcon className="h-3.5 w-3.5" />
                {dateTo ? format(dateTo, 'dd/MM/yyyy') : 'Até'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>

          {(dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setDateFrom(undefined); setDateTo(undefined); }}>
              Limpar
            </Button>
          )}

          <Button variant="outline" size="sm" className="text-xs gap-1" onClick={exportCSV} disabled={feedbacks.length === 0}>
            <Download className="h-3.5 w-3.5" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Feedbacks', value: total, icon: MessageSquare },
          { label: 'Taxa Satisfação', value: `${satisfactionRate}%`, icon: TrendingUp },
          { label: 'Positivos', value: totalPositive, icon: ThumbsUp },
          { label: 'Negativos', value: totalNegative, icon: ThumbsDown },
        ].map(kpi => (
          <div key={kpi.label} className="admin-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <kpi.icon className="h-4 w-4 admin-muted" />
              <span className="text-xs admin-muted">{kpi.label}</span>
            </div>
            <p className="text-xl font-bold admin-text">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 admin-card rounded-xl p-4">
          <h3 className="text-sm font-semibold admin-text mb-3">Satisfação por Ferramenta</h3>
          {barData.length === 0 ? (
            <p className="text-sm admin-muted text-center py-8">Nenhum feedback ainda</p>
          ) : (
            <ChartContainer config={barConfig} className="h-[260px] w-full">
              <BarChart data={barData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="positive" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="negative" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </div>

        <div className="admin-card rounded-xl p-4">
          <h3 className="text-sm font-semibold admin-text mb-3">Distribuição Geral</h3>
          {total === 0 ? (
            <p className="text-sm admin-muted text-center py-8">Sem dados</p>
          ) : (
            <div className="h-[220px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {recentComments.length > 0 && (
        <div className="admin-card rounded-xl p-4">
          <h3 className="text-sm font-semibold admin-text mb-3">Comentários Recentes</h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {recentComments.map(f => (
              <div key={f.id} className="flex items-start gap-3 p-2 rounded-lg bg-background/50">
                {f.rating === 'positive' ? (
                  <ThumbsUp className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                ) : (
                  <ThumbsDown className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm admin-text">{f.comment}</p>
                  <p className="text-xs admin-muted mt-1">
                    {toolLabels[f.tool_id || f.material_type] || f.material_type}
                    {f.material_title && ` · ${f.material_title}`}
                    {' · '}
                    {new Date(f.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
