
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blog_name text;

ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS article_images jsonb DEFAULT '[]'::jsonb;
