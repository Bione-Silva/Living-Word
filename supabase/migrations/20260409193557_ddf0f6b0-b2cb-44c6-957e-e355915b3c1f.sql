
-- Likes table
CREATE TABLE public.devotional_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  devotional_id UUID NOT NULL REFERENCES public.devotionals(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, devotional_id)
);

ALTER TABLE public.devotional_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all likes" ON public.devotional_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own likes" ON public.devotional_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON public.devotional_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_devotional_likes_devotional ON public.devotional_likes(devotional_id);

-- Comments table
CREATE TABLE public.devotional_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  devotional_id UUID NOT NULL REFERENCES public.devotionals(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.devotional_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all comments" ON public.devotional_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own comments" ON public.devotional_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.devotional_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_devotional_comments_devotional ON public.devotional_comments(devotional_id);
