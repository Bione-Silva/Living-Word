-- Create devotionals table for daily devotional content (populated by external cron job)
CREATE TABLE public.devotionals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  anchor_verse TEXT NOT NULL DEFAULT '',
  anchor_verse_text TEXT NOT NULL DEFAULT '',
  body_text TEXT NOT NULL DEFAULT '',
  daily_practice TEXT DEFAULT '',
  reflection_question TEXT DEFAULT '',
  closing_prayer TEXT DEFAULT '',
  scheduled_date DATE NOT NULL,
  cover_image_url TEXT,
  audio_url_nova TEXT,
  audio_url_alloy TEXT,
  audio_url_onyx TEXT,
  language TEXT NOT NULL DEFAULT 'PT',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique constraint: one devotional per date per language
CREATE UNIQUE INDEX idx_devotionals_date_lang ON public.devotionals (scheduled_date, language);

-- Index for fast lookup by date
CREATE INDEX idx_devotionals_scheduled_date ON public.devotionals (scheduled_date);

-- Enable RLS
ALTER TABLE public.devotionals ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read devotionals
CREATE POLICY "Authenticated users can view devotionals"
  ON public.devotionals FOR SELECT
  TO authenticated
  USING (true);

-- Service role (cron job) can manage devotionals
CREATE POLICY "Service role can manage devotionals"
  ON public.devotionals FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);