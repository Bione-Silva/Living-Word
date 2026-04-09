-- Etapa 1 do Backend: Tabelas Mestre para Bíblia e Gamificação
-- Criação de tabelas, RLS e Triggers

-------------------------------------------------------------------------------
-- 0. EXTENSÕES e ENUMS ADICIONAIS
-------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-------------------------------------------------------------------------------
-- 1. MOTOR BÍBLICO (BIBLE ENGINE)
-------------------------------------------------------------------------------

-- 1.1 Tabela Mestre de Versículos Bíblicos (Locais)
CREATE TABLE IF NOT EXISTS public.bible_verses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_name TEXT NOT NULL,         -- ex: Genesis
    book_abbreviation TEXT NOT NULL, -- ex: GN
    chapter INTEGER NOT NULL,        -- ex: 1
    verse INTEGER NOT NULL,          -- ex: 1
    text TEXT NOT NULL,              -- Texto do versículo
    translation TEXT NOT NULL DEFAULT 'ARA', -- Versão da Bíblia (ARA, NVI, ACF)
    testament TEXT NOT NULL CHECK (testament IN ('AT', 'NT'))
);
-- Índice para busca rápida de versículos
CREATE INDEX IF NOT EXISTS idx_bible_verses_lookup ON public.bible_verses(book_abbreviation, chapter, verse, translation);
CREATE INDEX IF NOT EXISTS idx_bible_verses_text_search ON public.bible_verses USING gin(to_tsvector('portuguese', text));

-- 1.2 Grifos e Marcações de Texto (Highlights)
CREATE TABLE IF NOT EXISTS public.bible_highlights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bible_verse_id UUID NOT NULL REFERENCES public.bible_verses(id) ON DELETE CASCADE,
    color_code TEXT NOT NULL DEFAULT '#E6DCC3', -- Hex color do grifo (ex: creme)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.3 Anotações Bíblicas Interativas
CREATE TABLE IF NOT EXISTS public.bible_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bible_verse_id UUID NOT NULL REFERENCES public.bible_verses(id) ON DELETE CASCADE,
    note_text TEXT NOT NULL,
    is_private BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.4 Progresso de Planos de Leitura
CREATE TABLE IF NOT EXISTS public.bible_plan_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL, -- Ex: '30_days', '90_days', '365_days'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 1.5 Controle de Capítulos Lidos Específicos (para barra de progresso)
CREATE TABLE IF NOT EXISTS public.bible_chapters_read (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    book_abbreviation TEXT NOT NULL,
    chapter INTEGER NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, book_abbreviation, chapter) -- Evita contar duas vezes o mesmo capítulo
);


-------------------------------------------------------------------------------
-- 2. PREGAÇÕES & STUDIOS
-------------------------------------------------------------------------------

-- 2.1 Pregações Salvas (Sermons Wizard)
CREATE TABLE IF NOT EXISTS public.sermons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    theme TEXT NOT NULL,
    target_audience TEXT,
    tone TEXT,
    duration TEXT,
    content_markdown TEXT NOT NULL,
    prompt_used TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.2 Geração de Artes (Living Word Studio)
CREATE TABLE IF NOT EXISTS public.biblical_art_generations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    prompt_text TEXT NOT NULL,
    image_url TEXT NOT NULL,
    resolution TEXT NOT NULL,
    aspect_ratio TEXT NOT NULL, -- Ex: '16:9', '9:16', '1:1'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-------------------------------------------------------------------------------
-- 3. GAMIFICAÇÃO & DESAFIOS (QUIZ ENGINE)
-------------------------------------------------------------------------------

-- 3.1 Tabela de Questões Mestre (Acervo do Quiz)
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    category TEXT NOT NULL CHECK (category IN ('old_testament', 'new_testament', 'prophets', 'gospels', 'heroes')),
    question_text TEXT NOT NULL,
    options JSONB NOT NULL, -- ex: ["A", "B", "C", "D"]
    correct_option_index INTEGER NOT NULL,
    explanation TEXT,
    points INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3.2 Sessões de Jogo e Placares de Usuário
CREATE TABLE IF NOT EXISTS public.quiz_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_score INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    wrong_answers INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    finished_at TIMESTAMP WITH TIME ZONE
);

-- 3.3 Desafios Diários (Daily Streaks integrados)
CREATE TABLE IF NOT EXISTS public.daily_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_date DATE UNIQUE NOT NULL,
    task_type TEXT NOT NULL, -- ex: 'read_chapter', 'complete_quiz', 'share_verse'
    reward_points INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-------------------------------------------------------------------------------
-- 4. SEGURANÇA DE NÍVEL DE LINHA (RLS - Row Level Security)
-------------------------------------------------------------------------------

-- Ativando RLS nas tabelas
ALTER TABLE public.bible_verses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bible_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bible_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bible_plan_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bible_chapters_read ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sermons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biblical_art_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS de Leitura Pública (Acesso Livre para Select)
CREATE POLICY "Livre acesso leitura para versiculos" ON public.bible_verses FOR SELECT USING (true);
CREATE POLICY "Livre acesso leitura questoes" ON public.quiz_questions FOR SELECT USING (true);
CREATE POLICY "Livre acesso leitura desafios" ON public.daily_challenges FOR SELECT USING (true);

-- Políticas RLS estritas (Somente o Dono e para Edição)
CREATE POLICY "Users can only view their own highlights" ON public.bible_highlights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own highlights" ON public.bible_highlights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own highlights" ON public.bible_highlights FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own notes" ON public.bible_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own notes" ON public.bible_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notes" ON public.bible_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notes" ON public.bible_notes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own plans" ON public.bible_plan_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own plans" ON public.bible_plan_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own plans" ON public.bible_plan_progress FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view and edit own chapters" ON public.bible_chapters_read FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view and edit own sermons" ON public.sermons FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view and edit own art" ON public.biblical_art_generations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view and edit own quiz sessions" ON public.quiz_sessions FOR ALL USING (auth.uid() = user_id);

-------------------------------------------------------------------------------
-- 5. FUNCTION BÁSICA DE TRIGGERS
-------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_bible_notes_updated_at
BEFORE UPDATE ON public.bible_notes
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();
