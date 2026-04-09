
CREATE TABLE public.expos_studies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  passagem text NOT NULL,
  formato text NOT NULL DEFAULT 'individual',
  conteudo_markdown text NOT NULL DEFAULT '',
  titulo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.expos_studies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own expos studies" ON public.expos_studies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expos studies" ON public.expos_studies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expos studies" ON public.expos_studies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expos studies" ON public.expos_studies FOR DELETE USING (auth.uid() = user_id);
