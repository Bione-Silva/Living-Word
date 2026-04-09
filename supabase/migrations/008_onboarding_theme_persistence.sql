-- 008_onboarding_theme_persistence.sql
-- Adiciona colunas de personalização de layout no perfil editorial

ALTER TABLE public.user_editorial_profile
ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT '#2d3748',
ADD COLUMN IF NOT EXISTS font_family TEXT DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS layout_style TEXT DEFAULT 'modern';

-- Optional: Comments for documentation
COMMENT ON COLUMN public.user_editorial_profile.theme_color IS 'A cor primária selecionada no Wizard de Onboarding';
COMMENT ON COLUMN public.user_editorial_profile.font_family IS 'A fonte principal selecionada no Wizard de Onboarding';
COMMENT ON COLUMN public.user_editorial_profile.layout_style IS 'O estilo estrutural do layout selecionado no Wizard de Onboarding';
