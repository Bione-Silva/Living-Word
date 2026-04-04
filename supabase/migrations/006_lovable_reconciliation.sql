-- 006_lovable_reconciliation.sql
-- Sprint 6: Reconciliação entre o schema do Lovable e o Backend Antigravity
-- ============================================================
-- O Lovable criou tabelas e colunas com nomes levemente diferentes
-- do nosso Backend. Esta migração garante compatibilidade total.
-- ============================================================

-- ============================================================
-- 1. Reconciliar global_settings: Lovable usa "key"/"value",
--    Backend usa "setting_key"/"setting_value"
--    SOLUÇÃO: Adicionar colunas alias OU renomear para o padrão Lovable
--    → Decidimos renomear para "key"/"value" (mais simples no React)
-- ============================================================
DO $$
BEGIN
  -- Se 'setting_key' existe mas 'key' não, renomear
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'global_settings' AND column_name = 'setting_key'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'global_settings' AND column_name = 'key'
  ) THEN
    ALTER TABLE public.global_settings RENAME COLUMN setting_key TO key;
    ALTER TABLE public.global_settings RENAME COLUMN setting_value TO value;
  END IF;
END $$;

-- Se a tabela sequer existe (Lovable criou antes do nosso 005), garantir
CREATE TABLE IF NOT EXISTS public.global_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Garantir defaults
INSERT INTO public.global_settings (key, value, description)
VALUES
  ('cfo_analytics_model', 'gpt-4o-mini', 'IA para relatórios Master'),
  ('support_agent_model', 'gemini-2.5-flash', 'IA para Suporte ao usuário'),
  ('core_generation_model', 'gpt-4o-mini', 'IA principal para geração de conteúdo')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 2. Tabela page_views (criada pelo Lovable — garantir existência)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  country TEXT,
  city TEXT,
  device TEXT,
  browser TEXT,
  session_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Master vê tudo
CREATE POLICY IF NOT EXISTS "Master can view page_views" ON public.page_views
  FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'email') = 'bionicaosilva@gmail.com');

-- Qualquer visitante pode inserir (tracking anônimo)
CREATE POLICY IF NOT EXISTS "Anyone can insert page_views" ON public.page_views
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON public.page_views(path);
CREATE INDEX IF NOT EXISTS idx_page_views_country ON public.page_views(country);

-- ============================================================
-- 3. Tabela monthly_financials (controle financeiro do Master)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.monthly_financials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month DATE NOT NULL,
  revenue NUMERIC NOT NULL DEFAULT 0,
  expenses NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.monthly_financials ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Master can manage financials" ON public.monthly_financials
  FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'email') = 'bionicaosilva@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'bionicaosilva@gmail.com');

-- ============================================================
-- 4. Tabela team_members (convites de equipe)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer',
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  invite_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  accepted_at TIMESTAMPTZ,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Master can manage team" ON public.team_members
  FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'email') = 'bionicaosilva@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'bionicaosilva@gmail.com');

CREATE POLICY IF NOT EXISTS "Team members can view own record" ON public.team_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- 5. Campos de perfil estendido
--    O Lovable espera uma tabela "profiles" (auto-criada pelo Supabase).
--    Verificamos se ela já existe; se sim, adicionamos campos.
--    Se a plataforma usa "users", criamos um alias via VIEW.
-- ============================================================
DO $$
BEGIN
  -- Se "profiles" existe (padrão Supabase/Lovable), adicionar campos
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN IF NOT EXISTS phone TEXT,
      ADD COLUMN IF NOT EXISTS country TEXT,
      ADD COLUMN IF NOT EXISTS city TEXT,
      ADD COLUMN IF NOT EXISTS church_name TEXT,
      ADD COLUMN IF NOT EXISTS denomination TEXT,
      ADD COLUMN IF NOT EXISTS favorite_preacher TEXT,
      ADD COLUMN IF NOT EXISTS preaching_style TEXT,
      ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;
  END IF;

  -- Se apenas "users" existe (nosso schema), adicionar os mesmos campos
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'users'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.users
      ADD COLUMN IF NOT EXISTS phone TEXT,
      ADD COLUMN IF NOT EXISTS country TEXT,
      ADD COLUMN IF NOT EXISTS city TEXT,
      ADD COLUMN IF NOT EXISTS church_name TEXT,
      ADD COLUMN IF NOT EXISTS denomination TEXT,
      ADD COLUMN IF NOT EXISTS favorite_preacher TEXT,
      ADD COLUMN IF NOT EXISTS preaching_style TEXT,
      ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;

    -- Criar VIEW "profiles" apontando para "users" para o Lovable funcionar
    CREATE OR REPLACE VIEW public.profiles AS
    SELECT
      id,
      email,
      full_name,
      plan,
      language_preference,
      phone,
      country,
      city,
      church_name,
      denomination,
      favorite_preacher,
      preaching_style,
      profile_completed,
      created_at,
      updated_at
    FROM public.users;
  END IF;
END $$;

-- ============================================================
-- 6. Atualizar a função get_api_key_secure para o novo nome de coluna
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_api_key_secure(p_provider TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_key TEXT;
BEGIN
  SELECT api_key INTO v_key FROM public.master_api_vault
    WHERE provider_id = p_provider LIMIT 1;
  RETURN v_key;
END;
$$;
