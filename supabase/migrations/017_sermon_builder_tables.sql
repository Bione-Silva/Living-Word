-- 1. Sermon Templates
CREATE TABLE IF NOT EXISTS public.sermon_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  structure jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_premium boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sermon_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sermon_templates_select" ON public.sermon_templates FOR SELECT TO authenticated USING (true);


-- 2. Illustrations
CREATE TABLE IF NOT EXISTS public.illustrations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  hook text,
  body text NOT NULL,
  category text,
  tags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.illustrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "illustrations_select" ON public.illustrations FOR SELECT TO authenticated USING (true);


-- 3. Research Cache
CREATE TABLE IF NOT EXISTS public.research_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query text,
  verse_reference text,
  background_context text,
  theological_insights text,
  original_language_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.research_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "research_cache_select" ON public.research_cache FOR SELECT TO authenticated USING (true);


-- 4. Social Calendar
CREATE TABLE IF NOT EXISTS public.social_calendar (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  material_id uuid REFERENCES public.materials(id) ON DELETE CASCADE,
  month text NOT NULL, 
  posts jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.social_calendar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "social_calendar_crud" ON public.social_calendar FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- 5. Multiply Outputs
CREATE TABLE IF NOT EXISTS public.multiply_outputs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  material_id uuid REFERENCES public.materials(id) ON DELETE CASCADE,
  output_type text NOT NULL, 
  content text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.multiply_outputs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "multiply_outputs_crud" ON public.multiply_outputs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_multiply_outputs_user_material ON public.multiply_outputs(user_id, material_id);
CREATE INDEX IF NOT EXISTS idx_social_calendar_user_month ON public.social_calendar(user_id, month);
