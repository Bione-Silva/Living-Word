-- ═══════════════════════════════════════════════════════════════
-- Living Word — Atomic Credit Deduction RPC
-- Prevents race conditions in credit consumption.
-- Uses SELECT FOR UPDATE to lock the row during the transaction.
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.debit_credits(
  p_user_id UUID,
  p_cost    INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER          -- runs with table-owner privileges
SET search_path = public  -- prevent search_path injection
AS $$
DECLARE
  v_used   INT;
  v_limit  INT;
BEGIN
  -- 1. Lock the row and read current values atomically
  SELECT generations_used, generations_limit
    INTO v_used, v_limit
    FROM profiles
   WHERE id = p_user_id
     FOR UPDATE;            -- row-level lock

  IF NOT FOUND THEN
    RETURN FALSE;           -- user doesn't exist
  END IF;

  -- 2. Check if user has enough credits
  IF (v_limit - v_used) < p_cost THEN
    RETURN FALSE;           -- insufficient credits
  END IF;

  -- 3. Deduct atomically
  UPDATE profiles
     SET generations_used = v_used + p_cost
   WHERE id = p_user_id;

  RETURN TRUE;
END;
$$;

-- Grant execute to authenticated users (called via supabase.rpc)
GRANT EXECUTE ON FUNCTION public.debit_credits(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.debit_credits(UUID, INT) TO service_role;

-- ═══════════════════════════════════════════════════════════════
-- Rollback helper: refund credits if AI generation fails
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.refund_credits(
  p_user_id UUID,
  p_cost    INT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
     SET generations_used = GREATEST(generations_used - p_cost, 0)
   WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.refund_credits(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refund_credits(UUID, INT) TO service_role;
