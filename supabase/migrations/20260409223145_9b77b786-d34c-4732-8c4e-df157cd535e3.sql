
-- Tabela de compartilhamentos virais de devocionais
CREATE TABLE public.devocional_compartilhamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  devocional_date date NOT NULL,
  share_token text NOT NULL UNIQUE,
  cliques integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, devocional_date)
);

ALTER TABLE public.devocional_compartilhamentos ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa pode ler (para a página pública)
CREATE POLICY "Anyone can view shares by token"
  ON public.devocional_compartilhamentos
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Usuário autenticado pode criar seus compartilhamentos
CREATE POLICY "Users can insert own shares"
  ON public.devocional_compartilhamentos
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Usuário autenticado pode atualizar seus compartilhamentos
CREATE POLICY "Users can update own shares"
  ON public.devocional_compartilhamentos
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Função para incrementar cliques sem autenticação
CREATE OR REPLACE FUNCTION public.increment_share_click(p_token text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE devocional_compartilhamentos
  SET cliques = cliques + 1
  WHERE share_token = p_token;
$$;
