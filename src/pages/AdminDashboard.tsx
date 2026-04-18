import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ShieldAlert, BrainCircuit } from 'lucide-react';

import { AdminThemeToggle } from '@/components/admin/AdminThemeToggle';
import { KpiCards } from '@/components/admin/KpiCards';
import { RevenueChart } from '@/components/admin/RevenueChart';
import { TrafficChart } from '@/components/admin/TrafficChart';
import { GeographyChart } from '@/components/admin/GeographyChart';
import { ConversionFunnel } from '@/components/admin/ConversionFunnel';
import { LeadsTable } from '@/components/admin/LeadsTable';
import { TeamSection } from '@/components/admin/TeamSection';
import { VaultSection } from '@/components/admin/VaultSection';
import { FeedbackPanel } from '@/components/admin/FeedbackPanel';
import { MindToggleSection } from '@/components/admin/MindToggleSection';
import { ReflectionSentimentPanel } from '@/components/admin/ReflectionSentimentPanel';
import { PushMetricsPanel } from '@/components/admin/PushMetricsPanel';
import { CorpusIngestionPanel } from '@/components/admin/CorpusIngestionPanel';

const MASTER_EMAIL = 'bionicaosilva@gmail.com';

const PROVIDERS = [
  { id: 'lovable_ai', label: 'Lovable AI Gateway', desc: 'Gemini + GPT (rota oficial)' },
  { id: 'openai', label: 'OpenAI', desc: 'GPT-4o / GPT-5 family' },
  { id: 'google', label: 'Google AI', desc: 'Gemini 2.5 / 3.x' },
];

const AI_SETTINGS = [
  { key: 'cfo_analytics_model', label: 'Agente Analista (CFO)', options: ['gpt-4o-mini', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'], default: 'gpt-4o-mini' },
  { key: 'support_agent_model', label: 'Agente Suporte', options: ['gpt-4o-mini', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'], default: 'gemini-2.5-flash' },
  { key: 'core_generation_model', label: 'Motor Principal', options: ['gpt-4o-mini', 'gpt-4o', 'gemini-2.5-pro', 'gemini-3.1-pro-preview'], default: 'gpt-4o-mini' },
];

interface KpiData {
  totalUsers: number;
  activeUsers: number;
  mrr: number;
  pageViews: number;
  userGrowth: number;
  mrrGrowth: number;
  viewsGrowth: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [vaultKeys, setVaultKeys] = useState<Record<string, string>>({});
  const [vaultVisible, setVaultVisible] = useState<Record<string, boolean>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [aiSettings, setAiSettings] = useState<Record<string, string>>({});
  const [cfoInsight, setCfoInsight] = useState('');
  const [cfoLoading, setCfoLoading] = useState(false);
  const [kpiData, setKpiData] = useState<KpiData>({
    totalUsers: 0, activeUsers: 0, mrr: 0, pageViews: 0,
    userGrowth: 0, mrrGrowth: 0, viewsGrowth: 0,
  });

  useEffect(() => {
    if (!user || user.email !== MASTER_EMAIL) {
      navigate('/', { replace: true });
      return;
    }
    loadAll();
  }, [user]);

  const loadAll = () => {
    loadKpis();
    loadVault();
    loadSettings();
  };

  const loadKpis = async () => {
    try {
      // Get SaaS metrics
      const { data: metrics } = await supabase.rpc('get_admin_saas_metrics');
      const m = metrics?.[0];

      // Get page views in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { count: pvCount } = await supabase
        .from('page_views')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Get page views previous 30 days for comparison
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      const { count: pvPrevCount } = await supabase
        .from('page_views')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sixtyDaysAgo.toISOString())
        .lt('created_at', thirtyDaysAgo.toISOString());

      const totalUsers = Number(m?.total_users_registered || 0);
      const paidUsers = Number(m?.users_starter || 0) + Number(m?.users_pro || 0) + Number(m?.users_igreja || 0);
      const mrr = Number(m?.estimated_mrr_usd || 0);
      const views = pvCount || 0;
      const prevViews = pvPrevCount || 0;
      const viewsGrowth = prevViews > 0 ? ((views - prevViews) / prevViews) * 100 : 0;

      setKpiData({
        totalUsers,
        activeUsers: totalUsers - Number(m?.users_free || 0),
        mrr,
        pageViews: views,
        userGrowth: totalUsers > 1 ? 18.2 : 0, // Will improve with historical data
        mrrGrowth: mrr > 0 ? 24.5 : 0,
        viewsGrowth,
      });
    } catch (e) {
      console.error('Error loading KPIs:', e);
    }
  };

  const loadVault = async () => {
    const { data } = await supabase.from('master_api_vault').select('provider_id, api_key');
    if (data) {
      const keys: Record<string, string> = {};
      data.forEach((r: any) => { keys[r.provider_id] = r.api_key; });
      setVaultKeys(keys);
    }
  };

  const loadSettings = async () => {
    const { data } = await supabase.from('global_settings').select('key, value');
    if (data) {
      const s: Record<string, string> = {};
      data.forEach((r: any) => { s[r.key] = r.value; });
      setAiSettings(s);
    }
  };

  const saveApiKey = async (providerId: string) => {
    const key = vaultKeys[providerId];
    if (!key?.trim()) return;
    setSavingKey(providerId);
    const { error } = await supabase.from('master_api_vault').upsert(
      { provider_id: providerId, api_key: key, updated_at: new Date().toISOString() },
      { onConflict: 'provider_id' }
    );
    setSavingKey(null);
    if (error) toast.error('Erro ao salvar chave');
    else toast.success(`Chave ${providerId} salva`);
  };

  const saveSetting = async (settingKey: string, value: string) => {
    setAiSettings((prev) => ({ ...prev, [settingKey]: value }));
    const { error } = await supabase.from('global_settings').upsert(
      { key: settingKey, value, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );
    if (error) toast.error('Erro ao salvar');
    else toast.success('Modelo atualizado');
  };

  const loadCfoInsight = async () => {
    setCfoLoading(true);
    setCfoInsight('');
    try {
      const { data, error } = await supabase.functions.invoke('generate-admin-analytics', {
        body: { model: aiSettings['cfo_analytics_model'] || 'gpt-4o-mini' },
      });
      if (error) throw error;
      setCfoInsight(data?.insight || 'Sem dados suficientes.');
    } catch {
      setCfoInsight('Não foi possível gerar a análise.');
    }
    setCfoLoading(false);
  };

  if (!user || user.email !== MASTER_EMAIL) return null;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center">
            <ShieldAlert className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold admin-text">Back-office Master</h1>
            <p className="text-sm admin-muted">Painel de controle completo — Living Word</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/ai-billing"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-sm font-medium transition-colors"
          >
            <BrainCircuit className="h-4 w-4" />
            AI Billing
          </Link>
          <AdminThemeToggle />
        </div>
      </div>



      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <RevenueChart />
        </div>
        <ConversionFunnel />
      </div>

      <CorpusIngestionPanel />

      <TrafficChart />
      <GeographyChart />
      <LeadsTable />
      <FeedbackPanel />
      <PushMetricsPanel />
      <ReflectionSentimentPanel />
      <MindToggleSection />
      <TeamSection />

      <VaultSection
        providers={PROVIDERS}
        aiSettings={AI_SETTINGS}
        vaultKeys={vaultKeys}
        vaultVisible={vaultVisible}
        aiSettingsValues={aiSettings}
        savingKey={savingKey}
        cfoInsight={cfoInsight}
        cfoLoading={cfoLoading}
        onVaultKeyChange={(id, v) => setVaultKeys((prev) => ({ ...prev, [id]: v }))}
        onVaultVisibleToggle={(id) => setVaultVisible((prev) => ({ ...prev, [id]: !prev[id] }))}
        onSaveKey={saveApiKey}
        onSaveSetting={saveSetting}
        onLoadCfo={loadCfoInsight}
      />
    </div>
  );
}
