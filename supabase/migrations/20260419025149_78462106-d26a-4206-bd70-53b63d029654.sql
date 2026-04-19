ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS church_logo_url TEXT,
  ADD COLUMN IF NOT EXISTS blog_author_display TEXT NOT NULL DEFAULT 'pastor',
  ADD COLUMN IF NOT EXISTS custom_doctrine TEXT;