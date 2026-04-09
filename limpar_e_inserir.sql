-- ATENÇÃO: Cole tudo isso no SQL Editor e rode!

-- 1. Vamos apagar TODOS os devocionais de "hoje" que duplicaram e quebraram a tela
DELETE FROM devotionals WHERE scheduled_date = CURRENT_DATE;

-- 2. Agora inserimos UM único devocional corretamente
INSERT INTO devotionals (
  id, title, category, scheduled_date, anchor_verse, anchor_verse_text, 
  body_text, reflection_question, tts_voice, is_published, 
  audio_url_nova, audio_url_alloy, audio_url_onyx
) VALUES (
  gen_random_uuid(),
  'A Plenitude em Tempos de Deserto',
  'Fé',
  CURRENT_DATE, 
  'Isaías 41:10',
  'Por isso não tema, pois estou com você; não tenha medo, pois sou o seu Deus. Eu o fortalecerei e o ajudarei; eu o segurarei com a minha mão direita vitoriosa.',
  'A vida muitas vezes nos surpreende com desafios gigantescos e montanhas que parecem inescaláveis. No entanto, o Deus que desenhou o cosmos é o mesmo que cuida das batidas do seu coração. Em Isaías 41:10, o Senhor diz: "Não temas, pois eu estou contigo". O medo é uma reação natural, mas a fé é a sua reação sobrenatural. Escolha a fé hoje. Que você possa descansar na certeza absoluta de que nenhuma tempestade dura para sempre, mas o amor de Deus é eterno.',
  'Onde você precisa trocar o seu medo pela fé hoje e encontrar a paz no descanso divino?',
  'nova',
  true,
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
);
