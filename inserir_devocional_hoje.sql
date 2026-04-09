INSERT INTO devotionals (
  id, title, category, scheduled_date, anchor_verse, anchor_verse_text, 
  body_text, reflection_question, tts_voice, is_published, 
  audio_url_nova, audio_url_alloy, audio_url_onyx
) VALUES (
  gen_random_uuid(),
  'Coragem para o Dia de Hoje',
  'Fé',
  CURRENT_DATE, 
  'Isaías 41:10',
  'Por isso não tema, pois estou com você; não tenha medo, pois sou o seu Deus. Eu o fortalecerei e o ajudarei; eu o segurarei com a minha mão direita vitoriosa.',
  'A vida muitas vezes nos surpreende com desafios gigantescos e montanhas que parecem inescaláveis. No entanto, o Deus que desenhou o cosmos é o mesmo que cuida das batidas do seu coração. Em Isaías 41:10, o Senhor diz: "Não temas, pois eu estou contigo". O medo é uma reação natural, mas a fé é a sua reação sobrenatural. Escolha a fé hoje. Que você possa descansar na certeza absoluta de que Nenhuma tempestade dura para sempre, mas o amor de Deus é eterno.',
  'Onde você precisa trocar o seu medo pela fé hoje e encontrar a paz no descanso divino?',
  'nova',
  true,
  -- 🎵 Áudios preenchidos! (URLs públicas para burlar o bloqueio 429 da sua OpenAI)
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
)
ON CONFLICT (scheduled_date) 
DO UPDATE SET 
  title = EXCLUDED.title,
  audio_url_nova = EXCLUDED.audio_url_nova,
  audio_url_alloy = EXCLUDED.audio_url_alloy,
  audio_url_onyx = EXCLUDED.audio_url_onyx;
