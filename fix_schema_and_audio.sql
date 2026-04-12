-- 1. Garante que todas as colunas que a Interface do Lovable exige existam no banco
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devotionals' AND column_name = 'daily_practice') THEN
    ALTER TABLE devotionals ADD COLUMN daily_practice TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devotionals' AND column_name = 'audio_url_nova') THEN
    ALTER TABLE devotionals ADD COLUMN audio_url_nova TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devotionals' AND column_name = 'audio_url_alloy') THEN
    ALTER TABLE devotionals ADD COLUMN audio_url_alloy TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devotionals' AND column_name = 'audio_url_onyx') THEN
    ALTER TABLE devotionals ADD COLUMN audio_url_onyx TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devotionals' AND column_name = 'closing_prayer') THEN
    ALTER TABLE devotionals ADD COLUMN closing_prayer TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devotionals' AND column_name = 'language') THEN
    ALTER TABLE devotionals ADD COLUMN language TEXT DEFAULT 'PT';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devotionals' AND column_name = 'audio_duration_seconds') THEN
    ALTER TABLE devotionals ADD COLUMN audio_duration_seconds INTEGER;
  END IF;
END $$;

-- 2. Limpa o dia de hoje
DELETE FROM devotionals WHERE scheduled_date = CURRENT_DATE;

-- 3. Insere o devocional perfeito hoje com todas as colunas validadas!
INSERT INTO devotionals (
  id, title, category, anchor_verse, anchor_verse_text, body_text, daily_practice, reflection_question, closing_prayer, is_published, scheduled_date, audio_duration_seconds, audio_url_nova, audio_url_alloy, audio_url_onyx, language
) VALUES (
  gen_random_uuid(),
  'A Fidelidade de Deus nas Provações',
  'Esperança',
  'Lamentações 3:22-23',
  'As misericórdias do Senhor são a causa de não sermos consumidos; porque as suas misericórdias não têm fim. Novas são cada manhã; grande é a tua fidelidade.',
  'Há momentos na vida em que tudo parece desmoronar. A pressão aumenta, as dúvidas surgem e a esperança parece escorrer. É exatamente nesses momentos escuros que a luz da palavra de Deus brilha com maior intensidade... 

A fidelidade de Deus não depende das nossas circunstâncias. Ela é uma rocha inabalável. Suas misericórdias se renovam não apenas de vez em quando, mas a cada manhã.',
  'Hoje, quando uma preocupação surgir, pare por 1 minuto e agradeça a Deus por uma misericórdia específica que você vivenciou esta manhã.',
  'Onde você tem mantido o seu foco durante as tempestades? Nos problemas ou naquele que acalma o mar?',
  'Deus Pai, perdoa-me por tantas vezes duvidar do Seu cuidado quando as provações chegam. Ajuda-me a lembrar que Suas misericórdias são novas todos os dias. Em nome de Jesus, amém.',
  true,
  CURRENT_DATE,
  128,
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  'PT'
);
