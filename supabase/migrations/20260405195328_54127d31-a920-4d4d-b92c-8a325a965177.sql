
DROP VIEW IF EXISTS public.public_blog_profiles;

CREATE OR REPLACE VIEW public.public_blog_profiles
WITH (security_barrier = true, security_invoker = true) AS
  SELECT id, full_name, bio, avatar_url, blog_name, blog_handle,
         church_name, city, country, language,
         theme_color, font_family, layout_style
  FROM profiles
  WHERE blog_handle IS NOT NULL;

GRANT SELECT ON public.public_blog_profiles TO anon, authenticated;

-- Since we dropped the "Public can view blog profiles" policy,
-- we need a new one that allows anon to read profiles via the view
CREATE POLICY "Anon can read blog profiles via view"
  ON profiles FOR SELECT TO anon
  USING (blog_handle IS NOT NULL);
