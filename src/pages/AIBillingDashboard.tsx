import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { BrainCircuit, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AdminThemeToggle } from '@/components/admin/AdminThemeToggle';
import { AICostKPIs } from '@/components/admin/ai-billing/AICostKPIs';
import { AICharts } from '@/components/admin/ai-billing/AICharts';
import { TenantsUsageTable } from '@/components/admin/ai-billing/TenantsUsageTable';
import { MOCK_DATA } from '@/components/admin/ai-billing/mockData';
import type { AIMetrics } from '@/components/admin/ai-billing/types';

const MASTER_EMAIL = 'bionicaosilva@gmail.com';

export default function AIBillingDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<AIMetrics>(MOCK_DATA);
  const [loading, setLoading] = useState(true);
  const [isRealData, setIsRealData] = useState(false);

  useEffect(() => {
    if (!user || user.email !== MASTER_EMAIL) {
      navigate('/', { replace: true });
      return;
    }
    loadMetrics();
  }, [user]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const { data: rpcData, error } = await (supabase as any).rpc('get_admin_ai_metrics' as any);
      if (!error && rpcData) {
        const metrics = rpcData as unknown as AIMetrics;
        // Only use real data if there are actual generations
        if (metrics.total_generations > 0) {
          setData(metrics);
          setIsRealData(true);
        }
      }
    } catch {
      // RPC not available yet, keep mock data
    }
    setLoading(false);
  };

  if (!user || user.email !== MASTER_EMAIL) return null;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center">
            <BrainCircuit className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold admin-text">AI Billing Dashboard</h1>
            <p className="text-sm admin-muted">Custos e consumo de tokens — OpenAI & Gemini</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isRealData && (
            <Badge variant="outline" className="text-amber-400 border-amber-400/40 text-[10px]">
              MOCK DATA
            </Badge>
          )}
          <AdminThemeToggle />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin admin-muted" />
        </div>
      ) : (
        <>
          <AICostKPIs data={data} />
          <AICharts data={data} />
          <TenantsUsageTable tenants={data.tenants_usage} />
        </>
      )}
    </div>
  );
}
