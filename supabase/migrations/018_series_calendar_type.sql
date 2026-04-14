-- 018_series_calendar_type.sql
-- Adiciona o novo tipo 'series_calendar' à tabela de materiais

-- Supabase não suporta ALTER TYPE CHECK diretamente; 
-- garantimos via DROP + ADD CONSTRAINT se existir, 
-- ou simplesmente removemos a constraint de CHECK de tipo para ser flexível.

ALTER TABLE public.materials DROP CONSTRAINT IF EXISTS materials_type_check;
