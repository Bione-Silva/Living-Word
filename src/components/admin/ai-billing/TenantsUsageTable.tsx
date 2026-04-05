import { useState, useMemo } from 'react';
import { Search, ArrowDownUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { TenantUsage } from './types';

const planColors: Record<string, string> = {
  free: 'bg-zinc-500/20 text-zinc-400',
  pastoral: 'bg-blue-500/20 text-blue-400',
  church: 'bg-violet-500/20 text-violet-400',
  ministry: 'bg-amber-500/20 text-amber-400',
};

interface Props {
  tenants: TenantUsage[];
}

export function TenantsUsageTable({ tenants }: Props) {
  const [search, setSearch] = useState('');
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = useMemo(() => {
    let list = tenants.filter((t) =>
      t.identifier.toLowerCase().includes(search.toLowerCase())
    );
    list.sort((a, b) => sortAsc ? a.cost_usd - b.cost_usd : b.cost_usd - a.cost_usd);
    return list;
  }, [tenants, search, sortAsc]);

  return (
    <Card className="admin-card border-0">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-base admin-text">Consumo por Blog / Tenant</CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 admin-muted" />
            <Input
              placeholder="Buscar email ou blog…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 admin-input h-9 text-sm"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left py-2 px-3 admin-muted font-medium">Blog / Usuário</th>
              <th className="text-left py-2 px-3 admin-muted font-medium">Plano</th>
              <th className="text-right py-2 px-3 admin-muted font-medium">Gerações</th>
              <th className="text-right py-2 px-3 admin-muted font-medium">Tokens</th>
              <th className="text-right py-2 px-3 admin-muted font-medium cursor-pointer select-none" onClick={() => setSortAsc(!sortAsc)}>
                <span className="inline-flex items-center gap-1">
                  Custo ($) <ArrowDownUp className="h-3 w-3" />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.identifier} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                <td className="py-2.5 px-3 admin-text font-mono text-xs">{t.identifier}</td>
                <td className="py-2.5 px-3">
                  <Badge variant="secondary" className={`text-[10px] uppercase ${planColors[t.plan] || ''}`}>
                    {t.plan}
                  </Badge>
                </td>
                <td className="py-2.5 px-3 text-right admin-text tabular-nums">{t.generations_count.toLocaleString('pt-BR')}</td>
                <td className="py-2.5 px-3 text-right admin-text tabular-nums">{t.total_tokens.toLocaleString('pt-BR')}</td>
                <td className="py-2.5 px-3 text-right font-semibold text-emerald-400 tabular-nums">${t.cost_usd.toFixed(2)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 admin-muted">Nenhum resultado encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
