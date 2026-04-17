-- 1. Bucket público para cenas bíblicas comunitárias
INSERT INTO storage.buckets (id, name, public)
VALUES ('biblical-scenes', 'biblical-scenes', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: leitura pública, escrita só via service role (edge function)
CREATE POLICY "Biblical scenes are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'biblical-scenes');

-- 2. Catálogo de cenas (banco compartilhado)
CREATE TABLE public.biblical_scene_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  keywords TEXT[] NOT NULL DEFAULT '{}',
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  is_curated BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  use_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_scene_library_keywords ON public.biblical_scene_library USING GIN(keywords);
CREATE INDEX idx_scene_library_use_count ON public.biblical_scene_library(use_count DESC);
CREATE INDEX idx_scene_library_curated ON public.biblical_scene_library(is_curated) WHERE is_curated = true;

ALTER TABLE public.biblical_scene_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view scene library"
ON public.biblical_scene_library FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Service role manages scene library"
ON public.biblical_scene_library FOR ALL
TO service_role
USING (true) WITH CHECK (true);

-- 3. Controle de cota mensal de geração nova
CREATE TABLE public.biblical_scene_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  scene_library_id UUID REFERENCES public.biblical_scene_library(id) ON DELETE SET NULL,
  month_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_scene_usage_user_month ON public.biblical_scene_usage(user_id, month_key);

ALTER TABLE public.biblical_scene_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own scene usage"
ON public.biblical_scene_usage FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Service role manages scene usage"
ON public.biblical_scene_usage FOR ALL
TO service_role
USING (true) WITH CHECK (true);

-- Função para contar geração do mês corrente
CREATE OR REPLACE FUNCTION public.count_user_scene_generations_this_month(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.biblical_scene_usage
  WHERE user_id = p_user_id
    AND month_key = to_char(now() AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM');
$$;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.update_biblical_scene_library_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_scene_library_updated
BEFORE UPDATE ON public.biblical_scene_library
FOR EACH ROW EXECUTE FUNCTION public.update_biblical_scene_library_updated_at();