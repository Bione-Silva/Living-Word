
-- Add cover_image_url to materials table
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Create storage bucket for blog images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to blog-images
CREATE POLICY "Users can upload blog images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'blog-images');

-- Allow public read access to blog images
CREATE POLICY "Public can view blog images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'blog-images');
