
-- Add trial columns
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days');

-- Backfill existing free users
UPDATE public.profiles
SET trial_started_at = created_at,
    trial_ends_at = created_at + interval '7 days'
WHERE trial_started_at IS NULL;

-- Update handle_new_user function to include trial dates
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  desired_handle text;
  final_handle text;
BEGIN
  desired_handle := COALESCE(NEW.raw_user_meta_data->>'blog_handle', NULL);
  
  IF desired_handle IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.profiles WHERE blog_handle = desired_handle) THEN
      final_handle := desired_handle || '-' || substr(NEW.id::text, 1, 6);
    ELSE
      final_handle := desired_handle;
    END IF;
  ELSE
    final_handle := NULL;
  END IF;

  INSERT INTO public.profiles (id, full_name, blog_handle, language, trial_started_at, trial_ends_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    final_handle,
    COALESCE(NEW.raw_user_meta_data->>'language', 'PT'),
    now(),
    now() + interval '7 days'
  );
  RETURN NEW;
END;
$function$;
