import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Lead {
  id: string;
  full_name: string;
  email?: string;
  plan: string;
  country: string | null;
  city: string | null;
  church_name: string | null;
  favorite_preacher: string | null;
  created_at: string;
}

const planColors: Record<string, string> = {
  free: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  pastoral: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  church: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  ministry: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

export function LeadsTable() {
  const [search, setSearch] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, plan, country, city, church_name, favorite_preacher, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) setLeads(data as Lead[]);
    setLoading(false);
  };

  const filtered = leads.filter((l) =>
    [l.full_name, l.city, l.church_name].some((f) =>
      f?.toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <Card className="admin-card border-0">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold admin-text">
            Leads & Cadastros ({leads.length})
          </CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 admin-muted" />
            <Input
              placeholder="Buscar lead..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 admin-input"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        {loading ? (
          <p className="text-sm admin-muted px-6">Carregando...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm admin-muted px-6 italic">Nenhum lead encontrado.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border/30 hover:bg-transparent">
                <TableHead className="text-xs admin-muted">Nome</TableHead>
                <TableHead className="text-xs admin-muted">Plano</TableHead>
                <TableHead className="text-xs admin-muted">País / Cidade</TableHead>
                <TableHead className="text-xs admin-muted">Igreja</TableHead>
                <TableHead className="text-xs admin-muted">Pregador Favorito</TableHead>
                <TableHead className="text-xs admin-muted">Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((l) => (
                <TableRow key={l.id} className="border-border/20 hover:bg-muted/5">
                  <TableCell className="font-medium text-sm admin-text">{l.full_name || '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] uppercase ${planColors[l.plan] || ''}`}>
                      {l.plan}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm admin-muted">
                    {l.country || '—'} · {l.city || '—'}
                  </TableCell>
                  <TableCell className="text-sm admin-muted">{l.church_name || '—'}</TableCell>
                  <TableCell className="text-sm admin-muted">{l.favorite_preacher || '—'}</TableCell>
                  <TableCell className="text-sm admin-muted font-mono text-xs">
                    {new Date(l.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
