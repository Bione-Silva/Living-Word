-- ============================================================
-- LIVING WORD — Migração Inicial v1.0
-- Banco completo: tabelas, índices, RLS, triggers, extensões
-- ============================================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;  -- pgvector para RAG bíblico

-- =============================================
-- TABELA: users (extensão do auth.users)
-- =============================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pastoral','church','ministry')),
  language_preference TEXT NOT NULL DEFAULT 'PT' CHECK (language_preference IN ('PT','EN','ES')),
  doctrine_preference TEXT DEFAULT 'evangelical_general',
  pastoral_voice TEXT DEFAULT 'welcoming',
  bible_version TEXT DEFAULT 'ARA',
  generation_count_month INTEGER NOT NULL DEFAULT 0,
  generation_reset_date DATE NOT NULL DEFAULT date_trunc('month', NOW()),
  blog_url TEXT,
  handle TEXT UNIQUE,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABELA: user_editorial_profile
-- =============================================
CREATE TABLE public.user_editorial_profile (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tone TEXT DEFAULT 'welcoming',
  depth TEXT DEFAULT 'intermediate' CHECK (depth IN ('introductory','intermediate','deep')),
  writing_style TEXT DEFAULT 'narrative',
  preferred_length TEXT DEFAULT 'medium' CHECK (preferred_length IN ('short','medium','long')),
  publish_frequency TEXT DEFAULT 'weekly',
  priority_themes TEXT[] DEFAULT '{}',
  active_sites JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABELA: materials
-- =============================================
CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('pastoral','blog','devotional','evangelistic','series')),
  language TEXT NOT NULL CHECK (language IN ('PT','EN','ES')),
  bible_passage TEXT,
  audience TEXT,
  pain_point TEXT,
  doctrine_line TEXT,
  pastoral_voice TEXT,
  bible_version TEXT,
  category TEXT,
  -- Frente A (Estúdio Pastoral)
  output_sermon TEXT,
  output_outline TEXT,
  output_devotional TEXT,
  output_reels JSONB,
  output_bilingual TEXT,
  output_cell TEXT,
  -- Frente B (Motor de Conteúdo)
  output_blog TEXT,
  article_title TEXT,
  meta_description TEXT,
  seo_slug TEXT,
  tags TEXT[],
  word_count INTEGER,
  -- Auditoria teológica
  theology_layer_marked BOOLEAN DEFAULT FALSE,
  citation_audit JSONB DEFAULT '{}',
  sensitive_topic_detected TEXT,
  generation_time_ms INTEGER,
  -- Publicação
  is_published BOOLEAN DEFAULT FALSE,
  published_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABELA: editorial_queue
-- =============================================
CREATE TABLE public.editorial_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  target_site_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','review','scheduled','published','archived')),
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  published_url TEXT,
  wp_post_id INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABELA: series
-- =============================================
CREATE TABLE public.series (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  theme TEXT,
  passages TEXT[] DEFAULT '{}',
  total_weeks INTEGER DEFAULT 4,
  language TEXT DEFAULT 'PT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABELA: library_tags
-- =============================================
CREATE TABLE public.library_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  tag TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABELA: generation_logs (billing + observabilidade)
-- =============================================
CREATE TABLE public.generation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  material_id UUID REFERENCES public.materials(id),
  language TEXT,
  mode TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  generation_time_ms INTEGER,
  llm_model TEXT DEFAULT 'gpt-4o-mini',
  theology_guardrails_triggered BOOLEAN DEFAULT FALSE,
  sensitive_topic_detected TEXT,
  error_code TEXT,
  cost_usd NUMERIC(10,8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABELA: admin_cost_snapshot
-- =============================================
CREATE TABLE public.admin_cost_snapshot (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  snapshot_date DATE NOT NULL UNIQUE,
  users_free INTEGER DEFAULT 0,
  users_pastoral INTEGER DEFAULT 0,
  users_church INTEGER DEFAULT 0,
  users_ministry INTEGER DEFAULT 0,
  total_mrr NUMERIC(10,2) DEFAULT 0,
  total_api_cost NUMERIC(10,4) DEFAULT 0,
  total_margin NUMERIC(10,2) DEFAULT 0,
  tokens_input_total BIGINT DEFAULT 0,
  tokens_output_total BIGINT DEFAULT 0,
  conversion_rate_free_to_paid NUMERIC(5,4) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABELA: conversion_events (analytics de conversão)
-- Rastreia os 7 gatilhos de upgrade da Conversion Strategy
-- =============================================
CREATE TABLE public.conversion_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'upgrade_cta_shown', 'upgrade_cta_clicked', 
    'trial_started', 'plan_upgraded', 'trial_expired'
  )),
  trigger_name TEXT CHECK (trigger_name IN (
    'generation_4of5', 'locked_tab_click', 'voice_blocked',
    'blog_limit', 'watermark_shame', 'library_archived', 'email_day25'
  )),
  user_type TEXT CHECK (user_type IN ('pastor', 'influencer', 'leader')),
  plan_from TEXT,
  plan_to TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversion_events_user ON public.conversion_events(user_id, created_at DESC);
CREATE INDEX idx_conversion_events_trigger ON public.conversion_events(trigger_name, event_type);

-- =============================================
-- TABELA: bible_commentary_embeddings (RAG Bíblico)
-- =============================================
CREATE TABLE public.bible_commentary_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse_start INTEGER NOT NULL,
  verse_end INTEGER,
  source TEXT NOT NULL,  -- ex: 'Matthew Henry', 'John Calvin', 'Warren Wiersbe'
  language TEXT NOT NULL DEFAULT 'EN',
  commentary_text TEXT NOT NULL,
  embedding vector(1536),  -- OpenAI text-embedding-3-small
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- ÍNDICES
-- =============================================
CREATE INDEX idx_materials_user_id ON public.materials(user_id);
CREATE INDEX idx_materials_created_at ON public.materials(created_at DESC);
CREATE INDEX idx_editorial_queue_user_status ON public.editorial_queue(user_id, status);
CREATE INDEX idx_generation_logs_user_date ON public.generation_logs(user_id, created_at DESC);
CREATE INDEX idx_generation_logs_cost ON public.generation_logs(cost_usd);
CREATE INDEX idx_commentary_book_chapter ON public.bible_commentary_embeddings(book, chapter);

-- =============================================
-- RLS — ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_editorial_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editorial_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_cost_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bible_commentary_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversion_events ENABLE ROW LEVEL SECURITY;

-- Políticas: usuário acessa apenas seus próprios dados
CREATE POLICY "users_own" ON public.users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "profile_own" ON public.user_editorial_profile
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "materials_own" ON public.materials
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "queue_own" ON public.editorial_queue
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "series_own" ON public.series
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "tags_own" ON public.library_tags
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "logs_own" ON public.generation_logs
  FOR ALL USING (auth.uid() = user_id);

-- admin_cost_snapshot: apenas service_role (painel admin)
CREATE POLICY "admin_only" ON public.admin_cost_snapshot
  FOR ALL USING (auth.role() = 'service_role');

-- bible_commentary_embeddings: leitura pública (dados open-source)
CREATE POLICY "commentary_read" ON public.bible_commentary_embeddings
  FOR SELECT USING (true);

-- conversion_events: usuário vê seus próprios; admin insere via service_role
CREATE POLICY "conversion_own" ON public.conversion_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "conversion_insert_service" ON public.conversion_events
  FOR INSERT WITH CHECK (true);

-- =============================================
-- TRIGGER: criar users row ao registrar
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, language_preference)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'language', 'PT')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- TRIGGER: reset mensal de gerações
-- =============================================
CREATE OR REPLACE FUNCTION public.reset_monthly_generations()
RETURNS void AS $$
UPDATE public.users
SET generation_count_month = 0,
    generation_reset_date = date_trunc('month', NOW())
WHERE generation_reset_date < date_trunc('month', NOW());
$$ LANGUAGE sql SECURITY DEFINER;

-- =============================================
-- FUNCTION: buscar comentários por similaridade (RAG)
-- =============================================
CREATE OR REPLACE FUNCTION public.match_commentary(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  filter_book text DEFAULT NULL,
  filter_chapter int DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  book text,
  chapter int,
  verse_start int,
  source text,
  commentary_text text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    bce.id,
    bce.book,
    bce.chapter,
    bce.verse_start,
    bce.source,
    bce.commentary_text,
    1 - (bce.embedding <=> query_embedding) AS similarity
  FROM public.bible_commentary_embeddings bce
  WHERE 1 - (bce.embedding <=> query_embedding) > match_threshold
    AND (filter_book IS NULL OR bce.book = filter_book)
    AND (filter_chapter IS NULL OR bce.chapter = filter_chapter)
  ORDER BY bce.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
