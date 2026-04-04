import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ShieldAlert } from 'lucide-react';

import { AdminThemeToggle } from '@/components/admin/AdminThemeToggle';
import { KpiCards } from '@/components/admin/KpiCards';
import { RevenueChart } from '@/components/admin/RevenueChart';
import { TrafficChart } from '@/components/admin/TrafficChart';
import { GeographyChart } from '@/components/admin/GeographyChart';
import { ConversionFunnel } from '@/components/admin/ConversionFunnel';
import { LeadsTable } from '@/components/admin/LeadsTable';
import { TeamSection } from '@/components/admin/TeamSection';
import { VaultSection } from '@/components/admin/VaultSection';

const MASTER_EMAIL = 'bionicaosilva@gmail.com';

const PROVIDERS = [
  { id: 'openrouter', label: 'OpenRouter', desc: 'Claude + GPT no mesmo balance' },
  { id: 'openai', label: 'OpenAI', desc: '' },
  { id: 'groq', label: 'Groq', desc: '' },
  { id: 'anthropic', label: 'Anthropic', desc: '' },
];

const AI_SETTINGS = [
  { key: 'cfo_analytics_model', label: 'Agente Analista (CFO)', options: ['gpt-4o-mini', 'gemini-2.5-flash', 'claude-3-haiku'], default: 'gpt-4o-mini' },
  { key: 'support_agent_model', label: 'Agente Suporte', options: ['gpt-4o-mini', 'gemini-2.5-flash', 'claude-3-haiku'], default: 'gemini-2.5-flash' },
  { key: 'core_generation_model', label: 'Motor Principal', options: ['gpt-4o-mini', 'gpt-4o', 'gemini-pro', 'claude-3-sonnet'], default: 'gpt-4o-mini' },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [vaultKeys, setVaultKeys] = useState<Record<string, string>>({});
  const [vaultVisible, setVaultVisible] = useState<Record<string, boolean>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [aiSettings, setAiSettings] = useState<Record<string, string>>({});
  const [cfoInsight, setCfoInsight] = useState('');
  const [cfoLoading, setCfoLoading] = useState(false);

  // Mock KPI data (will connect to real data later)
  const kpiData = {
    totalUsers: 1284,
    activeUsers: 847,
    mrr: 4280.50,
    pageViews: 7420,
    userGrowth: 18.2,
    mrrGrowth: 24.5,
    viewsGrowth: 32.1,
  };

  useEffect(() => {
    if (!user || user.email !== MASTER_EMAIL) {
      navigate('/', { replace: true });
      return;
    }
    loadVault();
    loadSettings();
  }, [user]);

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
      {/* Header */}
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
        <AdminThemeToggle />
      </div>

      {/* KPI Cards */}
      <KpiCards data={kpiData} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <RevenueChart />
        </div>
        <ConversionFunnel />
      </div>

      {/* Traffic + Devices */}
      <TrafficChart />

      {/* Geography */}
      <GeographyChart />

      {/* Leads Table */}
      <LeadsTable />

      {/* Team Management */}
      <TeamSection />

      {/* Vault + CFO */}
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
