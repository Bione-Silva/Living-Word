import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

const mockLeads = [
  { id: '1', name: 'Pr. Carlos Silva', email: 'carlos@igreja.com', plan: 'pastoral', country: 'Brasil', city: 'São Paulo', church: 'Igreja Batista Central', date: '2026-04-01', preacher: 'Billy Graham' },
  { id: '2', name: 'Ana Costa', email: 'ana@email.com', plan: 'free', country: 'Brasil', city: 'Belo Horizonte', church: 'Assembleia de Deus', date: '2026-04-02', preacher: 'Hernandes Dias Lopes' },
  { id: '3', name: 'Rev. João Santos', email: 'joao@church.org', plan: 'church', country: 'Portugal', city: 'Lisboa', church: 'Igreja Presbiteriana', date: '2026-04-02', preacher: 'John Piper' },
  { id: '4', name: 'Maria Fernandes', email: 'maria@gmail.com', plan: 'free', country: 'Angola', city: 'Luanda', church: 'IURD', date: '2026-04-03', preacher: 'Charles Spurgeon' },
  { id: '5', name: 'Pr. Pedro Lima', email: 'pedro@ministry.com', plan: 'ministry', country: 'Brasil', city: 'Recife', church: 'Igreja Metodista', date: '2026-04-03', preacher: 'Tim Keller' },
  { id: '6', name: 'Lucas Oliveira', email: 'lucas@church.com', plan: 'pastoral', country: 'Moçambique', city: 'Maputo', church: 'Igreja Evangélica', date: '2026-04-04', preacher: 'Augustus Nicodemus' },
];

const planColors: Record<string, string> = {
  free: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  pastoral: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  church: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  ministry: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

export function LeadsTable() {
  const [search, setSearch] = useState('');

  const filtered = mockLeads.filter((l) =>
    [l.name, l.email, l.city, l.church].some((f) =>
      f.toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <Card className="admin-card border-0">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold admin-text">Leads & Cadastros Recentes</CardTitle>
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
        <Table>
          <TableHeader>
            <TableRow className="border-border/30 hover:bg-transparent">
              <TableHead className="text-xs admin-muted">Nome</TableHead>
              <TableHead className="text-xs admin-muted">Email</TableHead>
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
                <TableCell className="font-medium text-sm admin-text">{l.name}</TableCell>
                <TableCell className="text-sm admin-muted">{l.email}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-[10px] uppercase ${planColors[l.plan] || ''}`}>
                    {l.plan}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm admin-muted">{l.country} · {l.city}</TableCell>
                <TableCell className="text-sm admin-muted">{l.church}</TableCell>
                <TableCell className="text-sm admin-muted">{l.preacher}</TableCell>
                <TableCell className="text-sm admin-muted font-mono text-xs">{l.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
