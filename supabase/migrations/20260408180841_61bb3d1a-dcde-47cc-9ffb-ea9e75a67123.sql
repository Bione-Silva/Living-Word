
-- Bible Favorites
CREATE TABLE public.bible_favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  book_id text NOT NULL,
  chapter_number integer NOT NULL,
  verse_number integer NOT NULL,
  verse_text text NOT NULL DEFAULT '',
  translation_code text NOT NULL DEFAULT 'almeida',
  language text NOT NULL DEFAULT 'PT',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.bible_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites" ON public.bible_favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own favorites" ON public.bible_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON public.bible_favorites FOR DELETE USING (auth.uid() = user_id);

CREATE UNIQUE INDEX idx_bible_favorites_unique ON public.bible_favorites (user_id, book_id, chapter_number, verse_number, translation_code);

-- Bible Notes
CREATE TABLE public.bible_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  book_id text NOT NULL,
  chapter_number integer NOT NULL,
  verse_number integer NOT NULL,
  note_text text NOT NULL DEFAULT '',
  translation_code text NOT NULL DEFAULT 'almeida',
  language text NOT NULL DEFAULT 'PT',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.bible_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notes" ON public.bible_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notes" ON public.bible_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes" ON public.bible_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON public.bible_notes FOR DELETE USING (auth.uid() = user_id);

-- Quiz Sessions
CREATE TABLE public.quiz_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  category text NOT NULL DEFAULT 'general',
  score integer NOT NULL DEFAULT 0,
  total_questions integer NOT NULL DEFAULT 10,
  correct_answers integer NOT NULL DEFAULT 0,
  xp_earned integer NOT NULL DEFAULT 0,
  time_seconds integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quiz sessions" ON public.quiz_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quiz sessions" ON public.quiz_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated can view for ranking" ON public.quiz_sessions FOR SELECT TO authenticated USING (true);

-- Quiz Scores (accumulated)
CREATE TABLE public.quiz_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  total_xp integer NOT NULL DEFAULT 0,
  games_played integer NOT NULL DEFAULT 0,
  best_streak integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view all scores" ON public.quiz_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own score" ON public.quiz_scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own score" ON public.quiz_scores FOR UPDATE USING (auth.uid() = user_id);
