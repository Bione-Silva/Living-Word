-- Migration 015: Unificação do Sistema de Créditos na tabela Profiles
-- Remove dependências da antiga tabela 'users' e centraliza tudo em 'profiles'

-- 1. Garantir que 'profiles' tenha os campos necessários de créditos e stripe
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS credits_remaining INTEGER NOT NULL DEFAULT 150,
  ADD COLUMN IF NOT EXISTS credits_monthly_limit INTEGER NOT NULL DEFAULT 150,
  ADD COLUMN IF NOT EXISTS credits_reset_date DATE NOT NULL DEFAULT date_trunc('month', NOW())::date,
  ADD COLUMN IF NOT EXISTS max_seats INTEGER NOT NULL DEFAULT 1;

-- 2. Recriar função de Débito (Atômica) para Profiles
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
  -- Débito atômico na tabela profiles
  UPDATE public.profiles
  SET credits_remaining = credits_remaining - p_amount,
      updated_at = NOW()
  WHERE id = p_user_id
    AND credits_remaining >= p_amount
  RETURNING credits_remaining INTO v_new_balance;

  -- Se update não afetou nenhuma linha, saldo insuficiente
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN, 
      (SELECT credits_remaining FROM public.profiles WHERE id = p_user_id)::INTEGER,
      'insufficient_credits'::TEXT;
    RETURN;
  END IF;

  -- Registrar transação (v1)
  INSERT INTO public.credit_transactions_v1 (
    user_id, tool_slug, credits_used, credits_before, credits_after
  ) VALUES (
    p_user_id, 
    COALESCE(p_generation_type, 'unknown'), 
    p_amount, 
    v_new_balance + p_amount, 
    v_new_balance
  );

  RETURN QUERY SELECT TRUE::BOOLEAN, v_new_balance, NULL::TEXT;
END;
$$;

-- 3. Recriar função de Upgrade para Profiles
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
  SELECT plan INTO v_old_plan FROM public.profiles WHERE id = p_user_id;

  -- Buscar créditos do novo plano na tabela plan_config
  SELECT credits_monthly INTO v_new_credits 
  FROM public.plan_config 
  WHERE plan = p_new_plan;

  -- Fallback se não encontrar na config
  IF v_new_credits IS NULL THEN
    v_new_credits := CASE p_new_plan
      WHEN 'free' THEN 150
      WHEN 'starter' THEN 3000
      WHEN 'pro' THEN 10000
      WHEN 'igreja' THEN 30000
      ELSE 150
    END;
  END IF;

  -- Ajuste para Igreja com assentos extras (+10% por seat)
  IF p_new_plan = 'igreja' AND p_extra_seats > 0 THEN
    v_new_credits := v_new_credits + (v_new_credits * 0.10 * p_extra_seats);
  END IF;

  -- Atualizar profile
  UPDATE public.profiles
  SET plan = p_new_plan,
      credits_remaining = v_new_credits,
      credits_monthly_limit = v_new_credits,
      credits_reset_date = date_trunc('month', NOW())::date,
      max_seats = CASE WHEN p_new_plan = 'igreja' THEN 1 + p_extra_seats ELSE 1 END,
      stripe_customer_id = COALESCE(p_stripe_customer_id, stripe_customer_id),
      stripe_subscription_id = COALESCE(p_stripe_subscription_id, stripe_subscription_id),
      subscription_status = 'active',
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Registrar log simples (opcional)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Função Reset Mensal para Profiles
CREATE OR REPLACE FUNCTION public.reset_monthly_credits(p_user_id UUID DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.id, p.plan, p.credits_monthly_limit
    FROM public.profiles p
    WHERE (p_user_id IS NULL OR p.id = p_user_id)
      AND (p.credits_reset_date IS NULL OR p.credits_reset_date < date_trunc('month', NOW())::date)
  LOOP
    UPDATE public.profiles
    SET credits_remaining = credits_monthly_limit,
        credits_reset_date = date_trunc('month', NOW())::date,
        updated_at = NOW()
    WHERE id = r.id;
  END LOOP;
END;
$$;

-- 5. Sincronizar plan_config com IDs reais (Default BRL)
UPDATE public.plan_config SET 
  stripe_price_id_monthly = 'price_1TJg0mEaDBbHafP6EjCuGgmk',
  stripe_price_id_annual = 'price_1TJg0nEaDBbHafP6R0XrOxCo',
  credits_monthly = 3000
WHERE plan = 'starter';

UPDATE public.plan_config SET 
  stripe_price_id_monthly = 'price_1TJg0oEaDBbHafP6bC747uSG',
  stripe_price_id_annual = 'price_1TJg0pEaDBbHafP6ToL24iXI',
  credits_monthly = 10000
WHERE plan = 'pro';

UPDATE public.plan_config SET 
  stripe_price_id_monthly = 'price_1TJg0qEaDBbHafP6gyw9BqQ1',
  stripe_price_id_annual = 'price_1TJg0rEaDBbHafP69yZFNvtc',
  credits_monthly = 30000
WHERE plan = 'igreja';

-- 6. Função para Recarga Avulsa (Top-up)
CREATE OR REPLACE FUNCTION public.add_credits_topup(
  p_user_id UUID,
  p_amount INTEGER,
  p_stripe_session_id TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Incrementar créditos atuais sem mudar o limite mensal
  UPDATE public.profiles
  SET credits_remaining = credits_remaining + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Registrar na transação (como um ganho/entrada)
  INSERT INTO public.credit_transactions_v1 (
    user_id, tool_slug, credits_used, credits_before, credits_after
  ) VALUES (
    p_user_id, 
    'topup', 
    -p_amount, -- valor negativo indica entrada/ganho
    (SELECT credits_remaining FROM public.profiles WHERE id = p_user_id) - p_amount,
    (SELECT credits_remaining FROM public.profiles WHERE id = p_user_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

