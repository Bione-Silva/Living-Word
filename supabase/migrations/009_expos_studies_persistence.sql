-- Supabase Migration: 009_expos_studies_persistence.sql
-- Description: Criação da tabela para armazenar os estudos teológicos gerados pelo método E.X.P.O.S.

CREATE TABLE IF NOT EXISTS public.expos_studies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    passagem TEXT NOT NULL,
    formato TEXT NOT NULL CHECK (formato IN ('individual', 'celula', 'classe', 'discipulado', 'sermao')),
    idioma TEXT DEFAULT 'pt-BR',
    conteudo_markdown TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar a segurança de linha (Row Level Security - RLS)
ALTER TABLE public.expos_studies ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
-- O usuário pode selecionar (ver) apenas seus próprios estudos gerados
CREATE POLICY "Usuários podem ver seus próprios estudos" ON public.expos_studies
    FOR SELECT USING (auth.uid() = user_id);

-- O usuário pode inserir seus próprios estudos (quando recebem a de volta da Edge Function)
CREATE POLICY "Usuários podem criar seus próprios estudos" ON public.expos_studies
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- O usuário pode atualizar seus próprios estudos (adicionar anotações em cima)
CREATE POLICY "Usuários podem atualizar seus próprios estudos" ON public.expos_studies
    FOR UPDATE USING (auth.uid() = user_id);

-- O usuário pode deletar seus próprios estudos
CREATE POLICY "Usuários podem deletar seus próprios estudos" ON public.expos_studies
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger de atualização de updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.expos_studies
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
