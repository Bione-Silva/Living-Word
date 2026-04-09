-- 010_progressive_onboarding_persistence.sql
-- Adiciona campos de gamificação e perfil progressivo para o Onboarding V2

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS theological_line_detail text,
ADD COLUMN IF NOT EXISTS primary_goal text,
ADD COLUMN IF NOT EXISTS teaching_style text,
ADD COLUMN IF NOT EXISTS audience_profile text,
ADD COLUMN IF NOT EXISTS desired_tone text,
ADD COLUMN IF NOT EXISTS preferred_formats text[],
ADD COLUMN IF NOT EXISTS desired_depth text,
ADD COLUMN IF NOT EXISTS profile_completion_total integer DEFAULT 10,
ADD COLUMN IF NOT EXISTS profile_completion_done integer DEFAULT 4,
ADD COLUMN IF NOT EXISTS profile_completion_percent integer DEFAULT 40;

-- Atualizar o trigger de inserção/perfil para garantir os padrões iniciais
COMMENT ON COLUMN public.profiles.profile_completion_percent IS 'Indica a porcentagem de completude do perfil progressivo do usuário (0 a 100).';
