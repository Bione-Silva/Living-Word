
INSERT INTO storage.buckets (id, name, public)
VALUES ('social_arts', 'social_arts', true)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.social_arts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  file_path text NOT NULL,
  file_url text NOT NULL,
  title text,
  aspect_ratio text NOT NULL DEFAULT '1:1',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.social_arts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own arts" ON public.social_arts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own arts" ON public.social_arts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own arts" ON public.social_arts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can upload own arts" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'social_arts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own stored arts" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'social_arts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public can view social arts" ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'social_arts');

CREATE POLICY "Users can delete own stored arts" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'social_arts' AND (storage.foldername(name))[1] = auth.uid()::text);
