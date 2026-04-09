
DROP FUNCTION IF EXISTS public.get_admin_saas_metrics();

CREATE FUNCTION public.get_admin_saas_metrics()
 RETURNS TABLE(total_users_registered bigint, users_free bigint, users_trialing integer, users_starter bigint, users_pro bigint, users_igreja bigint, estimated_mrr_usd numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF (auth.jwt() ->> 'email') != 'bionicaosilva@gmail.com' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY SELECT
    (SELECT count(*) FROM profiles) AS total_users_registered,
    (SELECT count(*) FROM profiles WHERE plan = 'free') AS users_free,
    0 AS users_trialing,
    (SELECT count(*) FROM profiles WHERE plan = 'starter') AS users_starter,
    (SELECT count(*) FROM profiles WHERE plan = 'pro') AS users_pro,
    (SELECT count(*) FROM profiles WHERE plan = 'igreja') AS users_igreja,
    (
      (SELECT count(*) FROM profiles WHERE plan = 'starter') * 9.90 +
      (SELECT count(*) FROM profiles WHERE plan = 'pro') * 29.90 +
      (SELECT count(*) FROM profiles WHERE plan = 'igreja') * 79.90
    )::numeric AS estimated_mrr_usd;
END;
$function$;
