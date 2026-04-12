import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  'https://priumwdestycikzfcysg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaXVtd2Rlc3R5Y2lremZjeXNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyMzg0OSwiZXhwIjoyMDkwNzk5ODQ5fQ.sajpSk081mza8QoNTC8DeIMo7HJpByti9NhQlsee4FI'
)
async function go() {
  const sql = `
  CREATE OR REPLACE FUNCTION public.consume_credits(
    p_user_id UUID,
    p_credits INTEGER
  )
  RETURNS BOOLEAN
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
  DECLARE
    v_limit   INTEGER;
    v_used    INTEGER;
  BEGIN
    -- Lock exclusivo na linha do usuário
    SELECT generations_limit, generations_used
    INTO v_limit, v_used
    FROM public.profiles
    WHERE id = p_user_id
    FOR UPDATE;

    -- Verificar se tem créditos suficientes
    IF (v_used + p_credits) > v_limit THEN
      RETURN FALSE;  -- bloqueado — créditos insuficientes
    END IF;

    -- Incrementar atomicamente
    UPDATE public.profiles
    SET generations_used = generations_used + p_credits
    WHERE id = p_user_id;

    RETURN TRUE;  -- consumo autorizado
  END;
  $$;

  GRANT EXECUTE ON FUNCTION public.consume_credits(UUID, INTEGER) TO service_role;
  `;
  // I must be careful as supabase js can't execute raw DDL scripts via standard clients without a dedicated RPC.
  // Wait, I can create a migration file and push it.
}
