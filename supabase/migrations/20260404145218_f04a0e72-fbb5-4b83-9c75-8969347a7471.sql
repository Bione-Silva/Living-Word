
-- Recreate view with security_invoker = true
DROP VIEW IF EXISTS public.admin_saas_metrics;

CREATE OR REPLACE VIEW public.admin_saas_metrics
WITH (security_invoker = true)
AS
SELECT
  (SELECT count(*) FROM public.profiles) AS total_users_registered,
  (SELECT count(*) FROM public.profiles WHERE plan = 'free') AS users_free,
  0 AS users_trialing,
  (SELECT count(*) FROM public.profiles WHERE plan = 'pastoral') AS users_pastoral,
  (SELECT count(*) FROM public.profiles WHERE plan = 'church') AS users_church,
  (SELECT count(*) FROM public.profiles WHERE plan = 'ministry') AS users_ministry,
  (
    (SELECT count(*) FROM public.profiles WHERE plan = 'pastoral') * 9.90 +
    (SELECT count(*) FROM public.profiles WHERE plan = 'church') * 29.90 +
    (SELECT count(*) FROM public.profiles WHERE plan = 'ministry') * 79.90
  ) AS estimated_mrr_usd;

-- Create a security definer function to fetch metrics (only admin can call)
CREATE OR REPLACE FUNCTION public.get_admin_saas_metrics()
RETURNS TABLE(
  total_users_registered bigint,
  users_free bigint,
  users_trialing integer,
  users_pastoral bigint,
  users_church bigint,
  users_ministry bigint,
  estimated_mrr_usd numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (auth.jwt() ->> 'email') != 'bionicaosilva@gmail.com' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY SELECT
    (SELECT count(*) FROM profiles) AS total_users_registered,
    (SELECT count(*) FROM profiles WHERE plan = 'free') AS users_free,
    0 AS users_trialing,
    (SELECT count(*) FROM profiles WHERE plan = 'pastoral') AS users_pastoral,
    (SELECT count(*) FROM profiles WHERE plan = 'church') AS users_church,
    (SELECT count(*) FROM profiles WHERE plan = 'ministry') AS users_ministry,
    (
      (SELECT count(*) FROM profiles WHERE plan = 'pastoral') * 9.90 +
      (SELECT count(*) FROM profiles WHERE plan = 'church') * 29.90 +
      (SELECT count(*) FROM profiles WHERE plan = 'ministry') * 79.90
    )::numeric AS estimated_mrr_usd;
END;
$$;
