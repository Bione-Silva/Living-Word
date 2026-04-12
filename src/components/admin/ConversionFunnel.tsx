import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FunnelStep { label: string; value: number; color: string; }

export function ConversionFunnel() {
  const [steps, setSteps] = useState<FunnelStep[]>([
    { label: 'Visitantes Landing', value: 0, color: 'bg-violet-500' },
    { label: 'Cadastros (Leads)', value: 0, color: 'bg-blue-500' },
    { label: 'Trial Ativado', value: 0, color: 'bg-cyan-500' },
    { label: 'Conversão Paga', value: 0, color: 'bg-emerald-500' },
  ]);

  useEffect(() => {
    loadFunnel();
  }, []);

  const loadFunnel = async () => {
    try {
      // Landing page views
      const { count: landingViews } = await (supabase as any)
        .from('page_views')
        .select('*', { count: 'exact', head: true })
        .eq('path', '/');

      // Total registrations
      const { data: metrics } = await (supabase as any).rpc('get_admin_saas_metrics');
      const m = metrics?.[0];
      const totalUsers = Number(m?.total_users_registered || 0);
      const trialing = Number(m?.users_trialing || 0);
      const paid = Number(m?.users_starter || 0) + Number(m?.users_pro || 0) + Number(m?.users_igreja || 0);

      setSteps([
        { label: 'Visitantes Landing', value: landingViews || 0, color: 'bg-violet-500' },
        { label: 'Cadastros (Leads)', value: totalUsers, color: 'bg-blue-500' },
        { label: 'Trial Ativado', value: trialing + paid, color: 'bg-cyan-500' },
        { label: 'Conversão Paga', value: paid, color: 'bg-emerald-500' },
      ]);
    } catch (e) {
      console.error('Error loading funnel:', e);
    }
  };

  const max = Math.max(steps[0].value, 1);

  return (
    <Card className="admin-card border-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold admin-text">Funil de Conversão</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((s, i) => {
            const pct = Math.round((s.value / max) * 100);
            const convRate = i > 0 && steps[i - 1].value > 0
              ? ((s.value / steps[i - 1].value) * 100).toFixed(1)
              : null;
            return (
              <div key={s.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm admin-text">{s.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold admin-text">{s.value.toLocaleString('pt-BR')}</span>
                    {convRate && (
                      <span className="text-[10px] admin-muted">({convRate}%)</span>
                    )}
                  </div>
                </div>
                <div className="h-8 rounded-lg bg-muted/20 overflow-hidden">
                  <div
                    className={`h-full rounded-lg ${s.color} transition-all duration-1000 flex items-center justify-end pr-3`}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  >
                    {pct > 5 && <span className="text-[10px] font-bold text-white">{pct}%</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
