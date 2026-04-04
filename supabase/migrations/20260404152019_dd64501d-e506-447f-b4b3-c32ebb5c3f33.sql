
-- 1. Page views tracking
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  referrer text,
  country text,
  city text,
  device text,
  browser text,
  user_agent text,
  session_id text,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master can view all page_views"
  ON public.page_views FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'email') = 'bionicaosilva@gmail.com');

CREATE POLICY "Anyone can insert page_views"
  ON public.page_views FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- 2. Monthly financials
CREATE TABLE public.monthly_financials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month date NOT NULL,
  revenue numeric NOT NULL DEFAULT 0,
  expenses numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.monthly_financials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master can manage financials"
  ON public.monthly_financials FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'email') = 'bionicaosilva@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'bionicaosilva@gmail.com');

-- 3. Team members (staff invitations)
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role text NOT NULL DEFAULT 'viewer',
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  invite_token text UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  accepted_at timestamptz,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master can manage team"
  ON public.team_members FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'email') = 'bionicaosilva@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'bionicaosilva@gmail.com');

CREATE POLICY "Team members can view own record"
  ON public.team_members FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 4. Extended profile fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS church_name text,
  ADD COLUMN IF NOT EXISTS denomination text,
  ADD COLUMN IF NOT EXISTS favorite_preacher text,
  ADD COLUMN IF NOT EXISTS preaching_style text,
  ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false;

-- Index for page_views queries
CREATE INDEX idx_page_views_created_at ON public.page_views(created_at);
CREATE INDEX idx_page_views_path ON public.page_views(path);
CREATE INDEX idx_page_views_country ON public.page_views(country);
