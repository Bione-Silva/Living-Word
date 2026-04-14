-- ============================================================
-- EXECUTE NO SUPABASE SQL EDITOR
-- Dashboard → SQL Editor → New Query → cole tudo → Run
-- ============================================================

-- 1. Adicionar colunas que o novo módulo de Séries precisa
ALTER TABLE public.materials
  ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS type  TEXT NOT NULL DEFAULT 'sermon',
  ADD COLUMN IF NOT EXISTS content TEXT NOT NULL DEFAULT '';

-- 2. Remover constraints antigas de CHECK que bloqueiam 'series_calendar'
ALTER TABLE public.materials DROP CONSTRAINT IF EXISTS materials_type_check;
ALTER TABLE public.materials DROP CONSTRAINT IF EXISTS materials_mode_check;

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_materials_type      ON public.materials(type);
CREATE INDEX IF NOT EXISTS idx_materials_user_type ON public.materials(user_id, type);

-- 4. Inserir as 4 séries das Mentes Brilhantes na conta master
-- (bx4usa@gmail.com / 945f6c31-52a1-46a5-91f9-ed1954c3ae06)

INSERT INTO public.materials (user_id, title, type, content, language) VALUES

('945f6c31-52a1-46a5-91f9-ed1954c3ae06',
 'Série: O Tesouro da Graça (Spurgeon)',
 'series_calendar',
 '{"title":"Série: O Tesouro da Graça (Spurgeon)","theme":"Charles Spurgeon — Pregação Poética e Puritana","overview":"Uma exploração da graça soberana de Deus sob a perspectiva do Príncipe dos Pregadores. Cada semana mergulhamos na poesia vitoriana e na profundidade teológica de Spurgeon para entender como a graça nos atrai, nos justifica e nos sustenta até o fim.","weeks":[{"week_number":1,"title":"O Chamado Soberano","overview":"Como a graça de Deus nos encontra antes mesmo de a buscarmos. O chamado irresistível que aquece a alma e produz fé genuína.","texts":["Salmo 34:8","João 6:44","Efésios 2:8-9"],"topics":["Graça Soberana","Chamado Eficaz","Eleição"]},{"week_number":2,"title":"Justificados pelo Sangue","overview":"A certeza inabalável da nossa paz com Deus fundamentada unicamente no sacrifício substitutivo de Cristo na cruz do Calvário. Nada mais, nada menos.","texts":["Romanos 5:1","Isaías 53:5","1 Pedro 2:24"],"topics":["Justificação","Expiação","Paz com Deus"]},{"week_number":3,"title":"O Incenso da Oração","overview":"O privilégio do crente de entrar no Santo dos Santos e derramar sua alma diante do trono da graça com ousadia e confiança filial.","texts":["Tiago 5:16","Hebreus 4:16","Lucas 18:1"],"topics":["Intercessão","Ousadia","Comunhão"]},{"week_number":4,"title":"Seguros nas Mãos de Deus","overview":"A promessa inabalável de que Aquele que começou a boa obra em nós irá completá-la até o dia de Jesus Cristo — a perseverança dos santos.","texts":["Filipenses 1:6","João 10:28-29","Romanos 8:38-39"],"topics":["Perseverança","Segurança Eterna","Fidelidade de Deus"]}]}',
 'PT'),

('945f6c31-52a1-46a5-91f9-ed1954c3ae06',
 'Série: Santidade ao Senhor (Wesley)',
 'series_calendar',
 '{"title":"Série: Santidade ao Senhor (Wesley)","theme":"John Wesley — Avivamento e Perfeição Cristã","overview":"Inspirada no grande avivamento metodista do século XVIII, esta série convida a Igreja a buscar a santidade prática e o amor perfeito a Deus e ao próximo, seguindo os passos do incansável cavaleiro do Evangelho.","weeks":[{"week_number":1,"title":"O Coração Estranhamente Aquecido","overview":"A experiência vital do novo nascimento e a certeza da salvação pelo testemunho interior do Espírito Santo. O \"coração aquecido\" de Wesley como paradigma da conversão genuína.","texts":["Lucas 24:32","Atos 2:1-4","Romanos 8:16"],"topics":["Novo Nascimento","Assurance","Espírito Santo"]},{"week_number":2,"title":"O Caminho da Perfeição","overview":"A busca deliberada pela santificação como processo contínuo de consagração total a Deus. O que Wesley entendia por perfeição no amor.","texts":["Mateus 5:48","Hebreus 12:14","1 João 4:18"],"topics":["Santificação","Amor Perfeito","Consagração"]},{"week_number":3,"title":"O Mundo é Minha Paróquia","overview":"A visão missionária revolucionária de Wesley que transformou toda a nação inglesa. A urgência de levar o Evangelho a cada pessoa fora dos muros da igreja.","texts":["Marcos 16:15","Atos 1:8","Mateus 28:19-20"],"topics":["Missões","Evangelismo","Paixão pelas Almas"]},{"week_number":4,"title":"Os Meios da Graça","overview":"A importância das disciplinas espirituais — oração, jejum, ceia e comunidade — como canais divinos para sustentar e aprofundar a vida em Deus.","texts":["Atos 2:42","Marcos 9:29","Lucas 22:19-20"],"topics":["Disciplinas Espirituais","Jejum","Método"]}]}',
 'PT'),

('945f6c31-52a1-46a5-91f9-ed1954c3ae06',
 'Série: Soli Deo Gloria (Calvino)',
 'series_calendar',
 '{"title":"Série: Soli Deo Gloria (Calvino)","theme":"João Calvino — Soberania e Glória de Deus","overview":"Uma série de estudo profundo sobre a soberania absoluta de Deus em todas as esferas da criação, da salvação e da história. Inspirada na teologia rigorosa e na exegese precisa de Calvino, para que nossa maior alegria seja glorificar a Deus em tudo.","weeks":[{"week_number":1,"title":"O Conhecimento de Deus e de Nós Mesmos","overview":"O ponto de partida de toda verdadeira sabedoria: conhecer a majestade infinita do Criador e, a partir dEle, compreender nossa própria condição de criaturas dependentes.","texts":["Romanos 11:33-36","Salmo 8","Isaías 40:12-14"],"topics":["Teologia Própria","Conhecimento","Reverência"]},{"week_number":2,"title":"A Soberania na Salvação","overview":"A eleição incondicional como suprema prova do amor de Deus. Ele nos escolheu antes da fundação do mundo, não por mérito nosso, mas por Sua pura e livre graça.","texts":["Efésios 1:4-5","Romanos 9:15-16","João 15:16"],"topics":["Eleição","Predestinação","Graça Irresistível"]},{"week_number":3,"title":"A Autoridade Absoluta das Escrituras","overview":"A Bíblia como Palavra infalível de Deus — nossa única regra de fé e prática. Calvino como o grande mestre da exegese que coloca a Escritura acima de qualquer tradição humana.","texts":["Salmo 119:105","2 Timóteo 3:16-17","2 Pedro 1:20-21"],"topics":["Sola Scriptura","Infalibilidade","Exegese"]},{"week_number":4,"title":"Soli Deo Gloria","overview":"A finalidade primeira e última da existência humana: glorificar a Deus e gozá-Lo para sempre. Vivendo toda a rotina — trabalho, família e ministério — como atos de adoração.","texts":["1 Coríntios 10:31","Isaías 43:7","Romanos 11:36"],"topics":["Glória de Deus","Adoração Integral","Vocação"]}]}',
 'PT'),

('945f6c31-52a1-46a5-91f9-ed1954c3ae06',
 'Série: Lógica em Chamas (Lloyd-Jones)',
 'series_calendar',
 '{"title":"Série: Lógica em Chamas (Lloyd-Jones)","theme":"Martyn Lloyd-Jones — O Poder do Espírito e o Avivamento","overview":"Uma análise bíblica profunda e urgente sobre o verdadeiro avivamento e a necessidade vital da unção do Espírito Santo, conduzida pelo médico que abandonou Harley Street para diagnosticar a alma da Igreja moderna.","weeks":[{"week_number":1,"title":"Lógica em Chamas","overview":"A pregação que combina a mais clara verdade teológica com o mais intenso fogo do Espírito Santo. O que Lloyd-Jones chamava de teologia com paixão — não emoção vazia, mas convicção ardente.","texts":["1 Tessalonicenses 1:5","Atos 17:2-3","1 Coríntios 2:4-5"],"topics":["Pregação","Unção","Verdade com Calor"]},{"week_number":2,"title":"O Batismo com o Espírito","overview":"A necessidade urgente de buscar o revestimento de poder do Espírito como uma experiência real e transformadora, distinta da conversão, para o testemunho eficaz no mundo.","texts":["Atos 1:8","Efésios 5:18","Lucas 24:49"],"topics":["Batismo no Espírito","Poder","Avivamento"]},{"week_number":3,"title":"Diagnóstico da Alma","overview":"Usando a precisão de um médico espiritual, Lloyd-Jones nos ensina a identificar as raízes da depressão espiritual e como a pregação correta da Palavra traz cura clínica à alma abatida.","texts":["Salmo 42:11","Jeremias 33:3","2 Coríntios 4:8-10"],"topics":["Depressão Espiritual","Cura","Fala com sua Alma"]},{"week_number":4,"title":"Firmes na Sã Doutrina","overview":"Manter-se solidamente ancorado na verdade infalível da Escritura diante dos ataques do liberalismo e do ceticismo moderno. A importância de contender pela fé uma vez entregue aos santos.","texts":["Judas 1:3","2 Timóteo 4:1-4","Tito 1:9"],"topics":["Sã Doutrina","Apologética","Fidelidade"]}]}',
 'PT');

-- 5. Verificar inserções
SELECT id, title, type, language, created_at FROM public.materials WHERE type = 'series_calendar' ORDER BY created_at DESC;
