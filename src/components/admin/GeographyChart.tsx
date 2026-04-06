import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CountryRow {
  country: string;
  visits: number;
  pct: number;
}

const flagMap: Record<string, string> = {
  'Brasil': '🇧🇷', 'Brazil': '🇧🇷',
  'United States': '🇺🇸', 'Estados Unidos': '🇺🇸',
  'Portugal': '🇵🇹',
  'Angola': '🇦🇴',
  'Mozambique': '🇲🇿', 'Moçambique': '🇲🇿',
  'Spain': '🇪🇸', 'Espanha': '🇪🇸',
  'Unknown': '🌍',
};

const barColors = [
  'bg-violet-500', 'bg-blue-500', 'bg-cyan-500',
  'bg-emerald-500', 'bg-amber-500', 'bg-orange-500', 'bg-slate-400',
];

export function GeographyChart() {
  const [data, setData] = useState<CountryRow[]>([]);

  useEffect(() => {
    loadGeo();
  }, []);

  const loadGeo = async () => {
    try {
      const { data: rows, error } = await supabase
        .from('page_views')
        .select('country');

      if (error || !rows || rows.length === 0) return;

    const counts: Record<string, number> = {};
    rows.forEach((r: any) => {
      const c = r.country || 'Unknown';
      counts[c] = (counts[c] || 0) + 1;
    });

    const total = rows.length;
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .map(([country, visits]) => ({
        country,
        visits,
        pct: Math.round((visits / total) * 100),
      }));

    setData(sorted);
    } catch {
      // silently fail for admin chart
    }

  if (data.length === 0) {
    return (
      <Card className="admin-card border-0">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 admin-muted" />
            <CardTitle className="text-base font-semibold admin-text">Distribuição Geográfica</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm admin-muted italic">Dados aparecerão conforme as visitas forem registradas.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="admin-card border-0">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 admin-muted" />
          <CardTitle className="text-base font-semibold admin-text">Distribuição Geográfica</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((c, i) => (
            <div key={c.country} className="flex items-center gap-3">
              <span className="text-lg w-7 text-center">{flagMap[c.country] || '🌍'}</span>
              <span className="text-sm admin-text w-32 truncate">{c.country}</span>
              <div className="flex-1 h-6 rounded-full bg-muted/30 overflow-hidden">
                <div
                  className={`h-full rounded-full ${barColors[i] || 'bg-slate-400'} transition-all duration-700`}
                  style={{ width: `${c.pct}%` }}
                />
              </div>
              <span className="text-xs font-mono font-semibold admin-text w-12 text-right">
                {c.visits.toLocaleString('pt-BR')}
              </span>
              <span className="text-xs admin-muted w-10 text-right">{c.pct}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
