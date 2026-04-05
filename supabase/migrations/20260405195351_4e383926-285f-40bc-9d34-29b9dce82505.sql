
-- Drop the overly permissive anon policy we just created
DROP POLICY IF EXISTS "Anon can read blog profiles via view" ON profiles;

-- We need security_invoker=false so the view runs as the view owner (postgres)
-- who bypasses RLS. But the linter flags this. The proper solution is:
-- Use security_invoker=true + a restrictive anon policy that only returns
-- the columns needed. However, RLS is row-level not column-level.
-- The correct approach: drop security_invoker view, use security definer FUNCTION instead.

DROP VIEW IF EXISTS public.public_blog_profiles;

-- Create a security definer function that returns only safe columns
CREATE OR REPLACE FUNCTION public.get_public_blog_profile(p_handle text)
RETURNS TABLE(
  id uuid,
  full_name text,
  bio text,
  avatar_url text,
  blog_name text,
  blog_handle text,
  church_name text,
  city text,
  country text,
  language text,
  theme_color text,
  font_family text,
  layout_style text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.bio, p.avatar_url, p.blog_name, p.blog_handle,
         p.church_name, p.city, p.country, p.language,
         p.theme_color, p.font_family, p.layout_style
  FROM profiles p
  WHERE p.blog_handle = p_handle;
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION public.get_public_blog_profile(text) TO anon, authenticated;
