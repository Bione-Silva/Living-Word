-- ============================================================
-- LW: Complemento de Módulo 2 — O Bom Amigo
-- Adiciona suporte a histórico de conversas (Sessão) e Feedback
-- Data: 2026-04-08
-- ============================================================

-- Primeiro, criar a tabela de sessões para gerenciar a continuidade da conversa
CREATE TABLE IF NOT EXISTS public.emotional_support_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT, -- título gerado automaticamente para o histórico
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alterar a tabela existente emotional_support_logs para incluir suporte à sessão e feedback
ALTER TABLE public.emotional_support_logs
  ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.emotional_support_sessions(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'assistant')), -- Define se foi entrada do usuário ou resposta da IA
  ADD COLUMN IF NOT EXISTS feedback_emoji TEXT CHECK (feedback_emoji IN ('like', 'heart', 'pray', 'dislike')); -- Chips de feedback (👍💛🙏)

-- RLS Enforcement
ALTER TABLE public.emotional_support_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_can_manage_emotional_sessions" ON public.emotional_support_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Criação do índice para facilitar queries de chat timeline
CREATE INDEX IF NOT EXISTS idx_emotional_logs_session 
  ON public.emotional_support_logs(session_id, created_at);

-- Função de Trigger para o updated_at da sessão
CREATE TRIGGER set_emotional_sessions_updated_at
BEFORE UPDATE ON public.emotional_support_sessions
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

GRANT ALL ON public.emotional_support_sessions TO authenticated;
