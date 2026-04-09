-- ============================================================
-- LW: Complemento de Migração — Kids, Cover Image, PWA
-- Data: 2026-04-08
-- Complementa a mega_migration com as tabelas/colunas
-- identificadas no mapeamento do Zeal Pro
-- ============================================================

-- 1. KIDS STORIES
CREATE TABLE IF NOT EXISTS public.kids_stories (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_name  TEXT NOT NULL,
  title           TEXT NOT NULL,
  story_text      TEXT NOT NULL,
  lesson          TEXT NOT NULL,
  image_url       TEXT, -- URL da imagem IA gerada (DALL-E 3)
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.kids_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kids_stories_owner" ON public.kids_stories
  FOR ALL USING (auth.uid() = user_id);

-- 2. COLUNA cover_image_url NA TABELA DEVOTIONALS (se ainda não existe)
ALTER TABLE public.devotionals ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- 3. JOURNALING PESSOAL DO DEVOCIONAL
CREATE TABLE IF NOT EXISTS public.devotional_journals (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  devotional_id   UUID NOT NULL REFERENCES public.devotionals(id) ON DELETE CASCADE,
  journal_text    TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.devotional_journals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "journals_owner" ON public.devotional_journals
  FOR ALL USING (auth.uid() = user_id);

-- Unique: 1 journal por usuário por devocional
CREATE UNIQUE INDEX IF NOT EXISTS idx_journal_user_devotional
  ON public.devotional_journals(user_id, devotional_id);

-- 4. QUIZ: BÔNUS DIÁRIO (para o calendário de XP)
CREATE TABLE IF NOT EXISTS public.quiz_daily_bonus (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bonus_date      DATE NOT NULL,
  day_streak      INT NOT NULL DEFAULT 1,  -- 1 a 7
  xp_earned       INT NOT NULL DEFAULT 10,
  claimed_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.quiz_daily_bonus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quiz_bonus_owner" ON public.quiz_daily_bonus
  FOR ALL USING (auth.uid() = user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_quiz_bonus_user_date
  ON public.quiz_daily_bonus(user_id, bonus_date);

-- 5. BÍBLIA: FAVORITOS (versículos favoritos)
CREATE TABLE IF NOT EXISTS public.bible_favorites (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_name       TEXT NOT NULL,
  chapter         INT NOT NULL,
  verse           INT NOT NULL,
  verse_text      TEXT NOT NULL,
  translation     TEXT DEFAULT 'NVI',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bible_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favorites_owner" ON public.bible_favorites
  FOR ALL USING (auth.uid() = user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_user_verse
  ON public.bible_favorites(user_id, book_name, chapter, verse, translation);

-- 6. BÍBLIA: CAPÍTULOS LIDOS (para o Progress Bar de 0/1189)
CREATE TABLE IF NOT EXISTS public.bible_chapters_read (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_name       TEXT NOT NULL,
  chapter         INT NOT NULL,
  translation     TEXT DEFAULT 'NVI',
  read_at         TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bible_chapters_read ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chapters_read_owner" ON public.bible_chapters_read
  FOR ALL USING (auth.uid() = user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_chapters_read_user_book_ch
  ON public.bible_chapters_read(user_id, book_name, chapter, translation);

-- 7. PWA: PUSH NOTIFICATION SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint        TEXT NOT NULL,
  p256dh          TEXT NOT NULL,
  auth_key        TEXT NOT NULL,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_subscriptions_owner" ON public.push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_push_endpoint
  ON public.push_subscriptions(user_id, endpoint);

-- CONCEDER PERMISSÕES
GRANT ALL ON public.kids_stories TO authenticated;
GRANT ALL ON public.devotional_journals TO authenticated;
GRANT ALL ON public.quiz_daily_bonus TO authenticated;
GRANT ALL ON public.bible_favorites TO authenticated;
GRANT ALL ON public.bible_chapters_read TO authenticated;
GRANT ALL ON public.push_subscriptions TO authenticated;
