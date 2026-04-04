import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe } from 'lucide-react';

const countryData = [
  { country: 'Brasil', code: '🇧🇷', visits: 4280, pct: 58 },
  { country: 'Estados Unidos', code: '🇺🇸', visits: 1120, pct: 15 },
  { country: 'Portugal', code: '🇵🇹', visits: 740, pct: 10 },
  { country: 'Angola', code: '🇦🇴', visits: 520, pct: 7 },
  { country: 'Moçambique', code: '🇲🇿', visits: 380, pct: 5 },
  { country: 'Espanha', code: '🇪🇸', visits: 220, pct: 3 },
  { country: 'Outros', code: '🌍', visits: 140, pct: 2 },
];

const barColors = [
  'bg-violet-500', 'bg-blue-500', 'bg-cyan-500',
  'bg-emerald-500', 'bg-amber-500', 'bg-orange-500', 'bg-slate-400',
];

export function GeographyChart() {
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
          {countryData.map((c, i) => (
            <div key={c.country} className="flex items-center gap-3">
              <span className="text-lg w-7 text-center">{c.code}</span>
              <span className="text-sm admin-text w-32 truncate">{c.country}</span>
              <div className="flex-1 h-6 rounded-full bg-muted/30 overflow-hidden">
                <div
                  className={`h-full rounded-full ${barColors[i]} transition-all duration-700`}
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
