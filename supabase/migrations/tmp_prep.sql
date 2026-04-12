CREATE TABLE IF NOT EXISTS public.profiles (id uuid PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.materials (id uuid PRIMARY KEY, user_id uuid NOT NULL, type text NOT NULL, title text NOT NULL);
CREATE TABLE IF NOT EXISTS public.devotionals (id uuid PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.generation_logs (id uuid PRIMARY KEY, user_id uuid NOT NULL, feature text NOT NULL, model text NOT NULL);
