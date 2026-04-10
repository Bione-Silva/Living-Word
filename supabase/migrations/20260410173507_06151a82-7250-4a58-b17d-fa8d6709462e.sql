CREATE TABLE public.visual_outputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  material_id uuid REFERENCES public.materials(id) ON DELETE CASCADE,
  output_type text NOT NULL DEFAULT 'carousel',
  format text NOT NULL DEFAULT '4:5',
  language text NOT NULL DEFAULT 'PT',
  slides_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  variation_number integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.visual_outputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own visual outputs"
  ON public.visual_outputs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own visual outputs"
  ON public.visual_outputs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own visual outputs"
  ON public.visual_outputs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);