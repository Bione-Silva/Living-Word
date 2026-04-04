-- 005_admin_infrastructure.sql
-- Sprint 5: Infraestrutura Master, Vault de Chaves e View Analíticas (SaaS)
-- ============================================================

-- ============================================================
-- 1. Vault de Chaves de API Globais (master_api_vault)
-- Guarda as chaves (OpenAI, Gemini, Anthropic, OpenRouter) 
-- sem expor ao client-side.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.master_api_vault (
  provider_id TEXT PRIMARY KEY,
  api_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.master_api_vault ENABLE ROW LEVEL SECURITY;

-- Acesso concedido APENAS ao email master da LivingWord
CREATE POLICY "master_api_vault_admin_all" ON public.master_api_vault
  FOR ALL USING (auth.jwt() ->> 'email' = 'bionicaosilva@gmail.com');

-- ============================================================
-- 2. Configurações Globais do Ecossistema (global_settings)
-- Guarda qual modelo roda em qual função.
-- Ex: key='support_agent_model', value='gemini-2.5-flash'
-- ============================================================
CREATE TABLE IF NOT EXISTS public.global_settings (
  setting_key TEXT PRIMARY KEY,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "global_settings_read_all" ON public.global_settings
  FOR SELECT USING (true); -- Funções RLS e leitura na UI pública caso necessário para UI de status

CREATE POLICY "global_settings_master_all" ON public.global_settings
  FOR ALL USING (auth.jwt() ->> 'email' = 'bionicaosilva@gmail.com');

-- Popular Default
INSERT INTO public.global_settings (setting_key, setting_value, description)
VALUES 
  ('cfo_analytics_model', 'gpt-4o-mini', 'Inteligência e provedor responsável pelos relatórios do Master'),
  ('support_agent_model', 'gemini-2.5-flash', 'Inteligência que cuida do Suporte e Helpdesk ao usuário'),
  ('core_generation_model', 'gpt-4o-mini', 'Inteligência para produção principal de textos (Sermão/Blog)')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;

-- ============================================================
-- 3. View: admin_saas_metrics (Dashboard SaaS Completo)
-- Calcula KPIs em tempo real: Conversões, Leads, Free Vs Pago e MRR Estimado.
-- Usa as tabelas `users` e `subscriptions`.
-- ============================================================
CREATE OR REPLACE VIEW public.admin_saas_metrics AS
WITH UserPlans AS (
  SELECT plan FROM public.users
),
SubscriptionsStatus AS (
  SELECT status FROM public.subscriptions
)
SELECT 
  (SELECT count(*) FROM public.users) as total_users_registered,
  (SELECT count(*) FROM UserPlans WHERE plan = 'free') as users_free,
  (SELECT count(*) FROM UserPlans WHERE plan = 'pastoral') as users_pastoral,
  (SELECT count(*) FROM UserPlans WHERE plan = 'church') as users_church,
  (SELECT count(*) FROM UserPlans WHERE plan = 'ministry') as users_ministry,
  (SELECT count(*) FROM SubscriptionsStatus WHERE status = 'trialing') as users_trialing,
  -- MRR Calculation (Baseado no pricing model da LivingWord)
  (
    (SELECT count(*) FROM UserPlans WHERE plan = 'pastoral') * 9 +
    (SELECT count(*) FROM UserPlans WHERE plan = 'church') * 29 +
    (SELECT count(*) FROM UserPlans WHERE plan = 'ministry') * 79
  ) as estimated_mrr_usd;

-- ============================================================
-- 4. Função Segura para a Edge Function acessar Chave (Bypass RLS para Deno)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_api_key_secure(p_provider TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER -- Permite rodar como master
AS $$
DECLARE
  v_key TEXT;
BEGIN
  SELECT api_key INTO v_key FROM public.master_api_vault WHERE provider_id = p_provider LIMIT 1;
  RETURN v_key;
END;
$$;
