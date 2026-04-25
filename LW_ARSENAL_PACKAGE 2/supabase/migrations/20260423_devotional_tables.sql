-- ══════════════════════════════════════════════════════════════════
-- Living Word — Devotional System Tables
-- Migration: 20260423_devotional_tables.sql
-- ══════════════════════════════════════════════════════════════════

-- Calendar: controls which theme/series is active each month
CREATE TABLE IF NOT EXISTS devotional_calendar (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mes          text NOT NULL,          -- "2026-04"
  tema_mes     text NOT NULL,          -- "fidelidade-confianca"
  serie_ativa  text,                   -- slug da série
  dia_serie    int DEFAULT 1,
  created_at   timestamptz DEFAULT now()
);

-- Saved devotionals per user
CREATE TABLE IF NOT EXISTS devotionals (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  modo             text NOT NULL CHECK (modo IN ('palavra_amiga', 'profundo')),
  data             date NOT NULL DEFAULT CURRENT_DATE,
  serie_tema       text,
  dia_serie        int,
  total_dias       int,
  conteudo_pt_br   jsonb NOT NULL,
  conteudo_en      jsonb,
  conteudo_es      jsonb,
  audio_url_pt_br  text,
  audio_url_en     text,
  audio_url_es     text,
  versao_biblica   text DEFAULT 'NVI',
  favorito         boolean DEFAULT false,
  lido_em          timestamptz,
  audio_ouvido_em  timestamptz,
  tokens_used      int DEFAULT 0,
  created_at       timestamptz DEFAULT now()
);

-- Index for fast user+date lookups
CREATE INDEX IF NOT EXISTS idx_devotionals_user_date
  ON devotionals(user_id, data DESC);

CREATE INDEX IF NOT EXISTS idx_devotionals_serie
  ON devotionals(user_id, serie_tema, dia_serie);

-- User preferences (devotional-specific)
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS versao_biblica     text DEFAULT 'NVI',
  ADD COLUMN IF NOT EXISTS idioma_preferido   text DEFAULT 'pt_br',
  ADD COLUMN IF NOT EXISTS nivel_teologico    text DEFAULT 'geral'
    CHECK (nivel_teologico IN ('geral', 'avancado')),
  ADD COLUMN IF NOT EXISTS modo_devocional    text DEFAULT 'palavra_amiga'
    CHECK (modo_devocional IN ('palavra_amiga', 'profundo')),
  ADD COLUMN IF NOT EXISTS horario_devocional time DEFAULT '06:00:00',
  ADD COLUMN IF NOT EXISTS notificacao_push   boolean DEFAULT true;

-- Streaks and progress
CREATE TABLE IF NOT EXISTS devotional_streaks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  streak_atual  int DEFAULT 0,
  streak_max    int DEFAULT 0,
  ultima_leitura date,
  total_lidos   int DEFAULT 0,
  updated_at    timestamptz DEFAULT now()
);

-- RLS Policies
ALTER TABLE devotionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE devotional_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own devotionals"
  ON devotionals FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own streaks"
  ON devotional_streaks FOR ALL
  USING (auth.uid() = user_id);

-- Function: update streak when devotional is marked as read
CREATE OR REPLACE FUNCTION update_devotional_streak(p_user_id uuid)
RETURNS void AS $$
DECLARE
  v_last_date date;
  v_streak    int;
BEGIN
  SELECT ultima_leitura, streak_atual
    INTO v_last_date, v_streak
    FROM devotional_streaks
   WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO devotional_streaks (user_id, streak_atual, streak_max, ultima_leitura, total_lidos)
    VALUES (p_user_id, 1, 1, CURRENT_DATE, 1);
    RETURN;
  END IF;

  IF v_last_date = CURRENT_DATE - 1 THEN
    -- Consecutive day
    v_streak := v_streak + 1;
  ELSIF v_last_date < CURRENT_DATE - 1 THEN
    -- Streak broken
    v_streak := 1;
  END IF;
  -- Same day = no change to streak

  UPDATE devotional_streaks SET
    streak_atual  = v_streak,
    streak_max    = GREATEST(streak_max, v_streak),
    ultima_leitura = CURRENT_DATE,
    total_lidos   = total_lidos + 1,
    updated_at    = now()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Storage bucket for audio
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio', 'audio', true)
ON CONFLICT (id) DO NOTHING;

-- Comments
COMMENT ON TABLE devotionals IS 'Generated devotionals per user — texto + audio';
COMMENT ON TABLE devotional_streaks IS 'Tracks daily reading streaks';
COMMENT ON TABLE devotional_calendar IS 'Monthly theme and active series control';
