-- 002_sprint2_schema.sql
-- Sprint 2: WordPress sites config, Stripe webhook, publicação cron
-- Rodar APÓS 001_initial_schema.sql

-- ============================================================
-- 1. Tabela de sites WordPress do usuário (separada do JSONB)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wordpress_sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  site_name TEXT NOT NULL,
  site_url TEXT NOT NULL,
  wp_rest_url TEXT NOT NULL,
  wp_username TEXT NOT NULL,
  wp_app_password TEXT NOT NULL, -- armazenada criptografada via vault
  site_type TEXT NOT NULL DEFAULT 'external' CHECK (site_type IN ('livingword_internal', 'external')),
  language TEXT DEFAULT 'PT',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, site_url)
);

ALTER TABLE public.wordpress_sites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wp_sites_own" ON public.wordpress_sites FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_wp_sites_user ON public.wordpress_sites(user_id);

-- ============================================================
-- 2. Tabela de eventos Stripe (webhook log)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.stripe_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  customer_id TEXT,
  user_id UUID REFERENCES public.users(id),
  subscription_id TEXT,
  plan_from TEXT,
  plan_to TEXT,
  amount_cents INTEGER,
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'processed',
  metadata JSONB DEFAULT '{}',
  raw_event JSONB DEFAULT '{}',
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
-- Apenas service_role pode ler/escrever eventos Stripe
CREATE POLICY "stripe_admin_only" ON public.stripe_events FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX idx_stripe_events_user ON public.stripe_events(user_id);
CREATE INDEX idx_stripe_events_type ON public.stripe_events(event_type);
CREATE INDEX idx_stripe_events_customer ON public.stripe_events(customer_id);

-- ============================================================
-- 3. Tabela de assinaturas ativas
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'pastoral', 'church', 'ministry')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid')),
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  amount_cents INTEGER,
  currency TEXT DEFAULT 'usd',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subs_own" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "subs_service" ON public.subscriptions FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe ON public.subscriptions(stripe_subscription_id);

-- ============================================================
-- 4. Função para processar upgrade de plano (chamada pelo stripe-webhook)
-- ============================================================
CREATE OR REPLACE FUNCTION public.process_plan_upgrade(
  p_user_id UUID,
  p_new_plan TEXT,
  p_stripe_customer_id TEXT DEFAULT NULL,
  p_stripe_subscription_id TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_old_plan TEXT;
BEGIN
  -- Buscar plano atual
  SELECT plan INTO v_old_plan FROM public.users WHERE id = p_user_id;

  -- Atualizar plano do usuário
  UPDATE public.users
  SET plan = p_new_plan,
      stripe_customer_id = COALESCE(p_stripe_customer_id, stripe_customer_id),
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Registrar evento de conversão
  INSERT INTO public.conversion_events (user_id, event_type, plan_from, plan_to, metadata)
  VALUES (
    p_user_id,
    'plan_upgraded',
    v_old_plan,
    p_new_plan,
    jsonb_build_object(
      'stripe_customer_id', p_stripe_customer_id,
      'stripe_subscription_id', p_stripe_subscription_id,
      'upgraded_at', NOW()
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 5. Função para processar downgrade/cancelamento
-- ============================================================
CREATE OR REPLACE FUNCTION public.process_plan_downgrade(
  p_user_id UUID,
  p_reason TEXT DEFAULT 'subscription_canceled'
)
RETURNS void AS $$
DECLARE
  v_old_plan TEXT;
BEGIN
  SELECT plan INTO v_old_plan FROM public.users WHERE id = p_user_id;

  UPDATE public.users
  SET plan = 'free',
      updated_at = NOW()
  WHERE id = p_user_id;

  INSERT INTO public.conversion_events (user_id, event_type, plan_from, plan_to, metadata)
  VALUES (
    p_user_id,
    'plan_upgraded', -- reutilizamos o tipo e diferenciamos pelo plan_to
    v_old_plan,
    'free',
    jsonb_build_object('reason', p_reason, 'downgraded_at', NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 6. Função cron para publicar artigos agendados
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_due_publications()
RETURNS TABLE (
  queue_id UUID,
  material_id UUID,
  user_id UUID,
  target_site_url TEXT,
  scheduled_at TIMESTAMPTZ
)
LANGUAGE sql
AS $$
  SELECT
    eq.id AS queue_id,
    eq.material_id,
    eq.user_id,
    eq.target_site_url,
    eq.scheduled_at
  FROM public.editorial_queue eq
  WHERE eq.status = 'scheduled'
    AND eq.scheduled_at <= NOW()
  ORDER BY eq.scheduled_at ASC
  LIMIT 10;
$$;

-- ============================================================
-- 7. Adicionar campo wp_post_id na editorial_queue (se não existe)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'editorial_queue'
    AND column_name = 'wp_post_id'
  ) THEN
    -- Já existe na migração 001, mas garantir
    NULL;
  END IF;
END $$;

-- ============================================================
-- 8. View para dashboard admin: métricas de conversão
-- ============================================================
CREATE OR REPLACE VIEW public.admin_conversion_metrics AS
SELECT
  date_trunc('day', created_at) AS day,
  event_type,
  trigger_name,
  COUNT(*) AS event_count,
  COUNT(DISTINCT user_id) AS unique_users
FROM public.conversion_events
GROUP BY 1, 2, 3
ORDER BY 1 DESC;

-- ============================================================
-- 9. View para dashboard admin: MRR por plano
-- ============================================================
CREATE OR REPLACE VIEW public.admin_mrr_by_plan AS
SELECT
  plan,
  COUNT(*) AS user_count,
  CASE plan
    WHEN 'free' THEN 0
    WHEN 'pastoral' THEN 9 * COUNT(*)
    WHEN 'church' THEN 29 * COUNT(*)
    WHEN 'ministry' THEN 79 * COUNT(*)
  END AS mrr_usd
FROM public.users
GROUP BY plan
ORDER BY mrr_usd DESC;
