CREATE TABLE public.bible_highlights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  book_id TEXT NOT NULL,
  chapter_number INTEGER NOT NULL,
  start_verse_number INTEGER NOT NULL,
  start_char_offset INTEGER NOT NULL DEFAULT 0,
  end_verse_number INTEGER NOT NULL,
  end_char_offset INTEGER NOT NULL DEFAULT 0,
  selected_text TEXT NOT NULL,
  color_key TEXT NOT NULL,
  language TEXT NOT NULL,
  translation_code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bible_highlights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bible highlights"
ON public.bible_highlights
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bible highlights"
ON public.bible_highlights
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bible highlights"
ON public.bible_highlights
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bible highlights"
ON public.bible_highlights
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_bible_highlights_user_chapter
  ON public.bible_highlights (user_id, book_id, chapter_number);

CREATE INDEX idx_bible_highlights_user_language
  ON public.bible_highlights (user_id, language, translation_code);

CREATE OR REPLACE FUNCTION public.update_bible_highlights_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_bible_highlights_updated_at_trigger
BEFORE UPDATE ON public.bible_highlights
FOR EACH ROW
EXECUTE FUNCTION public.update_bible_highlights_updated_at();