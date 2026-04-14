-- =====================================================
-- 019_fix_materials_schema_for_series.sql
-- Adiciona colunas necessárias para o módulo de Séries de Sermões
-- à tabela materials existente (versão antiga sem title/type/content)
-- =====================================================

-- Adicionar coluna title se não existir
ALTER TABLE public.materials
  ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '';

-- Adicionar coluna type se não existir  
ALTER TABLE public.materials
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'sermon';

-- Adicionar coluna content se não existir
ALTER TABLE public.materials
  ADD COLUMN IF NOT EXISTS content TEXT NOT NULL DEFAULT '';

-- Adicionar coluna language se não existir
ALTER TABLE public.materials
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'PT';

-- Garantir foreign key para profiles (caso a tabela antiga referencie users)
-- ALTER TABLE public.materials
--   ADD CONSTRAINT materials_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Remover restrição CHECK de mode se existir (para permitir series_calendar como type)
ALTER TABLE public.materials DROP CONSTRAINT IF EXISTS materials_type_check;
ALTER TABLE public.materials DROP CONSTRAINT IF EXISTS materials_mode_check;

-- Habilitar RLS se ainda não estiver
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'materials' AND policyname = 'Users can view own materials') THEN
    CREATE POLICY "Users can view own materials" ON public.materials FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'materials' AND policyname = 'Users can insert own materials') THEN
    CREATE POLICY "Users can insert own materials" ON public.materials FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'materials' AND policyname = 'Users can update own materials') THEN
    CREATE POLICY "Users can update own materials" ON public.materials FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'materials' AND policyname = 'Users can delete own materials') THEN
    CREATE POLICY "Users can delete own materials" ON public.materials FOR DELETE USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Índice para busca eficiente por tipo
CREATE INDEX IF NOT EXISTS idx_materials_type ON public.materials(type);
CREATE INDEX IF NOT EXISTS idx_materials_user_type ON public.materials(user_id, type);
