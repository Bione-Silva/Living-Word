-- Force schema cache reload
NOTIFY pgrst, 'reload schema';

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS generations_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS generations_limit INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS blog_handle TEXT,
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'PT',
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS doctrine TEXT,
ADD COLUMN IF NOT EXISTS pastoral_voice TEXT,
ADD COLUMN IF NOT EXISTS bible_version TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT,
ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT 'amber',
ADD COLUMN IF NOT EXISTS font_family TEXT DEFAULT 'cormorant';

-- Force schema cache reload again to make sure it's applied for the APIs
NOTIFY pgrst, 'reload schema';
