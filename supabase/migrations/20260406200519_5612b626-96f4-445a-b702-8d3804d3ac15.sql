
ALTER TABLE public.workspaces
  ADD COLUMN target_audience text DEFAULT NULL,
  ADD COLUMN communication_tone text DEFAULT NULL,
  ADD COLUMN content_preferences text DEFAULT NULL,
  ADD COLUMN brand_color text DEFAULT NULL,
  ADD COLUMN default_template text DEFAULT NULL;
