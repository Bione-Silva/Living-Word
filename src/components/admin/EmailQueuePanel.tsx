import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Mail, RefreshCw, AlertTriangle, CheckCircle2, Clock, Ban, TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

type Range = '24h' | '7d' | '30d';
type StatusFilter = 'all' | 'sent' | 'pending' | 'failed' | 'dlq' | 'suppressed' | 'stale';

interface LogRow {
  id: string;
  message_id: string | null;
  template_name: string;
  recipient_email: string;
  status: string;
  error_message: string | null;
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  sent: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  pending: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  failed: 'bg-red-500/15 text-red-600 border-red-500/30',
  dlq: 'bg-red-700/15 text-red-700 border-red-700/30',
  suppressed: 'bg-zinc-500/15 text-zinc-600 border-zinc-500/30',
  rate_limited: 'bg-orange-500/15 text-orange-600 border-orange-500/30',
  stale: 'bg-zinc-400/15 text-zinc-500 border-zinc-400/30',
};

const rangeStart = (r: Range): Date => {
  const d = new Date();
  if (r === '24h') d.setHours(d.getHours() - 24);
  if (r === '7d') d.setDate(d.getDate() - 7);
  if (r === '30d') d.setDate(d.getDate() - 30);
  return d;
};

export function EmailQueuePanel() {
  const [range, setRange] = useState<Range>('7d');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [template, setTemplate] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [chartData, setChartData] = useState<Array<{ date: string; sent: number; failed: number }>>([]);

  const load = async () => {
    setLoading(true);
    const since = rangeStart(range).toISOString();
    const since30d = rangeStart('30d').toISOString();
    const [main, series] = await Promise.all([
      supabase
        .from('email_send_log')
        .select('id, message_id, template_name, recipient_email, status, error_message, created_at')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(1000),
      supabase
        .from('email_send_log')
        .select('message_id, status, created_at')
        .gte('created_at', since30d)
        .order('created_at', { ascending: false })
        .limit(5000),
    ]);
    if (!main.error && main.data) setRows(main.data as LogRow[]);

    // Build daily series, deduplicated by message_id (latest status wins)
    if (!series.error && series.data) {
      const seenMsg = new Set<string>();
      const buckets = new Map<string, { sent: number; failed: number }>();
      // initialize 30 day buckets
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        buckets.set(d.toISOString().slice(0, 10), { sent: 0, failed: 0 });
      }
      for (const r of series.data as Array<{ message_id: string | null; status: string; created_at: string }>) {
        const key = r.message_id || `${r.created_at}-${r.status}`;
        if (seenMsg.has(key)) continue;
        seenMsg.add(key);
        const day = r.created_at.slice(0, 10);
        const bucket = buckets.get(day);
        if (!bucket) continue;
        if (r.status === 'sent') bucket.sent++;
        else if (r.status === 'failed' || r.status === 'dlq' || r.status === 'rate_limited') bucket.failed++;
      }
      setChartData(Array.from(buckets.entries()).map(([date, v]) => ({ date, ...v })));
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  // Deduplicate by message_id keeping latest status
  const dedup = useMemo(() => {
    const seen = new Set<string>();
    const out: LogRow[] = [];
    for (const r of rows) {
      const key = r.message_id || r.id;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(r);
    }
    return out;
  }, [rows]);

  const templates = useMemo(
    () => Array.from(new Set(dedup.map((r) => r.template_name))).sort(),
    [dedup]
  );

  // Reclassify "pending" rows older than 1h as "stale" so they don't pollute
  // the live queue view — these are sends whose final state was never logged
  // (likely lost in earlier infrastructure incidents).
  const STALE_MS = 60 * 60 * 1000;
  const reclassified = useMemo(() => {
    const now = Date.now();
    return dedup.map((r) => {
      if (r.status === 'pending' && now - new Date(r.created_at).getTime() > STALE_MS) {
        return { ...r, status: 'stale' };
      }
      return r;
    });
  }, [dedup]);

  const filtered = useMemo(() => {
    return reclassified.filter((r) => {
      if (status !== 'all' && r.status !== status) return false;
      if (template !== 'all' && r.template_name !== template) return false;
      if (search && !r.recipient_email.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [reclassified, status, template, search]);

  const stats = useMemo(() => {
    const counts = { total: reclassified.length, sent: 0, pending: 0, failed: 0, dlq: 0, suppressed: 0, stale: 0 };
    for (const r of reclassified) {
      if (r.status === 'sent') counts.sent++;
      else if (r.status === 'pending') counts.pending++;
      else if (r.status === 'failed' || r.status === 'rate_limited') counts.failed++;
      else if (r.status === 'dlq') counts.dlq++;
      else if (r.status === 'suppressed') counts.suppressed++;
      else if (r.status === 'stale') counts.stale++;
    }
    return counts;
  }, [reclassified]);

  // Per-template breakdown with delivery rate
  const byTemplate = useMemo(() => {
    const map = new Map<string, { total: number; sent: number; failed: number; pending: number; stale: number }>();
    for (const r of reclassified) {
      const t = map.get(r.template_name) || { total: 0, sent: 0, failed: 0, pending: 0, stale: 0 };
      t.total++;
      if (r.status === 'sent') t.sent++;
      else if (r.status === 'failed' || r.status === 'dlq' || r.status === 'rate_limited') t.failed++;
      else if (r.status === 'pending') t.pending++;
      else if (r.status === 'stale') t.stale++;
      map.set(r.template_name, t);
    }
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, ...v, rate: v.total ? (v.sent / v.total) * 100 : 0 }))
      .sort((a, b) => b.total - a.total);
  }, [reclassified]);

  // Delivery rate excludes stale (sends whose final state was lost) so the
  // metric reflects the live system, not legacy infrastructure incidents.
  const deliveryDenom = stats.total - stats.stale;
  const deliveryRate = deliveryDenom > 0 ? ((stats.sent / deliveryDenom) * 100).toFixed(1) : '0.0';

  return (
    <Card className="admin-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Mail className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Fila de E-mails</CardTitle>
            <p className="text-xs admin-muted">Deliverability em tempo real</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <StatBox label="Total" value={stats.total} icon={Mail} tone="neutral" />
          <StatBox label="Enviados" value={stats.sent} icon={CheckCircle2} tone="emerald" />
          <StatBox label="Pendentes" value={stats.pending} icon={Clock} tone="amber" />
          <StatBox label="Falhas" value={stats.failed} icon={AlertTriangle} tone="red" />
          <StatBox label="DLQ" value={stats.dlq} icon={Ban} tone="red" />
          <StatBox label="Entrega %" value={`${deliveryRate}%`} icon={CheckCircle2} tone="emerald" />
        </div>

        {/* Daily volume chart — last 30 days */}
        <div className="rounded-lg border admin-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium">Volume diário · últimos 30 dias</h3>
          </div>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(v: string) => {
                    const [, m, d] = v.split('-');
                    return `${d}/${m}`;
                  }}
                  interval="preserveStartEnd"
                  minTickGap={24}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelFormatter={(v: string) => {
                    const [y, m, d] = v.split('-');
                    return `${d}/${m}/${y}`;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
                <Line
                  type="monotone"
                  dataKey="sent"
                  name="Enviados"
                  stroke="hsl(142 71% 45%)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="failed"
                  name="Falhas"
                  stroke="hsl(0 72% 51%)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex gap-1 rounded-lg border admin-border p-1">
            {(['24h', '7d', '30d'] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1 text-xs rounded-md transition ${
                  range === r ? 'bg-primary text-primary-foreground' : 'admin-muted hover:bg-muted/40'
                }`}
              >
                {r === '24h' ? '24 h' : r === '7d' ? '7 dias' : '30 dias'}
              </button>
            ))}
          </div>

          <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
            <SelectTrigger className="w-[150px] h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="sent">Enviado</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="failed">Falha</SelectItem>
              <SelectItem value="dlq">DLQ</SelectItem>
              <SelectItem value="suppressed">Suprimido</SelectItem>
              <SelectItem value="stale">Stale (perdido)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={template} onValueChange={setTemplate}>
            <SelectTrigger className="w-[180px] h-9 text-xs">
              <SelectValue placeholder="Template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos templates</SelectItem>
              {templates.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Buscar por e-mail…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-[220px] h-9 text-xs"
          />
        </div>

        {/* Table */}
        <div className="rounded-lg border admin-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">Template</TableHead>
                <TableHead className="text-xs">Destinatário</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Quando</TableHead>
                <TableHead className="text-xs">Erro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 admin-muted text-sm">
                    {loading ? 'Carregando…' : 'Nenhum e-mail no período selecionado.'}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.slice(0, 50).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs font-medium">{r.template_name}</TableCell>
                    <TableCell className="text-xs">{r.recipient_email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${STATUS_STYLES[r.status] || ''}`}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs admin-muted whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell className="text-xs text-red-500 max-w-[280px] truncate">
                      {r.error_message || '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {filtered.length > 50 && (
          <p className="text-xs admin-muted text-center">
            Mostrando 50 de {filtered.length} resultados. Refine os filtros para ver mais.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function StatBox({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number | string;
  icon: typeof Mail;
  tone: 'neutral' | 'emerald' | 'amber' | 'red';
}) {
  const tones = {
    neutral: 'text-foreground',
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    red: 'text-red-600',
  };
  return (
    <div className="rounded-lg border admin-border p-3">
      <div className="flex items-center gap-1.5 admin-muted mb-1">
        <Icon className="h-3 w-3" />
        <span className="text-[10px] uppercase tracking-wide">{label}</span>
      </div>
      <div className={`text-xl font-semibold ${tones[tone]}`}>{value}</div>
    </div>
  );
}
