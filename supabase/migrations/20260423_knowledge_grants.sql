-- ============================================================
-- Correção de permissões: schema knowledge
-- Projeto: priumwdestycikzfcysg
-- Rodar via: Supabase SQL Editor
-- ============================================================

-- 1. Garantir acesso ao schema para todas as roles relevantes
GRANT USAGE ON SCHEMA knowledge TO anon, authenticated, service_role;

-- 2. Garantir acesso às tabelas
GRANT SELECT ON knowledge.documents TO anon, authenticated;
GRANT SELECT ON knowledge.chunks    TO anon, authenticated;
GRANT ALL    ON knowledge.documents TO service_role;
GRANT ALL    ON knowledge.chunks    TO service_role;

-- 3. Garantir acesso a sequences (para INSERT com gen_random_uuid há tabelas auxiliares)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA knowledge TO service_role;

-- 4. Tornar match_cea_chunks executável por authenticated e service_role
GRANT EXECUTE ON FUNCTION match_cea_chunks(vector, float, int, text, text) TO authenticated, service_role;

-- 5. Verificação final
SELECT 
  nspname AS schema,
  has_schema_privilege('authenticated', nspname, 'USAGE') AS auth_can_use,
  has_schema_privilege('service_role', nspname, 'USAGE') AS svc_can_use
FROM pg_namespace
WHERE nspname = 'knowledge';
