import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend } from 'recharts';
import { TOOL_CREDITS } from '@/lib/plans';

type L = 'PT' | 'EN' | 'ES';

interface UsageEntry {
  id: string;
  feature: string;
  total_tokens: number;
  cost_usd: number;
  created_at: string;
  model: string;
}

const FEATURE_LABELS: Record<string, Record<L, string>> = {
  studio: { PT: 'Sermão', EN: 'Sermon', ES: 'Sermón' },
  'biblical-study': { PT: 'Estudo Bíblico', EN: 'Bible Study', ES: 'Estudio Bíblico' },
  'free-article': { PT: 'Artigo', EN: 'Article', ES: 'Artículo' },
  'free-article-universal': { PT: 'Redator', EN: 'Writer', ES: 'Redactor' },
  'title-gen': { PT: 'Títulos', EN: 'Titles', ES: 'Títulos' },
  'topic-explorer': { PT: 'Temas', EN: 'Topics', ES: 'Temas' },
  'verse-finder': { PT: 'Versículos', EN: 'Verses', ES: 'Versículos' },
  'historical-context': { PT: 'Contexto', EN: 'Context', ES: 'Contexto' },
  'mind-chat': { PT: 'Mentes', EN: 'Minds', ES: 'Mentes' },
  'deep-search': { PT: 'Pesquisa', EN: 'Search', ES: 'Búsqueda' },
  'social-studio': { PT: 'Social', EN: 'Social', ES: 'Social' },
  'social-carousel': { PT: 'Carrossel', EN: 'Carousel', ES: 'Carrusel' },
  'pastoral-material': { PT: 'Pastoral', EN: 'Pastoral', ES: 'Pastoral' },
  'devotional': { PT: 'Devocional', EN: 'Devotional', ES: 'Devocional' },
  'devotional-today': { PT: 'Devocional Dia', EN: 'Daily Dev.', ES: 'Dev. Día' },
  'outline': { PT: 'Esboço', EN: 'Outline', ES: 'Esquema' },
  'sermon': { PT: 'Sermão', EN: 'Sermon', ES: 'Sermón' },
  'Blog Creator': { PT: 'Blog', EN: 'Blog', ES: 'Blog' },
  'illustrations': { PT: 'Ilustrações', EN: 'Illustrations', ES: 'Ilustraciones' },
  'youtube-blog': { PT: 'YouTube', EN: 'YouTube', ES: 'YouTube' },
  'reels-script': { PT: 'Reels', EN: 'Reels', ES: 'Reels' },
  'cell-group': { PT: 'Célula', EN: 'Cell', ES: 'Célula' },
  'social-caption': { PT: 'Legenda', EN: 'Caption', ES: 'Leyenda' },
  'newsletter': { PT: 'Newsletter', EN: 'Newsletter', ES: 'Newsletter' },
  'kids-story': { PT: 'Infantil', EN: 'Kids', ES: 'Infantil' },
  'poetry': { PT: 'Poesia', EN: 'Poetry', ES: 'Poesía' },
  'trivia': { PT: 'Quiz', EN: 'Quiz', ES: 'Quiz' },
};

// Platform palette: primary (café), accent (gold), warm earth tones
const PIE_COLORS = [
  'hsl(257, 61%, 32%)',   // primary café
  'hsl(263, 70%, 50%)',   // accent gold
  'hsl(256, 56%, 16%)',   // dark café
  'hsl(263, 70%, 50%)',   // warm sand
  'hsl(257, 61%, 32%)',   // muted brown
  'hsl(263, 70%, 50%)',   // medium earth
  'hsl(263, 70%, 50%)',   // olive gold
  'hsl(20, 35%, 35%)',   // deep brown
];

interface Props {
  entries: UsageEntry[];
}

export function CreditUsageCharts({ entries }: Props) {
  const { lang } = useLanguage();
  const l = lang as L;

  // Line chart: credits used per day
  const dailyData = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of entries) {
      const day = new Date(e.created_at).toLocaleDateString(
        lang === 'PT' ? 'pt-BR' : lang === 'ES' ? 'es' : 'en',
        { day: '2-digit', month: 'short' }
      );
      const credits = TOOL_CREDITS[e.feature] || 10;
      map.set(day, (map.get(day) || 0) + credits);
    }
    return Array.from(map.entries())
      .map(([day, credits]) => ({ day, credits }))
      .reverse();
  }, [entries, lang]);

  // Pie chart: distribution by feature
  const featureData = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of entries) {
      const credits = TOOL_CREDITS[e.feature] || 10;
      const label = FEATURE_LABELS[e.feature]?.[l] || e.feature;
      map.set(label, (map.get(label) || 0) + credits);
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [entries, l]);

  if (entries.length === 0) return null;

  const lineLabel = lang === 'PT' ? 'Créditos/dia' : lang === 'ES' ? 'Créditos/día' : 'Credits/day';
  const pieLabel = lang === 'PT' ? 'Distribuição por ferramenta' : lang === 'ES' ? 'Distribución por herramienta' : 'Distribution by tool';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Line Chart */}
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {lineLabel}
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              width={35}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Line
              type="monotone"
              dataKey="credits"
              stroke="hsl(var(--primary))"
              strokeWidth={2.5}
              dot={{ r: 4, fill: 'hsl(var(--primary))' }}
              activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
              animationDuration={1200}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Chart */}
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {pieLabel}
        </p>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={featureData}
              cx="50%"
              cy="40%"
              innerRadius={40}
              outerRadius={68}
              paddingAngle={3}
              dataKey="value"
              animationDuration={1000}
              animationEasing="ease-out"
            >
              {featureData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [`${value} créditos`, '']}
            />
            <Legend
              verticalAlign="bottom"
              align="center"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }}
              formatter={(value: string) => <span style={{ color: 'hsl(257, 61%, 32%)' }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
