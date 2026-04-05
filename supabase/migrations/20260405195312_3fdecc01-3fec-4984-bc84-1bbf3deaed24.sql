
-- =============================================
-- 1. Create is_admin security definer function
-- =============================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() = 'b368f7c8-ff05-46af-be04-381832f7e7e3'::uuid
$$;

-- =============================================
-- 2. Create public blog profiles view
-- =============================================
CREATE OR REPLACE VIEW public.public_blog_profiles
WITH (security_barrier = true, security_invoker = false) AS
  SELECT id, full_name, bio, avatar_url, blog_name, blog_handle,
         church_name, city, country, language,
         theme_color, font_family, layout_style
  FROM profiles
  WHERE blog_handle IS NOT NULL;

GRANT SELECT ON public.public_blog_profiles TO anon, authenticated;

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Public can view blog profiles" ON profiles;

-- =============================================
-- 3. Replace all hardcoded email admin policies
-- =============================================

-- generation_logs
DROP POLICY IF EXISTS "Master can view all logs" ON generation_logs;
CREATE POLICY "Master can view all logs"
  ON generation_logs FOR SELECT TO authenticated
  USING (public.is_admin());

-- master_api_vault
DROP POLICY IF EXISTS "Master can manage vault" ON master_api_vault;
CREATE POLICY "Master can manage vault"
  ON master_api_vault FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- global_settings
DROP POLICY IF EXISTS "Master can manage settings" ON global_settings;
CREATE POLICY "Master can manage settings"
  ON global_settings FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- team_members
DROP POLICY IF EXISTS "Master can manage team" ON team_members;
CREATE POLICY "Master can manage team"
  ON team_members FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- monthly_financials
DROP POLICY IF EXISTS "Master can manage financials" ON monthly_financials;
CREATE POLICY "Master can manage financials"
  ON monthly_financials FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- mind_settings
DROP POLICY IF EXISTS "Master can manage mind_settings" ON mind_settings;
CREATE POLICY "Master can manage mind_settings"
  ON mind_settings FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- material_feedback
DROP POLICY IF EXISTS "Master can view all feedback" ON material_feedback;
CREATE POLICY "Master can view all feedback"
  ON material_feedback FOR SELECT TO authenticated
  USING (public.is_admin());

-- page_views
DROP POLICY IF EXISTS "Master can view all page_views" ON page_views;
CREATE POLICY "Master can view all page_views"
  ON page_views FOR SELECT TO authenticated
  USING (public.is_admin());

-- =============================================
-- 4. Fix page_views insert validation
-- =============================================
DROP POLICY IF EXISTS "Anyone can insert page_views" ON page_views;
CREATE POLICY "Validated page_views insert"
  ON page_views FOR INSERT TO anon, authenticated
  WITH CHECK (
    path IS NOT NULL
    AND length(path) > 0
    AND length(path) < 500
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- =============================================
-- 5. Fix storage policies for blog-images
-- =============================================

-- Drop old INSERT policy and recreate with path ownership
DROP POLICY IF EXISTS "Users can upload blog images" ON storage.objects;
CREATE POLICY "Users can upload own blog images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'blog-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Add UPDATE policy with ownership
CREATE POLICY "Users can update own blog images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'blog-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Add DELETE policy with ownership
CREATE POLICY "Users can delete own blog images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'blog-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
