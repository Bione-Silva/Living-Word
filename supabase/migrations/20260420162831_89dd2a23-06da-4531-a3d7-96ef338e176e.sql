-- AutoFeed feature: opt-in toggle on profile + tracking on social posts

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS autofeed_enabled boolean NOT NULL DEFAULT false;

ALTER TABLE public.social_calendar_posts
  ADD COLUMN IF NOT EXISTS source_material_id uuid,
  ADD COLUMN IF NOT EXISTS auto_generated boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_social_posts_source_material
  ON public.social_calendar_posts(source_material_id)
  WHERE source_material_id IS NOT NULL;