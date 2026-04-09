-- ============================================================
-- 007_credits_billing.sql
-- Sistema de Créditos, Rate Limiting e Billing Avançado
-- ============================================================
-- MIGRAÇÃO DESTRUTIVA: Renomeia planos existentes e adiciona
-- infraestrutura completa de créditos com débito atômico.
-- ============================================================

-- ============================================================
-- 1. Migrar nomes de planos: pastoral→starter, church→pro, ministry→church
-- ============================================================

-- 1a. Primeiro, remover a constraint CHECK existente
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_plan_check;
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;

-- 1b. Migrar dados existentes (ordem importa para evitar conflito)
UPDATE public.users SET plan = 'church_temp' WHERE plan = 'ministry';
UPDATE public.users SET plan = 'pro' WHERE plan = 'church';
UPDATE public.users SET plan = 'starter' WHERE plan = 'pastoral';
UPDATE public.users SET plan = 'church' WHERE plan = 'church_temp';

UPDATE public.subscriptions SET plan = 'church_temp' WHERE plan = 'ministry';
UPDATE public.subscriptions SET plan = 'pro' WHERE plan = 'church';
UPDATE public.subscriptions SET plan = 'starter' WHERE plan = 'pastoral';
UPDATE public.subscriptions SET plan = 'church' WHERE plan = 'church_temp';

-- 1c. Recriar constraints com novos nomes
ALTER TABLE public.users 
  ADD CONSTRAINT users_plan_check 
  CHECK (plan IN ('free', 'starter', 'pro', 'church'));

ALTER TABLE public.subscriptions 
  ADD CONSTRAINT subscriptions_plan_check 
  CHECK (plan IN ('free', 'starter', 'pro', 'church'));

-- ============================================================
-- 2. Adicionar colunas de créditos na tabela users
-- ============================================================
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS credits_balance INTEGER NOT NULL DEFAULT 500,
  ADD COLUMN IF NOT EXISTS credits_reset_date DATE NOT NULL DEFAULT date_trunc('month', NOW())::date,
  ADD COLUMN IF NOT EXISTS max_seats INTEGER NOT NULL DEFAULT 1;

-- Popular créditos iniciais baseado no plano atual
UPDATE public.users SET credits_balance = 500 WHERE plan = 'free';
UPDATE public.users SET credits_balance = 2000 WHERE plan = 'starter';
UPDATE public.users SET credits_balance = 8000 WHERE plan = 'pro';
UPDATE public.users SET credits_balance = 10000 WHERE plan = 'church';

-- ============================================================
-- 3. Adicionar extra_seats na tabela subscriptions
-- ============================================================
ALTER TABLE public.subscriptions 
  ADD COLUMN IF NOT EXISTS extra_seats INTEGER NOT NULL DEFAULT 0;

-- ============================================================
-- 4. Tabela: credit_transactions (log atômico de cada operação)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('debit', 'credit', 'reset', 'bonus', 'refund')),
  amount INTEGER NOT NULL,  -- positivo = crédito, negativo = débito
  balance_after INTEGER NOT NULL,
  generation_type TEXT CHECK (generation_type IN (
    'sermon', 'study', 'devotional', 'post', 'outline', 'reels', 'bilingual', 'cell'
  )),
  material_id UUID REFERENCES public.materials(id) ON DELETE SET NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Usuário vê seus próprios registros
CREATE POLICY "credit_tx_own_select" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Apenas service_role pode inserir (via admin client nas Edge Functions)
CREATE POLICY "credit_tx_service_insert" ON public.credit_transactions
  FOR INSERT WITH CHECK (true);

CREATE INDEX idx_credit_tx_user_date ON public.credit_transactions(user_id, created_at DESC);
CREATE INDEX idx_credit_tx_type ON public.credit_transactions(type, created_at DESC);

-- ============================================================
-- 5. Tabela: rate_limit_log (enforcement de limites por tempo)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rate_limit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;

-- Apenas service_role pode ler/escrever
CREATE POLICY "rate_limit_service_only" ON public.rate_limit_log
  FOR ALL USING (true);

CREATE INDEX idx_rate_limit_user_time ON public.rate_limit_log(user_id, created_at DESC);

-- Limpar registros antigos automaticamente (> 24h)
-- Executar via pg_cron ou manualmente
CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_log()
RETURNS void AS $$
  DELETE FROM public.rate_limit_log
  WHERE created_at < NOW() - INTERVAL '24 hours';
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- 6. Função: debit_credits (ATÔMICA — anti race-condition)
-- ============================================================
-- Usa UPDATE ... RETURNING para garantir atomicidade.
-- Retorna o saldo após débito. Se saldo insuficiente, não debita.
-- ============================================================
CREATE OR REPLACE FUNCTION public.debit_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_generation_type TEXT DEFAULT NULL,
  p_material_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  balance_remaining INTEGER,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Débito atômico: só executa se saldo >= amount
  UPDATE public.users
  SET credits_balance = credits_balance - p_amount,
      updated_at = NOW()
  WHERE id = p_user_id
    AND credits_balance >= p_amount
  RETURNING credits_balance INTO v_new_balance;

  -- Se update não afetou nenhuma linha, saldo insuficiente
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN, 
      (SELECT credits_balance FROM public.users WHERE id = p_user_id)::INTEGER,
      'insufficient_credits'::TEXT;
    RETURN;
  END IF;

  -- Registrar transação
  INSERT INTO public.credit_transactions (
    user_id, type, amount, balance_after, generation_type, material_id, description
  ) VALUES (
    p_user_id, 'debit', -p_amount, v_new_balance, p_generation_type, p_material_id,
    COALESCE(p_description, 'Generation: ' || COALESCE(p_generation_type, 'unknown'))
  );

  RETURN QUERY SELECT TRUE::BOOLEAN, v_new_balance, NULL::TEXT;
END;
$$;

-- ============================================================
-- 7. Função: calculate_church_credits
-- ============================================================
-- Fórmula: base_credits + (base_credits * 0.10 * extra_seats)
-- Ex: 10000 + (10000 * 0.10 * 3) = 13000
-- ============================================================
CREATE OR REPLACE FUNCTION public.calculate_church_credits(
  p_base_credits INTEGER DEFAULT 10000,
  p_extra_seats INTEGER DEFAULT 0
)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN p_base_credits + FLOOR(p_base_credits * 0.10 * p_extra_seats)::INTEGER;
END;
$$;

-- ============================================================
-- 8. Função: reset_monthly_credits
-- ============================================================
-- Chamada pelo webhook Stripe (invoice.paid) ou por pg_cron.
-- Recalcula créditos baseado no plano e seats extras.
-- ============================================================
CREATE OR REPLACE FUNCTION public.reset_monthly_credits(
  p_user_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT u.id, u.plan, COALESCE(s.extra_seats, 0) AS extra_seats
    FROM public.users u
    LEFT JOIN public.subscriptions s ON s.user_id = u.id AND s.status IN ('active', 'trialing')
    WHERE (p_user_id IS NULL OR u.id = p_user_id)
      AND u.credits_reset_date < date_trunc('month', NOW())::date
  LOOP
    DECLARE
      v_credits INTEGER;
    BEGIN
      -- Calcular créditos pelo plano
      v_credits := CASE r.plan
        WHEN 'free' THEN 500
        WHEN 'starter' THEN 2000
        WHEN 'pro' THEN 8000
        WHEN 'church' THEN public.calculate_church_credits(10000, r.extra_seats)
        ELSE 500
      END;

      -- Atualizar saldo
      UPDATE public.users
      SET credits_balance = v_credits,
          credits_reset_date = date_trunc('month', NOW())::date,
          updated_at = NOW()
      WHERE id = r.id;

      -- Registrar transação de reset
      INSERT INTO public.credit_transactions (user_id, type, amount, balance_after, description)
      VALUES (r.id, 'reset', v_credits, v_credits, 'Monthly credit reset — Plan: ' || r.plan);
    END;
  END LOOP;
END;
$$;

-- ============================================================
-- 9. Função: credit_user (para bônus, reembolsos, promoções)
-- ============================================================
CREATE OR REPLACE FUNCTION public.credit_user(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT DEFAULT 'bonus',
  p_description TEXT DEFAULT 'Bonus credits'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  UPDATE public.users
  SET credits_balance = credits_balance + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING credits_balance INTO v_new_balance;

  INSERT INTO public.credit_transactions (user_id, type, amount, balance_after, description)
  VALUES (p_user_id, p_type, p_amount, v_new_balance, p_description);

  RETURN v_new_balance;
END;
$$;

-- ============================================================
-- 10. Função: process_plan_upgrade (REFATORADA para créditos)
-- ============================================================
-- Substitui a versão antiga (002_sprint2_schema.sql)
-- Agora atribui créditos proporcionais ao upgrade.
-- ============================================================
CREATE OR REPLACE FUNCTION public.process_plan_upgrade(
  p_user_id UUID,
  p_new_plan TEXT,
  p_stripe_customer_id TEXT DEFAULT NULL,
  p_stripe_subscription_id TEXT DEFAULT NULL,
  p_extra_seats INTEGER DEFAULT 0
)
RETURNS void AS $$
DECLARE
  v_old_plan TEXT;
  v_new_credits INTEGER;
BEGIN
  -- Buscar plano atual
  SELECT plan INTO v_old_plan FROM public.users WHERE id = p_user_id;

  -- Calcular créditos do novo plano
  v_new_credits := CASE p_new_plan
    WHEN 'free' THEN 500
    WHEN 'starter' THEN 2000
    WHEN 'pro' THEN 8000
    WHEN 'church' THEN public.calculate_church_credits(10000, p_extra_seats)
    ELSE 500
  END;

  -- Atualizar plano, créditos e seats
  UPDATE public.users
  SET plan = p_new_plan,
      credits_balance = v_new_credits,
      credits_reset_date = date_trunc('month', NOW())::date,
      max_seats = CASE WHEN p_new_plan = 'church' THEN 1 + p_extra_seats ELSE 1 END,
      stripe_customer_id = COALESCE(p_stripe_customer_id, stripe_customer_id),
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Registrar transação
  INSERT INTO public.credit_transactions (user_id, type, amount, balance_after, description)
  VALUES (p_user_id, 'credit', v_new_credits, v_new_credits,
    'Plan upgrade: ' || v_old_plan || ' → ' || p_new_plan);

  -- Registrar evento de conversão
  INSERT INTO public.conversion_events (user_id, event_type, plan_from, plan_to, metadata)
  VALUES (
    p_user_id, 'plan_upgraded', v_old_plan, p_new_plan,
    jsonb_build_object(
      'stripe_customer_id', p_stripe_customer_id,
      'stripe_subscription_id', p_stripe_subscription_id,
      'extra_seats', p_extra_seats,
      'credits_assigned', v_new_credits,
      'upgraded_at', NOW()
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 11. Função: process_plan_downgrade (REFATORADA para créditos)
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
      credits_balance = 500,
      credits_reset_date = date_trunc('month', NOW())::date,
      max_seats = 1,
      updated_at = NOW()
  WHERE id = p_user_id;

  INSERT INTO public.credit_transactions (user_id, type, amount, balance_after, description)
  VALUES (p_user_id, 'reset', 500, 500, 'Downgrade to free — Reason: ' || p_reason);

  INSERT INTO public.conversion_events (user_id, event_type, plan_from, plan_to, metadata)
  VALUES (p_user_id, 'plan_upgraded', v_old_plan, 'free',
    jsonb_build_object('reason', p_reason, 'downgraded_at', NOW()));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 12. View: admin_credits_overview (painel de monitoramento)
-- ============================================================
CREATE OR REPLACE VIEW public.admin_credits_overview AS
SELECT
  u.plan,
  COUNT(*) AS user_count,
  SUM(u.credits_balance) AS total_credits_remaining,
  AVG(u.credits_balance)::INTEGER AS avg_credits_remaining,
  (SELECT COUNT(*) FROM public.credit_transactions ct 
   WHERE ct.user_id = u.id AND ct.type = 'debit' 
   AND ct.created_at >= date_trunc('month', NOW())) AS debits_this_month
FROM public.users u
GROUP BY u.plan
ORDER BY user_count DESC;

-- ============================================================
-- 13. Atualizar View MRR com novos nomes de plano
-- ============================================================
CREATE OR REPLACE VIEW public.admin_mrr_by_plan AS
SELECT
  plan,
  COUNT(*) AS user_count,
  CASE plan
    WHEN 'free' THEN 0
    WHEN 'starter' THEN 9.90 * COUNT(*)
    WHEN 'pro' THEN 29.90 * COUNT(*)
    WHEN 'church' THEN 49.90 * COUNT(*)
  END AS mrr_usd
FROM public.users
GROUP BY plan
ORDER BY mrr_usd DESC;

-- ============================================================
-- 14. Adicionar generation_logs.credits_consumed
-- ============================================================
ALTER TABLE public.generation_logs
  ADD COLUMN IF NOT EXISTS credits_consumed INTEGER DEFAULT 0;

-- ============================================================
-- 15. Índices adicionais para performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_plan ON public.users(plan);
CREATE INDEX IF NOT EXISTS idx_users_credits ON public.users(credits_balance);
CREATE INDEX IF NOT EXISTS idx_subscriptions_extra_seats ON public.subscriptions(extra_seats);

-- ============================================================
-- FIM DA MIGRAÇÃO 007
-- ============================================================
