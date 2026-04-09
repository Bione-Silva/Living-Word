-- ============================================================
-- 011_backend_architecture_v1.sql
-- Implementação da Nova Arquitetura de Backend V1.0
-- (Créditos, Planos, Ferramentas, Stripe, Workspaces, Profiles)
-- ============================================================

-- 1. Profiles (Tabela perfil alinhada ao padrão Supabase para Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  plan TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'starter', 'pro', 'igreja')),
  plan_interval TEXT DEFAULT NULL
    CHECK (plan_interval IN ('monthly', 'annual', NULL)),
  credits_remaining INTEGER NOT NULL DEFAULT 150,
  credits_monthly_limit INTEGER NOT NULL DEFAULT 150,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  subscription_status TEXT DEFAULT 'inactive'
    CHECK (subscription_status IN ('active', 'inactive', 'past_due', 'canceled', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuário lê o próprio perfil"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "usuário atualiza o próprio perfil"
  ON public.profiles FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Gatilho para preencher profiles ao criar account na auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, plan, credits_remaining, credits_monthly_limit)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'free',
    150,
    150
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Se o trigger antigo existir, nós adicionaremos o novo para a tabela profiles
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();


-- 2. Tabela free_tool_usage (Controla o "1 uso por ferramenta" do Free)
CREATE TABLE IF NOT EXISTS public.free_tool_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  tool_slug TEXT NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  reset_at TIMESTAMPTZ NOT NULL, -- primeiro dia do próximo mês
  UNIQUE(user_id, tool_slug, reset_at)
);

CREATE INDEX IF NOT EXISTS idx_free_tool_usage_user ON public.free_tool_usage(user_id, tool_slug, reset_at);
ALTER TABLE public.free_tool_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usuário vê seu próprio uso" ON public.free_tool_usage FOR SELECT USING (auth.uid() = user_id);

-- 3. Tabela credit_transactions
CREATE TABLE IF NOT EXISTS public.credit_transactions_v1 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  tool_slug TEXT NOT NULL,
  credits_used INTEGER NOT NULL,
  credits_before INTEGER NOT NULL,
  credits_after INTEGER NOT NULL,
  generation_id UUID, -- referência ao conteúdo gerado
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_v1_user ON public.credit_transactions_v1(user_id, created_at DESC);
ALTER TABLE public.credit_transactions_v1 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usuário vê suas transações" ON public.credit_transactions_v1 FOR SELECT USING (auth.uid() = user_id);


-- 4. Workspaces & Members (Estrutura multitenant)
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan_required TEXT NOT NULL DEFAULT 'free'
    CHECK (plan_required IN ('free', 'starter', 'pro', 'igreja')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner gerencia workspace" ON public.workspaces FOR ALL USING (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  UNIQUE(workspace_id, user_id)
);


-- 5. Tabela generated_content (Armazena todo conteúdo gerado unificado)
CREATE TABLE IF NOT EXISTS public.generated_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  tool_slug TEXT NOT NULL,
  input_params JSONB NOT NULL DEFAULT '{}',
  output_content TEXT NOT NULL,
  output_tokens INTEGER,
  favorito BOOLEAN DEFAULT FALSE,
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generated_content_user ON public.generated_content(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_content_tool ON public.generated_content(user_id, tool_slug);
ALTER TABLE public.generated_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usuário vê seu conteúdo" ON public.generated_content FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "usuário cria conteúdo" ON public.generated_content FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "usuário atualiza conteúdo" ON public.generated_content FOR UPDATE USING (auth.uid() = user_id);


-- 6. Tabela stripe_events (Log de webhooks)
CREATE TABLE IF NOT EXISTS public.stripe_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  payload JSONB NOT NULL
);


-- 7. Configuração dos Planos (Parametrização no DB)
CREATE TABLE IF NOT EXISTS public.plan_config (
  plan TEXT PRIMARY KEY CHECK (plan IN ('free', 'starter', 'pro', 'igreja')),
  credits_monthly INTEGER NOT NULL,
  max_users INTEGER NOT NULL,
  max_workspaces INTEGER,
  max_portals INTEGER NOT NULL,
  stripe_price_id_monthly TEXT,
  stripe_price_id_annual TEXT
);

INSERT INTO public.plan_config VALUES
  ('free',     150,    1, 1, 1, NULL, NULL),
  ('starter',  3000,   1, 1, 1, 'price_starter_monthly', 'price_starter_annual'),
  ('pro',      10000,  3, 3, 1, 'price_pro_monthly',     'price_pro_annual'),
  ('igreja',   30000,  10, NULL, 5, 'price_igreja_monthly', 'price_igreja_annual')
ON CONFLICT (plan) DO UPDATE SET 
  credits_monthly = EXCLUDED.credits_monthly,
  max_users = EXCLUDED.max_users,
  max_workspaces = EXCLUDED.max_workspaces,
  max_portals = EXCLUDED.max_portals,
  stripe_price_id_monthly = EXCLUDED.stripe_price_id_monthly,
  stripe_price_id_annual = EXCLUDED.stripe_price_id_annual;


-- 8. Tabela de Custos por Ferramenta (tool_config)
CREATE TABLE IF NOT EXISTS public.tool_config (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('pesquisa', 'criacao_core', 'criacao_extras', 'premium')),
  credits_cost INTEGER NOT NULL,
  min_plan TEXT NOT NULL DEFAULT 'free'
    CHECK (min_plan IN ('free', 'starter', 'pro', 'igreja')),
  available_on_free BOOLEAN NOT NULL DEFAULT FALSE
);

INSERT INTO public.tool_config (slug, name, category, credits_cost, min_plan, available_on_free) VALUES
('explorador_temas',     'Explorador de Temas',    'pesquisa',        5,  'free',    TRUE),
('versiculos',           'Versículos',             'pesquisa',        3,  'free',    TRUE),
('contexto_historico',   'Contexto Histórico',     'pesquisa',        5,  'free',    TRUE),
('citacoes',             'Citações',               'pesquisa',        4,  'free',    TRUE),
('texto_original',       'Texto Original',         'pesquisa',        4,  'free',    TRUE),
('analise_lexical',      'Análise Lexical',        'pesquisa',        5,  'free',    TRUE),
('estudio_pastoral',     'Estúdio Pastoral',       'criacao_core',   20,  'free',    TRUE),
('estudo_biblico',       'Estudo Bíblico',         'criacao_core',   30,  'free',    TRUE),
('blog',                 'Blog',                   'criacao_core',   15,  'free',    TRUE),
('artigo',               'Artigo',                 'criacao_core',   15,  'free',    TRUE),
('titulos',              'Títulos Criativos',      'criacao_core',    3,  'free',    TRUE),
('metaforas',            'Criador de Metáforas',   'criacao_core',    4,  'free',    TRUE),
('modernizador',         'Modernizador Bíblico',   'criacao_core',    6,  'free',    TRUE),
('redator_universal',    'Redator Universal',      'criacao_core',   10,  'free',    TRUE),
('roteiro_reels',        'Roteiro Reels',          'criacao_extras', 15,  'starter', FALSE),
('celula',               'Célula',                 'criacao_extras', 15,  'starter', FALSE),
('legendas',             'Legendas',               'criacao_extras', 10,  'starter', FALSE),
('newsletter',           'Newsletter',             'criacao_extras', 30,  'starter', FALSE),
('avisos',               'Avisos',                 'criacao_extras', 10,  'starter', FALSE),
('quiz_biblico',         'Quiz Bíblico',           'criacao_extras', 20,  'starter', FALSE),
('poesia',               'Poesia',                 'criacao_extras', 15,  'starter', FALSE),
('infantil',             'Infantil',               'criacao_extras', 20,  'starter', FALSE),
('traducao',             'Tradução',               'criacao_extras', 15,  'starter', FALSE),
('youtube_to_blog',      'YouTube → Blog',         'criacao_extras', 25,  'pro',     FALSE),
('mentes_brilhantes',    'Mentes Brilhantes',      'premium',        40,  'pro',     FALSE),
('ilustracoes',          'Ilustrações Sermões',    'premium',        25,  'pro',     FALSE)
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  credits_cost = EXCLUDED.credits_cost,
  min_plan = EXCLUDED.min_plan,
  available_on_free = EXCLUDED.available_on_free;

-- NOTA: A tabela public.users não existe neste projeto.
-- Os usuários são gerenciados exclusivamente via auth.users (Supabase Auth).
-- O trigger on_auth_user_created_profile acima cuida de criar o perfil
-- automaticamente para cada novo signup. Nenhuma sincronização manual é necessária.
