INSERT INTO storage.buckets (id, name, public) VALUES ('devotional-assets', 'devotional-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can read devotional assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'devotional-assets');

CREATE POLICY "Service role can manage devotional assets"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'devotional-assets')
WITH CHECK (bucket_id = 'devotional-assets');