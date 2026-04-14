-- 017_update_plan_limits.sql
-- Aplica o redimensionamento de planos (escassez sadia)
-- Free passa de 150 créditos para 30 créditos no signup inicial.

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, plan, credits_remaining, credits_monthly_limit)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'free',
    30, -- Era 150
    30  -- Era 150
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Se o sistema recarrega os planos de usuários ativos, podemos atualizar 
-- o limite de usuários 'free' existentes para não estourarem o novo teto
UPDATE public.profiles 
SET credits_monthly_limit = 30
WHERE plan = 'free';

-- Atualiza Starter / Standard de 500 para 150
UPDATE public.profiles 
SET credits_monthly_limit = 150
WHERE plan IN ('starter', 'standard');

-- Atualiza Pro de 2000 para 450
UPDATE public.profiles 
SET credits_monthly_limit = 450
WHERE plan = 'pro';

-- Atualiza Pastor Pro / Ministério de 5000 para 1500
UPDATE public.profiles 
SET credits_monthly_limit = 1500
WHERE plan IN ('pastor_pro', 'igreja');
