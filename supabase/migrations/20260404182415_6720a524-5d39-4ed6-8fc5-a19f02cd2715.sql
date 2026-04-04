
CREATE TABLE public.mind_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mind_id text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.mind_settings ENABLE ROW LEVEL SECURITY;

-- Master can manage
CREATE POLICY "Master can manage mind_settings"
ON public.mind_settings
FOR ALL
TO authenticated
USING ((auth.jwt() ->> 'email'::text) = 'bionicaosilva@gmail.com'::text)
WITH CHECK ((auth.jwt() ->> 'email'::text) = 'bionicaosilva@gmail.com'::text);

-- All authenticated users can read
CREATE POLICY "Authenticated can read mind_settings"
ON public.mind_settings
FOR SELECT
TO authenticated
USING (true);

-- Seed all existing minds as active
INSERT INTO public.mind_settings (mind_id, active) VALUES
  ('billy-graham', true),
  ('charles-spurgeon', true),
  ('john-wesley', true),
  ('joao-calvino', true),
  ('marco-feliciano', true),
  ('tiago-brunet', true),
  ('martyn-lloyd-jones', true);
