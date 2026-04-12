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
