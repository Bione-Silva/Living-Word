-- Drop existing triggers if any
DROP TRIGGER IF EXISTS trg_sync_plan_credits ON public.profiles;
DROP TRIGGER IF EXISTS trg_sync_plan_credits_insert ON public.profiles;

-- Recreate update trigger
CREATE TRIGGER trg_sync_plan_credits
  BEFORE UPDATE OF plan ON public.profiles
  FOR EACH ROW
  WHEN (OLD.plan IS DISTINCT FROM NEW.plan)
  EXECUTE FUNCTION public.sync_plan_credits();

-- Insert trigger for new users
CREATE TRIGGER trg_sync_plan_credits_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_plan_credits();

-- Fix all existing profiles to have correct limits
UPDATE public.profiles SET generations_limit = CASE plan
  WHEN 'free'     THEN 500
  WHEN 'starter'  THEN 4000
  WHEN 'pro'      THEN 8000
  WHEN 'igreja'   THEN 20000
  ELSE 500
END;