import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Bell, Users, Send, Activity, CheckCircle2, MousePointerClick } from 'lucide-react';

interface PushMetrics {
  total_subscriptions: number;
  unique_users: number;
  opted_in_users: number;
  deliveries_24h: number;
  deliveries_7d: number;
  success_rate_7d: number;
  click_rate_7d: number;
}

export function PushMetricsPanel() {
  const [m, setM] = useState<PushMetrics | null>(null);

  useEffect(() => {
    supabase.rpc('get_admin_push_metrics' as any).then(({ data }: any) => {
      if (data) setM(data as PushMetrics);
    });
  }, []);

  const items = [
    { icon: Users, label: 'Inscritos (usuários)', value: m?.unique_users ?? 0 },
    { icon: Bell, label: 'Devices inscritos', value: m?.total_subscriptions ?? 0 },
    { icon: CheckCircle2, label: 'Opt-in ativo', value: m?.opted_in_users ?? 0 },
    { icon: Send, label: 'Envios 24h', value: m?.deliveries_24h ?? 0 },
    { icon: Activity, label: 'Envios 7d', value: m?.deliveries_7d ?? 0 },
    { icon: MousePointerClick, label: 'Taxa clique 7d', value: `${m?.click_rate_7d ?? 0}%` },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display admin-text">
          <Bell className="h-5 w-5 text-primary" /> Push notifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {items.map((it) => (
            <div key={it.label} className="rounded-lg border admin-card p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 admin-muted text-xs">
                <it.icon className="h-3.5 w-3.5" />
                <span>{it.label}</span>
              </div>
              <p className="text-xl font-semibold admin-text">{it.value}</p>
            </div>
          ))}
        </div>
        <p className="text-xs admin-muted mt-3">
          Taxa de sucesso 7d: <strong>{m?.success_rate_7d ?? 0}%</strong>
        </p>
      </CardContent>
    </Card>
  );
}
