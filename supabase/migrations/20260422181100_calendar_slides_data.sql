-- Add rich carousel data columns to social_calendar_posts
-- slides_data: full JSON of slide contents (text, subtitle, image_url per slide)
-- format_id: the selected format/template identifier from SocialStudio
-- canvas_template: template style (editorial, swiss, cinematic, etc.)
-- theme_config: JSON with colors, fonts, imageMode for full reconstruction

ALTER TABLE public.social_calendar_posts
  ADD COLUMN IF NOT EXISTS slides_data     JSONB        DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS format_id       TEXT         DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS canvas_template TEXT         DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS theme_config    JSONB        DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS slide_count     INTEGER      DEFAULT 1,
  ADD COLUMN IF NOT EXISTS topic           TEXT         DEFAULT NULL;
