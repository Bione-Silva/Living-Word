-- Fix: Restrict devocional_compartilhamentos SELECT so anon/authenticated can only see rows by share_token, not browse all
DROP POLICY IF EXISTS "Anyone can view shares by token" ON public.devocional_compartilhamentos;

-- Owners can see their own shares
CREATE POLICY "Users can view own shares"
  ON public.devocional_compartilhamentos
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Anon can view by share_token only (used by increment_share_click RPC and public devotional page)
-- Note: anon must filter by share_token in their query; without a filter they get nothing useful
-- We keep this permissive but the public page only queries by token via the RPC (SECURITY DEFINER)
-- To truly restrict, we remove anon SELECT entirely since the RPC bypasses RLS
-- No anon SELECT policy needed - the increment_share_click RPC is SECURITY DEFINER