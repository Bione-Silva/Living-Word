-- Pulpit Mode: 2 extra Bible versions chosen by the preacher to compare verses on stage.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pulpit_compare_version_2 TEXT NULL,
  ADD COLUMN IF NOT EXISTS pulpit_compare_version_3 TEXT NULL;