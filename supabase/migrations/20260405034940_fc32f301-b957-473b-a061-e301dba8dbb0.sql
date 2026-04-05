
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS street text,
  ADD COLUMN IF NOT EXISTS neighborhood text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS zip_code text,
  ADD COLUMN IF NOT EXISTS theme_color text DEFAULT 'amber',
  ADD COLUMN IF NOT EXISTS font_family text DEFAULT 'cormorant',
  ADD COLUMN IF NOT EXISTS layout_style text DEFAULT 'classic';
