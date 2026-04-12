CREATE TABLE public.page_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  path text NOT NULL,
  referrer text,
  country text DEFAULT 'Unknown',
  city text DEFAULT 'Unknown',
  device text DEFAULT 'Unknown',
  browser text DEFAULT 'Unknown',
  user_agent text,
  session_id text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can insert page views"
  ON public.page_views FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can select page views"
  ON public.page_views FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Authenticated users can read page views"
  ON public.page_views FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX idx_page_views_created_at ON public.page_views (created_at DESC);
CREATE INDEX idx_page_views_path ON public.page_views (path);