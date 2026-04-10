
CREATE TABLE public.sermon_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
  session_id TEXT,
  content TEXT NOT NULL DEFAULT '',
  text_color TEXT NOT NULL DEFAULT '#374151',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT sermon_notes_unique_material UNIQUE (user_id, material_id),
  CONSTRAINT sermon_notes_unique_session UNIQUE (user_id, session_id),
  CONSTRAINT sermon_notes_has_ref CHECK (material_id IS NOT NULL OR session_id IS NOT NULL)
);

ALTER TABLE public.sermon_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sermon notes"
  ON public.sermon_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sermon notes"
  ON public.sermon_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sermon notes"
  ON public.sermon_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sermon notes"
  ON public.sermon_notes FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_sermon_notes_updated_at
  BEFORE UPDATE ON public.sermon_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_bible_highlights_updated_at();
