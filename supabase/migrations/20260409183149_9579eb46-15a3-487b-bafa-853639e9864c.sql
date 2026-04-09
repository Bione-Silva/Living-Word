-- 1. devotional_engagements
CREATE TABLE public.devotional_engagements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  devotional_id UUID REFERENCES public.devotionals(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('view','like','save','share','complete_reflection')),
  duration_seconds INTEGER DEFAULT 0,
  emotional_response TEXT CHECK (emotional_response IS NULL OR emotional_response IN ('inspired','comforted','challenged','neutral')),
  reflection_text TEXT,
  reflection_sentiment TEXT CHECK (reflection_sentiment IS NULL OR reflection_sentiment IN ('positive','negative','mixed')),
  theme TEXT,
  series_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.devotional_engagements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own engagements" ON public.devotional_engagements FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own engagements" ON public.devotional_engagements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full access engagements" ON public.devotional_engagements FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX idx_engagements_user ON public.devotional_engagements(user_id);
CREATE INDEX idx_engagements_devotional ON public.devotional_engagements(devotional_id);
CREATE INDEX idx_engagements_created ON public.devotional_engagements(created_at);

-- 2. devotional_user_profiles
CREATE TABLE public.devotional_user_profiles (
  user_id UUID NOT NULL PRIMARY KEY,
  favorite_themes JSONB DEFAULT '[]'::jsonb,
  last_devotional_id UUID REFERENCES public.devotionals(id),
  last_devotional_theme TEXT,
  consecutive_days_engaged INTEGER DEFAULT 0,
  average_time_spent INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.devotional_user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own devotional profile" ON public.devotional_user_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own devotional profile" ON public.devotional_user_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own devotional profile" ON public.devotional_user_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role full access dev profiles" ON public.devotional_user_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3. notification_queue
CREATE TABLE public.notification_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('new_devotional','series_milestone','engagement_reminder')),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notification_queue FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role full access notifications" ON public.notification_queue FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX idx_notifications_user ON public.notification_queue(user_id);
CREATE INDEX idx_notifications_scheduled ON public.notification_queue(scheduled_for);

-- 4. Add series columns to existing devotionals
ALTER TABLE public.devotionals ADD COLUMN IF NOT EXISTS series_number INTEGER;
ALTER TABLE public.devotionals ADD COLUMN IF NOT EXISTS series_id UUID;