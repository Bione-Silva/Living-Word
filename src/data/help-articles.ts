export interface HelpArticle {
  toolId: string;
  title: { PT: string; EN: string; ES: string };
  sections: {
    heading: string;
    icon?: string;
    content: string;
    type?: 'tip' | 'warning' | 'normal';
  }[];
}

export const helpArticles: HelpArticle[] = [
  // ═══════════════ PESQUISA ═══════════════
  {
    toolId: 'topic-explorer',
    title: {
      PT: 'Explorador de Tópicos — Descubra ângulos únicos para sua mensagem',
      EN: 'Topic Explorer — Discover unique angles for your message',
      ES: 'Explorador de Temas — Descubre ángulos únicos para tu mensaje',
    },
    sections: [
      { heading: 'O que é essa ferramenta', icon: '💡', content: 'O Explorador de Tópicos é o seu ponto de partida para qualquer mensagem. Ele analisa um tema bíblico e gera subtópicos, ângulos criativos e conexões que você talvez nunca tivesse pensado.' },
      { heading: 'O que ela faz', icon: '⚙️', content: '• Gera de 5 a 10 subtópicos relacionados ao seu tema\n• Sugere ângulos contemporâneos e aplicações práticas\n• Conecta o tema com passagens bíblicas relevantes\n• Oferece perguntas provocativas para reflexão' },
      { heading: 'Qual problema ela resolve', icon: '🎯', content: 'Você já sentou para preparar um sermão e ficou olhando para a tela sem saber por onde começar? Essa ferramenta elimina o bloqueio criativo. Em segundos, você tem um mapa completo de ideias.' },
      { heading: 'Como usar (passo a passo)', icon: '📋', content: '1. Digite o tema ou passagem que deseja explorar\n2. Escolha o idioma e o estilo de abordagem\n3. Clique em "Gerar"\n4. Navegue pelos subtópicos sugeridos\n5. Use os que mais se conectam com sua congregação' },
      { heading: 'O que você consegue criar', icon: '✨', content: '• Um mapa mental completo do tema\n• Esboço inicial para sermão ou estudo\n• Lista de perguntas para grupo de célula\n• Tópicos para série de mensagens' },
      { heading: 'Quando usar', icon: '📅', content: '• Ao iniciar o planejamento semanal\n• Quando precisa de inspiração fresca\n• Para planejar séries temáticas\n• Antes de estudos em grupo' },
      { heading: 'Dica Pro', icon: '🚀', content: 'Combine o Explorador com o Localizador de Versículos para ter um sermão praticamente estruturado em minutos.', type: 'tip' },
    ],
  },
  {
    toolId: 'verse-finder',
    title: {
      PT: 'Localizador de Versículos — Encontre a passagem perfeita em segundos',
      EN: 'Verse Finder — Find the perfect passage in seconds',
      ES: 'Localizador de Versículos — Encuentra el pasaje perfecto en segundos',
    },
    sections: [
      { heading: 'O que é essa ferramenta', icon: '💡', content: 'O Localizador de Versículos busca passagens bíblicas relevantes para qualquer tema, emoção ou situação pastoral que você esteja abordando.' },
      { heading: 'O que ela faz', icon: '⚙️', content: '• Busca versículos por tema, palavra-chave ou sentimento\n• Apresenta o texto na versão bíblica que você preferir\n• Contextualiza cada versículo com breve explicação\n• Sugere versículos complementares' },
      { heading: 'Qual problema ela resolve', icon: '🎯', content: 'Chega de ficar folheando a Bíblia inteira ou pesquisando no Google. Essa ferramenta encontra os versículos mais relevantes e os apresenta com contexto pastoral.' },
      { heading: 'Como usar (passo a passo)', icon: '📋', content: '1. Digite o tema, sentimento ou situação\n2. Selecione a versão bíblica preferida\n3. Clique em "Buscar"\n4. Receba uma lista curada de versículos\n5. Copie ou salve os que desejar' },
      { heading: 'O que você consegue criar', icon: '✨', content: '• Base bíblica sólida para sermões\n• Versículos para aconselhamento pastoral\n• Textos para postagens e devotionais\n• Referências para estudos temáticos' },
      { heading: 'Quando usar', icon: '📅', content: '• Na preparação de qualquer mensagem\n• Ao aconselhar alguém e precisar de respaldo bíblico\n• Criando conteúdo para redes sociais\n• Montando material de célula' },
    ],
  },
  {
    toolId: 'historical-context',
    title: {
      PT: 'Contexto Histórico — Entenda a Bíblia como nunca antes',
      EN: 'Historical Context — Understand the Bible like never before',
      ES: 'Contexto Histórico — Entiende la Biblia como nunca antes',
    },
    sections: [
      { heading: 'O que é essa ferramenta', icon: '💡', content: 'O Contexto Histórico revela o cenário cultural, político e social por trás de qualquer passagem bíblica, enriquecendo sua pregação com profundidade acadêmica acessível.' },
      { heading: 'O que ela faz', icon: '⚙️', content: '• Explica o contexto histórico-cultural da passagem\n• Descreve costumes e tradições da época\n• Mostra o cenário político e geográfico\n• Conecta o contexto com a aplicação moderna' },
      { heading: 'Qual problema ela resolve', icon: '🎯', content: 'Muitos pregadores citam versículos sem entender o contexto original. Isso pode levar a interpretações equivocadas. Essa ferramenta garante que sua mensagem seja fiel ao significado original.' },
      { heading: 'Como usar (passo a passo)', icon: '📋', content: '1. Insira a passagem bíblica (ex: João 4:1-26)\n2. Escolha o nível de profundidade\n3. Receba o contexto completo\n4. Use na introdução ou desenvolvimento do sermão' },
      { heading: 'O que você consegue criar', icon: '✨', content: '• Introduções envolventes com "curiosidades históricas"\n• Explicações que dão vida ao texto bíblico\n• Material para classes bíblicas avançadas\n• Conteúdo para blog e newsletter' },
      { heading: 'Quando usar', icon: '📅', content: '• Ao preparar estudos expositivos\n• Antes de pregar sobre passagens complexas\n• Para enriquecer qualquer material escrito' },
      { heading: 'Dica Pro', icon: '🚀', content: 'Compartilhe um dado histórico impactante logo nos primeiros 2 minutos do sermão. Isso prende a atenção da congregação imediatamente.', type: 'tip' },
    ],
  },
  {
    toolId: 'quote-finder',
    title: {
      PT: 'Localizador de Citações — Autoridade teológica na ponta dos dedos',
      EN: 'Quote Finder — Theological authority at your fingertips',
      ES: 'Localizador de Citas — Autoridad teológica en la punta de los dedos',
    },
    sections: [
      { heading: 'O que é essa ferramenta', icon: '💡', content: 'Encontre citações de teólogos, pastores renomados e autores cristãos que reforcem seu argumento com autoridade e credibilidade.' },
      { heading: 'O que ela faz', icon: '⚙️', content: '• Busca citações por tema ou autor\n• Apresenta citações de teólogos clássicos e contemporâneos\n• Inclui contexto e referência bibliográfica\n• Sugere onde inserir no sermão' },
      { heading: 'Qual problema ela resolve', icon: '🎯', content: 'Uma boa citação pode transformar um sermão comum em uma mensagem memorável. Mas encontrar a citação certa demanda horas de pesquisa — até agora.' },
      { heading: 'Como usar (passo a passo)', icon: '📋', content: '1. Digite o tema da sua mensagem\n2. Opcionalmente, escolha um autor específico\n3. Receba citações relevantes com contexto\n4. Copie e insira no seu material' },
      { heading: 'O que você consegue criar', icon: '✨', content: '• Sermões com maior credibilidade acadêmica\n• Posts para redes sociais com citações impactantes\n• Material de estudo enriquecido\n• Devocional com profundidade teológica' },
      { heading: 'Quando usar', icon: '📅', content: '• Ao desenvolver o argumento central do sermão\n• Criando conteúdo para redes sociais\n• Escrevendo artigos para o blog' },
    ],
  },
  {
    toolId: 'movie-scenes',
    title: {
      PT: 'Cenas de Filmes — Ilustrações cinematográficas para o sermão',
      EN: 'Movie Scenes — Cinematic illustrations for your sermon',
      ES: 'Escenas de Películas — Ilustraciones cinematográficas para el sermón',
    },
    sections: [
      { heading: 'O que é essa ferramenta', icon: '💡', content: 'Encontre cenas de filmes e séries que ilustram perfeitamente o ponto do seu sermão. Conexão imediata com a audiência.' },
      { heading: 'O que ela faz', icon: '⚙️', content: '• Sugere cenas de filmes relevantes ao tema\n• Descreve a cena em detalhes para narração\n• Conecta a cena com a verdade bíblica\n• Indica filmes conhecidos e acessíveis' },
      { heading: 'Qual problema ela resolve', icon: '🎯', content: 'Ilustrações são o que tornam um sermão inesquecível. Mas pensar em exemplos cinematográficos relevantes na hora da preparação é difícil. Essa ferramenta resolve isso.' },
      { heading: 'Como usar (passo a passo)', icon: '📋', content: '1. Descreva o tema ou princípio bíblico\n2. Receba sugestões de cenas de filmes\n3. Leia a descrição narrativa da cena\n4. Use como ilustração no sermão' },
      { heading: 'O que você consegue criar', icon: '✨', content: '• Ilustrações que a congregação vai lembrar\n• Conexões entre cultura pop e verdade bíblica\n• Ganchos de atenção para jovens e adultos' },
      { heading: 'Quando usar', icon: '📅', content: '• Ao preparar sermões para audiências diversas\n• Quando precisa de uma ilustração impactante\n• Para cultos de jovens' },
    ],
  },
  {
    toolId: 'original-text',
    title: {
      PT: 'Texto Original — Grego e Hebraico ao seu alcance',
      EN: 'Original Text — Greek and Hebrew within reach',
      ES: 'Texto Original — Griego y Hebreo a tu alcance',
    },
    sections: [
      { heading: 'O que é essa ferramenta', icon: '💡', content: 'Acesse o texto bíblico nas línguas originais (Grego e Hebraico) com análise palavra por palavra, sem precisar de anos de seminário.' },
      { heading: 'O que ela faz', icon: '⚙️', content: '• Mostra o texto original com transliteração\n• Análise morfológica de cada palavra\n• Significados possíveis e nuances\n• Comparação entre traduções' },
      { heading: 'Qual problema ela resolve', icon: '🎯', content: 'Muitas vezes a riqueza do texto bíblico se perde na tradução. Essa ferramenta revela significados profundos que apenas o texto original pode oferecer.' },
      { heading: 'Como usar (passo a passo)', icon: '📋', content: '1. Insira a referência bíblica\n2. Receba o texto original com análise\n3. Explore as nuances de cada palavra\n4. Use no sermão para enriquecer a explicação' },
      { heading: 'O que você consegue criar', icon: '✨', content: '• Explicações profundas que impressionam\n• Insights únicos sobre passagens conhecidas\n• Material para aulas de escola bíblica' },
      { heading: 'Aviso Importante', icon: '⚠️', content: 'Esta ferramenta está disponível nos planos Pastoral, Igreja e Ministério. Faça upgrade para acessar.', type: 'warning' },
    ],
  },
  {
    toolId: 'lexical',
    title: {
      PT: 'Pesquisa Lexical — Estudo profundo de termos bíblicos',
      EN: 'Lexical Research — Deep study of biblical terms',
      ES: 'Investigación Léxica — Estudio profundo de términos bíblicos',
    },
    sections: [
      { heading: 'O que é essa ferramenta', icon: '💡', content: 'Faça uma análise lexical completa de qualquer termo bíblico. Descubra raízes, cognatos, usos em outros textos e evolução semântica.' },
      { heading: 'O que ela faz', icon: '⚙️', content: '• Análise da raiz etimológica do termo\n• Ocorrências em toda a Bíblia\n• Uso no contexto cultural original\n• Comparação com termos sinônimos' },
      { heading: 'Qual problema ela resolve', icon: '🎯', content: 'Entender uma única palavra no original pode mudar totalmente a interpretação de uma passagem. Essa ferramenta torna esse estudo acessível a qualquer pastor.' },
      { heading: 'Como usar (passo a passo)', icon: '📋', content: '1. Digite o termo em português (ou no original)\n2. Selecione se é do Antigo ou Novo Testamento\n3. Receba a análise completa\n4. Use os insights no sermão ou estudo' },
      { heading: 'Aviso Importante', icon: '⚠️', content: 'Disponível nos planos Pastoral, Igreja e Ministério.', type: 'warning' },
    ],
  },

  // ═══════════════ ESCRITA E CRIAÇÃO ═══════════════
  {
    toolId: 'studio',
    title: {
      PT: 'Estúdio Pastoral — Seu assistente completo de pregação',
      EN: 'Pastoral Studio — Your complete preaching assistant',
      ES: 'Estudio Pastoral — Tu asistente completo de predicación',
    },
    sections: [
      { heading: 'O que é essa ferramenta', icon: '💡', content: 'O Estúdio Pastoral é a ferramenta principal da Living Word. Ele gera sermões completos, esboços estruturados e devocionais prontos para uso — tudo com a sua voz pastoral.' },
      { heading: 'O que ela faz', icon: '⚙️', content: '• Gera sermão completo com introdução, desenvolvimento e conclusão\n• Cria esboço estruturado com tópicos e subtópicos\n• Produz devocional pronto para publicar\n• Permite escolher "Mentes Brilhantes" como referência de estilo\n• Adapta ao seu público-alvo e contexto' },
      { heading: 'Qual problema ela resolve', icon: '🎯', content: 'Preparar um sermão de qualidade demanda em média 10-15 horas por semana. Com o Estúdio Pastoral, você tem um primeiro rascunho excelente em minutos, liberando tempo para oração e cuidado pastoral.' },
      { heading: 'Como usar (passo a passo)', icon: '📋', content: '1. Insira a passagem bíblica base\n2. Descreva o público-alvo e o ponto de dor\n3. Escolha os formatos desejados (sermão, esboço, devocional)\n4. Opcionalmente, selecione uma "Mente Brilhante"\n5. Clique em "Gerar"\n6. Edite e personalize o resultado' },
      { heading: 'O que você consegue criar', icon: '✨', content: '• Sermão completo de 20-30 minutos\n• Esboço para pregação livre\n• Devocional para redes ou blog\n• Material para estudo bíblico' },
      { heading: 'Quando usar', icon: '📅', content: '• Toda semana na preparação de mensagens\n• Quando precisa de inspiração rápida\n• Para preparar múltiplas mensagens em série' },
      { heading: 'Dica Pro', icon: '🚀', content: 'Use as "Mentes Brilhantes" para variar seu estilo. Experimente pregar com a abordagem de diferentes referências e descubra novas formas de comunicar.', type: 'tip' },
    ],
  },
  {
    toolId: 'title-gen',
    title: {
      PT: 'Gerador de Títulos — Títulos que capturam a atenção',
      EN: 'Title Generator — Titles that capture attention',
      ES: 'Generador de Títulos — Títulos que capturan la atención',
    },
    sections: [
      { heading: 'O que é essa ferramenta', icon: '💡', content: 'Gere 10 opções de títulos criativos, envolventes e relevantes para seu sermão, estudo ou conteúdo digital.' },
      { heading: 'O que ela faz', icon: '⚙️', content: '• Gera 10 títulos criativos por tema\n• Varia estilos: provocativo, emocional, direto, curioso\n• Adapta ao tom da sua comunicação\n• Sugere subtítulos complementares' },
      { heading: 'Qual problema ela resolve', icon: '🎯', content: 'O título é a primeira impressão. Um título genérico perde a audiência antes mesmo de começar. Essa ferramenta garante que suas mensagens tenham títulos memoráveis.' },
      { heading: 'Como usar (passo a passo)', icon: '📋', content: '1. Descreva o tema ou passagem\n2. Escolha o tom desejado\n3. Receba 10 opções de títulos\n4. Escolha o que mais ressoa com sua mensagem' },
      { heading: 'O que você consegue criar', icon: '✨', content: '• Títulos para sermões e séries\n• Manchetes para blog e newsletter\n• Títulos para vídeos no YouTube\n• Headlines para redes sociais' },
      { heading: 'Quando usar', icon: '📅', content: '• Ao finalizar a preparação do sermão\n• Criando conteúdo para redes\n• Planejando séries temáticas' },
    ],
  },
  {
    toolId: 'metaphor-creator',
    title: {
      PT: 'Criador de Metáforas — Analogias que iluminam verdades bíblicas',
      EN: 'Metaphor Creator — Analogies that illuminate biblical truths',
      ES: 'Creador de Metáforas — Analogías que iluminan verdades bíblicas',
    },
    sections: [
      { heading: 'O que é essa ferramenta', icon: '💡', content: 'Transforme conceitos bíblicos complexos em analogias modernas e acessíveis. Jesus usava parábolas — você pode usar metáforas contemporâneas.' },
      { heading: 'O que ela faz', icon: '⚙️', content: '• Cria metáforas modernas para conceitos bíblicos\n• Usa referências do cotidiano (tecnologia, esportes, natureza)\n• Adapta ao perfil da sua congregação\n• Gera múltiplas opções para escolha' },
      { heading: 'Qual problema ela resolve', icon: '🎯', content: 'Como explicar a Trindade para um jovem de 16 anos? Como tornar "justificação pela fé" algo palpável? Essa ferramenta cria pontes entre o texto antigo e a vida moderna.' },
      { heading: 'Como usar (passo a passo)', icon: '📋', content: '1. Descreva o conceito bíblico\n2. Indique o público-alvo\n3. Receba metáforas criativas\n4. Escolha e adapte ao seu estilo' },
      { heading: 'O que você consegue criar', icon: '✨', content: '• Ilustrações que a congregação entende na hora\n• Explicações para conceitos teológicos difíceis\n• Conteúdo para ensino infantil e juvenil' },
      { heading: 'Quando usar', icon: '📅', content: '• Ao explicar doutrinas complexas\n• Para aulas de escola dominical\n• Em mensagens para público diversificado' },
    ],
  },
  {
    toolId: 'bible-modernizer',
    title: {
      PT: 'Modernizador Bíblico — Histórias antigas em linguagem de hoje',
      EN: 'Bible Modernizer — Ancient stories in today\'s language',
      ES: 'Modernizador Bíblico — Historias antiguas en lenguaje de hoy',
    },
    sections: [
      { heading: 'O que é essa ferramenta', icon: '💡', content: 'Reconte histórias bíblicas em contextos modernos. Imagine a parábola do bom samaritano acontecendo hoje, na sua cidade.' },
      { heading: 'O que ela faz', icon: '⚙️', content: '• Reconta histórias bíblicas em cenários atuais\n• Mantém a essência e a mensagem original\n• Adapta personagens e situações ao contexto moderno\n• Cria narrativas envolventes e relacionáveis' },
      { heading: 'Qual problema ela resolve', icon: '🎯', content: 'Muitas pessoas têm dificuldade em se conectar com histórias de 2000 anos atrás. O Modernizador torna essas histórias vivas e relevantes para a audiência de hoje.' },
      { heading: 'Como usar (passo a passo)', icon: '📋', content: '1. Selecione a passagem ou história bíblica\n2. Escolha o contexto moderno desejado\n3. Receba a história recontada\n4. Use como ilustração no sermão' },
      { heading: 'O que você consegue criar', icon: '✨', content: '• Ilustrações narrativas para sermões\n• Conteúdo para dramatizações na igreja\n• Posts criativos para redes sociais\n• Material para estudo com jovens' },
      { heading: 'Quando usar', icon: '📅', content: '• Em sermões para audiências jovens\n• Para introduzir uma passagem de forma criativa\n• Em estudos de célula' },
    ],
  },
  {
    toolId: 'illustrations',
    title: {
      PT: 'Ilustrações para Sermão — Histórias que tocam o coração',
      EN: 'Sermon Illustrations — Stories that touch the heart',
      ES: 'Ilustraciones para Sermón — Historias que tocan el corazón',
    },
    sections: [
      { heading: 'O que é essa ferramenta', icon: '💡', content: 'Gere ilustrações e histórias reais que enriquecem sua pregação com emoção, verdade e conexão humana.' },
      { heading: 'O que ela faz', icon: '⚙️', content: '• Cria ilustrações baseadas em situações reais\n• Gera histórias com arco narrativo completo\n• Adapta o tom (emocional, inspirador, reflexivo)\n• Conecta a história com a verdade bíblica' },
      { heading: 'Qual problema ela resolve', icon: '🎯', content: 'As melhores pregações são lembradas pelas histórias, não pelos pontos teológicos. Essa ferramenta garante que você sempre tenha uma boa história para contar.' },
      { heading: 'Como usar (passo a passo)', icon: '📋', content: '1. Descreva o tema ou ponto do sermão\n2. Escolha o tipo de ilustração\n3. Receba histórias prontas\n4. Adapte e personalize ao seu contexto' },
      { heading: 'O que você consegue criar', icon: '✨', content: '• Histórias para aberturas de sermão\n• Ilustrações para pontos-chave\n• Narrativas para encerramento emocional\n• Testemunhos ficcionais (baseados em situações reais)' },
      { heading: 'Quando usar', icon: '📅', content: '• Na preparação de qualquer sermão\n• Quando precisa de um "gancho" emocional\n• Para tornar estudos mais envolventes' },
    ],
  },
  {
    toolId: 'free-article',
    title: {
      PT: 'Redator Universal — Artigos completos prontos para publicar',
      EN: 'Universal Writer — Complete articles ready to publish',
      ES: 'Redactor Universal — Artículos completos listos para publicar',
    },
    sections: [
      { heading: 'O que é essa ferramenta', icon: '💡', content: 'Gere artigos devotionais completos, otimizados para blog, prontos para publicar com título, introdução, desenvolvimento e conclusão.' },
      { heading: 'O que ela faz', icon: '⚙️', content: '• Gera artigo completo de 800-1500 palavras\n• Estrutura com SEO básico (título, subtítulos)\n• Tom devocional e pastoral\n• Pronto para publicar no blog integrado' },
      { heading: 'Qual problema ela resolve', icon: '🎯', content: 'Manter um blog atualizado é essencial para alcance digital, mas consome muito tempo. Essa ferramenta produz artigos de qualidade em minutos.' },
      { heading: 'Como usar (passo a passo)', icon: '📋', content: '1. Escolha o tema ou passagem\n2. Defina o tom e público-alvo\n3. Gere o artigo\n4. Revise e publique no blog' },
      { heading: 'O que você consegue criar', icon: '✨', content: '• Artigos para o blog da igreja\n• Devocionais para newsletter\n• Conteúdo para portais cristãos\n• Material de apoio para estudos' },
      { heading: 'Quando usar', icon: '📅', content: '• Semanalmente para manter o blog ativo\n• Ao transformar sermões em artigos\n• Para criar conteúdo de apoio' },
    ],
  },

  // ═══════════════ ALCANCE ═══════════════
  {
    toolId: 'reels-script',
    title: {
      PT: 'Roteiro para Reels — Conquiste as redes em 60 segundos',
      EN: 'Reels Script — Win social media in 60 seconds',
      ES: 'Guión para Reels — Conquista las redes en 60 segundos',
    },
    sections: [
      { heading: 'O que é essa ferramenta', icon: '💡', content: 'Crie roteiros profissionais para vídeos curtos (Reels, Shorts, TikTok) com gancho de atenção, conteúdo e chamada para ação.' },
      { heading: 'O que ela faz', icon: '⚙️', content: '• Gera roteiro de 30-60 segundos\n• Inclui gancho de atenção nos primeiros 3 segundos\n• Estrutura: gancho → conteúdo → CTA\n• Adapta ao estilo da sua comunicação' },
      { heading: 'Qual problema ela resolve', icon: '🎯', content: 'A maioria dos pastores sabe que precisa estar nas redes, mas não sabe como criar conteúdo curto e impactante. Essa ferramenta resolve isso com roteiros prontos.' },
      { heading: 'Como usar (passo a passo)', icon: '📋', content: '1. Escolha o tema ou versículo\n2. Defina o objetivo (inspirar, ensinar, evangelizar)\n3. Receba o roteiro completo\n4. Grave seguindo o script' },
      { heading: 'O que você consegue criar', icon: '✨', content: '• Reels para Instagram\n• Shorts para YouTube\n• TikToks evangelísticos\n• Conteúdo de 1 minuto para WhatsApp' },
      { heading: 'Quando usar', icon: '📅', content: '• 2-3 vezes por semana para manter presença digital\n• Após cada sermão (transforme pontos-chave em Reels)\n• Em datas especiais da igreja' },
      { heading: 'Dica Pro', icon: '🚀', content: 'Grave 3-5 Reels de uma vez usando diferentes roteiros. Isso economiza tempo e mantém seu conteúdo constante.', type: 'tip' },
    ],
  },
  {
    toolId: 'cell-group',
    title: {
      PT: 'Material de Célula — Estudos completos para grupos',
      EN: 'Cell Group Material — Complete studies for groups',
      ES: 'Material de Célula — Estudios completos para grupos',
    },
    sections: [
      { heading: 'O que é essa ferramenta', icon: '💡', content: 'Gere material completo para reuniões de célula com estudo bíblico, perguntas para discussão, dinâmicas e aplicação prática.' },
      { heading: 'O que ela faz', icon: '⚙️', content: '• Cria estudo bíblico focado e objetivo\n• Gera perguntas para discussão em grupo\n• Sugere dinâmicas e atividades\n• Inclui aplicação prática para a semana' },
      { heading: 'Qual problema ela resolve', icon: '🎯', content: 'Líderes de célula muitas vezes não têm tempo ou preparo para criar material de qualidade. Essa ferramenta oferece estudos prontos e envolventes.' },
      { heading: 'Como usar (passo a passo)', icon: '📋', content: '1. Escolha o tema ou siga a série do sermão\n2. Defina o perfil do grupo\n3. Gere o material\n4. Distribua para os líderes de célula' },
      { heading: 'O que você consegue criar', icon: '✨', content: '• Estudo semanal para célula\n• Guia para o líder\n• Dinâmicas de quebra-gelo\n• Plano de oração do grupo' },
      { heading: 'Quando usar', icon: '📅', content: '• Semanalmente para alimentar as células\n• Ao iniciar uma nova série\n• Quando líderes pedem material de apoio' },
    ],
  },
  {
    toolId: 'social-caption',
    title: {
      PT: 'Legendas para Redes — Textos que geram engajamento',
      EN: 'Social Captions — Texts that drive engagement',
      ES: 'Leyendas para Redes — Textos que generan engagement',
    },
    sections: [
      { heading: 'O que é essa ferramenta', icon: '💡', content: 'Gere 5 opções de legenda para Instagram, Facebook ou Twitter com emojis, hashtags e chamada para ação.' },
      { heading: 'O que ela faz', icon: '⚙️', content: '• Gera 5 legendas diferentes por tema\n• Inclui emojis estratégicos\n• Sugere hashtags relevantes\n• Adapta para cada plataforma social' },
      { heading: 'Qual problema ela resolve', icon: '🎯', content: 'Escrever legendas que gerem engajamento é uma arte. Essa ferramenta oferece opções testadas e otimizadas para redes sociais cristãs.' },
      { heading: 'Como usar (passo a passo)', icon: '📋', content: '1. Descreva o tema ou versículo\n2. Escolha a rede social\n3. Receba 5 opções de legenda\n4. Escolha, personalize e publique' },
      { heading: 'O que você consegue criar', icon: '✨', content: '• Posts para Instagram e Facebook\n• Tweets impactantes\n• Conteúdo para stories\n• Textos para WhatsApp da igreja' },
      { heading: 'Quando usar', icon: '📅', content: '• Diariamente para manter presença nas redes\n• Após cada sermão\n• Em datas comemorativas e especiais' },
    ],
  },
  {
    toolId: 'newsletter',
    title: {
      PT: 'Newsletter Semanal — Comunicação que aproxima',
      EN: 'Weekly Newsletter — Communication that connects',
      ES: 'Newsletter Semanal — Comunicación que acerca',
    },
    sections: [
      { heading: 'O que é essa ferramenta', icon: '💡', content: 'Crie uma newsletter completa com devocional, avisos da semana, eventos e uma palavra pastoral — pronta para enviar.' },
      { heading: 'O que ela faz', icon: '⚙️', content: '• Gera devocional breve e impactante\n• Organiza avisos e eventos da semana\n• Inclui palavra pastoral pessoal\n• Formata para envio por e-mail ou WhatsApp' },
      { heading: 'Qual problema ela resolve', icon: '🎯', content: 'Manter a comunicação constante com a congregação é vital, mas criar uma newsletter toda semana é trabalhoso. Essa ferramenta automatiza 80% do processo.' },
      { heading: 'Como usar (passo a passo)', icon: '📋', content: '1. Insira os avisos da semana\n2. Escolha o tema do devocional\n3. Gere a newsletter completa\n4. Revise e envie' },
      { heading: 'O que você consegue criar', icon: '✨', content: '• Newsletter semanal profissional\n• Comunicação para WhatsApp da igreja\n• Boletim dominical digital\n• E-mail pastoral periódico' },
      { heading: 'Quando usar', icon: '📅', content: '• Toda semana (quinta ou sexta-feira)\n• Antes de eventos especiais\n• Para comunicações emergenciais' },
    ],
  },
  {
    toolId: 'announcements',
    title: {
      PT: 'Avisos do Culto — Comunicação clara e acolhedora',
      EN: 'Service Announcements — Clear and welcoming communication',
      ES: 'Avisos del Culto — Comunicación clara y acogedora',
    },
    sections: [
      { heading: 'O que é essa ferramenta', icon: '💡', content: 'Transforme uma lista de avisos em comunicações claras, breves e acolhedoras para o boletim ou projeção do culto.' },
      { heading: 'O que ela faz', icon: '⚙️', content: '• Reescreve avisos em tom pastoral\n• Organiza por prioridade\n• Torna comunicações claras e objetivas\n• Adapta para projeção, impresso ou digital' },
      { heading: 'Qual problema ela resolve', icon: '🎯', content: 'Avisos mal escritos passam despercebidos. Avisos longos demais irritam. Essa ferramenta encontra o equilíbrio perfeito entre informação e acolhimento.' },
      { heading: 'Como usar (passo a passo)', icon: '📋', content: '1. Liste os avisos da semana\n2. Escolha o formato (projeção, impresso, digital)\n3. Gere os avisos formatados\n4. Use no culto' },
      { heading: 'O que você consegue criar', icon: '✨', content: '• Slides de avisos para projeção\n• Texto para boletim impresso\n• Avisos para grupo de WhatsApp\n• Comunicação de eventos especiais' },
      { heading: 'Quando usar', icon: '📅', content: '• Semanalmente antes do culto\n• Quando há muitos avisos para organizar\n• Para eventos especiais da igreja' },
    ],
  },

  // ═══════════════ DINÂMICAS ═══════════════
  {
    toolId: 'trivia',
    title: {
      PT: 'Quiz Bíblico — Aprendizado divertido para toda a igreja',
      EN: 'Bible Trivia — Fun learning for the whole church',
      ES: 'Trivia Bíblica — Aprendizaje divertido para toda la iglesia',
    },
    sections: [
      { heading: 'O que é essa ferramenta', icon: '💡', content: 'Gere quizzes bíblicos divertidos com 10 perguntas de múltipla escolha, incluindo respostas e explicações breves.' },
      { heading: 'O que ela faz', icon: '⚙️', content: '• Cria 10 perguntas por tema ou livro\n• Formato de múltipla escolha (A, B, C, D)\n• Inclui resposta correta e explicação\n• Varia a dificuldade' },
      { heading: 'Qual problema ela resolve', icon: '🎯', content: 'Criar dinâmicas para célula, EBD ou cultos de jovens consome tempo. Essa ferramenta entrega quizzes prontos e divertidos em segundos.' },
      { heading: 'Como usar (passo a passo)', icon: '📋', content: '1. Escolha o tema, livro ou passagem\n2. Defina o nível de dificuldade\n3. Gere o quiz\n4. Use na célula, EBD ou evento' },
      { heading: 'O que você consegue criar', icon: '✨', content: '• Quizzes para células e EBD\n• Gincanas bíblicas\n• Conteúdo interativo para redes\n• Jogos para retiros e acampamentos' },
      { heading: 'Quando usar', icon: '📅', content: '• Em reuniões de jovens\n• Para células que gostam de interação\n• Em eventos e retiros\n• Nas redes sociais da igreja' },
    ],
  },
  {
    toolId: 'poetry',
    title: {
      PT: 'Poesia Cristã — Palavras que tocam a alma',
      EN: 'Christian Poetry — Words that touch the soul',
      ES: 'Poesía Cristiana — Palabras que tocan el alma',
    },
    sections: [
      { heading: 'O que é essa ferramenta', icon: '💡', content: 'Crie poemas cristãos inspirados em passagens bíblicas, temas de fé ou momentos da vida pastoral.' },
      { heading: 'O que ela faz', icon: '⚙️', content: '• Gera poemas em diferentes estilos (livre, rimado, soneto)\n• Inspira-se em passagens bíblicas ou temas\n• Adapta o tom (contemplativo, celebrativo, penitente)\n• Pronto para compartilhar ou publicar' },
      { heading: 'Qual problema ela resolve', icon: '🎯', content: 'Nem todo pastor tem o dom da escrita poética, mas todo sermão pode ser enriquecido com um poema. Essa ferramenta democratiza a arte poética para a fé.' },
      { heading: 'Como usar (passo a passo)', icon: '📋', content: '1. Escolha o tema ou passagem inspiradora\n2. Selecione o estilo do poema\n3. Gere a poesia\n4. Use no culto, blog ou redes' },
      { heading: 'O que você consegue criar', icon: '✨', content: '• Poemas para leitura no culto\n• Textos para cards de Instagram\n• Reflexões poéticas para newsletter\n• Material para eventos especiais' },
      { heading: 'Quando usar', icon: '📅', content: '• Em cultos especiais (Natal, Páscoa, casamentos)\n• Para conteúdo diferenciado nas redes\n• Como fechamento de sermões' },
    ],
  },
  {
    toolId: 'kids-story',
    title: {
      PT: 'Histórias Infantis — A Bíblia contada para crianças',
      EN: 'Kids Stories — The Bible told for children',
      ES: 'Historias Infantiles — La Biblia contada para niños',
    },
    sections: [
      { heading: 'O que é essa ferramenta', icon: '💡', content: 'Transforme histórias bíblicas em narrativas encantadoras para crianças de 5 a 10 anos, com linguagem simples e lições práticas.' },
      { heading: 'O que ela faz', icon: '⚙️', content: '• Reconta histórias bíblicas para crianças\n• Usa linguagem simples e divertida\n• Inclui lição moral e aplicação\n• Adapta para diferentes faixas etárias\n• Sugere atividades complementares' },
      { heading: 'Qual problema ela resolve', icon: '🎯', content: 'Professores de escola dominical frequentemente lutam para encontrar material adequado e envolvente para crianças. Essa ferramenta resolve com histórias prontas e cativantes.' },
      { heading: 'Como usar (passo a passo)', icon: '📋', content: '1. Escolha a história bíblica\n2. Defina a faixa etária\n3. Gere a história adaptada\n4. Use na escola dominical ou culto infantil' },
      { heading: 'O que você consegue criar', icon: '✨', content: '• Material para escola dominical\n• Histórias para culto infantil\n• Conteúdo para pais compartilharem\n• Devocional infantil semanal' },
      { heading: 'Quando usar', icon: '📅', content: '• Semanalmente para a escola dominical\n• Em eventos infantis\n• Para criar conteúdo para pais' },
      { heading: 'Dica Pro', icon: '🚀', content: 'Peça para as crianças desenharem a história depois. Isso reforça o aprendizado e cria memórias afetivas.', type: 'tip' },
    ],
  },
  {
    toolId: 'deep-translation',
    title: {
      PT: 'Tradução Teológica — Muito além do Google Tradutor',
      EN: 'Theological Translation — Far beyond Google Translate',
      ES: 'Traducción Teológica — Mucho más allá del Google Traductor',
    },
    sections: [
      { heading: 'O que é essa ferramenta', icon: '💡', content: 'Traduza textos teológicos mantendo nuances, termos técnicos e o sentido original — algo que tradutores automáticos não conseguem fazer.' },
      { heading: 'O que ela faz', icon: '⚙️', content: '• Traduz textos teológicos entre PT, EN e ES\n• Preserva termos técnicos com notas explicativas\n• Mantém nuances culturais e teológicas\n• Oferece alternativas de tradução quando necessário' },
      { heading: 'Qual problema ela resolve', icon: '🎯', content: 'Textos teológicos têm vocabulário específico que tradutores genéricos destroem. "Justificação", "santificação", "propiciação" — cada termo tem peso teológico que precisa ser preservado.' },
      { heading: 'Como usar (passo a passo)', icon: '📋', content: '1. Cole o texto a ser traduzido\n2. Selecione o idioma de origem e destino\n3. Receba a tradução teológica\n4. Revise as notas e alternativas' },
      { heading: 'O que você consegue criar', icon: '✨', content: '• Traduções fiéis de artigos teológicos\n• Material bilíngue para igrejas multiculturais\n• Versões em outros idiomas dos seus sermões' },
      { heading: 'Aviso Importante', icon: '⚠️', content: 'Disponível nos planos Pastoral, Igreja e Ministério.', type: 'warning' },
    ],
  },
];

export function getHelpArticle(toolId: string): HelpArticle | undefined {
  return helpArticles.find(a => a.toolId === toolId);
}
