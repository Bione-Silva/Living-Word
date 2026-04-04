
-- Table for storing API keys securely
CREATE TABLE public.master_api_vault (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id TEXT NOT NULL UNIQUE,
  api_key TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.master_api_vault ENABLE ROW LEVEL SECURITY;

-- Only the master admin can read/write
CREATE POLICY "Master can manage vault"
ON public.master_api_vault
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'email' = 'bionicaosilva@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'bionicaosilva@gmail.com');

-- Table for global settings (model selections etc)
CREATE TABLE public.global_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master can manage settings"
ON public.global_settings
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'email' = 'bionicaosilva@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'bionicaosilva@gmail.com');

-- Anyone authenticated can read settings (needed for model selection in edge functions)
CREATE POLICY "Authenticated can read settings"
ON public.global_settings
FOR SELECT
TO authenticated
USING (true);

-- View for admin SaaS metrics
CREATE OR REPLACE VIEW public.admin_saas_metrics AS
SELECT
  (SELECT count(*) FROM public.profiles) AS total_users_registered,
  (SELECT count(*) FROM public.profiles WHERE plan = 'free') AS users_free,
  0 AS users_trialing,
  (SELECT count(*) FROM public.profiles WHERE plan = 'pastoral') AS users_pastoral,
  (SELECT count(*) FROM public.profiles WHERE plan = 'church') AS users_church,
  (SELECT count(*) FROM public.profiles WHERE plan = 'ministry') AS users_ministry,
  (
    (SELECT count(*) FROM public.profiles WHERE plan = 'pastoral') * 9.90 +
    (SELECT count(*) FROM public.profiles WHERE plan = 'church') * 29.90 +
    (SELECT count(*) FROM public.profiles WHERE plan = 'ministry') * 79.90
  ) AS estimated_mrr_usd;
