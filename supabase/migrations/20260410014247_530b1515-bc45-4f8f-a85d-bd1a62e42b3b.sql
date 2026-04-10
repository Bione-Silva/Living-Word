
-- Trigger to auto-sync generations_limit when plan changes
CREATE OR REPLACE FUNCTION public.sync_plan_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.generations_limit := CASE NEW.plan
    WHEN 'free'     THEN 500
    WHEN 'starter'  THEN 4000
    WHEN 'pastoral' THEN 4000
    WHEN 'pro'      THEN 8000
    WHEN 'church'   THEN 8000
    WHEN 'igreja'   THEN 20000
    WHEN 'ministry' THEN 20000
    ELSE 500
  END;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_plan_credits
  BEFORE INSERT OR UPDATE OF plan ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_plan_credits();

-- Fix any existing misaligned limits
UPDATE public.profiles SET generations_limit = 500   WHERE plan = 'free'    AND generations_limit != 500;
UPDATE public.profiles SET generations_limit = 4000  WHERE plan = 'starter' AND generations_limit != 4000;
UPDATE public.profiles SET generations_limit = 8000  WHERE plan = 'pro'     AND generations_limit != 8000;
UPDATE public.profiles SET generations_limit = 20000 WHERE plan = 'igreja'  AND generations_limit != 20000;
