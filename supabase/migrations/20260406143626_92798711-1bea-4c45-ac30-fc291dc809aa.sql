ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS church_role text DEFAULT null;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS audience text DEFAULT null;