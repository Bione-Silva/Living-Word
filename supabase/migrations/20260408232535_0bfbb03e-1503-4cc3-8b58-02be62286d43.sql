ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bonus_last_claimed date,
ADD COLUMN IF NOT EXISTS bonus_day_count integer NOT NULL DEFAULT 0;