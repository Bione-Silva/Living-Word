-- Migration 014: Fase 1 - Devocional Loop
-- 1. Devotionals table
CREATE TABLE IF NOT EXISTS devotionals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  scheduled_date DATE NOT NULL UNIQUE,
  anchor_verse TEXT NOT NULL,
  anchor_verse_text TEXT NOT NULL,
  body_text TEXT NOT NULL,
  audio_url TEXT,
  audio_duration_seconds INTEGER,
  reflection_question TEXT,
  tts_voice TEXT DEFAULT 'nova',
  tts_generated_at TIMESTAMPTZ,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_devotionals_date ON devotionals(scheduled_date);

-- 2. Devotional Progress
CREATE TABLE IF NOT EXISTS user_devotional_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  devotional_id UUID REFERENCES devotionals(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  listened_audio BOOLEAN DEFAULT FALSE,
  reflection_answer TEXT,
  UNIQUE(user_id, devotional_id)
);

-- 3. Streaks
CREATE TABLE IF NOT EXISTS bible_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Local Bible texts table (for Phase 1 & 2)
CREATE TABLE IF NOT EXISTS bible_texts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  text TEXT NOT NULL,
  translation TEXT NOT NULL CHECK (translation IN ('NVI', 'ARA', 'ACF', 'NTLH')),
  UNIQUE(book, chapter, verse, translation)
);
CREATE INDEX IF NOT EXISTS idx_bible_texts_lookup ON bible_texts(book, chapter, translation);
CREATE INDEX IF NOT EXISTS idx_bible_texts_search ON bible_texts USING gin(to_tsvector('portuguese', text));

-- 5. Emotional Support Logs (O Bom Amigo)
CREATE TABLE IF NOT EXISTS emotional_support_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_input TEXT NOT NULL,
  detected_emotion TEXT,
  anchor_verse TEXT,
  anchor_verse_text TEXT,
  comfort_text TEXT,
  closing_prayer TEXT,
  audio_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_emotional_logs_date ON emotional_support_logs(created_at);

-- Add quiz_score to profiles for the RPC 
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS quiz_score INTEGER DEFAULT 0;

-- RLS Enforcement
ALTER TABLE devotionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devotional_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE bible_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bible_texts ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotional_support_logs ENABLE ROW LEVEL SECURITY;

-- Policies for public reading
DROP POLICY IF EXISTS "devotionals_public_read" ON devotionals;
CREATE POLICY "devotionals_public_read" ON devotionals FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "bible_texts_public_read" ON bible_texts;
CREATE POLICY "bible_texts_public_read" ON bible_texts FOR SELECT USING (true);

-- User Policies (Owner access)
DROP POLICY IF EXISTS "owner_select_dev_progress" ON user_devotional_progress;
DROP POLICY IF EXISTS "owner_insert_dev_progress" ON user_devotional_progress;
DROP POLICY IF EXISTS "owner_update_dev_progress" ON user_devotional_progress;
CREATE POLICY "owner_select_dev_progress" ON user_devotional_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owner_insert_dev_progress" ON user_devotional_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_update_dev_progress" ON user_devotional_progress FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner_select_streaks" ON bible_streaks;
DROP POLICY IF EXISTS "owner_insert_streaks" ON bible_streaks;
DROP POLICY IF EXISTS "owner_update_streaks" ON bible_streaks;
CREATE POLICY "owner_select_streaks" ON bible_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owner_insert_streaks" ON bible_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_update_streaks" ON bible_streaks FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner_select_logs" ON emotional_support_logs;
DROP POLICY IF EXISTS "owner_insert_logs" ON emotional_support_logs;
CREATE POLICY "owner_select_logs" ON emotional_support_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owner_insert_logs" ON emotional_support_logs FOR INSERT WITH CHECK (auth.uid() = user_id);


-- RPC get_user_daily_usage
CREATE OR REPLACE FUNCTION get_user_daily_usage(p_user_id UUID)
RETURNS TABLE (
  generations_today BIGINT,
  credits_remaining INTEGER,
  current_streak INTEGER,
  quiz_score INTEGER,
  devotional_read_today BOOLEAN,
  chapters_read_total BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM credit_transactions_v1
     WHERE user_id = p_user_id
     AND created_at >= CURRENT_DATE)::BIGINT AS generations_today,

    (SELECT COALESCE(p.credits_remaining, 0) FROM profiles p
     WHERE p.id = p_user_id)::INTEGER AS credits_remaining,

    (SELECT COALESCE(bs.current_streak, 0) FROM bible_streaks bs
     WHERE bs.user_id = p_user_id)::INTEGER AS current_streak,

    (SELECT COALESCE(p.quiz_score, 0) FROM profiles p
     WHERE p.id = p_user_id)::INTEGER AS quiz_score,

    EXISTS(SELECT 1 FROM user_devotional_progress udp
      JOIN devotionals d ON d.id = udp.devotional_id
      WHERE udp.user_id = p_user_id
      AND d.scheduled_date = CURRENT_DATE) AS devotional_read_today,

    (0)::BIGINT AS chapters_read_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
