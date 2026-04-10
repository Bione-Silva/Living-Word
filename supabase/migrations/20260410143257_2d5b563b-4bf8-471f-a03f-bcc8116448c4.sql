-- Create the article-covers bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('article-covers', 'article-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public can view article covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'article-covers');

-- Allow authenticated users to upload their own covers
CREATE POLICY "Users can upload own article covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'article-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to update their own covers
CREATE POLICY "Users can update own article covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'article-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to delete their own covers
CREATE POLICY "Users can delete own article covers"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'article-covers' AND auth.uid()::text = (storage.foldername(name))[1]);