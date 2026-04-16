CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  platform text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_success_at timestamptz,
  last_error_at timestamptz,
  last_error text,
  UNIQUE (user_id, endpoint)
);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON public.push_subscriptions(user_id);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own push subs" ON public.push_subscriptions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full access push subs" ON public.push_subscriptions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Admin can view all push subs" ON public.push_subscriptions FOR SELECT TO authenticated USING (is_admin());

CREATE TABLE IF NOT EXISTS public.push_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subscription_id uuid REFERENCES public.push_subscriptions(id) ON DELETE SET NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'sent',
  status_code int,
  error text,
  clicked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_push_deliveries_user ON public.push_deliveries(user_id);
CREATE INDEX IF NOT EXISTS idx_push_deliveries_created ON public.push_deliveries(created_at DESC);
ALTER TABLE public.push_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own deliveries" ON public.push_deliveries FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role full access deliveries" ON public.push_deliveries FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Admin can view all deliveries" ON public.push_deliveries FOR SELECT TO authenticated USING (is_admin());

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS push_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS push_hour smallint NOT NULL DEFAULT 6,
  ADD COLUMN IF NOT EXISTS push_timezone text NOT NULL DEFAULT 'America/Sao_Paulo';

CREATE OR REPLACE FUNCTION public.get_admin_push_metrics()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE result json;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  SELECT json_build_object(
    'total_subscriptions', (SELECT count(*) FROM push_subscriptions),
    'unique_users', (SELECT count(DISTINCT user_id) FROM push_subscriptions),
    'opted_in_users', (SELECT count(*) FROM profiles WHERE push_enabled = true),
    'deliveries_24h', (SELECT count(*) FROM push_deliveries WHERE created_at > now() - interval '24 hours'),
    'deliveries_7d', (SELECT count(*) FROM push_deliveries WHERE created_at > now() - interval '7 days'),
    'success_rate_7d', (SELECT COALESCE(round(100.0 * count(*) FILTER (WHERE status = 'sent') / NULLIF(count(*), 0), 1), 0) FROM push_deliveries WHERE created_at > now() - interval '7 days'),
    'click_rate_7d', (SELECT COALESCE(round(100.0 * count(*) FILTER (WHERE clicked_at IS NOT NULL) / NULLIF(count(*), 0), 1), 0) FROM push_deliveries WHERE created_at > now() - interval '7 days')
  ) INTO result;
  RETURN result;
END; $$;