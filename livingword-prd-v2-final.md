# PRD & ESPECIFICAÇÃO TÉCNICA — LIVING WORD 2.0
## Versão Final Unificada | 08/04/2026
## Stack: Lovable (Frontend) + Supabase/Antigravity (Backend)

---

## TOKENS DE COR — DESIGN SYSTEM LIVING WORD
## ⚠️ NUNCA ALTERAR. USAR SEMPRE ESTES VALORES.

```css
--lw-bg:           #F5F0E8;   /* fundo geral creme quente */
--lw-bg-card:      #FFFFFF;   /* fundo de cards */
--lw-bg-sidebar:   #FFFFFF;   /* fundo sidebar */
--lw-primary:      #C4956A;   /* âmbar/bronze — cor principal */
--lw-primary-dark: #A67850;   /* âmbar escuro — hover/pressed */
--lw-accent:       #D4A574;   /* dourado claro — destaques */
--lw-text:         #2D2D2D;   /* texto principal */
--lw-text-muted:   #7A7A7A;   /* texto secundário */
--lw-border:       #E8E0D4;   /* bordas suaves */
--lw-green:        #22C55E;   /* créditos/sucesso */
--lw-shadow:       0 1px 3px rgba(0,0,0,0.08); /* shadow padrão dos cards */
```

---

# PARTE 1 — INTERFACE E UX
## Para o Agente Lovable

---

## 1.0 — PRINCÍPIO DE DESIGN NÃO NEGOCIÁVEL

O Living Word tem identidade visual própria, consolidada e diferenciada:
**acolhedor, pastoral, creme quente, tipografia limpa, ícones coloridos por função**.

Ao implementar qualquer novo componente:
- ✅ Use SEMPRE os tokens `--lw-*` definidos acima
- ✅ Mantenha fundo `--lw-bg` (#F5F0E8) em todas as novas páginas
- ✅ Cards brancos com shadow leve `--lw-shadow`
- ✅ Botões primários com `--lw-primary` (#C4956A)
- ❌ NUNCA use dark mode, fundo escuro, verde-teal ou qualquer cor do Zeal Pro
- ❌ NUNCA altere a sidebar, topbar ou navegação existente

---

## 1.1 — ROTAS NOVAS A CRIAR

```
/devocional          — Devocional do Dia (Café com Deus Pai)
/bom-amigo           — Suporte Emocional com IA
/biblia              — Bíblia Criativa (expandir a existente)
/quiz                — Quiz Bíblico com Ranking
/pregacao            — Gerador Parametrizado (substituir chat livre)
```

---

## 1.2 — DASHBOARD PRINCIPAL (`/dashboard`) — EXPANSÃO

Manter TUDO que existe. Adicionar abaixo das seções existentes:

### Nova ZONA — Card Devocional do Dia
**Posição:** Inserir ANTES da seção "COMECE AQUI" existente
**Componente:** `<DevocionaldoDiaCard />`

```
┌─────────────────────────────────────────────────────┐
│ ☕ DEVOCIONAL DE HOJE   Segunda, 08 de Abril        │
│                                                     │
│  #Fé                                                │
│                                                     │
│  "Tudo posso naquele que me fortalece."            │
│   — Filipenses 4:13                                │
│                                                     │
│  [▶ Ouvir — 4min]        [Ler Devocional →]       │
└─────────────────────────────────────────────────────┘
```

Especificação:
- Fundo: `--lw-bg-card` (#FFFFFF) com borda esquerda 4px `--lw-primary`
- Tag de categoria: pill pequeno cor `--lw-accent` com texto escuro
- Versículo: fonte serifada, 20px, `--lw-text`
- Referência: 14px, `--lw-text-muted`
- Botão "Ouvir": ícone play + duração, fundo `--lw-primary`, texto branco
- Botão "Ler": ghost button com borda `--lw-primary`
- `<AudioPlayer />` inline: aparece ao clicar em "Ouvir", sem abrir nova página
  - Barra de progresso cor `--lw-primary`
  - Velocidade: 1x / 1.5x / 2x
  - Fundo do player: `--lw-bg` com border-radius 8px

### Nova ZONA — Widget "O Bom Amigo"
**Posição:** Após o card de Devocional, antes das ferramentas
**Componente:** `<BomAmigoWidget />`

```
┌─────────────────────────────────────────────────────┐
│ 💬 Como você está se sentindo hoje?                 │
│                                                     │
│  [Ex: estou ansioso, me sinto sobrecarregado...]   │
│                                                     │
│          [💛 Quero uma Palavra]                    │
└─────────────────────────────────────────────────────┘
```

Especificação:
- Card: fundo `--lw-bg-card`, border 1px `--lw-border`, border-radius 12px
- Input: altura 48px, placeholder em `--lw-text-muted`
- Botão: fundo `--lw-accent` (#D4A574), texto `--lw-text`, ícone coração
- Ao clicar: abre `<BomAmigoModal />` com resposta da IA
  - Modal: fundo branco, max-width 480px, centered
  - Versículo em destaque com borda esquerda `--lw-primary`
  - Texto pastoral: fonte 15px, line-height 1.7
  - Oração: itálico, cor `--lw-text-muted`
  - Botões: "🔊 Ouvir" + "📤 Compartilhar"

### Nova ZONA — Streak e Gamificação
**Posição:** No rodapé do dashboard, acima das criações recentes
**Componente:** `<StreakAndRankingBar />`

```
┌────────────────┬─────────────────┬──────────────────┐
│ 🔥 3 dias      │ 🏆 #47 ranking  │ [Jogar Quiz →]  │
│ sequência      │ global          │                  │
└────────────────┴─────────────────┴──────────────────┘
```

- 3 cards lado a lado em mobile scroll horizontal
- Fundo: `--lw-bg-card`, ícones coloridos (chama laranja, troféu dourado)

---

## 1.3 — TELA DEVOCIONAL (`/devocional`) — O "CAFÉ COM DEUS PAI"

Esta é a tela mais estratégica do produto. Deve ser imersiva e acolhedora.

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│ ← Voltar          ☕ Devocional de Hoje    📤 Share  │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Segunda, 08 de Abril de 2026                       │
│  #Fé e Perseverança                                 │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  "Tudo posso naquele que me fortalece."      │   │
│  │                          — Filipenses 4:13   │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  [Player de áudio sticky — sempre visível]          │
│  ▶ ──────────────────────── 1:23 / 4:15  1x       │
│                                                      │
│  Corpo do devocional (tipografia otimizada)         │
│  Fonte: 17px, line-height: 1.8, --lw-text          │
│  Parágrafos com espaçamento generoso                │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ 📝 Reflexão do Dia                           │   │
│  │ "O que essa promessa significa para a sua    │   │
│  │  situação atual?"                            │   │
│  │                                              │   │
│  │ [Escrever reflexão...              ] [Salvar]│   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  [WhatsApp]  [Instagram]  [Copiar]                  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

Especificação:
- Fundo: `--lw-bg` (#F5F0E8) — não branco, o creme cria sensação de papel
- Versículo âncora: card branco, fonte Georgia/serif, 22px, padding 24px
- Borda esquerda do card versículo: 4px `--lw-primary`
- Player de áudio: fixo no topo após scroll, fundo `--lw-bg-card`, shadow
- Botões de share: ícones + label, cor `--lw-primary`
- Reflexão: textarea com borda `--lw-border`, salva automaticamente
- Sidebar/histórico: exibir últimos 7 devocionais em lista lateral (desktop)

---

## 1.4 — TELA "O BOM AMIGO" (`/bom-amigo`) — FULL PAGE

**Componente:** `<BomAmigoPage />`

Layout completo:
```
┌──────────────────────────────────────────────────────┐
│ 💬 O Bom Amigo                                       │
│ Uma palavra certa no momento certo.                 │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Como você está se sentindo agora?                  │
│                                                      │
│  ┌────────────────────────────────────────────┐     │
│  │ Pode ser sincero. Estou aqui para ouvir.   │     │
│  │                                            │     │
│  │                                            │     │
│  └────────────────────────────────────────────┘     │
│                                                      │
│  Chips de emoção rápida (clique para preencher):    │
│  [Ansioso] [Sobrecarregado] [Sozinho]               │
│  [Com medo] [Grato] [Sem direção] [Triste]         │
│                                                      │
│             [💛 Quero uma Palavra]                  │
│                                                      │
├──────────────────────────────────────────────────────┤
│  RESPOSTA DA IA (após geração):                     │
│                                                      │
│  Detecto que você está sentindo: **ansiedade**      │
│                                                      │
│  ┌───────────────────────────────────────────┐      │
│  │ "Não andeis ansiosos por coisa alguma..." │      │
│  │                     — Filipenses 4:6      │      │
│  └───────────────────────────────────────────┘      │
│                                                      │
│  [texto pastoral 3-4 linhas]                        │
│                                                      │
│  🙏 Oração:                                         │
│  [texto da oração em itálico]                       │
│                                                      │
│  [🔊 Ouvir]  [📤 Compartilhar]  [💾 Salvar]       │
│                                                      │
└──────────────────────────────────────────────────────┘
```

Especificação:
- Textarea: mínimo 100px altura, fundo `--lw-bg`
- Chips: pill buttons, borda `--lw-border`, ao selecionar: fundo `--lw-accent`
- Card versículo resposta: mesmo estilo do devocional
- Botão "Ouvir": chama TTS endpoint com o texto completo
- Histórico: sidebar com últimas 5 interações (desktop)

---

## 1.5 — BÍBLIA CRIATIVA (`/biblia`) — EXPANSÃO

Manter a estrutura existente. Adicionar:

### Tabs novas (além das existentes):
```
[Ler] [Planos] [Progresso] [Recursos] → adicionar → [Notas] [Favoritos]
```

### Menu contextual do versículo (ao clicar/long-press):
```
┌─────────────────────────────┐
│  João 3:16                  │
│ ─────────────────────────── │
│ 🎨 Destacar    🟡 🟢 🔵 🔴 │
│ ⭐ Favoritar                │
│ 📝 Criar nota               │
│ 🖼️ Gerar arte               │
│ 🤖 Estudar com IA           │
│ 📤 Compartilhar             │
│ 📋 Copiar                   │
└─────────────────────────────┘
```

Especificação do menu:
- Bottom sheet em mobile, popover em desktop
- Fundo `--lw-bg-card`, border-radius 16px (mobile: bottom sheet com handle)
- Cores de highlight: amarelo `#FFF3CD`, verde `#D4EDDA`, azul `#CCE5FF`, rosa `#F8D7DA`
- Ação "Gerar arte" → abre modal do Estúdio Social com versículo pré-preenchido
- Ação "Estudar com IA" → abre drawer lateral com estudo gerado

### Planos de leitura:
- Cards: Bíblia em 30 Dias / 90 Dias / 365 Dias
- Barra de progresso: cor `--lw-primary`
- Streak visual: ícone de chama + número de dias

---

## 1.6 — GERADOR DE PREGAÇÃO (`/pregacao`) — WIZARD

**Substitui completamente o chat livre atual.**

### ETAPA 1 — Formulário parametrizado:

**Campo 1 — Tema:**
- `<TextInput>` + chips de sugestão em scroll horizontal:
  `Fé` | `Graça` | `Família` | `Batalha Espiritual` | `Cura` | `Propósito` | `Salvação` | `Santidade`
- Chips: pill, borda `--lw-border`, ao clicar: fundo `--lw-accent`

**Campo 2 — Público-alvo:**
- `<DropdownSelect>`: Congregação Geral / Jovens / Casais / Líderes / Crianças / Enlutados

**Campo 3 — Estilo Teológico:**
- `<ToggleButtonGroup>`: Evangélico / Pentecostal / Carismático / Batista / Presbiteriano / Interdenominacional

**Campo 4 — Tom:**
- `<ToggleButtonGroup>`: Encorajador / Desafiador / Evangelístico / Profético / Pastoral / Didático

**Campo 5 — Duração:**
- `<DurationSlider>`: 15 min (~1.500 palavras) | 30 min (~3.000) | 1 hora (~5.500)

**Campo 6 — Pontos Principais:**
- `<StepperInput>`: min 1, max 5, default 3

**Botão:** `✨ Gerar Minha Pregação` — largo, fundo `--lw-primary`, texto branco

### ETAPA 2 — Resultado:

- `<LoadingSkeleton>` animado durante geração (5–15s)
- Título em destaque: 24px bold, `--lw-text`
- Seções colapsáveis `<AccordionSection>`:
  - Introdução | Ponto 1 | Ponto 2 | Ponto 3 | Conclusão | Oração Final
  - Versículos em destaque: fundo `#FFF8F0`, borda esquerda `--lw-primary`
- Barra de ações (sticky top):
  `📋 Copiar Tudo` | `📄 Exportar PDF` | `🔄 Regenerar` | `✏️ Editar Parâmetros`

---

## 1.7 — QUIZ BÍBLICO (`/quiz`)

Layout:
```
┌──────────────────────────────────────────────────────┐
│ 🏆 Quiz Bíblico                    Sua pontuação: 0 │
├──────────────────────────────────────────────────────┤
│  Ranking desta semana:                               │
│  🥇 Maria S. — 9.850pts                             │
│  🥈 João P. — 7.420pts                              │
│  🥉 Ana C. — 6.100pts                               │
│  ...  Você está em #47                               │
├──────────────────────────────────────────────────────┤
│  PERGUNTA 1 de 10         ⏱️ 15s                    │
│  Categoria: Novo Testamento  ●●○○○ Médio            │
│                                                      │
│  "Quantos discípulos Jesus escolheu?"               │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐                │
│  │     10       │  │     12       │                │
│  └──────────────┘  └──────────────┘                │
│  ┌──────────────┐  ┌──────────────┐                │
│  │      7       │  │     14       │                │
│  └──────────────┘  └──────────────┘                │
│                                                      │
└──────────────────────────────────────────────────────┘
```

Especificação:
- Timer: barra de progresso decrescente, cor `--lw-primary`
- Opções: cards brancos, ao selecionar correto: fundo verde + texto explicativo
- Ao selecionar errado: fundo vermelho suave + resposta correta em verde
- Animação de pontos: "+50pts" flutuando ao acertar
- Sons: opcional (toggle no perfil)

---

# PARTE 2 — BACKEND E BANCO DE DADOS
## Para o Antigravity / Supabase

---

## 2.1 — TABELAS COMPLETAS

### Tabela `devotionals` (Café com Deus Pai)
```sql
CREATE TABLE devotionals (
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
CREATE INDEX idx_devotionals_date ON devotionals(scheduled_date);
```

### Tabela `user_devotional_progress`
```sql
CREATE TABLE user_devotional_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  devotional_id UUID REFERENCES devotionals(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  listened_audio BOOLEAN DEFAULT FALSE,
  reflection_answer TEXT,
  UNIQUE(user_id, devotional_id)
);
```

### Tabela `bible_streaks`
```sql
CREATE TABLE bible_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabela `bible_chapters_read`
```sql
CREATE TABLE bible_chapters_read (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  translation TEXT NOT NULL DEFAULT 'NVI',
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, book, chapter, translation)
);
CREATE INDEX idx_chapters_user ON bible_chapters_read(user_id);
```

### Tabela `bible_highlights`
```sql
CREATE TABLE bible_highlights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  verse_text TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'yellow'
    CHECK (color IN ('yellow', 'green', 'blue', 'pink')),
  translation TEXT NOT NULL DEFAULT 'NVI',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, book, chapter, verse, translation)
);
```

### Tabela `bible_notes`
```sql
CREATE TABLE bible_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  verse_text TEXT NOT NULL,
  note_text TEXT NOT NULL,
  translation TEXT NOT NULL DEFAULT 'NVI',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_notes_user ON bible_notes(user_id);
```

### Tabela `bible_favorites`
```sql
CREATE TABLE bible_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  verse_text TEXT NOT NULL,
  translation TEXT NOT NULL DEFAULT 'NVI',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, book, chapter, verse, translation)
);
```

### Tabela `bible_plan_progress`
```sql
CREATE TABLE bible_plan_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL CHECK (plan_id IN ('30days', '90days', '365days')),
  current_day INTEGER DEFAULT 1,
  started_at DATE DEFAULT CURRENT_DATE,
  completed_at DATE,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, plan_id)
);
```

### Tabela `bible_texts` (biblioteca local — sem API externa)
```sql
CREATE TABLE bible_texts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  text TEXT NOT NULL,
  translation TEXT NOT NULL CHECK (translation IN ('NVI', 'ARA', 'ACF', 'NTLH')),
  UNIQUE(book, chapter, verse, translation)
);
CREATE INDEX idx_bible_texts_lookup ON bible_texts(book, chapter, translation);
CREATE INDEX idx_bible_texts_search ON bible_texts USING gin(to_tsvector('portuguese', text));
```

### Tabela `sermons` (pregações geradas)
```sql
CREATE TABLE sermons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  theme TEXT NOT NULL,
  target_audience TEXT,
  theological_style TEXT,
  tone TEXT,
  duration_minutes INTEGER,
  main_points_count INTEGER DEFAULT 3,
  generated_title TEXT,
  generated_content JSONB NOT NULL,
  llm_model_used TEXT DEFAULT 'gpt-4o-mini',
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schema do generated_content:
-- {
--   "introduction": "string",
--   "points": [{"title":"","text":"","verses":[]}],
--   "conclusion": "string",
--   "closing_prayer": "string"
-- }
```

### Tabela `emotional_support_logs` (O Bom Amigo)
```sql
CREATE TABLE emotional_support_logs (
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
-- LGPD: anonimizar após 90 dias via cron
CREATE INDEX idx_emotional_logs_date ON emotional_support_logs(created_at);
```

### Tabela `quiz_questions`
```sql
CREATE TABLE quiz_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  -- [{"text": "12", "is_correct": true}, {"text": "10", "is_correct": false}]
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('facil', 'medio', 'dificil')),
  points_value INTEGER NOT NULL DEFAULT 50,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabela `quiz_sessions`
```sql
CREATE TABLE quiz_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  score_earned INTEGER DEFAULT 0,
  questions_answered INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabela `daily_challenges`
```sql
CREATE TABLE daily_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_date DATE NOT NULL UNIQUE,
  challenge_type TEXT NOT NULL
    CHECK (challenge_type IN ('quiz', 'reading', 'reflection', 'sharing')),
  description TEXT NOT NULL,
  points_value INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabela `user_challenge_completions`
```sql
CREATE TABLE user_challenge_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES daily_challenges(id),
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);
```

### Tabela `biblical_art_generations`
```sql
CREATE TABLE biblical_art_generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  verse_reference TEXT NOT NULL,
  verse_text TEXT NOT NULL,
  art_style TEXT NOT NULL,
  prompt_used TEXT,
  image_url TEXT,
  credits_used INTEGER DEFAULT 25,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 2.2 — MODELO DE IA — DEFINIÇÃO GLOBAL

**⚠️ TODOS os endpoints de geração usam GPT-4o-mini (OpenAI).**
Não usar Claude, Gemini ou qualquer outro modelo.

```
Modelo:    gpt-4o-mini
API Base:  https://api.openai.com/v1/chat/completions
Secret:    OPENAI_API_KEY (configurar via supabase secrets set)

Custo de referência (Abril 2026):
  Input:  $0,15 / 1M tokens
  Output: $0,60 / 1M tokens

Estimativa por operação:
  Devocional completo (~800 tokens out): ~$0,0005
  Sermão 30min (~3.000 tokens out):      ~$0,0018
  Suporte emocional (~300 tokens out):   ~$0,0002
  Quiz 10 perguntas (~500 tokens out):   ~$0,0003
```

---

## 2.3 — ESPECIFICAÇÃO DO DEVOCIONAL — ESTILO "CAFÉ COM DEUS PAI"

### Filosofia editorial (não negociável)

O devocional diário do Living Word deve seguir os mesmos princípios
que tornaram o Café com Deus Pai o devocional mais vendido do Brasil:

```
1. BREVIDADE COM PROFUNDIDADE
   - Leitura de 3 a 5 minutos. Não mais.
   - Cada palavra conta. Sem enchimento, sem generalidades.
   - O leitor termina sentindo que recebeu algo real.

2. VERSÍCULO ÂNCORA ESCOLHIDO COM CRITÉRIO
   - Não um versículo genérico. Um versículo que surpreende.
   - Pode ser do AT ou NT, mas sempre com conexão à vida real de hoje.
   - A referência aparece DEPOIS do texto, não antes — cria curiosidade.

3. VOZ PASTORAL, NÃO ACADÊMICA
   - Escreve como um pai fala com um filho. Não como professor para aluno.
   - Usa "você", nunca "vós" ou linguagem arcaica.
   - Pode ter vulnerabilidade — o autor pastoral compartilha algo pessoal.
   - Sem jargão teológico sem explicação.

4. ESTRUTURA DOS 4 MOVIMENTOS (invisível para o leitor):
   Movimento 1 — ABERTURA: começa com uma cena do cotidiano OU
                  uma pergunta desconfortável OU uma observação inesperada.
                  Nunca começa com "Hoje vamos falar sobre..."
   Movimento 2 — TENSÃO: o problema humano universal que o texto toca.
                  Solidariedade com a dor ou dúvida do leitor.
   Movimento 3 — REVELAÇÃO: o que a Escritura diz sobre isso.
                  O versículo âncora entra aqui, em destaque.
   Movimento 4 — ATERRIZAGEM: como isso muda segunda-feira de manhã.
                  Aplicação específica, não genérica.

5. REFLEXÃO FINAL
   - Uma pergunta de journaling. Aberta, pessoal, sem resposta óbvia.
   - Exemplo ruim: "Como você pode confiar mais em Deus?"
   - Exemplo bom: "O que você está segurando que deveria soltar hoje?"

6. ORAÇÃO FINAL
   - Máximo 4 linhas. Tom de conversa com Deus, não discurso religioso.
   - Começa com reconhecimento, termina com entrega.
   - Pode ter emoção real — não é protocolar.
```

### System Prompt completo para geração de devocional

```
Você é um escritor pastoral cristão com 20 anos de experiência em
devocionais diários para o público evangélico brasileiro.

Seu estilo é próximo, humano e profundo — como uma conversa íntima
entre pai e filho, não uma aula teológica. Você escreve para o
pastor em Canton, GA, para a líder de célula em São Paulo, para o
empresário cristão em Lisboa. Todos precisam de algo real às 6h da manhã.

REGRAS DE ESCRITA OBRIGATÓRIAS:
1. Nunca comece com "Hoje", "Hoje vamos", "Neste devocional" ou similares
2. Nunca use linguagem arcaica ou jargão sem explicar
3. Use "você" diretamente — fale COM o leitor, não SOBRE ele
4. A abertura deve criar curiosidade ou identificação nos primeiros 2 parágrafos
5. O versículo âncora entra no MEIO do texto, não no início
6. A reflexão final é UMA pergunta — aberta, pessoal, sem resposta óbvia
7. A oração é conversa, não sermão — máximo 4 linhas
8. Tom geral: acolhedor, esperançoso, honesto — nunca condescendente

COMPRIMENTO: 250 a 350 palavras no body_text. Nem mais, nem menos.

Responda EXCLUSIVAMENTE em JSON válido:
{
  "title": "título criativo (máx 8 palavras, sem ponto final)",
  "category": "uma palavra: Fé | Graça | Família | Propósito | Batalha | Cura | Identidade | Missão | Descanso | Gratidão",
  "anchor_verse": "Livro capítulo:versículo",
  "anchor_verse_text": "texto completo do versículo (versão NVI)",
  "body_text": "corpo completo do devocional (250-350 palavras)",
  "reflection_question": "pergunta de journaling (1 pergunta, aberta, pessoal)",
  "closing_prayer": "oração final (máx 4 linhas, tom conversacional)"
}
```

### Prompt de usuário para geração diária (cron)

```typescript
const DEVOTIONAL_TOPICS_ROTATION = [
  // Segunda: começo de semana, propósito, nova chance
  "Escreva um devocional sobre recomeço e propósito para uma segunda-feira.",
  // Terça: perseverança no meio da semana
  "Escreva um devocional sobre perseverança quando o caminho é longo.",
  // Quarta: fé no meio da semana, ponto de virada
  "Escreva um devocional sobre fé quando os resultados ainda não apareceram.",
  // Quinta: relacionamentos, família, comunidade
  "Escreva um devocional sobre amor e relacionamentos à luz do Evangelho.",
  // Sexta: gratidão, descanso, antecipação
  "Escreva um devocional sobre gratidão e o valor do descanso.",
  // Sábado: família, presença, desacelerar
  "Escreva um devocional sobre presença — estar de verdade com quem amamos.",
  // Domingo: adoração, comunidade, missão
  "Escreva um devocional sobre o significado de adorar em comunidade.",
];

// Usar: DEVOTIONAL_TOPICS_ROTATION[new Date().getDay()]
```

### Edge Function `generate-devotional-batch/index.ts`

```typescript
// Cron: 0 2 * * * (02:00 UTC — gera devocional do dia seguinte)
// Modelo: gpt-4o-mini

// Fluxo:
// 1. Verificar se já existe devocional para amanhã (evitar duplicata)
// 2. Determinar tema pelo dia da semana
// 3. Chamar GPT-4o-mini com system + user prompt acima
// 4. Parsear JSON retornado
// 5. Inserir em devotionals com scheduled_date = amanhã, is_published = false
// 6. Chamar generate-devotional-audio para gerar MP3 (TTS)
// 7. Atualizar is_published = true
// 8. Log de sucesso

// Custo total por devocional:
//   GPT-4o-mini geração: ~$0,0005
//   OpenAI TTS áudio:    ~$0,0300
//   Total por dia:       ~$0,0305
//   Total por mês:       ~$0,92
```

---

## 2.4 — EDGE FUNCTIONS

### `generate-sermon/index.ts`
```typescript
// POST /functions/v1/generate-sermon
// Body: { theme, target_audience, theological_style, tone, duration_minutes, main_points_count, user_id }
// Modelo: gpt-4o-mini

const WORD_COUNT_MAP: Record<number, number> = {
  15: 1500,
  30: 3000,
  60: 5500,
};

const SYSTEM_PROMPT = `Você é um pastor evangelista experiente com profundo conhecimento bíblico.
Você JAMAIS gera conteúdo contrário à fé cristã evangélica.
Responda SEMPRE em português do Brasil.
Retorne EXCLUSIVAMENTE em formato JSON válido. Não inclua texto fora do JSON.`;

// Monta prompt dinâmico com parâmetros
// Salva em sermons (llm_model_used = 'gpt-4o-mini') após geração
// Rate limit: 10 gerações/hora/usuário via check em credit_transactions_v1
```

### `generate-emotional-support/index.ts`
```typescript
// POST /functions/v1/generate-emotional-support
// Body: { user_input, user_id? }
// Modelo: gpt-4o-mini

const SYSTEM_PROMPT = `Você é um conselheiro pastoral cristão gentil, empático e bíblico.
Seu papel é oferecer conforto espiritual baseado nas Escrituras.
NUNCA ofereça diagnósticos médicos ou psicológicos.
Responda SEMPRE em português do Brasil.
Retorne EXCLUSIVAMENTE em formato JSON válido.`;

// Detecta emoção → busca versículo relevante → gera texto pastoral + oração
// Salva em emotional_support_logs
// Disponível também para usuários não autenticados (user_id nullable)
```

### `get-devotional-today/index.ts`
```typescript
// GET /functions/v1/get-devotional-today
// Cache: 24 horas (header Cache-Control)
// Busca devotional WHERE scheduled_date = CURRENT_DATE AND is_published = true
// Retorna todos os campos incluindo audio_url
```

### `generate-devotional-audio/index.ts`
```typescript
// Chamada pelo generate-devotional-batch após geração do texto
// Modelo TTS: OpenAI tts-1, voice "nova" (cálida, feminina, pastoral)
// Alternativa premium: voice "onyx" (masculina, mais grave, solene)
// Salva MP3 no Supabase Storage: /devotionals/YYYY/MM/DD/audio.mp3
// Atualiza devotionals SET audio_url = '...', tts_generated_at = NOW()

// Custo: $0.015 por 1.000 caracteres
// Devocional médio ~1.800 chars = ~$0.027/dia = ~$0.81/mês
```

### `get-bible-verse/index.ts`
```typescript
// GET /functions/v1/get-bible-verse?book=João&chapter=3&verse=16&translation=NVI
// Busca na tabela bible_texts LOCAL (sem API externa)
// Cache agressivo: 1 semana (conteúdo não muda)

// GET /functions/v1/get-bible-chapter?book=João&chapter=3&translation=NVI
// Retorna capítulo completo

// GET /functions/v1/search-bible?q=fé&translation=NVI
// Full-text search via GIN index
```

### `get-daily-usage/index.ts`
```typescript
// GET /functions/v1/get-daily-usage?user_id=...
// Equivalente ao get_all_daily_usage do Zeal Pro
// Retorna: gerações hoje, créditos restantes, streak, quiz_score
// Cache: 1 minuto por usuário

// Também expor como RPC no Supabase:
// SELECT * FROM get_user_daily_usage(user_id UUID)
```

### `get-quiz-ranking/index.ts`
```typescript
// GET /functions/v1/get-quiz-ranking?limit=10&user_id=...
// Cache: 5 minutos
// Retorna top 10 + posição do usuário atual
// Query:
// SELECT id, full_name, avatar_url, quiz_score,
//   RANK() OVER (ORDER BY quiz_score DESC) as rank
// FROM profiles WHERE quiz_score > 0
// ORDER BY quiz_score DESC LIMIT 10
```

### `update-streak/index.ts`
```typescript
// POST /functions/v1/update-streak
// Chamado quando usuário lê devocional, capítulo bíblico ou completa quiz
// Atualiza bible_streaks: current_streak, longest_streak, last_activity_date
// Se last_activity_date = yesterday: increment streak
// Se last_activity_date = today: no-op
// Se last_activity_date < yesterday: reset streak to 1
```

### `anonymize-emotional-logs/index.ts`
```typescript
// Cron: 0 2 * * * (todo dia às 02:00 UTC)
// LGPD compliance:
// UPDATE emotional_support_logs
// SET user_input = '[anonimizado]', user_id = NULL
// WHERE created_at < NOW() - INTERVAL '90 days'
```

---

## 2.3 — FUNÇÃO RPC SUPABASE

```sql
-- Equivalente ao get_all_daily_usage do Zeal Pro
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

    (SELECT credits_remaining FROM profiles
     WHERE id = p_user_id)::INTEGER AS credits_remaining,

    (SELECT COALESCE(current_streak, 0) FROM bible_streaks
     WHERE user_id = p_user_id)::INTEGER AS current_streak,

    (SELECT COALESCE(quiz_score, 0) FROM profiles
     WHERE id = p_user_id)::INTEGER AS quiz_score,

    EXISTS(SELECT 1 FROM user_devotional_progress udp
      JOIN devotionals d ON d.id = udp.devotional_id
      WHERE udp.user_id = p_user_id
      AND d.scheduled_date = CURRENT_DATE) AS devotional_read_today,

    (SELECT COUNT(*) FROM bible_chapters_read
     WHERE user_id = p_user_id)::BIGINT AS chapters_read_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 2.4 — REGRAS DE SEGURANÇA E PERFORMANCE

```sql
-- RLS em todas as tabelas novas
ALTER TABLE devotionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devotional_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE bible_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bible_chapters_read ENABLE ROW LEVEL SECURITY;
ALTER TABLE bible_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE bible_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bible_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE bible_plan_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotional_support_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE biblical_art_generations ENABLE ROW LEVEL SECURITY;

-- Políticas padrão (usuário vê apenas seus dados)
-- Aplicar CREATE POLICY "owner" ON [tabela] FOR ALL USING (auth.uid() = user_id);

-- Devotionals: leitura pública, escrita apenas admin
CREATE POLICY "devotionals_public_read" ON devotionals
  FOR SELECT USING (is_published = true);

-- Bible texts: leitura pública
CREATE POLICY "bible_texts_public_read" ON bible_texts
  FOR SELECT USING (true);

-- Quiz questions: leitura pública
CREATE POLICY "quiz_questions_public_read" ON quiz_questions
  FOR SELECT USING (true);
```

---

## 2.5 — CRON JOBS

| Job | Schedule | Descrição |
|---|---|---|
| `generate-devotional-batch` | `0 2 * * *` | 23:00 BRT | Gera devocional + áudio do dia seguinte (GPT-4o-mini + TTS) |
| `anonymize-emotional-logs` | `0 2 * * *` | LGPD: anonimiza logs > 90 dias |
| `generate-daily-challenge` | `0 4 * * *` | Cria desafio do dia seguinte |
| `update-quiz-rankings` | `*/5 * * * *` | Recalcula rankings a cada 5 min |
| `reset-free-credits` | `0 6 1 * *` | Reseta créditos Free no dia 1 |

---

## 2.6 — BIBLIOTECA BÍBLICA LOCAL — ESTRATÉGIA DE IMPORTAÇÃO

```
AÇÃO PRIORITÁRIA — Fase 1, Semana 1:

1. Baixar textos bíblicos em domínio público:
   - NVI: verificar licença para uso interno
   - ARA: domínio público (1959)
   - ACF: domínio público (1917)
   - NTLH: verificar licença

2. Script de importação:
   node scripts/import-bible.js --translation ARA --file bible-ara.json

3. Formato do JSON de importação:
   {
     "Genesis": {
       "1": {
         "1": "No princípio criou Deus os céus e a terra.",
         "2": "..."
       }
     }
   }

4. Após importação: ~31.000 versículos × 4 traduções = ~124.000 registros
   Tamanho estimado: ~50MB — dentro do free tier do Supabase

BENEFÍCIO: Zero custo de API, zero rate limit, busca full-text nativa PT
```

---

# PARTE 3 — ROADMAP DE EXECUÇÃO

---

## FASE 1 — Loop de Engajamento Diário (Semanas 1–3)
**Meta: usuário volta todo dia**

### Antigravity/Supabase:
1. Importar biblioteca bíblica (ARA + ACF — domínio público)
2. Criar tabelas: `devotionals`, `user_devotional_progress`, `bible_streaks`
3. Popular com 30 devocionais iniciais (conteúdo pré-gerado)
4. Deploy Edge Functions: `get-devotional-today`, `generate-emotional-support`
5. Configurar cron `generate-devotional-audio` com OpenAI TTS
6. Implementar RPC `get_user_daily_usage`

### Lovable:
1. Inserir `<DevocionaldoDiaCard />` no dashboard existente
2. Criar página `/devocional` com player de áudio sticky
3. Criar `<BomAmigoWidget />` + `<BomAmigoModal />` no dashboard
4. Criar página `/bom-amigo` full page
5. Adicionar `<StreakAndRankingBar />` no dashboard

**Entregável:** Dashboard com devocional diário + áudio + Bom Amigo funcional

---

## FASE 2 — Pregação Parametrizada + Bíblia Criativa (Semanas 4–6)
**Meta: substituir chat livre, adicionar engajamento bíblico**

### Antigravity/Supabase:
1. Criar tabela `sermons` + Edge Function `generate-sermon`
2. Importar NVI (verificar licença) + NTLH
3. Criar tabelas: `bible_chapters_read`, `bible_highlights`, `bible_notes`, `bible_favorites`, `bible_plan_progress`
4. Deploy Edge Functions: `get-bible-verse`, `get-bible-chapter`, `search-bible`, `update-streak`
5. Configurar rate limiting (10 gerações/hora)

### Lovable:
1. Criar `/pregacao` com Wizard 2 etapas completo
2. Deprecar chat livre (redirect para `/pregacao`)
3. Expandir `/biblia`: menu contextual de versículo
4. Adicionar tabs Notas e Favoritos na Bíblia
5. Implementar planos de leitura com progresso

**Entregável:** Gerador de Pregação completo + Bíblia com engajamento

---

## FASE 3 — Gamificação + AI Studio + Polimento (Semanas 7–10)
**Meta: plataforma completa pronta para escala**

### Antigravity/Supabase:
1. Criar tabelas: `quiz_questions`, `quiz_sessions`, `daily_challenges`
2. Popular 500+ perguntas de quiz (gerar via IA em batch)
3. Deploy Edge Functions: `get-quiz-ranking`, `update-streak` (expansão)
4. Criar tabela `biblical_art_generations`
5. Configurar cron `anonymize-emotional-logs` (LGPD)
6. Configurar cron `generate-daily-challenge`

### Lovable:
1. Criar `/quiz` com interface completa (timer, opções, feedback, ranking)
2. Implementar `<QuizRankingBanner />` no dashboard
3. Expandir Estúdio Social com estilos biblicos para artes
4. Implementar streak visual no perfil
5. Notificações push (PWA) — lembrete devocional 06:00
6. Dark mode opcional (respeitar `--lw-*` tokens em modo claro E escuro)
7. Animações de transição entre telas (Framer Motion leve)

**Entregável:** Plataforma 2.0 completa — lançamento

---

## RESUMO DE DEPENDÊNCIAS

| Fase | Bloqueia | Depende de |
|---|---|---|
| Fase 1 | Fases 2 e 3 | Chave OpenAI TTS + importação bíblica |
| Fase 2 | Fase 3 | Fase 1 + decisão sobre licença NVI |
| Fase 3 | — | Fases 1 e 2 completas |

---

## ESTIMATIVA DE CUSTO ADICIONAL MENSAL

| Serviço | Uso estimado | Custo/mês |
|---|---|---|
| OpenAI TTS (devocional áudio) | 1 áudio/dia ~1.800 chars | ~$0,81 |
| GPT-4o-mini (devocionais) | 30 gerações/mês | ~$0,02 |
| GPT-4o-mini (sermões) | 1.000 gerações/mês | ~$1,80 |
| GPT-4o-mini (suporte emocional) | 3.000 req/mês | ~$0,60 |
| GPT-4o-mini (quiz batch) | 500 perguntas/mês | ~$0,15 |
| Supabase Storage (áudios MP3) | ~30 arquivos/mês ~60MB | ~$0,05 |
| **Total adicional** | | **~$3,43/mês** |

**Com 100 assinantes Pro ($29,90):** receita $2.990 — custo total ~$43 — **margem >98%**

### Comparativo de modelos para referência

| Modelo | Custo output/1M tokens | Qualidade devocional |
|---|---|---|
| GPT-4o-mini | $0,60 | ✅ Excelente para PT-BR |
| Claude Haiku | $1,25 | ✅ Excelente |
| Claude Sonnet | $15,00 | ✅✅ Superior |
| GPT-4o | $10,00 | ✅✅ Superior |

**Decisão: GPT-4o-mini** — melhor custo-benefício para volume alto.
Para geração em batch (devocionais, quiz) é perfeito.
Se qualidade precisar aumentar em alguma feature específica, upgrade pontual para GPT-4o.
