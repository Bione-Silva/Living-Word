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


