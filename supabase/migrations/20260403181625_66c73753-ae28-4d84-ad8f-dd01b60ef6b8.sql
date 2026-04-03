
-- Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  blog_handle TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT DEFAULT '',
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pastoral', 'church', 'ministry')),
  generations_used INTEGER NOT NULL DEFAULT 0,
  generations_limit INTEGER NOT NULL DEFAULT 5,
  language TEXT NOT NULL DEFAULT 'PT',
  doctrine TEXT DEFAULT 'evangelical',
  pastoral_voice TEXT DEFAULT 'acolhedor',
  bible_version TEXT DEFAULT 'NVI',
  wordpress_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Materials table
CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'sermon' CHECK (type IN ('sermon', 'outline', 'devotional', 'reels', 'bilingual', 'cell', 'blog_article')),
  passage TEXT,
  content TEXT NOT NULL DEFAULT '',
  language TEXT DEFAULT 'PT',
  bible_version TEXT DEFAULT 'NVI',
  favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Editorial queue table
CREATE TABLE public.editorial_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editorial_queue ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Materials: users can CRUD their own materials
CREATE POLICY "Users can view own materials" ON public.materials FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own materials" ON public.materials FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own materials" ON public.materials FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own materials" ON public.materials FOR DELETE USING (auth.uid() = user_id);

-- Editorial queue: users can CRUD their own entries
CREATE POLICY "Users can view own queue" ON public.editorial_queue FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own queue" ON public.editorial_queue FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own queue" ON public.editorial_queue FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own queue" ON public.editorial_queue FOR DELETE USING (auth.uid() = user_id);

-- Blog: anyone can read published materials via editorial_queue
CREATE POLICY "Public can view published materials" ON public.materials FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.editorial_queue eq WHERE eq.material_id = id AND eq.status = 'published')
);
CREATE POLICY "Public can view published queue" ON public.editorial_queue FOR SELECT USING (status = 'published');

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, blog_handle, language)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'blog_handle', NULL),
    COALESCE(NEW.raw_user_meta_data->>'language', 'PT')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
