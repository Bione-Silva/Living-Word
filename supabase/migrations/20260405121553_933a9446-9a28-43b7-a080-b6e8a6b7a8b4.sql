
-- Table to log every AI generation
CREATE TABLE public.generation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  feature text NOT NULL,
  model text NOT NULL,
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  total_tokens integer NOT NULL DEFAULT 0,
  cost_usd numeric(10,6) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.generation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own logs"
  ON public.generation_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own logs"
  ON public.generation_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Master can view all logs"
  ON public.generation_logs FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'bionicaosilva@gmail.com');

-- Index for fast admin queries
CREATE INDEX idx_generation_logs_created ON public.generation_logs(created_at DESC);
CREATE INDEX idx_generation_logs_user ON public.generation_logs(user_id);

-- RPC function for AI Billing Dashboard
CREATE OR REPLACE FUNCTION public.get_admin_ai_metrics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result json;
BEGIN
  IF (auth.jwt() ->> 'email') != 'bionicaosilva@gmail.com' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_build_object(
    'total_cost_usd', COALESCE((SELECT SUM(cost_usd) FROM generation_logs), 0),
    'total_tokens', COALESCE((SELECT SUM(total_tokens) FROM generation_logs), 0),
    'total_generations', COALESCE((SELECT COUNT(*) FROM generation_logs), 0),
    'top_feature', COALESCE(
      (SELECT feature FROM generation_logs GROUP BY feature ORDER BY SUM(cost_usd) DESC LIMIT 1),
      'N/A'
    ),
    'models_usage', COALESCE(
      (SELECT json_agg(row_to_json(m)) FROM (
        SELECT model, SUM(cost_usd)::numeric(10,2) AS cost_usd, SUM(total_tokens) AS tokens, COUNT(*) AS generations
        FROM generation_logs GROUP BY model ORDER BY SUM(cost_usd) DESC
      ) m),
      '[]'::json
    ),
    'features_usage', COALESCE(
      (SELECT json_agg(row_to_json(f)) FROM (
        SELECT feature, SUM(cost_usd)::numeric(10,2) AS cost_usd, SUM(total_tokens) AS tokens, COUNT(*) AS generations
        FROM generation_logs GROUP BY feature ORDER BY SUM(cost_usd) DESC
      ) f),
      '[]'::json
    ),
    'tenants_usage', COALESCE(
      (SELECT json_agg(row_to_json(t)) FROM (
        SELECT 
          COALESCE(p.full_name, gl.user_id::text) AS identifier,
          p.plan,
          COUNT(*) AS generations_count,
          SUM(gl.total_tokens) AS total_tokens,
          SUM(gl.cost_usd)::numeric(10,2) AS cost_usd
        FROM generation_logs gl
        LEFT JOIN profiles p ON p.id = gl.user_id
        GROUP BY gl.user_id, p.full_name, p.plan
        ORDER BY SUM(gl.cost_usd) DESC
      ) t),
      '[]'::json
    )
  ) INTO result;

  RETURN result;
END;
$$;
