-- Fix the broken public materials RLS policy
DROP POLICY IF EXISTS "Public can view published materials" ON public.materials;

CREATE POLICY "Public can view published materials"
ON public.materials
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM editorial_queue eq
    WHERE eq.material_id = materials.id
    AND eq.status = 'published'
  )
);

-- Allow public to view blog profiles
CREATE POLICY "Public can view blog profiles"
ON public.profiles
FOR SELECT
TO public
USING (blog_handle IS NOT NULL);