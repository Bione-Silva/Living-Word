# ZEAL PRO — MAPEAMENTO COMPLETO DE FUNCIONALIDADES
## Inspeção ao vivo via Claude in Chrome | 08/04/2026
## Referência para desenvolvimento do Living Word 2.0

---

## ROTAS REAIS DO ZEAL PRO

```
/                              → Dashboard/Home
/bible                         → Bíblia Criativa (grid de livros)
/bible → [livro] → [cap]       → Leitura de capítulo (SPA, não muda URL)
/bible?book=hebrews&chapter=11 → Link direto para capítulo (gerado pela IA)
/bible-chat/devocional         → Devocional do Dia
/bible-chat/pregacao           → Gerador de Pregação
/bible-chat/estudo             → Chat Bíblico
/bible-chat/conforto           → O Bom Amigo
/bible-art-generator           → AI Studio de Artes Bíblicas
/games                         → Jogos Cristãos
/games/zeal-quiz               → Quiz Hub (stats + bônus diário)
/games/zeal-quiz/categories    → Seleção de categoria
/games/zeal-quiz/play?category=X → Quiz ativo
/games/zeal-quiz/ranking       → Ranking global
/kids                          → Histórias para Crianças
/profile                       → Perfil do usuário
```

---

## 1. DASHBOARD / HOME (`/`)

### Estrutura completa
```
Header:
  - "O zelo da tua casa me consumiu." — Salmos 69:9 (versículo fixo do brand)
  - "Bom dia/Boa tarde, {nome}! 👋"

Seção 1 — Gerador de Pregação (destaque topo):
  - Card proeminente com CTA direto

Seção 2 — Top 3 Zeal Quiz (ranking global visível na home):
  - 🥇 Jogador 1 — 48.263pts
  - 🥈 Jogador 2 — 42.830pts
  - 🥉 Jogador 3 — 7.395pts
  - Botão: "Jogar agora e entrar no ranking →"

Seção 3 — O Bom Amigo (widget):
  - Input: "Como você está se sentindo hoje?"
  - Placeholder: "Ex: Estou ansioso, me sinto sozinho..."
  - Botão: "Quero uma Palavra"

Seção 4 — Palavra do dia / Devocional:
  - Label: "📖 Palavra do dia"
  - Título: "Devocional do Dia"
  - Título do devocional atual: "Ande na verdade diante de Deus"
  - Categoria: "Santidade" + badge "Áudio"
  - Data: "quarta-feira, 8 de abril"
  - Versículo âncora completo
  - Referência: "— 1 Pedro 1:15-16"
  - CTA: "Toque para ler ou ouvir"

Seção 5 — Grid de ferramentas em destaque:
  - Artes Bíblicas
  - Bíblia Criativa
  - Devocional
  - Chat Bíblico
  - Gerador de Pregação
  - Kids
  - O Bom Amigo
  - Jogos Cristãos
```

---

## 2. BÍBLIA CRIATIVA (`/bible`)

### Tela de listagem de livros
```
Header da tela:
  - Ícone + "Zeal Bíblia Criativa"
  - Subtítulo: "Leia, estude e crie artes dos versículos"
  - Botões topo direito: ⭐ Favoritos | 💬 Chat Bíblico
  - Campo de busca: "Buscar palavra-chave, livro, capítulo ou versículo..."

Tabs: [Ler] [Planos] [Progresso] [Recursos]

Tab Ler:
  - Toggle: [Antigo Testamento] [Novo Testamento]
  - Seletor de tradução: [NVI] [ARA] [ACF] [NTLH]
  - Grid de livros: #01 Gênesis (50 caps) — Criação, promessa e começo de tudo.
    ... todos os 39 livros AT e 27 NT

Tab Planos:
  - ⚡ Bíblia em 30 Dias — jornada intensiva — botão "Começar →"
  - 🎯 Bíblia em 90 Dias — NT completo + principais livros AT — "Começar →"
  - 📖 Bíblia em 365 Dias — Bíblia completa em um ano — "Começar →"

Tab Progresso (Estatísticas de Leitura):
  - 🔥 1 dia — Sequência
  - 📖 0 — Cap. lidos
  - 📋 0 — Livros completos
  - ⭐ 1 — Favoritos
  - Barra: "Progresso Geral — 0%" — "0 de 1189 capítulos lidos"
  - Por Testamento: AT 0/929 | NT 0/260
```

### Tela de leitura de capítulo (após clicar no livro)
```
Navegação:
  - "← Voltar aos livros"
  - Dropdown livro: "Gênesis"
  - Dropdown capítulo: "Cap 1"
  - Seletor de tradução: "Nova Versão Internacional"
  - Botão: "⭐ Favoritos"
  - "← Anterior" | "Próximo →"

Corpo do texto:
  - Versículos numerados, cada um como elemento clicável separado
  - Fonte clara, espaçamento generoso
```

### Menu contextual do versículo (ao clicar em qualquer versículo)
```
10 ações disponíveis:
  1. 🟡 Amarelo    — highlight amarelo
  2. 🟢 Verde      — highlight verde
  3. 🔵 Azul       — highlight azul
  4. ⭐ Favoritar  — salvar nos favoritos
  5. 📋 Copiar     — copiar texto do versículo
  6. 📤 Compartilhar — share nativo
  7. 📝 Anotação   — criar nota no versículo
  8. 📚 Estudo     — abre estudo com IA
  9. 🎨 Arte       — gera arte com o versículo
  10. ☑️ Selecionar — selecionar múltiplos versículos para estudo

Comportamento especial:
  - "Estudo" e "Arte" abrem modais/drawers inline
  - Versículos com highlight ficam coloridos no texto
  - Versículos favoritos aparecem na aba "Favoritos"
  - Versículos estudados geram links para capítulo: /bible?book=X&chapter=Y
```

---

## 3. DEVOCIONAL DO DIA (`/bible-chat/devocional`)

### Estrutura completa da tela
```
Header:
  - "Zeal Devocional"
  - Subtítulo: "Reflexões diárias para fortalecer sua fé"
  - Data: "quarta-feira, 8 de abril de 2026"

Card principal:
  - Categoria: "Santidade" (badge colorido)
  - Título: "Ande na verdade diante de Deus"
  - Versículo âncora (card destacado):
    'Mas, assim como é santo aquele que os chamou, sejam santos vocês
    também em tudo o que fizerem, pois está escrito: "Sejam santos,
    porque eu sou santo".'
    — 1 Pedro 1:15-16

Player de áudio:
  - Botão: "Ouvir Devocional"
  - Player inline: [▶] [barra de progresso] 0:00 / 1:41 [1x]
  - Duração real: 1 minuto e 41 segundos

Imagem do Devocional:
  - Imagem gerada por IA relacionada ao tema
  - Botões abaixo: [Salvar Imagem] [Compartilhar] [WhatsApp]
  - "Clique para ampliar"

Corpo — Reflexão:
  Texto completo (254 palavras):
  "Pedro escreve a cristãos dispersos que enfrentavam pressões e
  precisavam lembrar quem eram em Cristo. Depois de falar da salvação
  recebida pela graça, ele chama o povo de Deus a uma vida moldada
  pelo caráter do Senhor. A santidade, no texto, não é isolamento
  religioso, mas uma nova maneira de viver diante de Deus. Ser santo
  significa pertencer ao Senhor e rejeitar padrões antigos de pecado.
  O fundamento desse chamado não é orgulho humano, mas o próprio Deus,
  que é santo. Em Cristo, fomos alcançados para obedecer com sinceridade,
  inclusive nas áreas mais comuns da vida. Santidade prática aparece nas
  palavras, escolhas, relacionamentos e intenções do coração. Hoje,
  examine se sua vida combina com a fé que você professa. Abandone um
  hábito que desonra a Deus e busque cultivar uma prática que reflita
  a pureza de Cristo. Senhor, forma em mim um coração obediente e puro.
  Que minha vida reflita teu caráter em tudo. Em nome de Jesus, amém."

Prática do Dia:
  "peça perdão a Deus por um pecado específico e tome uma atitude
  concreta para abandoná-lo hoje."

Botões de ação pós-leitura:
  [Copiar] [Compartilhar] [Continuar no Chat]

Seção de Journaling:
  - Label: "Minha Reflexão Pessoal"
  - Textarea: "Escreva suas reflexões pessoais, orações ou pensamentos
    sobre o devocional de hoje."
  - Botão: [Salvar Reflexão]

Sidebar — Devocionais Anteriores (histórico de 30+ dias):
  Formato: Título | Categoria | Data
  Ex:
  - "Ande na verdade diante de Deus" — Santidade — 8 de abr.
  - "Sabedoria que começa no Senhor" — Temor do Senhor — 7 de abr.
  - "Humildade que Deus honra" — Humildade — 6 de abr.
  - "Santidade que agrada a Deus" — Santidade — 5 de abr.
  ... (histórico contínuo desde 9 de março = 30+ devocionais)

Categorias observadas nos devocionais (rotação):
  Santidade | Temor do Senhor | Humildade | Idolatria | Justiça
```

---

## 4. GERADOR DE PREGAÇÃO (`/bible-chat/pregacao`)

### Formulário de parâmetros
```
Campo 1 — Tipo de Pregação (7 opções):
  Expositivo | Temático | Narrativo | Textual | Biográfico |
  Devocional | Apologético

  Tooltips ao hover:
  - Expositivo: "Análise de um texto bíblico"
  - Temático: "Tema com múltiplos textos"
  - Narrativo: "Contando a história bíblica"
  - Textual: "Foco em passagem única"
  - Biográfico: "Vida de um personagem"
  - Devocional: "Meditação e aplicação prática"
  - Apologético: "Defesa racional da fé cristã"

Campo 2 — Público-alvo (8 opções):
  Geral | Jovens | Adultos | Homens | Mulheres | Casais |
  Líderes | Crianças

Campo 3 — Duração (4 opções):
  15 min | 30 min | 45 min | 1 hora
  ⚠️ DIFERENÇA: Zeal tem 45min — PRD atual não tem 45min

Campo 4 — Estilo de Pregação (7 opções):
  Contemporâneo | Pentecostal | Reformado | Tradicional |
  Evangelístico | Pastoral | Profético

Campo 5 — Tom da Mensagem (4 opções):
  Equilibrado | Intenso | Reflexivo | Motivacional
  ⚠️ DIFERENÇA: Zeal tem apenas 4 tons, PRD tem 6

Campo 6 — Sugestões de Tema (10 chips clicáveis):
  A fé que vence o medo
  O poder da oração persistente
  Graça que transforma vidas
  Identidade e propósito em Cristo
  Superando a ansiedade pela fé
  O amor incondicional de Deus
  Avivamento e renovação espiritual
  A armadura de Deus para tempos difíceis
  Perdão: libertando o coração
  O fruto do Espírito na vida diária

Sem campo de "Pontos Principais" — o Zeal não usa isso.
Input livre de tema via textarea.
Botão: [Enviar] + "Enter para enviar • Shift+Enter para nova linha"

Histórico recente (sidebar):
  - Conversas salvas com título e "08/04/2026 • 2 mensagens"
  - Botão "Novo Chat" | Botão "Apagar conversa" por item
```

### Output da pregação (após geração)
```
Estrutura gerada (exemplo "A Fé que Vence o Medo"):
  - Título em heading: "A Fé que Vence o Medo"
  - Texto-base com referência linkável: "2 Timóteo 1:7 (NVI)"
  - Versículo completo em destaque
  - Seções com heading: 📌 Introdução | pontos temáticos | ✨ Aplicações Práticas | 🎯 Conclusão
  - Referências bíblicas inline clicáveis → /bible?book=X&chapter=Y
  - Listas de aplicações práticas numeradas

Botões pós-geração (5 ações):
  1. [📋 Copiar mensagem]
  2. [📤 Compartilhar no WhatsApp]
  3. [🎠 Gerar carrossel de slides]  ← AÇÃO PRINCIPAL
  4. [📄 Baixar como PDF]
  5. [🔄 Regenerar com outros filtros]
```

### Carrossel de slides (após clicar em "Gerar carrossel")
```
Header do carrossel:
  - Título: "Carrossel" + contador "7 slides"
  - Botão: [🖼️ Background] — escolher imagem de fundo
  - Botão: [🔄 Nova Variação] — gera novo design (usa tokens)
  - Seletor de formato: [4:5] [16:9]
  - Botão fechar: [✕]

Painel esquerdo — Visualizador:
  - Slide atual em preview grande
  - Contador: "1/7", "2/7"... etc
  - Setas de navegação: [←] [→]
  - Bolinhas de navegação na base

Painel direito — Grade de miniaturas:
  - Thumbnails clicáveis de todos os slides
  - Cada thumbnail: imagem + label + texto resumido
  - Slide ativo destacado com borda

7 slides gerados automaticamente:
  Slide 1 — PREGAÇÃO: título + referência bíblica
  Slide 2 — VERSÍCULO: texto âncora completo
  Slide 3 — CONTEXTO: introdução/contextualização
  Slide 4 — PONTO 1: primeiro ponto principal
  Slide 5 — PONTO 2: segundo ponto principal
  Slide 6 — APLICAÇÃO: aplicações práticas
  Slide 7 — CONCLUSÃO: fechamento

Info do slide ativo (abaixo da grade):
  - Label: "PREGAÇÃO" / "CONTEXTO" / "PONTO 1" etc
  - "Slide X de 7"
  - Título do slide
  - Referência bíblica
  - Dimensões: "Widescreen 16:9" / "Instagram 4:5"
  - Resolução: "1920x1080px PNG" / "1080x1350px PNG"

Botões de download:
  [📥 Slide] — baixar slide atual
  [📥 Baixar Todos] — baixar todos como ZIP
  [📤 Enviar] — compartilhar
```

---

## 5. O BOM AMIGO (`/bible-chat/conforto`)

### Interface
```
Header: "Zeal O Bom Amigo"
Subtítulo: "Como você está se sentindo hoje? Compartilhe o que está no seu coração."

Input:
  - Campo de texto: "Ex: Estou triste, estou feliz, estou preocupado..."
  - Botão de envio (ícone)
  - Enter para enviar
```

### Output gerado (exemplo real capturado)
```
Input do usuário: "Estou me sentindo ansioso e com medo do futuro"

Resposta completa da IA:
  Tom: pastoral, íntimo, usa o nome do usuário ("bx4")
  Abertura empática: "Ei, bx4, eu sinto o peso dessa ansiedade..."
  Versículo: Isaías 41:10 (NVI) — "Por isso não tema, pois estou com você..."
  Texto pastoral: 3 linhas conectando versículo à situação específica
  Exercício prático: "feche os olhos por um minuto e respire devagar,
    repetindo 'Deus, segura minha mão'"
  Oração: "Pai, vem agora para bx4. Tira esse medo... Em nome de Jesus, amém."

Botões pós-resposta:
  [Copiar] [Compartilhar]

Campo de continuidade:
  - Novo input: "Compartilhe mais sobre como está se sentindo..."
  - Fluxo conversacional contínuo
```

---

## 6. AI STUDIO DE ARTES BÍBLICAS (`/bible-art-generator`)

### Interface completa
```
Header: "Zeal Artes Bíblicas"
Subtítulo: "Transforme versículos e cenas bíblicas em artes visuais impressionantes
  com inteligência artificial."

Campo principal:
  - Textarea: "Ex: Jesus caminhando sobre as águas em uma tempestade épica,
    estilo pintura clássica, luz dramática..."
  - Aceita: versículos, cenas bíblicas, descrições livres

Seletor de formato (3 opções):
  [1:1] [16:9] [9:16]

Seletor de categoria de estilo (10 tabs):
  ✦ Novos | Realista | 3D & Animação | Desenhos | Esculturas |
  Surrealista | Ilustração | PInturas | Colagem | Vitrais | Páscoa

25 estilos disponíveis (nomes reais):
  Páscoa arte sacra europeia
  A surreal double exposure portrait
  A cinematic back view of Jesus Christ
  A fine art portrait of Jesus Christ
  A cinematic scene framed
  A minimalist macro photograph
  A minimalist double exposure silhouette
  Double exposure composition
  A cinematic biblical
  Dramatic cinematic
  tinta e splashes abstratos
  split-view composition above/below
  collage style
  xilogravura moderna
  silhueta minimalista
  ultra-realismo dramático
  Celestial Hachuras barroco e estética dark
  Renascentista e barroca
  classical sculpture style
  street art
  Contemporary urban art
  Acrylic painting and urban art
  [+ 3 não identificados]

Botão: [Gerar Imagem]

Galeria inferior:
  "Criações recentes" — grid de imagens geradas anteriormente
```

---

## 7. KIDS (`/kids`)

### Interface de seleção
```
Header: "Zeal Kids"
Subtítulo: "Escolha um personagem bíblico que o Zeal conta a história para você"

20 personagens disponíveis (com imagem AI gerada + descrição):
  Davi — "O pequeno pastor que se tornou rei"
  Moisés — "O líder que libertou o povo de Deus"
  Daniel — "O jovem que confiou em Deus na cova dos leões"
  Ester — "A rainha que salvou seu povo"
  José — "O sonhador que se tornou governador"
  Rute — "A moabita que escolheu seguir a Deus"
  Samuel — "O menino que ouviu a voz de Deus"
  Jonas — "O profeta que foi engolido por um peixe"
  Sansão — "O homem mais forte do mundo"
  Josué — "O corajoso líder que conquistou a Terra Prometida"
  Gideão — "O juiz que venceu com apenas 300 homens"
  Jesus — "O Filho de Deus, nosso Salvador"
  Noé — "O construtor da arca que salvou os animais"
  Adão e Eva — "Os primeiros seres humanos criados por Deus"
  Salomão — "O rei mais sábio de todos os tempos"
  Zaqueu — "O coletor de impostos que subiu na árvore"
  Apóstolo Pedro — "O pescador que se tornou pescador de homens"
  Balaão — "O profeta cuja jumenta falou"
  Abraão — "O pai da fé e amigo de Deus"
  Jacó — "O homem que lutou com Deus"
```

### Output da história (exemplo Davi — capturado ao vivo)
```
Header da história:
  - "✨ História especial para você ✨"
  - "📖" (ícone)
  - Título: "Davi"

Texto da história (3 parágrafos, linguagem infantil simples):
  Parágrafo 1: Apresentação do personagem, contexto cotidiano
  Parágrafo 2: O conflito/desafio principal
  Parágrafo 3: A resolução e a intervenção de Deus

Lição moral ao final:
  "Lição: Deus nos torna corajosos quando confiamos Nele."

Botões pós-geração:
  [Copiar] [Compartilhar] [WhatsApp] [Gerar Desenho de Davi]
  ⚠️ "Gerar Desenho" = gera imagem da história via AI (usa tokens)
```

---

## 8. QUIZ (`/games/zeal-quiz` e `/games/zeal-quiz/play`)

### Hub do Quiz
```
Header: "Teste seus conhecimentos bíblicos!"

Stats do usuário:
  - Nível Atual: Iniciante → Próximo: Aprendiz
  - XP: 0 / 1.000 para subir
  - Partidas: 0
  - 🔥 Sequência: 0
  - Melhor: 0

Bônus Diário (calendário de XP):
  Dia 1: +10 XP
  Dia 2: +15 XP
  Dia 3: +20 XP
  Dia 4: +25 XP
  Dia 5: +35 XP
  Dia 6: +50 XP
  Dia 7: 🎁 +100 XP
  Botão: "RESGATAR DIA 1 (+10 XP)"

CTAs:
  - [Jogar Agora] → /games/zeal-quiz/categories
  - [Desafio Diário] — bônus especial diário
  - [Ranking] → /games/zeal-quiz/ranking
```

### Seleção de categorias (`/games/zeal-quiz/categories`)
```
5 categorias + modo aleatório:
  📜 Antigo Testamento — Médio — Gênesis a Malaquias — 10 perguntas
  ✝️ Novo Testamento — Médio — Mateus a Apocalipse — 10 perguntas
  👤 Personagens Bíblicos — Fácil — Heróis da fé — 10 perguntas
  📚 Livros da Bíblia — Fácil — 66 livros sagrados — 10 perguntas
  🎵 Salmos e Provérbios — Difícil — Sabedoria e louvor — 10 perguntas
  🎲 Modo Aleatório — Todas as categorias
```

### Tela do Quiz ativo (`/games/zeal-quiz/play?category=X`)
```
Header:
  - Botão "Sair" (ícone ←)
  - Categoria: "personagens"
  - "Pergunta 1/10"
  - Pontuação atual: "0 pts"

Card da pergunta:
  - Referência bíblica da questão: "1 Reis 18"
  - Pergunta em heading grande:
    "Quem foi o profeta que desafiou os profetas de Baal no Monte Carmelo?"

4 opções em botões grandes (A/B/C/D):
  A — Elias
  B — Eliseu
  C — Samuel
  D — Natã

Timer:
  - "9s" (contagem regressiva visível)
  - "⚡ Responda rápido para ganhar mais pontos!"

Botão: [Confirmar Resposta]

Sistema de pontuação por velocidade:
  - Resposta rápida = mais pontos
  - Timer começa em ~15s
```

### Ranking Global (`/games/zeal-quiz/ranking`)
```
Tabs: [🏆 Geral] [📅 Mensal] [⚡ Semanal]

Top 23 jogadores visíveis:
  🥇 Jogador 1 — 163 jogos — 48.263pts
  🥈 Jogador 2 — 118 jogos — 42.830pts
  🥉 Jogador 3 — 18 jogos — 7.395pts
  #4 — 10 jogos — 2.814pts
  #5 — 15 jogos — 2.795pts
  ... até #23 — 1 jogo — 80pts

Botão: [Jogar e Subir no Ranking]
```

---

## 9. CHAT BÍBLICO (`/bible-chat/estudo`)

```
Header: "Zeal Chat Bíblico"
Subtítulo: "Tire dúvidas, faça estudos aprofundados, entenda o contexto histórico,
  descubra significados originais e muito mais. Sua IA especializada em teologia."

Interface:
  - Input livre: "Digite sua mensagem..."
  - Enter para enviar | Shift+Enter para nova linha
  - Histórico de conversas na sidebar

Histórico recente (sidebar):
  - "Historia da arca" — 08/04/2026 • 2 mensagens
  - "Olá" — 08/04/2026 • 2 mensagens
  - Botão "Novo Chat" | Botão "Apagar conversa"
```

---

## 10. PERFIL (`/profile`)

```
Seções:
  1. Dados Pessoais (com botão Editar)
     - Nome Completo
     - Email
     - WhatsApp
     - Tipo de Conta: Free
     - Membro desde: [data]
     - "Clique na foto para alterar"

  2. Entrar em Contato
     - "Suporte via WhatsApp — Fale conosco pelo WhatsApp"

  3. Gerenciar Assinatura
     - Status: Trial Ativo
     - "Acesso completo a todas as ferramentas"
     - "7 dias restantes"
     - Progresso do trial: 0%
     - Início do trial: [data]
     - Expira em: [data + 7 dias]
     - Botão: [Assinar Agora]

  4. Notificações Push
     - Toggle: Notificações Push
     - "Você receberá lembretes diários"
     - Lista de notificações:
       • Desafio bíblico diário às 7h
       • Lembretes para manter sua sequência
       • Novidades e atualizações importantes

  5. Instalar Aplicativo (PWA)
     - "Instale o Zeal Pro na sua tela inicial para acesso rápido,
       notificações e experiência fullscreen."
     - Botão: [Instalar Zeal Pro]

  6. [Sair da conta]
```

---

## 11. SEGUNDO JOGO — COLETOR DE SÍMBOLOS (`/games`)

```
Na tela /games aparece além do Quiz:
  - "Colete símbolos cristãos que caem pela tela"
  - "Monte combos e bata recordes em 3 minutos de pura diversão"
  - 3 minutos | Ranking | Combos 10x
  - Botão: [Jogar]
  - Status: Beta
```

---

## GAPS IDENTIFICADOS — O QUE O ZEAL TEM E O LW AINDA NÃO TEM

| Funcionalidade | Zeal Pro | Living Word | Prioridade |
|---|---|---|---|
| Devocional com áudio TTS | ✅ 1:41min real | ❌ | 🔴 Crítico |
| Imagem gerada por IA no devocional | ✅ | ❌ | 🟡 Alto |
| Histórico 30+ devocionais na sidebar | ✅ | ❌ | 🔴 Crítico |
| Journaling pessoal por devocional | ✅ | ❌ | 🟡 Alto |
| Menu contextual de versículo (10 ações) | ✅ | ❌ | 🔴 Crítico |
| Highlights coloridos no versículo | ✅ | ❌ | 🔴 Crítico |
| Planos de leitura com progresso | ✅ | ❌ | 🟡 Alto |
| Streak de leitura | ✅ | ❌ | 🟡 Alto |
| Carrossel de slides da pregação | ✅ 7 slides | ❌ | 🔴 Crítico |
| Download PDF da pregação | ✅ | ✅ Parcial | 🟢 OK |
| 45 min como opção de duração | ✅ | ❌ | 🟢 Baixo |
| Tipo de pregação (7 tipos) | ✅ | ❌ | 🟡 Alto |
| Quiz com sistema XP + níveis | ✅ | ❌ | 🟡 Alto |
| Bônus diário de XP (7 dias) | ✅ | ❌ | 🟡 Alto |
| Timer no quiz | ✅ | ❌ | 🟡 Alto |
| Ranking global 3 períodos | ✅ | ❌ | 🟢 Baixo |
| O Bom Amigo full page | ✅ | ❌ | 🔴 Crítico |
| Kids com 20 personagens + imagem | ✅ | ❌ | 🟡 Alto |
| "Gerar Desenho" do personagem Kids | ✅ | ❌ | 🟢 Baixo |
| Notificações push PWA | ✅ | ❌ | 🟡 Alto |
| Instalação como PWA | ✅ | ❌ | 🟡 Alto |

## VANTAGENS DO LIVING WORD QUE O ZEAL NÃO TEM

| Funcionalidade | Living Word | Zeal Pro |
|---|---|---|
| Identidade visual acolhedora/pastoral | ✅ | ❌ Dark/tech |
| Múltiplos idiomas (PT/EN/ES) | ✅ | ❌ Só PT |
| Workspaces para equipes | ✅ | ❌ |
| Estúdio Social completo | ✅ | Parcial |
| Calendário editorial | ✅ | ❌ |
| Sistema de planos detalhado (4 tiers) | ✅ | Básico |
| Blog integrado | ✅ | ❌ |
| Estudo Bíblico estruturado (8 seções) | ✅ | Chat livre |
| Biblioteca de conteúdos salvos | ✅ | ❌ |
