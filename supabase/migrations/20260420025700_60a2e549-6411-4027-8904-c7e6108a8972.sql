-- Tabela para posts do calendário de redes sociais
CREATE TABLE IF NOT EXISTS public.social_calendar_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  network text NOT NULL DEFAULT 'instagram',
  caption text NOT NULL DEFAULT '',
  hashtags text NOT NULL DEFAULT '',
  image_url text,
  social_art_id uuid,
  material_id uuid,
  scheduled_at timestamptz,
  status text NOT NULL DEFAULT 'draft',
  color text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scp_user_scheduled ON public.social_calendar_posts (user_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_scp_user_network ON public.social_calendar_posts (user_id, network);

ALTER TABLE public.social_calendar_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own social posts"
  ON public.social_calendar_posts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own social posts"
  ON public.social_calendar_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own social posts"
  ON public.social_calendar_posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own social posts"
  ON public.social_calendar_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.touch_social_calendar_posts()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_social_calendar_posts ON public.social_calendar_posts;
CREATE TRIGGER trg_touch_social_calendar_posts
  BEFORE UPDATE ON public.social_calendar_posts
  FOR EACH ROW EXECUTE FUNCTION public.touch_social_calendar_posts();