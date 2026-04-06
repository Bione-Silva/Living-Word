
-- Create a safe view for team_members that excludes invite_token
CREATE OR REPLACE VIEW public.team_members_safe
WITH (security_invoker = on) AS
  SELECT id, email, role, status, invited_by, user_id, accepted_at, created_at, updated_at
  FROM public.team_members;

-- Drop the existing permissive SELECT policy that exposes invite_token
DROP POLICY IF EXISTS "Team members can view own record" ON public.team_members;

-- Recreate: team members can only see own record but the app should use the view
CREATE POLICY "Team members can view own record"
  ON public.team_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
