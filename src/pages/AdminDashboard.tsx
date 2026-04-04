import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Activity, Star, DollarSign, Brain, TrendingUp, Eye, EyeOff, Save, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

const MASTER_EMAIL = 'bionicaosilva@gmail.com';

interface SaasMetrics {
  total_users_registered: number;
  users_free: number;
  users_trialing: number;
  users_pastoral: number;
  users_church: number;
  users_ministry: number;
  estimated_mrr_usd: number;
}

const PROVIDERS = [
  { id: 'openrouter', label: 'OpenRouter', desc: 'Claude + GPT no mesmo balance — Recomendado' },
  { id: 'openai', label: 'OpenAI', desc: '' },
  { id: 'groq', label: 'Groq', desc: '' },
  { id: 'anthropic', label: 'Anthropic', desc: '' },
];

const AI_SETTINGS = [
  {
    key: 'cfo_analytics_model',
    label: 'Agente Analista Master (CFO Interno)',
    options: ['gpt-4o-mini', 'gemini-2.5-flash', 'claude-3-haiku'],
    default: 'gpt-4o-mini',
  },
  {
    key: 'support_agent_model',
    label: 'Agente de Atendimento ao Público (Helpdesk)',
    options: ['gpt-4o-mini', 'gemini-2.5-flash', 'claude-3-haiku'],
    default: 'gemini-2.5-flash',
  },
  {
    key: 'core_generation_model',
    label: 'Motor Principal (Estudo/Sermão)',
    options: ['gpt-4o-mini', 'gpt-4o', 'gemini-pro', 'claude-3-sonnet'],
    default: 'gpt-4o-mini',
  },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<SaasMetrics | null>(null);
  const [vaultKeys, setVaultKeys] = useState<Record<string, string>>({});
  const [vaultVisible, setVaultVisible] = useState<Record<string, boolean>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [aiSettings, setAiSettings] = useState<Record<string, string>>({});
  const [cfoInsight, setCfoInsight] = useState<string>('');
  const [cfoLoading, setCfoLoading] = useState(false);

  useEffect(() => {
    if (!user || user.email !== MASTER_EMAIL) {
      navigate('/', { replace: true });
      return;
    }
    loadMetrics();
    loadVault();
    loadSettings();
  }, [user]);

  const loadMetrics = async () => {
    const { data, error } = await supabase.rpc('get_admin_saas_metrics');
    if (data && !error && data.length > 0) {
      setMetrics(data[0] as unknown as SaasMetrics);
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
    else toast.success(`Chave ${providerId} salva com sucesso`);
  };

  const saveSetting = async (settingKey: string, value: string) => {
    setAiSettings(prev => ({ ...prev, [settingKey]: value }));
    const { error } = await supabase.from('global_settings').upsert(
      { key: settingKey, value, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );
    if (error) toast.error('Erro ao salvar configuração');
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
      setCfoInsight(data?.insight || 'Sem dados suficientes para análise no momento.');
    } catch {
      setCfoInsight('Não foi possível gerar a análise. Verifique se a Edge Function está configurada.');
    }
    setCfoLoading(false);
  };

  if (!user || user.email !== MASTER_EMAIL) return null;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
          <ShieldAlert className="h-5 w-5 text-destructive" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Back-office Master</h1>
          <p className="text-sm text-muted-foreground">Painel de controle do SaaS Living Word</p>
        </div>
      </div>

      {/* AREA 1: SaaS Metrics */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">📊 Visão Geral do SaaS</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-medium uppercase tracking-wider">Contas Registradas</CardDescription>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{metrics?.total_users_registered ?? '—'}</p>
              <p className="text-xs text-muted-foreground mt-1">Leads totais</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-medium uppercase tracking-wider">Trial / Free</CardDescription>
                <Activity className="h-4 w-4 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">
                {metrics?.users_trialing ?? 0} <span className="text-lg text-muted-foreground font-normal">trial</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">({metrics?.users_free ?? 0} Free)</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-medium uppercase tracking-wider">Assinaturas Pagas</CardDescription>
                <Star className="h-4 w-4 text-indigo-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-sm"><span className="font-semibold">{metrics?.users_pastoral ?? 0}</span> Pastoral</p>
                <p className="text-sm"><span className="font-semibold">{metrics?.users_church ?? 0}</span> Church</p>
                <p className="text-sm"><span className="font-semibold">{metrics?.users_ministry ?? 0}</span> Ministry</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-gradient-to-br from-green-500/5 to-emerald-500/10">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-medium uppercase tracking-wider text-green-600">Receita (MRR)</CardDescription>
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-green-600">
                US$ {metrics?.estimated_mrr_usd?.toFixed(2) ?? '0.00'}
              </p>
              <p className="text-xs text-green-600/70 mt-1">Receita mensal recorrente estimada</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* AREA 2: The Vault */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              🔐 The Vault — Configuração de Chaves
            </CardTitle>
            <CardDescription>Insira as API Keys dos provedores de IA. As chaves ficam seguras no banco.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* API Keys */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">API Keys</h3>
              {PROVIDERS.map((p) => (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="w-28 shrink-0">
                    <p className="text-sm font-medium">{p.label}</p>
                    {p.desc && <p className="text-[10px] text-muted-foreground">{p.desc}</p>}
                  </div>
                  <div className="relative flex-1">
                    <Input
                      type={vaultVisible[p.id] ? 'text' : 'password'}
                      placeholder={`Chave ${p.label}...`}
                      value={vaultKeys[p.id] || ''}
                      onChange={(e) => setVaultKeys(prev => ({ ...prev, [p.id]: e.target.value }))}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setVaultVisible(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {vaultVisible[p.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => saveApiKey(p.id)}
                    disabled={savingKey === p.id}
                  >
                    <Save className="h-3.5 w-3.5 mr-1" />
                    Salvar
                  </Button>
                </div>
              ))}
            </div>

            {/* AI Model Settings */}
            <div className="space-y-3 pt-4 border-t border-border">
              <h3 className="text-sm font-semibold text-foreground">⚙️ IAs Ativas — Modelos</h3>
              {AI_SETTINGS.map((s) => (
                <div key={s.key} className="flex items-center gap-3">
                  <p className="text-sm w-64 shrink-0">{s.label}</p>
                  <Select
                    value={aiSettings[s.key] || s.default}
                    onValueChange={(v) => saveSetting(s.key, v)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {s.options.map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* AREA 3: CFO Analytics Agent */}
      <section>
        <Card className="bg-gradient-to-r from-slate-900 to-slate-800 text-white border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Brain className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <CardTitle className="text-white text-lg">Conselheiro Financeiro Analítico AI</CardTitle>
                  <CardDescription className="text-slate-400">Análise inteligente de custos e receita</CardDescription>
                </div>
              </div>
              <Button
                onClick={loadCfoInsight}
                disabled={cfoLoading}
                variant="outline"
                className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
              >
                <TrendingUp className="h-4 w-4 mr-1" />
                {cfoLoading ? 'Analisando...' : 'Gerar Análise'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {cfoInsight ? (
              <div className="bg-white/5 rounded-lg p-4 text-sm text-slate-200 leading-relaxed prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{cfoInsight}</ReactMarkdown>
              </div>
            ) : (
              <div className="bg-white/5 rounded-lg p-4 text-sm text-slate-400 italic">
                Clique em "Gerar Análise" para receber insights financeiros do seu SaaS com base nos dados reais.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
