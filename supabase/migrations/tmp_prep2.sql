CREATE TABLE IF NOT EXISTS public.user_roles (user_id uuid, role text);
CREATE TABLE IF NOT EXISTS public.devocional_compartilhamentos (share_token text, cliques int);
CREATE TABLE IF NOT EXISTS public.editorial_queue (material_id uuid, user_id uuid, status text, published_at timestamptz);
