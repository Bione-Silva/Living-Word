# LIVING WORD 2.0 — PLANO DE IMPLANTAÇÃO LOVABLE
## Guia completo ferramenta por ferramenta
## Versão 1.0 | 08/04/2026

---

## ⚠️ REGRAS ABSOLUTAS — LER ANTES DE QUALQUER COISA

```
1. NUNCA alterar cores, tipografia ou identidade visual existente
2. NUNCA mexer em telas que já funcionam
3. NUNCA usar dark mode, verde-teal ou qualquer cor do Zeal Pro
4. SEMPRE usar os tokens --lw-* definidos abaixo
5. SEMPRE adicionar componentes novos SEM quebrar os existentes
6. Backend (Edge Functions + Supabase) JÁ ESTÁ PRONTO — apenas consumir APIs
```

### Tokens de cor obrigatórios
```css
--lw-bg:           #F5F0E8   /* creme quente — fundo de todas as páginas */
--lw-bg-card:      #FFFFFF   /* cards e painéis */
--lw-primary:      #C4956A   /* âmbar — cor principal, botões, destaques */
--lw-primary-dark: #A67850   /* hover e estados pressed */
--lw-accent:       #D4A574   /* dourado claro — badges, chips ativos */
--lw-text:         #2D2D2D   /* texto principal */
--lw-text-muted:   #7A7A7A   /* texto secundário */
--lw-border:       #E8E0D4   /* bordas suaves */
--lw-shadow:       0 1px 3px rgba(0,0,0,0.08)
```

---

## VISÃO GERAL — O QUE SERÁ CONSTRUÍDO

O documento do Antigravity confirma que o backend está 100% pronto.
O Lovable só precisa construir as interfaces que consomem essas APIs.

### Status atual (o que já existe no LW)
```
✅ Dashboard com ferramentas
✅ Gerador de Sermão (chat livre)
✅ Estudo Bíblico estruturado
✅ Blog & Artigos
✅ Estúdio Social
✅ Sidebar reorganizada (8 itens)
✅ Sistema de planos + créditos
```

### O que será construído (este documento)
```
MÓDULO 1 — Devocional do Dia           /devocional
MÓDULO 2 — O Bom Amigo                 /bom-amigo
MÓDULO 3 — Bíblia Criativa expandida   /biblia (expansão)
MÓDULO 4 — Carrossel de Pregação       /pregacao (expansão)
MÓDULO 5 — Quiz Bíblico                /quiz
MÓDULO 6 — Kids                        /kids
MÓDULO 7 — Dashboard expandido         /dashboard (expansão)
```

---

# MÓDULO 1 — DEVOCIONAL DO DIA
## Rota: `/devocional`

### O que é
O "Café com Deus Pai" do Living Word. Conteúdo gerado diariamente pela IA
com texto pastoral, áudio TTS de ~2 minutos, imagem de capa e journaling.
É o principal mecanismo de retenção diária da plataforma.

### API disponível (já pronta no backend)
```
GET /functions/v1/get-devotional-today
Retorna: { id, title, category, anchor_verse, anchor_verse_text,
           body_text, audio_url, audio_duration_seconds,
           reflection_question, scheduled_date }
```

---

### TELA 1A — CARD NO DASHBOARD (adicionar ao dashboard existente)

**Posição:** Logo após o header de saudação, ANTES da seção "COMECE AQUI"

**Visual:**
```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  ☕  DEVOCIONAL DE HOJE         Quarta, 08 de Abril  →      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ #Santidade                                           │   │
│  │                                                      │   │
│  │  "Sejam santos, porque eu sou santo."               │   │
│  │                          — 1 Pedro 1:15-16          │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  [▶ Ouvir — 1min41s]              [Ler Devocional →]        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Especificação técnica:**
- Container: `bg-card rounded-2xl p-5 border-l-4 shadow-sm`
- Borda esquerda: 4px solid `--lw-primary` (#C4956A)
- Label "☕ DEVOCIONAL DE HOJE": 11px uppercase tracking-wider `--lw-text-muted`
- Data + seta →: link para `/devocional`, 12px `--lw-text-muted`
- Card versículo interno: `bg-[#FFF8F0] rounded-xl p-4`
- Categoria pill: `bg-[--lw-accent]/20 text-[--lw-primary] text-xs px-2 py-0.5 rounded-full`
- Versículo: Georgia/serif, 17px, `--lw-text`, line-height 1.7
- Referência: 13px, `--lw-text-muted`, text-right
- Botão "Ouvir": `bg-[--lw-primary] text-white rounded-lg px-4 py-2 text-sm`
  - Ícone play (Lucide: Play, 14px) + "Ouvir — {duração}"
  - AO CLICAR: expande player inline abaixo do card (não navega)
- Botão "Ler Devocional": ghost, `border border-[--lw-primary] text-[--lw-primary] rounded-lg px-4 py-2 text-sm`
  - Navega para `/devocional`

**Player inline (aparece ao clicar "Ouvir"):**
```
┌──────────────────────────────────────────────┐
│ ▶  ──────────────────────  0:23 / 1:41  1x  │
└──────────────────────────────────────────────┘
```
- Fundo: `bg-[--lw-bg] rounded-xl p-3 mt-2`
- Barra de progresso: `--lw-primary`, height 3px, cursor pointer
- Velocidade toggle: 1x → 1.5x → 2x (cicla ao clicar)
- Usa elemento `<audio>` HTML nativo com `src={audio_url}`

**Chamada de API:**
```typescript
const { data } = await supabase.functions.invoke('get-devotional-today');
// Exibir dados no card
// Se audio_url existir: mostrar botão Ouvir
// Se não existir: mostrar apenas botão Ler
```

---

### TELA 1B — PÁGINA COMPLETA `/devocional`

**Layout:** Página de leitura imersiva. Fundo `--lw-bg` (não branco — o creme cria sensação de papel).

**Estrutura completa:**

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER (sticky)                                             │
│ ← Devocional    ☕ Devocional de Hoje    [Compartilhar ↗]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Quarta, 08 de Abril de 2026                               │
│  ●  Santidade                                               │
│                                                             │
│  Ande na verdade diante de Deus                            │
│  (título grande, serif, 28px)                              │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  "Mas, assim como é santo aquele que os chamou,    │   │
│  │  sejam santos vocês também em tudo o que fizerem,  │   │
│  │  pois está escrito: 'Sejam santos, porque eu       │   │
│  │  sou santo'."                                      │   │
│  │                                                     │   │
│  │                              — 1 Pedro 1:15-16     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ▶  ──────────────────  0:00 / 1:41  1x            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Imagem de capa gerada por IA — 16:9, rounded-2xl]        │
│  [Salvar Imagem] [Compartilhar] [WhatsApp]                 │
│                                                             │
│  ────────────────── REFLEXÃO ──────────────────            │
│                                                             │
│  [Corpo do devocional — 250-350 palavras]                  │
│  Fonte: 17px, line-height: 1.9, --lw-text                  │
│  Parágrafos com margin-bottom: 20px                        │
│                                                             │
│  ────────────────── PRÁTICA DO DIA ──────────────────      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🎯  [texto da prática do dia]                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Copiar] [Compartilhar] [Continuar no Chat]               │
│                                                             │
│  ────────────────── MINHA REFLEXÃO ──────────────────      │
│  [Pergunta de journaling em itálico]                       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Escreva suas reflexões pessoais...                  │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                        [Salvar Reflexão]                   │
│                                                             │
│  ────────────────── DEVOCIONAIS ANTERIORES ──────────      │
│  [Lista de 30+ devocionais com título + categoria + data]  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Especificações de cada elemento:**

**Header sticky:**
- `bg-[--lw-bg]/95 backdrop-blur-sm border-b border-[--lw-border]`
- Altura: 56px
- Botão voltar: ChevronLeft icon + "Devocional"
- Título: "☕ Devocional de Hoje" centralizado, 14px semibold
- Botão share: Share2 icon (Lucide)

**Data + categoria:**
- Data: 13px `--lw-text-muted`
- Categoria: pill `bg-[--lw-accent]/20 text-[--lw-primary]` com bolinha colorida

**Título do devocional:**
- Font: Georgia ou Lora (serif), 28px, `--lw-text`, font-weight 600
- Line-height: 1.3
- Margin-bottom: 24px

**Card do versículo âncora:**
- `bg-white rounded-2xl p-6 border-l-4 border-[--lw-primary] shadow-sm`
- Texto versículo: Georgia/serif, 19px, `--lw-text`, line-height: 1.8
- Aspas tipográficas: " e "
- Referência: 13px `--lw-text-muted`, text-right, margin-top: 8px

**Player de áudio:**
- `bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm`
- Botão play/pause: círculo 40px `bg-[--lw-primary]`, ícone branco
- Barra de progresso: `bg-[--lw-border] h-1 rounded-full` com `bg-[--lw-primary]` progresso
- Tempo: "0:00 / 1:41" em mono 12px `--lw-text-muted`
- Velocidade: "1x" clickável → "1.5x" → "2x"

**Imagem de capa:**
- `w-full aspect-video rounded-2xl object-cover` — ratio 16:9
- Botões abaixo: row com gap-2
  - [💾 Salvar]: ghost pequeno
  - [Compartilhar]: ghost pequeno
  - [WhatsApp]: bg-green-500/10 text-green-700 pequeno

**Corpo do texto:**
- Container: `max-w-prose mx-auto`
- Fonte: Inter/system, 17px, line-height: 1.9, `--lw-text`
- Parágrafos: margin-bottom 20px
- NÃO usar fonte serif no corpo — apenas no versículo

**Card Prática do Dia:**
- `bg-[--lw-accent]/10 border border-[--lw-accent]/30 rounded-xl p-4`
- Ícone 🎯 + título "Prática do Dia" em 12px uppercase `--lw-primary`
- Texto: 15px `--lw-text`

**Seção de Journaling:**
- Label: "✍️ Minha Reflexão Pessoal" em 14px semibold
- Pergunta de reflexão: itálico, 15px, `--lw-text-muted`, margin-bottom 12px
- Textarea: `bg-white border border-[--lw-border] rounded-xl p-4 min-h-[100px] w-full`
- Botão Salvar: `bg-[--lw-primary] text-white rounded-lg px-4 py-2`
- Salva via: `supabase.from('user_devotional_progress').upsert({ reflection_answer: texto })`

**Lista de Devocionais Anteriores:**
- Título seção: "📅 Devocionais Anteriores"
- Cada item: `flex items-center justify-between py-3 border-b border-[--lw-border]`
  - Esquerda: título (14px semibold) + categoria (pill pequeno)
  - Direita: data (12px `--lw-text-muted`)
- Ao clicar: busca o devocional pelo ID e renderiza na mesma página
- Mostrar 30 itens, botão "Ver todos" para carregar mais

**Chamadas de API:**
```typescript
// Buscar devocional de hoje
GET /functions/v1/get-devotional-today

// Buscar histórico
supabase.from('devotionals')
  .select('id, title, category, scheduled_date, anchor_verse')
  .eq('is_published', true)
  .order('scheduled_date', { ascending: false })
  .limit(30)

// Salvar reflexão
supabase.from('user_devotional_progress').upsert({
  user_id: user.id,
  devotional_id: devotional.id,
  reflection_answer: texto,
  read_at: new Date().toISOString()
})

// Atualizar streak ao ler
POST /functions/v1/update-streak
Body: { user_id, activity_type: 'devotional' }
```

---

# MÓDULO 2 — O BOM AMIGO
## Rota: `/bom-amigo`

### API disponível
```
POST /functions/v1/generate-emotional-support
Body: { user_input: string, user_id?: string }
Retorna: { detected_emotion, anchor_verse, anchor_verse_text,
           comfort_text, closing_prayer, audio_url? }
```

---

### TELA 2A — WIDGET NO DASHBOARD

**Posição:** Após o card do Devocional, antes da seção "COMECE AQUI"

```
┌──────────────────────────────────────────────────────────────┐
│ 💬 Como você está se sentindo hoje?                          │
│                                                              │
│  [Ex: estou ansioso, me sinto sobrecarregado...]            │
│                                                              │
│  [Ansioso] [Sobrecarregado] [Grato] [Com medo] [Triste]    │
│                                                              │
│                    [💛 Quero uma Palavra]                   │
└──────────────────────────────────────────────────────────────┘
```

**Especificação:**
- Card: `bg-white rounded-2xl p-5 border border-[--lw-border] shadow-sm`
- Label: "💬 Como você está se sentindo hoje?" — 15px semibold `--lw-text`
- Input: `bg-[--lw-bg] border border-[--lw-border] rounded-xl p-3 w-full text-sm`
- Chips de emoção rápida: `flex flex-wrap gap-2 mt-2`
  - Cada chip: `bg-[--lw-bg] border border-[--lw-border] rounded-full px-3 py-1 text-xs cursor-pointer`
  - Chip selecionado: `bg-[--lw-accent]/20 border-[--lw-primary] text-[--lw-primary]`
  - Ao clicar: preenche o input automaticamente
- Botão CTA: `bg-[--lw-accent] text-[--lw-text] rounded-xl px-6 py-2.5 w-full font-medium mt-3`
- AO CLICAR: chama API e abre `<BomAmigoModal />`

**Modal de resposta:**
```
┌──────────────────────────────────────────────────┐
│ 💛 Uma Palavra para Você              [✕]         │
├──────────────────────────────────────────────────┤
│                                                  │
│  Detectamos: ansiedade                           │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │ "Por isso não tema, pois estou com você;  │  │
│  │  não tenha medo, pois sou o seu Deus."    │  │
│  │                          — Isaías 41:10   │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  [texto pastoral 3-4 linhas conectando          │
│   o versículo à situação do usuário]            │
│                                                  │
│  🙏 Oração:                                      │
│  [oração em itálico, 3-4 linhas]                │
│                                                  │
│  [🔊 Ouvir]  [📤 Compartilhar]  [Ver mais →]   │
│                                                  │
└──────────────────────────────────────────────────┘
```
- Modal: `max-w-sm w-full bg-white rounded-2xl p-6 shadow-xl`
- Card versículo: `bg-[#FFF8F0] border-l-4 border-[--lw-primary] rounded-r-xl p-4`
- Texto pastoral: 15px, line-height 1.8, `--lw-text`
- Oração: itálico, 14px, `--lw-text-muted`
- "Ver mais →": link para `/bom-amigo`

---

### TELA 2B — PÁGINA COMPLETA `/bom-amigo`

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER: ← Voltar    💬 O Bom Amigo                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  💬 O Bom Amigo                                            │
│  Uma palavra certa no momento certo.                       │
│                                                             │
│  Como você está se sentindo agora?                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Pode ser sincero. Estou aqui para ouvir.            │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Chips: [Ansioso][Sobrecarregado][Sozinho][Com medo]       │
│         [Grato][Sem direção][Triste][Cansado]              │
│                                                             │
│              [💛 Quero uma Palavra]                        │
│                                                             │
├── RESPOSTA (após geração) ──────────────────────────────────┤
│                                                             │
│  Você disse: "estou ansioso e com medo do futuro"          │
│  ─────────────────────────────────────────────────         │
│                                                             │
│  Detectamos: Ansiedade                                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ "Por isso não tema, pois estou com você..."         │   │
│  │                               — Isaías 41:10       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [texto pastoral completo — 4-6 linhas]                    │
│                                                             │
│  🙏 Oração                                                 │
│  [oração em itálico]                                       │
│                                                             │
│  [🔊 Ouvir]  [📋 Copiar]  [📤 Compartilhar]              │
│                                                             │
│  ─────── Como foi essa palavra para você? ──────           │
│  [👍 Me ajudou]  [💛 Foi lindo]  [🙏 Obrigado]            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Compartilhe mais sobre como está se sentindo...     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Especificações:**
- Página: `bg-[--lw-bg] min-h-screen`
- Título "O Bom Amigo": Georgia/serif, 26px, `--lw-text`
- Subtítulo: 14px `--lw-text-muted`
- Textarea: `bg-white border border-[--lw-border] rounded-2xl p-4 min-h-[80px] w-full`
- Loading state: skeleton com pulso + "Buscando uma palavra para você..."
- Feedback chips (👍💛🙏): `flex gap-2 mt-4`
  - Cada chip: `bg-[--lw-bg] border border-[--lw-border] rounded-full px-4 py-2 text-sm`
- Campo de continuidade: aparece após resposta para seguir conversando
- Histórico local (sessionStorage): últimas 3 interações visíveis

---

# MÓDULO 3 — BÍBLIA CRIATIVA EXPANDIDA
## Rota: `/biblia` (expansão da tela existente)

### O que adicionar (sem quebrar o que existe)

**3A — Menu contextual do versículo**

Ao clicar em qualquer versículo na leitura, exibir bottom sheet (mobile)
ou popover (desktop):

```
Mobile — Bottom Sheet:
┌────────────────────────────────────────┐
│  ▬▬▬  (handle)                         │
│                                        │
│  João 3:16                            │
│  "Porque Deus amou o mundo..."        │
│  ──────────────────────────────────── │
│                                        │
│  Destacar:  🟡  🟢  🔵  🔴            │
│                                        │
│  ⭐ Favoritar     📝 Criar nota        │
│  📋 Copiar        📤 Compartilhar      │
│  🎨 Gerar arte    🤖 Estudar com IA   │
│  ☑️ Selecionar múltiplos versículos    │
│                                        │
└────────────────────────────────────────┘
```

**Especificação:**
- Bottom sheet: `fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl p-5 z-50`
- Handle: `w-10 h-1 bg-[--lw-border] rounded-full mx-auto mb-4`
- Referência do versículo: 12px `--lw-text-muted`
- Texto do versículo (preview): 14px, max 2 linhas, `--lw-text`
- Separador: `border-t border-[--lw-border] my-3`
- Linha de highlights: `flex gap-3 items-center`
  - Label "Destacar:": 12px `--lw-text-muted`
  - Círculos de cor: 28px, rounded-full, borda 2px white + shadow
  - Amarelo: `#FFF3CD` | Verde: `#D4EDDA` | Azul: `#CCE5FF` | Vermelho: `#F8D7DA`
- Grid de ações 2x3: `grid grid-cols-2 gap-2`
  - Cada ação: `flex items-center gap-2 p-3 rounded-xl bg-[--lw-bg] text-sm`
  - Hover: `bg-[--lw-accent]/10`

**Comportamento de cada ação:**
```typescript
// Highlight
supabase.from('bible_highlights').upsert({
  user_id, book, chapter, verse, verse_text, color, translation
})
// Visualmente: adicionar classe de cor ao elemento do versículo

// Favoritar
supabase.from('bible_favorites').insert({ user_id, book, chapter, verse, verse_text, translation })

// Criar nota → abre drawer lateral com textarea

// Gerar arte → navega para /artes com versículo pré-preenchido
// OU abre modal do Estúdio Social com versículo

// Estudar com IA → abre drawer com estudo gerado pela API

// Selecionar múltiplos → entra em modo de seleção múltipla
```

**3B — Tabs novas: Notas e Favoritos**

Adicionar 2 tabs extras na navegação da Bíblia:
```
[Ler] [Planos] [Progresso] [Recursos] [📝 Notas] [⭐ Favoritos]
```

Tab Notas:
- Lista de notas criadas por versículo
- Cada item: referência + texto da nota + data
- Botão editar/excluir por nota

Tab Favoritos:
- Grid de versículos favoritos
- Cada item: referência + texto + tradução + data
- Botão remover favorito

**3C — Planos de leitura com progresso visual**

Expandir a tab "Planos" existente com:
- Progresso real (% de capítulos lidos do plano)
- Barra de progresso `--lw-primary`
- Próximo capítulo para ler
- Streak de dias no plano
- Botão "Continuar leitura" → vai direto para o próximo capítulo

---

# MÓDULO 4 — CARROSSEL DE PREGAÇÃO
## Expansão da rota existente de Sermão

### O que fazer
Após a geração de um sermão, adicionar o botão "Gerar Carrossel de Slides"
e criar o componente visual do carrossel.

### Botões pós-geração (adicionar aos existentes)
```
[📋 Copiar]  [📤 WhatsApp]  [🎠 Gerar Carrossel]  [📄 PDF]  [🔄 Regenerar]
```

### Componente Carrossel `<SermonCarousel />`

Aparece abaixo dos botões quando o usuário clica "Gerar Carrossel":

```
┌────────────────────────────────────────────────────────────┐
│ 🎠 Carrossel de Slides    7 slides                         │
│                                                            │
│ [🖼️ Background] [🔄 Nova Variação]    [4:5]  [16:9]  [✕] │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────────────────────┐  Slides do Carrossel │
│  │                                  │  ┌───┐┌───┐┌───┐    │
│  │   Preview do slide atual         │  │ 1 ││ 2 ││ 3 │    │
│  │   (grande, 60% da largura)       │  └───┘└───┘└───┘    │
│  │                                  │  ┌───┐┌───┐┌───┐    │
│  │        3/7                       │  │ 4 ││ 5 ││ 6 │    │
│  └──────────────────────────────────┘  └───┘└───┘└───┘    │
│                                        ┌───┐               │
│  ← anterior  ● ● ● ● ● ● ●  próximo → │ 7 │               │
│                                        └───┘               │
│                                                            │
│  PREGAÇÃO • Slide 1 de 7                                   │
│  "A Fé que Vence o Medo"                                   │
│  📖 2 Timóteo 1:7 • 1920x1080px PNG                        │
│                                                            │
│        [⬇️ Slide]  [⬇️ Baixar Todos]  [📤 Enviar]         │
└────────────────────────────────────────────────────────────┘
```

### Como gerar os 7 slides automaticamente

O conteúdo do sermão já vem estruturado. Montar os slides assim:

```typescript
interface Slide {
  label: string;
  title: string;
  subtitle?: string;
  reference?: string;
}

function buildSlides(sermon: GeneratedSermon): Slide[] {
  return [
    {
      label: 'PREGAÇÃO',
      title: sermon.generated_title,
      reference: sermon.theme
    },
    {
      label: 'VERSÍCULO BASE',
      title: sermon.content.introduction.split('.')[0], // primeira frase
      reference: extrairReferencia(sermon.content.introduction)
    },
    {
      label: 'CONTEXTO',
      title: sermon.content.introduction.split('.')[1]?.trim() || '',
    },
    ...sermon.content.points.map((point, i) => ({
      label: `PONTO ${i + 1}`,
      title: point.title,
      subtitle: point.verses[0] || ''
    })),
    {
      label: 'APLICAÇÃO',
      title: 'Coloque em prática',
      subtitle: sermon.content.points[sermon.content.points.length - 1]?.title
    },
    {
      label: 'CONCLUSÃO',
      title: sermon.content.conclusion.split('.')[0]
    }
  ].slice(0, 7);
}
```

### Renderização visual de cada slide

Cada slide é um `<div>` com HTML/CSS que gera a arte.
Para download: usar `html2canvas` (já está no projeto).

```typescript
// Estilos do slide — usando as cores do Living Word
const slideStyles = {
  '1:1': { width: 1080, height: 1080 },
  '4:5': { width: 1080, height: 1350 },
  '16:9': { width: 1920, height: 1080 }
}

// Template visual do slide (adaptar identidade LW)
// Fundo: gradiente warm --lw-primary/#C4956A → --lw-primary-dark/#A67850
// Label: uppercase, tracking-widest, branco 60%
// Título: serif, branco, grande
// Referência bíblica: branco 70%, menor
// Logo LW: canto inferior
```

**Especificação visual dos slides (identidade Living Word):**
```
Fundo: gradiente linear 135deg
  from: #C4956A (--lw-primary)
  to:   #7A5230 (mais escuro)

OU fundo escuro com texto claro:
  Fundo: #2D2D2D com overlay de textura sutil
  Texto: #FFFFFF principal, #D4A574 (--lw-accent) para destaques

Label (ex: "PONTO 1"):
  - Uppercase, letter-spacing: 0.25em, 12px
  - Cor: rgba(255,255,255,0.6)
  - Border-left: 2px solid --lw-accent

Título:
  - Georgia/Lora serif, bold
  - Tamanho: adaptativo (menor se texto longo)
  - Cor: #FFFFFF

Referência bíblica:
  - 14px, cor: rgba(255,255,255,0.75), itálico

Logo Living Word:
  - Canto inferior direito
  - 24px, rgba(255,255,255,0.5)

Background option (quando usuário clica "Background"):
  - Abre picker com 6 gradientes predefinidos nas cores LW
```

**Download:**
```typescript
import html2canvas from 'html2canvas';

const downloadSlide = async (slideRef: HTMLElement, format: string) => {
  const dims = slideStyles[format];
  const canvas = await html2canvas(slideRef, {
    width: dims.width,
    height: dims.height,
    scale: 2
  });
  const link = document.createElement('a');
  link.download = `slide-${slideIndex}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};

const downloadAll = async () => {
  for (const slide of slides) {
    await downloadSlide(slideRefs[slide.index], format);
    await new Promise(r => setTimeout(r, 200)); // evitar travamento
  }
};
```

---

# MÓDULO 5 — QUIZ BÍBLICO
## Rota: `/quiz`

### APIs disponíveis
```
GET /functions/v1/get-quiz-ranking?limit=10&user_id=X
POST /functions/v1/update-streak (após completar quiz)
supabase.from('quiz_questions').select()...
supabase.from('quiz_sessions').insert()...
```

---

### TELA 5A — HUB DO QUIZ `/quiz`

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER: 🏆 Quiz Bíblico                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Iniciante →  Aprendiz                             │   │
│  │  ████░░░░░░░░░░░  0 / 1.000 XP                    │   │
│  │  0 partidas  •  🔥 0 sequência  •  Melhor: 0      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────── BÔNUS DIÁRIO ──────────────────────────┐    │
│  │  Resgate seu XP de hoje!                           │    │
│  │  1    2    3    4    5    6   🎁7                  │    │
│  │ +10  +15  +20  +25  +35  +50  +100                │    │
│  │                                                    │    │
│  │          [RESGATAR DIA 1 (+10 XP)]                │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
│           [⚡ Jogar Agora]    [📅 Desafio Diário]          │
│                                                             │
│  ┌──────────── TOP 3 ──────────────────────────────────┐   │
│  │  🥇 Jogador 1  •  48.263 pts                       │   │
│  │  🥈 Jogador 2  •  42.830 pts                       │   │
│  │  🥉 Jogador 3  •  7.395 pts                        │   │
│  │                       [Ver Ranking Completo →]     │   │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Especificações:**
- Card de stats: `bg-white rounded-2xl p-5 shadow-sm`
- Barra de XP: `bg-[--lw-border] h-2 rounded-full overflow-hidden`
  - Progress: `bg-[--lw-primary] h-full rounded-full transition-all`
- Nível: badge `bg-[--lw-accent]/20 text-[--lw-primary] text-xs px-2 py-0.5`

- Card bônus diário: `bg-[--lw-primary]/5 border border-[--lw-primary]/20 rounded-2xl p-5`
  - Círculos dos dias: 36px, `bg-white border-2 border-[--lw-border] rounded-full`
  - Dia atual: `border-[--lw-primary] bg-[--lw-primary]/10`
  - Dias completos: `bg-[--lw-primary] border-[--lw-primary]` + checkmark branco
  - Dia 7 (🎁): dourado especial
  - Botão resgatar: `bg-[--lw-primary] text-white rounded-xl w-full py-3 font-semibold`

- Botão "Jogar Agora": `bg-[--lw-primary] text-white rounded-xl px-8 py-3 font-semibold`
- Botão "Desafio Diário": ghost, `border-2 border-[--lw-primary] text-[--lw-primary]`

---

### TELA 5B — SELEÇÃO DE CATEGORIA `/quiz/categorias`

```
┌─────────────────────────────────────────────────────────────┐
│ ← Quiz    Escolha uma Categoria                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────┐ ┌─────────────────────────┐   │
│  │ 📜 Antigo Testamento    │ │ ✝️  Novo Testamento      │   │
│  │ Médio • 10 perguntas    │ │ Médio • 10 perguntas    │   │
│  └─────────────────────────┘ └─────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────┐ ┌─────────────────────────┐   │
│  │ 👤 Personagens Bíblicos │ │ 📚 Livros da Bíblia     │   │
│  │ Fácil • 10 perguntas    │ │ Fácil • 10 perguntas    │   │
│  └─────────────────────────┘ └─────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────┐ ┌─────────────────────────┐   │
│  │ 🎵 Salmos e Provérbios  │ │ 🎲 Modo Aleatório       │   │
│  │ Difícil • 10 perguntas  │ │ Todas as categorias     │   │
│  └─────────────────────────┘ └─────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Cards de categoria:**
- `bg-white border border-[--lw-border] rounded-2xl p-5 cursor-pointer`
- Hover: `border-[--lw-primary] bg-[--lw-primary]/5`
- Ícone: 28px, centralizado ou esquerda
- Nome: 15px semibold `--lw-text`
- Dificuldade badge: "Fácil" = verde | "Médio" = amarelo | "Difícil" = vermelho
- "10 perguntas": 12px `--lw-text-muted`

---

### TELA 5C — QUIZ ATIVO

```
┌─────────────────────────────────────────────────────────────┐
│ [Sair ←]    Personagens Bíblicos    Pergunta 1/10  240pts  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Timer: [████████████░░░] 9s restantes                     │
│                                                             │
│  Personagens Bíblicos  •  1 Reis 18                        │
│                                                             │
│  Quem foi o profeta que desafiou os                        │
│  profetas de Baal no Monte Carmelo?                        │
│                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │     A  Elias        │  │     B  Eliseu        │          │
│  └─────────────────────┘  └─────────────────────┘          │
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │     C  Samuel       │  │     D  Natã          │          │
│  └─────────────────────┘  └─────────────────────┘          │
│                                                             │
│  ⚡ Responda rápido para ganhar mais pontos!               │
│                                                             │
│                  [Confirmar Resposta]                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Especificações:**
- Fundo: `--lw-bg`
- Timer bar: `bg-[--lw-border] h-2 rounded-full`
  - Progress decrescente: começa em 100%, vai a 0 em 15s
  - Cor: verde → amarelo → vermelho conforme tempo diminui
  - Usa `setInterval` de 100ms para atualizar

- Categoria + referência: 12px uppercase `--lw-text-muted`
- Pergunta: Georgia/serif, 20px, `--lw-text`, line-height 1.4

- Opções (A/B/C/D):
  ```
  bg-white border-2 border-[--lw-border] rounded-2xl p-4
  flex items-center gap-3
  cursor-pointer transition-all
  ```
  - Letra A/B/C/D: `w-8 h-8 rounded-full bg-[--lw-bg] flex items-center justify-center font-bold text-[--lw-primary]`
  - Texto: 15px `--lw-text`
  - Selecionado: `border-[--lw-primary] bg-[--lw-primary]/10`
  - Correto (após confirmar): `border-green-500 bg-green-50`
  - Errado (após confirmar): `border-red-400 bg-red-50`

- Botão confirmar: `bg-[--lw-primary] text-white rounded-xl w-full py-3 font-semibold`
  - Desabilitado se nenhuma opção selecionada

- **Animação de pontos**: ao acertar, `+50pts` sobe flutuando (keyframe animation)

**Sistema de pontuação:**
```typescript
// Pontos baseados no tempo restante
const calcPoints = (timeRemaining: number, basePoints: number = 50): number => {
  const bonus = Math.floor(timeRemaining / 15 * 50); // até 50 pts de bônus
  return basePoints + bonus;
};

// Ao finalizar 10 perguntas: salvar sessão
supabase.from('quiz_sessions').insert({
  user_id, score_earned, questions_answered: 10, correct_answers
});

// Atualizar XP no perfil
supabase.from('profiles').update({
  quiz_score: currentScore + score_earned
}).eq('id', user_id);
```

---

# MÓDULO 6 — KIDS
## Rota: `/kids`

### API disponível
```
POST /functions/v1/generate-kids-story
Body: { character: string, user_id?: string }
Retorna: { character, story_text, lesson, image_url? }
```

---

### TELA 6A — SELEÇÃO DE PERSONAGEM

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER: ← Ferramentas    👦 Zeal Kids                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  👦 Kids                                                   │
│  Histórias bíblicas para crianças                          │
│                                                             │
│  Escolha um personagem e ouça a história!                  │
│                                                             │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐                  │
│  │  🦁   │ │  🌊   │ │  👑   │ │  🐟   │                  │
│  │ Davi  │ │Moisés │ │ Ester │ │ Jonas │                  │
│  └───────┘ └───────┘ └───────┘ └───────┘                  │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐                  │
│  │  ✨   │ │  🌾   │ │  🎵   │ │  ⚡   │                  │
│  │ José  │ │  Rute │ │Samuel │ │Josué  │                  │
│  └───────┘ └───────┘ └───────┘ └───────┘                  │
│  ... (20 personagens no total)                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Cards de personagem:**
- Grid: `grid grid-cols-4 gap-3` (mobile: 3 colunas)
- Card: `bg-white rounded-2xl p-4 text-center cursor-pointer border-2 border-[--lw-border]`
- Hover: `border-[--lw-primary] shadow-md scale-105 transition-transform`
- Emoji/imagem: 40px centralizado
- Nome: 13px semibold `--lw-text`
- Subtítulo: 10px `--lw-text-muted` (ex: "O pequeno pastor")

---

### TELA 6B — HISTÓRIA GERADA

```
┌─────────────────────────────────────────────────────────────┐
│ ← Kids    ✨ História de Davi                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✨ Uma história especial para você! ✨                    │
│                                                             │
│  [Imagem gerada por IA de Davi — cartoon/ilustração]       │
│                                                             │
│  📖  Davi                                                  │
│                                                             │
│  [Parágrafo 1: contexto e apresentação]                    │
│                                                             │
│  [Parágrafo 2: conflito e desafio]                         │
│                                                             │
│  [Parágrafo 3: resolução com Deus]                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 💡 Lição: Deus nos torna corajosos quando          │   │
│  │    confiamos Nele.                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [📋 Copiar] [📤 Compartilhar] [💬 WhatsApp]              │
│  [🎨 Gerar Desenho de Davi]                                │
│                                                             │
│  [← Escolher outro personagem]                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Especificações:**
- Fundo: `--lw-bg`
- Título "✨ Uma história especial para você ✨": Georgia/serif, 20px, centralizado
- Imagem: `w-full aspect-square max-w-xs mx-auto rounded-2xl object-cover`
  - Placeholder enquanto carrega: gradiente suave + ícone 🌟
- Nome do personagem: Georgia/serif, 24px bold, `--lw-text`
- Texto da história: Inter, 16px, line-height 1.8, `--lw-text`
  - Parágrafos separados com margin-bottom 16px
  - Linguagem simples (linguagem infantil)
- Card da lição:
  - `bg-[--lw-accent]/10 border-l-4 border-[--lw-accent] rounded-r-xl p-4`
  - "💡 Lição:" em bold + texto
- Botão "Gerar Desenho": `bg-[--lw-primary]/10 text-[--lw-primary] border border-[--lw-primary]/30 rounded-xl px-4 py-2`
  - Chama a API de geração de imagem com o prompt do personagem

**Loading state:**
```
[Imagem de loading animada — emoji do personagem pulsando]
📖 Criando uma história mágica...
Gerando história especial sobre Davi...
```

---

# MÓDULO 7 — DASHBOARD EXPANDIDO
## Expansão da rota `/dashboard` existente

### Adicionar (sem remover nada existente)

**7A — Barra de Streak + Ranking** (acima da seção "COMECE AQUI")

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  🔥 3 dias     🏆 #47 no ranking     [🎮 Jogar Quiz →]     │
│  de sequência  global                                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

- Container: `flex gap-3 items-center`
- Cards stats: `bg-white rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm`
- Dados via RPC `get_user_daily_usage`
- Botão Quiz: `bg-[--lw-primary]/10 text-[--lw-primary] rounded-xl px-4 py-2 text-sm`

**7B — Card Devocional do Dia** (já especificado no Módulo 1)

**7C — Widget O Bom Amigo** (já especificado no Módulo 2)

---

## ORDEM DE EXECUÇÃO RECOMENDADA

```
SEMANA 1 — Fundação de retenção diária:
  Dia 1: Módulo 7 (Dashboard — adicionar card devocional + widget bom amigo + streak bar)
  Dia 2: Módulo 1 (Página /devocional completa com player + journaling + histórico)
  Dia 3: Módulo 2 (Página /bom-amigo full page)
  Dia 4: Teste end-to-end dos 3 módulos

SEMANA 2 — Ferramentas de criação:
  Dia 1: Módulo 4 (Carrossel na pregação)
  Dia 2: Módulo 3 (Menu contextual Bíblia + tabs Notas/Favoritos)
  Dia 3: Módulo 3 (Planos de leitura com progresso)
  Dia 4: Teste end-to-end

SEMANA 3 — Engajamento e gamificação:
  Dia 1: Módulo 5 (Quiz hub + seleção de categoria)
  Dia 2: Módulo 5 (Quiz ativo + pontuação + bônus diário)
  Dia 3: Módulo 6 (Kids — seleção + história)
  Dia 4: Teste geral + ajustes
```

---

## CHECKLIST GERAL DE QUALIDADE

Antes de considerar qualquer módulo concluído, verificar:

```
IDENTIDADE VISUAL:
[ ] Fundo usa --lw-bg (#F5F0E8) e não branco ou dark
[ ] Botões primários usam --lw-primary (#C4956A)
[ ] Cards usam bg-white com shadow-sm
[ ] Nenhuma referência a cores do Zeal (verde-teal etc)

FUNCIONALIDADE:
[ ] Chamadas à API corretas (endpoint + método + body)
[ ] Loading states em todas as chamadas assíncronas
[ ] Estados de erro tratados (fallback visual)
[ ] Estados vazios tratados (empty state com ilustração)

RESPONSIVIDADE:
[ ] Mobile-first: testar em 375px de largura
[ ] Bottom sheets em mobile, popovers em desktop
[ ] Texto legível sem zoom no mobile
[ ] Botões com área de toque mínima de 44px

EXISTENTE NÃO QUEBROU:
[ ] Dashboard original ainda funciona
[ ] Sidebar com 8 itens ainda funciona
[ ] Gerador de sermão existente ainda funciona
[ ] Sistema de créditos ainda aparece corretamente
[ ] Plano e uso ainda acessível
```

---

## NOTAS FINAIS PARA O LOVABLE

1. **Não reescrever** nenhum componente existente — apenas adicionar
2. **Importar ícones** do Lucide React (já está no projeto)
3. **Fonte serifada** (Georgia ou Lora) APENAS em títulos e versículos, nunca no corpo
4. **Animações**: usar `transition-all duration-200` — nada chamativo
5. **html2canvas**: já está no projeto, usar para download de slides
6. **Supabase client**: já configurado, usar o existente
7. **Autenticação**: todos os módulos precisam de `user.id` — verificar `useAuth()`
8. **Créditos**: antes de cada geração por IA verificar créditos disponíveis via `check-and-consume-credits`
