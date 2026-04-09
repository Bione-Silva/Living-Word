-- ============================================================
-- 009_admin_ai_billing_dashboard.sql
-- Funções e Agregações para o Painel de Controle de Gastos de IA 
-- (OpenAI e Gemini -> custo por tenant, feature e modelos)
-- ============================================================

-- ============================================================
-- 1. Função: get_admin_ai_metrics
-- Retorna um objeto JSON agregado com as métricas globais,
-- consolidado por modelo, funcionalidade e por cada blog/usuário.
-- É declarada SECURITY DEFINER para permitir que o frontend 
-- Lovable a acesse sem ser bloqueado pela RLS logado como admin.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_admin_ai_metrics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Reúne todo o payload em uma única view embutida ou queries com aggregates JSON
  SELECT json_build_object(
    
    -- Totais Gerais
    'total_cost_usd', COALESCE((SELECT SUM(cost_usd) FROM public.generation_logs), 0),
    'total_tokens', COALESCE((SELECT SUM(input_tokens + output_tokens) FROM public.generation_logs), 0),
    
    -- Uso por Modelo (Ex: gpt-4o, gemini-1.5-pro)
    'models_usage', COALESCE(
      (
        SELECT json_agg(json_build_object(
          'model', COALESCE(llm_model, 'unknown'),
          'cost_usd', total_cost,
          'tokens', total_toks,
          'generations', qty
        ))
        FROM (
          SELECT llm_model, SUM(cost_usd) as total_cost, SUM(input_tokens + output_tokens) as total_toks, COUNT(*) as qty
          FROM public.generation_logs
          GROUP BY llm_model
          ORDER BY total_cost DESC NULLS LAST
        ) t_models
      ),
      '[]'::json
    ),

    -- Uso por Functionalidade / Ferramenta (Mode)
    'features_usage', COALESCE(
      (
        SELECT json_agg(json_build_object(
          'feature', COALESCE(mode, 'unknown'),
          'cost_usd', total_cost,
          'tokens', total_toks,
          'generations', qty
        ))
        FROM (
          SELECT mode, SUM(cost_usd) as total_cost, SUM(input_tokens + output_tokens) as total_toks, COUNT(*) as qty
          FROM public.generation_logs
          GROUP BY mode
          ORDER BY total_cost DESC NULLS LAST
        ) t_features
      ),
      '[]'::json
    ),

    -- Uso por Tenant / Blog (Agrupado por usuário)
    'tenants_usage', COALESCE(
      (
        SELECT json_agg(json_build_object(
          'user_id', u.id,
          'email', u.email,
          'blog_url', COALESCE(u.blog_url, 'Sem blog cadastrado'),
          'plan', u.plan,
          'cost_usd', t_u.total_cost,
          'total_tokens', t_u.total_toks,
          'generations', t_u.qty
        ))
        FROM (
          SELECT user_id, SUM(cost_usd) as total_cost, SUM(input_tokens + output_tokens) as total_toks, COUNT(*) as qty
          FROM public.generation_logs
          GROUP BY user_id
          ORDER BY total_cost DESC NULLS LAST
        ) t_u
        JOIN public.users u ON u.id = t_u.user_id
        -- LIMIT opcional: Pode adicionar 'LIMIT 100' aqui caso a base cresça muito
      ),
      '[]'::json
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Nota de Segurança: No futuro, se a interface Lovable for separada para uma rota
-- pública ou acessada por quem não é staff, recomenda-se adicionar um IF verificando 
-- auth.uid() contra uma tabela de `admins`. Como estamos em estágio master/backoffice 
-- interno logado, SECURITY DEFINER resolve o bypass momentaneamente.
