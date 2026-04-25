-- =============================================
-- RECUPERAÇÃO DE TABELAS DELETADAS
-- Living Word / Palavra Viva
-- =============================================

-- 1. MIND_SETTINGS — controla quais mentes são visíveis
CREATE TABLE IF NOT EXISTS public.mind_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  mind_id text UNIQUE NOT NULL,
  active boolean DEFAULT true NOT NULL,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.mind_settings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "mind_settings_read" ON public.mind_settings FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "mind_settings_all" ON public.mind_settings FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Seed: ativar TODAS as 7 mentes
INSERT INTO public.mind_settings (mind_id, active) VALUES
  ('billy-graham', true),
  ('charles-spurgeon', true),
  ('john-wesley', true),
  ('joao-calvino', true),
  ('marco-feliciano', true),
  ('tiago-brunet', true),
  ('martyn-lloyd-jones', true)
ON CONFLICT (mind_id) DO UPDATE SET active = true, updated_at = now();

-- 2. GLOBAL_SETTINGS — configs gerais da plataforma
CREATE TABLE IF NOT EXISTS public.global_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key text UNIQUE NOT NULL,
  value text,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "global_settings_read" ON public.global_settings FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "global_settings_all" ON public.global_settings FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Seed configs padrão
INSERT INTO public.global_settings (key, value) VALUES
  ('cfo_analytics_model', 'gpt-4o-mini'),
  ('support_agent_model', 'gemini-2.5-flash'),
  ('core_generation_model', 'gpt-4o-mini')
ON CONFLICT (key) DO NOTHING;

-- 3. MASTER_API_VAULT — chaves de API do admin
CREATE TABLE IF NOT EXISTS public.master_api_vault (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id text UNIQUE NOT NULL,
  api_key text NOT NULL,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.master_api_vault ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "vault_read" ON public.master_api_vault FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "vault_all" ON public.master_api_vault FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
