-- =====================================================
-- LIVING WORD — FULL SCHEMA EXPORT
-- 32 tables + RLS + Functions + Triggers + Views
-- Target: priumwdestycikzfcysg.supabase.co
-- Added ALTER TABLE ADD COLUMN IF NOT EXISTS to protect existing tables
-- =====================================================

-- =====================================================
-- 0. ALTER EXISTING TABLES TO ADD MISSING COLUMNS
-- =====================================================
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS bio text DEFAULT '',
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'PT',
  ADD COLUMN IF NOT EXISTS doctrine text DEFAULT 'evangelical',
  ADD COLUMN IF NOT EXISTS pastoral_voice text DEFAULT 'acolhedor',
  ADD COLUMN IF NOT EXISTS bible_version text DEFAULT 'NVI',
  ADD COLUMN IF NOT EXISTS wordpress_url text,
  ADD COLUMN IF NOT EXISTS blog_handle text,
  ADD COLUMN IF NOT EXISTS blog_name text,
  ADD COLUMN IF NOT EXISTS church_name text,
  ADD COLUMN IF NOT EXISTS church_role text,
  ADD COLUMN IF NOT EXISTS denomination text,
  ADD COLUMN IF NOT EXISTS audience text,
  ADD COLUMN IF NOT EXISTS favorite_preacher text,
  ADD COLUMN IF NOT EXISTS preaching_style text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS street text,
  ADD COLUMN IF NOT EXISTS neighborhood text,
  ADD COLUMN IF NOT EXISTS zip_code text,
  ADD COLUMN IF NOT EXISTS theme_color text DEFAULT 'amber',
  ADD COLUMN IF NOT EXISTS font_family text DEFAULT 'cormorant',
  ADD COLUMN IF NOT EXISTS layout_style text DEFAULT 'classic',
  ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS bonus_day_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bonus_last_claimed date,
  ADD COLUMN IF NOT EXISTS trial_started_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz DEFAULT (now() + interval '7 days');

ALTER TABLE public.generation_logs 
  ADD COLUMN IF NOT EXISTS model text DEFAULT 'gpt-4o-mini',
  ADD COLUMN IF NOT EXISTS input_tokens integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS output_tokens integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_tokens integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost_usd numeric NOT NULL DEFAULT 0;

ALTER TABLE public.materials 
  ADD COLUMN IF NOT EXISTS language text DEFAULT 'PT',
  ADD COLUMN IF NOT EXISTS bible_version text DEFAULT 'NVI',
  ADD COLUMN IF NOT EXISTS favorite boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS article_images jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS notes text DEFAULT '',
  ADD COLUMN IF NOT EXISTS workspace_id uuid;

ALTER TABLE public.devotionals 
  ADD COLUMN IF NOT EXISTS category text DEFAULT '',
  ADD COLUMN IF NOT EXISTS anchor_verse text DEFAULT '',
  ADD COLUMN IF NOT EXISTS anchor_verse_text text DEFAULT '',
  ADD COLUMN IF NOT EXISTS body_text text DEFAULT '',
  ADD COLUMN IF NOT EXISTS daily_practice text DEFAULT '',
  ADD COLUMN IF NOT EXISTS reflection_question text DEFAULT '',
  ADD COLUMN IF NOT EXISTS closing_prayer text DEFAULT '',
  ADD COLUMN IF NOT EXISTS scheduled_date date DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS audio_url_nova text,
  ADD COLUMN IF NOT EXISTS audio_url_alloy text,
  ADD COLUMN IF NOT EXISTS audio_url_onyx text,
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'PT',
  ADD COLUMN IF NOT EXISTS series_id uuid,
  ADD COLUMN IF NOT EXISTS series_number integer;


-- =====================================================
-- 1. EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA extensions;

-- =====================================================
-- 2. FUNCTIONS (must exist before triggers/policies)
-- =====================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  desired_handle text;
  final_handle text;
BEGIN
  desired_handle := COALESCE(NEW.raw_user_meta_data->>'blog_handle', NULL);
  IF desired_handle IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.profiles WHERE blog_handle = desired_handle) THEN
      final_handle := desired_handle || '-' || substr(NEW.id::text, 1, 6);
    ELSE
      final_handle := desired_handle;
    END IF;
  ELSE
    final_handle := NULL;
  END IF;
  INSERT INTO public.profiles (id, full_name, blog_handle, language, trial_started_at, trial_ends_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    final_handle,
    COALESCE(NEW.raw_user_meta_data->>'language', 'PT'),
    now(),
    now() + interval '7 days'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_plan_credits()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.generations_limit := CASE NEW.plan
    WHEN 'free'     THEN 500
    WHEN 'starter'  THEN 4000
    WHEN 'pastoral' THEN 4000
    WHEN 'pro'      THEN 8000
    WHEN 'church'   THEN 8000
    WHEN 'igreja'   THEN 20000
    WHEN 'ministry' THEN 20000
    ELSE 500
  END;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_bible_highlights_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_share_click(p_token text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE devocional_compartilhamentos
  SET cliques = cliques + 1
  WHERE share_token = p_token;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_saas_metrics()
RETURNS TABLE(total_users_registered bigint, users_free bigint, users_trialing integer, users_starter bigint, users_pro bigint, users_igreja bigint, estimated_mrr_usd numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF (auth.jwt() ->> 'email') != 'bionicaosilva@gmail.com' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN QUERY SELECT
    (SELECT count(*) FROM profiles) AS total_users_registered,
    (SELECT count(*) FROM profiles WHERE plan = 'free') AS users_free,
    0 AS users_trialing,
    (SELECT count(*) FROM profiles WHERE plan = 'starter') AS users_starter,
    (SELECT count(*) FROM profiles WHERE plan = 'pro') AS users_pro,
    (SELECT count(*) FROM profiles WHERE plan = 'igreja') AS users_igreja,
    (
      (SELECT count(*) FROM profiles WHERE plan = 'starter') * 9.90 +
      (SELECT count(*) FROM profiles WHERE plan = 'pro') * 29.90 +
      (SELECT count(*) FROM profiles WHERE plan = 'igreja') * 79.90
    )::numeric AS estimated_mrr_usd;
END;
$$;

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

CREATE OR REPLACE FUNCTION public.get_public_blog_profile(p_handle text)
RETURNS TABLE(id uuid, full_name text, bio text, avatar_url text, blog_name text, blog_handle text, church_name text, city text, country text, language text, theme_color text, font_family text, layout_style text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.id, p.full_name, p.bio, p.avatar_url, p.blog_name, p.blog_handle,
         p.church_name, p.city, p.country, p.language,
         p.theme_color, p.font_family, p.layout_style
  FROM profiles p
  WHERE p.blog_handle = p_handle;
$$;

CREATE OR REPLACE FUNCTION public.get_public_blog_articles(p_handle text)
RETURNS TABLE(id uuid, title text, content text, cover_image_url text, created_at timestamptz, updated_at timestamptz, language text, passage text, article_images jsonb, published_at timestamptz)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT m.id, m.title, m.content, m.cover_image_url, m.created_at, m.updated_at,
         m.language, m.passage, m.article_images, eq.published_at
  FROM public.profiles p
  JOIN public.materials m ON m.user_id = p.id AND m.type = 'blog_article'
  JOIN public.editorial_queue eq ON eq.material_id = m.id AND eq.user_id = p.id AND eq.status = 'published'
  WHERE p.blog_handle = p_handle
  ORDER BY COALESCE(eq.published_at, m.created_at) DESC, m.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_public_blog_article(p_article_id uuid)
RETURNS TABLE(id uuid, type text, title text, content text, bible_version text, language text, passage text, article_images jsonb, cover_image_url text, updated_at timestamptz, created_at timestamptz, favorite boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT m.id, m.type, m.title, m.content, m.bible_version, m.language, m.passage,
         m.article_images, m.cover_image_url, m.updated_at, m.created_at, m.favorite
  FROM public.materials m
  JOIN public.editorial_queue eq ON eq.material_id = m.id AND eq.user_id = m.user_id AND eq.status = 'published'
  WHERE m.id = p_article_id AND m.type = 'blog_article'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_public_blog_siblings(p_article_id uuid)
RETURNS TABLE(id uuid, language text, title text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH target_article AS (
    SELECT m.id, m.user_id, m.passage
    FROM public.materials m
    JOIN public.editorial_queue eq ON eq.material_id = m.id AND eq.user_id = m.user_id AND eq.status = 'published'
    WHERE m.id = p_article_id AND m.type = 'blog_article'
    LIMIT 1
  )
  SELECT m.id, m.language, m.title
  FROM target_article ta
  JOIN public.materials m ON m.user_id = ta.user_id AND m.type = 'blog_article' AND m.id <> ta.id AND COALESCE(m.passage, '') = COALESCE(ta.passage, '')
  JOIN public.editorial_queue eq ON eq.material_id = m.id AND eq.user_id = m.user_id AND eq.status = 'published'
  ORDER BY m.created_at DESC;
$$;

-- =====================================================
-- 3. TABLES (Creates only if not exists)
-- =====================================================

-- 3.1 profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL PRIMARY KEY,
  full_name text NOT NULL DEFAULT '',
  avatar_url text,
  bio text DEFAULT '',
  plan text NOT NULL DEFAULT 'free',
  generations_used integer NOT NULL DEFAULT 0,
  generations_limit integer NOT NULL DEFAULT 500,
  language text NOT NULL DEFAULT 'PT',
  doctrine text DEFAULT 'evangelical',
  pastoral_voice text DEFAULT 'acolhedor',
  bible_version text DEFAULT 'NVI',
  wordpress_url text,
  blog_handle text,
  blog_name text,
  church_name text,
  church_role text,
  denomination text,
  audience text,
  favorite_preacher text,
  preaching_style text,
  phone text,
  country text,
  city text,
  state text,
  street text,
  neighborhood text,
  zip_code text,
  theme_color text DEFAULT 'amber',
  font_family text DEFAULT 'cormorant',
  layout_style text DEFAULT 'classic',
  profile_completed boolean DEFAULT false,
  bonus_day_count integer NOT NULL DEFAULT 0,
  bonus_last_claimed date,
  trial_started_at timestamptz DEFAULT now(),
  trial_ends_at timestamptz DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 3.2 user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'user',
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- 3.3 materials
CREATE TABLE IF NOT EXISTS public.materials (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  type text NOT NULL DEFAULT 'sermon',
  content text NOT NULL DEFAULT '',
  passage text,
  language text DEFAULT 'PT',
  bible_version text DEFAULT 'NVI',
  favorite boolean DEFAULT false,
  cover_image_url text,
  article_images jsonb DEFAULT '[]'::jsonb,
  notes text DEFAULT '',
  workspace_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own materials" ON public.materials FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own materials" ON public.materials FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own materials" ON public.materials FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own materials" ON public.materials FOR DELETE USING (auth.uid() = user_id);

-- 3.4 editorial_queue
CREATE TABLE IF NOT EXISTS public.editorial_queue (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  material_id uuid REFERENCES public.materials(id),
  status text NOT NULL DEFAULT 'draft',
  scheduled_at timestamptz,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.editorial_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own queue" ON public.editorial_queue FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own queue" ON public.editorial_queue FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own queue" ON public.editorial_queue FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own queue" ON public.editorial_queue FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Public can view published queue limited" ON public.editorial_queue FOR SELECT TO anon USING (status = 'published');

-- Now add cross-reference policy on materials (needs editorial_queue to exist)
CREATE POLICY "Public can view published materials" ON public.materials FOR SELECT USING (EXISTS (SELECT 1 FROM editorial_queue eq WHERE eq.material_id = materials.id AND eq.status = 'published'));

-- 3.5 workspaces
CREATE TABLE IF NOT EXISTS public.workspaces (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  emoji text DEFAULT '📂',
  target_audience text,
  communication_tone text,
  content_preferences text,
  brand_color text,
  default_template text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own workspaces" ON public.workspaces FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own workspaces" ON public.workspaces FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workspaces" ON public.workspaces FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workspaces" ON public.workspaces FOR DELETE USING (auth.uid() = user_id);

-- Add FK materials -> workspaces
ALTER TABLE public.materials ADD CONSTRAINT materials_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id);

-- 3.6 devotionals
CREATE TABLE IF NOT EXISTS public.devotionals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  category text NOT NULL DEFAULT '',
  anchor_verse text NOT NULL DEFAULT '',
  anchor_verse_text text NOT NULL DEFAULT '',
  body_text text NOT NULL DEFAULT '',
  daily_practice text DEFAULT '',
  reflection_question text DEFAULT '',
  closing_prayer text DEFAULT '',
  scheduled_date date NOT NULL,
  cover_image_url text,
  audio_url_nova text,
  audio_url_alloy text,
  audio_url_onyx text,
  language text NOT NULL DEFAULT 'PT',
  series_id uuid,
  series_number integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.devotionals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view devotionals" ON public.devotionals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role can manage devotionals" ON public.devotionals FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3.7 devotional_likes
CREATE TABLE IF NOT EXISTS public.devotional_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  devotional_id uuid NOT NULL REFERENCES public.devotionals(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.devotional_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all likes" ON public.devotional_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own likes" ON public.devotional_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON public.devotional_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3.8 devotional_comments
CREATE TABLE IF NOT EXISTS public.devotional_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  devotional_id uuid NOT NULL REFERENCES public.devotionals(id),
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.devotional_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all comments" ON public.devotional_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own comments" ON public.devotional_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.devotional_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3.9 devotional_engagements
CREATE TABLE IF NOT EXISTS public.devotional_engagements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  devotional_id uuid REFERENCES public.devotionals(id),
  action text NOT NULL,
  duration_seconds integer DEFAULT 0,
  emotional_response text,
  reflection_text text,
  reflection_sentiment text,
  theme text,
  series_number integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.devotional_engagements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own engagements" ON public.devotional_engagements FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own engagements" ON public.devotional_engagements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full access engagements" ON public.devotional_engagements FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3.10 devotional_user_profiles
CREATE TABLE IF NOT EXISTS public.devotional_user_profiles (
  user_id uuid NOT NULL PRIMARY KEY,
  favorite_themes jsonb DEFAULT '[]'::jsonb,
  last_devotional_id uuid REFERENCES public.devotionals(id),
  last_devotional_theme text,
  average_time_spent integer DEFAULT 0,
  consecutive_days_engaged integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.devotional_user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own devotional profile" ON public.devotional_user_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own devotional profile" ON public.devotional_user_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own devotional profile" ON public.devotional_user_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role full access dev profiles" ON public.devotional_user_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3.11 devocional_compartilhamentos
CREATE TABLE IF NOT EXISTS public.devocional_compartilhamentos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  share_token text NOT NULL,
  devocional_date date NOT NULL,
  cliques integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.devocional_compartilhamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view shares by token" ON public.devocional_compartilhamentos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users can insert own shares" ON public.devocional_compartilhamentos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own shares" ON public.devocional_compartilhamentos FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- 3.12 bible_favorites
CREATE TABLE IF NOT EXISTS public.bible_favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  book_id text NOT NULL,
  chapter_number integer NOT NULL,
  verse_number integer NOT NULL,
  verse_text text NOT NULL DEFAULT '',
  language text NOT NULL DEFAULT 'PT',
  translation_code text NOT NULL DEFAULT 'almeida',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bible_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own favorites" ON public.bible_favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own favorites" ON public.bible_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON public.bible_favorites FOR DELETE USING (auth.uid() = user_id);

-- 3.13 bible_highlights
CREATE TABLE IF NOT EXISTS public.bible_highlights (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  book_id text NOT NULL,
  chapter_number integer NOT NULL,
  start_verse_number integer NOT NULL,
  end_verse_number integer NOT NULL,
  start_char_offset integer NOT NULL DEFAULT 0,
  end_char_offset integer NOT NULL DEFAULT 0,
  selected_text text NOT NULL,
  color_key text NOT NULL,
  language text NOT NULL,
  translation_code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bible_highlights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own bible highlights" ON public.bible_highlights FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own bible highlights" ON public.bible_highlights FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bible highlights" ON public.bible_highlights FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own bible highlights" ON public.bible_highlights FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3.14 bible_notes
CREATE TABLE IF NOT EXISTS public.bible_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  book_id text NOT NULL,
  chapter_number integer NOT NULL,
  verse_number integer NOT NULL,
  note_text text NOT NULL DEFAULT '',
  language text NOT NULL DEFAULT 'PT',
  translation_code text NOT NULL DEFAULT 'almeida',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bible_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notes" ON public.bible_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notes" ON public.bible_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes" ON public.bible_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON public.bible_notes FOR DELETE USING (auth.uid() = user_id);

-- 3.15 chat_messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  agent_id text NOT NULL DEFAULT 'palavra_amiga',
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own chat messages" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chat messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own chat messages" ON public.chat_messages FOR DELETE USING (auth.uid() = user_id);

-- 3.16 generation_logs
CREATE TABLE IF NOT EXISTS public.generation_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  feature text NOT NULL,
  model text NOT NULL,
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  total_tokens integer NOT NULL DEFAULT 0,
  cost_usd numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.generation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own logs" ON public.generation_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own logs" ON public.generation_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Master can view all logs" ON public.generation_logs FOR SELECT TO authenticated USING (is_admin());

-- 3.17 page_views
CREATE TABLE IF NOT EXISTS public.page_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
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
CREATE POLICY "Master can view all page_views" ON public.page_views FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "Validated page_views insert" ON public.page_views FOR INSERT TO anon, authenticated WITH CHECK (path IS NOT NULL AND length(path) > 0 AND length(path) < 500 AND (user_id IS NULL OR user_id = auth.uid()));

-- 3.18 expos_studies
CREATE TABLE IF NOT EXISTS public.expos_studies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  passagem text NOT NULL,
  formato text NOT NULL DEFAULT 'individual',
  conteudo_markdown text NOT NULL DEFAULT '',
  titulo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.expos_studies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own expos studies" ON public.expos_studies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expos studies" ON public.expos_studies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expos studies" ON public.expos_studies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expos studies" ON public.expos_studies FOR DELETE USING (auth.uid() = user_id);

-- 3.19 sermon_notes
CREATE TABLE IF NOT EXISTS public.sermon_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  material_id uuid REFERENCES public.materials(id),
  session_id text,
  content text NOT NULL DEFAULT '',
  text_color text NOT NULL DEFAULT '#374151',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sermon_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sermon notes" ON public.sermon_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sermon notes" ON public.sermon_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sermon notes" ON public.sermon_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sermon notes" ON public.sermon_notes FOR DELETE USING (auth.uid() = user_id);

-- 3.20 visual_outputs
CREATE TABLE IF NOT EXISTS public.visual_outputs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  material_id uuid REFERENCES public.materials(id),
  output_type text NOT NULL DEFAULT 'carousel',
  format text NOT NULL DEFAULT '4:5',
  language text NOT NULL DEFAULT 'PT',
  variation_number integer NOT NULL DEFAULT 1,
  slides_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.visual_outputs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own visual outputs" ON public.visual_outputs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own visual outputs" ON public.visual_outputs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own visual outputs" ON public.visual_outputs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3.21 social_arts
CREATE TABLE IF NOT EXISTS public.social_arts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  file_path text NOT NULL,
  file_url text NOT NULL,
  title text,
  aspect_ratio text NOT NULL DEFAULT '1:1',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.social_arts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own arts" ON public.social_arts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own arts" ON public.social_arts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own arts" ON public.social_arts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3.22 material_feedback
CREATE TABLE IF NOT EXISTS public.material_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  material_type text NOT NULL,
  rating text NOT NULL,
  comment text,
  material_title text,
  tool_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.material_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own feedback" ON public.material_feedback FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own feedback" ON public.material_feedback FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Master can view all feedback" ON public.material_feedback FOR SELECT TO authenticated USING (is_admin());

-- 3.23 free_tool_usage
CREATE TABLE IF NOT EXISTS public.free_tool_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  tool_id text NOT NULL,
  month_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.free_tool_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own usage" ON public.free_tool_usage FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role only" ON public.free_tool_usage FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3.24 global_settings
CREATE TABLE IF NOT EXISTS public.global_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read settings" ON public.global_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Master can manage settings" ON public.global_settings FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- 3.25 master_api_vault
CREATE TABLE IF NOT EXISTS public.master_api_vault (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id text NOT NULL,
  api_key text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.master_api_vault ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Master can manage vault" ON public.master_api_vault FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- 3.26 mind_settings
CREATE TABLE IF NOT EXISTS public.mind_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mind_id text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.mind_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read mind_settings" ON public.mind_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Master can manage mind_settings" ON public.mind_settings FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- 3.27 monthly_financials
CREATE TABLE IF NOT EXISTS public.monthly_financials (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month date NOT NULL,
  revenue numeric NOT NULL DEFAULT 0,
  expenses numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.monthly_financials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Master can manage financials" ON public.monthly_financials FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- 3.28 notification_queue
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  type text NOT NULL,
  message text NOT NULL,
  scheduled_for timestamptz NOT NULL,
  sent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notification_queue FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role full access notifications" ON public.notification_queue FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3.29 quiz_scores
CREATE TABLE IF NOT EXISTS public.quiz_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  total_xp integer NOT NULL DEFAULT 0,
  best_streak integer NOT NULL DEFAULT 0,
  games_played integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view all scores" ON public.quiz_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own score" ON public.quiz_scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own score" ON public.quiz_scores FOR UPDATE USING (auth.uid() = user_id);

-- 3.30 quiz_sessions
CREATE TABLE IF NOT EXISTS public.quiz_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  category text NOT NULL DEFAULT 'general',
  total_questions integer NOT NULL DEFAULT 10,
  correct_answers integer NOT NULL DEFAULT 0,
  score integer NOT NULL DEFAULT 0,
  xp_earned integer NOT NULL DEFAULT 0,
  time_seconds integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view for ranking" ON public.quiz_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own quiz sessions" ON public.quiz_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own quiz sessions" ON public.quiz_sessions FOR SELECT USING (auth.uid() = user_id);

-- 3.31 reading_plan_progress
CREATE TABLE IF NOT EXISTS public.reading_plan_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  plan_id text NOT NULL,
  day_number integer NOT NULL,
  completed boolean NOT NULL DEFAULT true,
  completed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reading_plan_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own reading progress" ON public.reading_plan_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reading progress" ON public.reading_plan_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reading progress" ON public.reading_plan_progress FOR DELETE USING (auth.uid() = user_id);

-- 3.32 team_members
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'viewer',
  status text NOT NULL DEFAULT 'pending',
  user_id uuid,
  invited_by uuid,
  invite_token text DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Master can manage team" ON public.team_members FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Team members can view own record" ON public.team_members FOR SELECT TO authenticated USING (user_id = auth.uid());

-- =====================================================
-- 4. TRIGGERS
-- =====================================================

-- Auto-create profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sync plan credits
CREATE OR REPLACE TRIGGER sync_plan_credits_trigger
  BEFORE UPDATE OF plan ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_plan_credits();

-- Bible highlights updated_at
CREATE OR REPLACE TRIGGER update_bible_highlights_updated_at
  BEFORE UPDATE ON public.bible_highlights
  FOR EACH ROW EXECUTE FUNCTION public.update_bible_highlights_updated_at();

-- =====================================================
-- 5. VIEWS
-- =====================================================

CREATE OR REPLACE VIEW public.admin_saas_metrics AS
SELECT
  (SELECT count(*) FROM profiles) AS total_users_registered,
  (SELECT count(*) FROM profiles WHERE plan = 'free') AS users_free,
  (SELECT count(*) FROM profiles WHERE plan = 'pastoral') AS users_pastoral,
  (SELECT count(*) FROM profiles WHERE plan = 'ministry') AS users_ministry,
  (SELECT count(*) FROM profiles WHERE plan = 'church') AS users_church,
  (SELECT count(*) FROM profiles WHERE trial_ends_at > now() AND plan = 'free') AS users_trialing,
  (
    (SELECT count(*) FROM profiles WHERE plan = 'pastoral') * 29.90 +
    (SELECT count(*) FROM profiles WHERE plan = 'ministry') * 59.90 +
    (SELECT count(*) FROM profiles WHERE plan = 'church') * 99.90
  )::numeric AS estimated_mrr_usd;

CREATE OR REPLACE VIEW public.published_queue_public AS
SELECT id, material_id, status, scheduled_at, published_at, created_at
FROM public.editorial_queue
WHERE status = 'published';

CREATE OR REPLACE VIEW public.team_members_safe AS
SELECT id, email, role, status, user_id, invited_by, accepted_at, created_at, updated_at
FROM public.team_members;

-- =====================================================
-- 6. STORAGE BUCKETS
-- =====================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('blog-images', 'blog-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('social_arts', 'social_arts', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('devotional-assets', 'devotional-assets', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('article-covers', 'article-covers', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies for public read
CREATE POLICY "Public read blog-images" ON storage.objects FOR SELECT USING (bucket_id = 'blog-images');
CREATE POLICY "Public read social_arts" ON storage.objects FOR SELECT USING (bucket_id = 'social_arts');
CREATE POLICY "Public read devotional-assets" ON storage.objects FOR SELECT USING (bucket_id = 'devotional-assets');
CREATE POLICY "Public read article-covers" ON storage.objects FOR SELECT USING (bucket_id = 'article-covers');

-- =====================================================
-- DONE! All 32 tables, RLS, functions, triggers, views
-- and storage buckets have been created.
-- =====================================================
