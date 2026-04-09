-- 012_update_stripe_prices.sql
-- Atualiza os placeholder IDs pelos IDs reais gerados no Stripe (BRL)

UPDATE public.plan_config
SET 
  stripe_price_id_monthly = 'price_1TJg0mEaDBbHafP6EjCuGgmk',
  stripe_price_id_annual = 'price_1TJg0nEaDBbHafP6R0XrOxCo'
WHERE plan = 'starter';

UPDATE public.plan_config
SET 
  stripe_price_id_monthly = 'price_1TJg0oEaDBbHafP6bC747uSG',
  stripe_price_id_annual = 'price_1TJg0pEaDBbHafP6ToL24iXI'
WHERE plan = 'pro';

UPDATE public.plan_config
SET 
  stripe_price_id_monthly = 'price_1TJg0qEaDBbHafP6gyw9BqQ1',
  stripe_price_id_annual = 'price_1TJg0rEaDBbHafP69yZFNvtc'
WHERE plan = 'igreja';
