
-- Update default generations_limit to 500 (credits) for new users
ALTER TABLE public.profiles ALTER COLUMN generations_limit SET DEFAULT 500;

-- Update existing free plan users to have 500 credits limit
UPDATE public.profiles SET generations_limit = 500 WHERE plan = 'free' AND generations_limit = 5;

-- Update plan limits for paid plans
UPDATE public.profiles SET generations_limit = 2000 WHERE plan = 'pastoral';
UPDATE public.profiles SET generations_limit = 5000 WHERE plan = 'church';
UPDATE public.profiles SET generations_limit = 15000 WHERE plan = 'ministry';
