-- Migration to add multiple audio options for Devocional
ALTER TABLE devotionals
ADD COLUMN IF NOT EXISTS audio_url_nova TEXT,
ADD COLUMN IF NOT EXISTS audio_url_alloy TEXT,
ADD COLUMN IF NOT EXISTS audio_url_onyx TEXT;
