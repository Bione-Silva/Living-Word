CREATE TABLE public.free_tool_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tool_id text NOT NULL,
  month_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tool_id, month_key)
);

ALTER TABLE public.free_tool_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON public.free_tool_usage
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Users can view own usage" ON public.free_tool_usage
  FOR SELECT TO authenticated USING (auth.uid() = user_id);