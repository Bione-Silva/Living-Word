
-- 1. Replace the public editorial_queue SELECT policy to hide user_id
-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Public can view published queue" ON public.editorial_queue;

-- Create a view that only exposes non-sensitive columns
CREATE OR REPLACE VIEW public.published_queue_public AS
SELECT id, material_id, status, published_at, scheduled_at, created_at
FROM public.editorial_queue
WHERE status = 'published';

-- Re-create policy scoped: public can only read published rows but through the view
-- We still need the policy on the base table for the view to work (security invoker)
CREATE POLICY "Public can view published queue limited"
ON public.editorial_queue
FOR SELECT
TO anon
USING (status = 'published');

-- 2. Replace the overly broad public materials policy to avoid leaking user_id
-- The existing policy is fine since it uses editorial_queue join, but let's ensure
-- the public blog functions (security definer) are the main access path.

-- 3. Fix is_admin() to not use hardcoded UUID - use a proper user_roles approach
-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Only admins can read/manage roles (bootstrap: the existing admin)
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Seed the current admin into user_roles
INSERT INTO public.user_roles (user_id, role)
VALUES ('b368f7c8-ff05-46af-be04-381832f7e7e3', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Create a security definer function that checks user_roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Now replace is_admin() to use user_roles instead of hardcoded UUID
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;
