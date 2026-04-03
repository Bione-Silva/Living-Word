# LIVING WORD — Documento de Contexto para Lovable
## Cole este documento inteiro no chat inicial do Lovable

---

## O QUE É O PROJETO

**Living Word** (Palavra Viva em PT · Palabra Viva em ES) é uma plataforma SaaS trilíngue para pastores, líderes cristãos e influencers de fé. Ela tem duas frentes:

**Frente A — Estúdio Pastoral:** o usuário fornece uma passagem bíblica + contexto da congregação e recebe material pastoral completo (sermão, esboço, devocional, reels, versão bilíngue, adaptação para célula).

**Frente B — Motor de Conteúdo:** geração e publicação automatizada de artigos devocionais e de blog cristão no subdomínio do próprio usuário (`joao.livingword.app`), com fila editorial, agendamento e suporte a múltiplos sites.

**Público-alvo:** pastores, líderes e influencers cristãos em três idiomas — Português (Brasil e EUA), English (pastores americanos), Español (comunidade hispânica nos EUA e América Latina).

**Missão do produto:** transformar a Palavra pregada no domingo em conteúdo escrito que circula durante a semana — com fidelidade teológica, naturalidade pastoral e alcance digital.

---

## STACK TÉCNICA

```
Frontend:    React + TypeScript + Tailwind CSS + shadcn/ui  ← VOCÊ CONSTRÓI ISSO
Backend:     Supabase (Postgres + Edge Functions Deno + Auth + RLS)
IA:          OpenAI API — modelo gpt-4o-mini
Bible APIs:  wldeh/bible-api (PT) · API.Bible (EN) · ApiBiblia (ES)
Publishing:  WordPress REST API (subdomínios livingword.app)
Pagamento:   Stripe
i18n:        PT | EN | ES — detecção automática, troca manual
```

**O backend (Edge Functions Supabase) já está implementado e funcionando.**
Você vai construir o frontend React que consome esses endpoints.

---

## ENDPOINTS DISPONÍVEIS (backend pronto)

Todos os endpoints estão em: `https://<projeto>.supabase.co/functions/v1/`

### `POST /generate-pastoral-material`
Gera os 6 formatos pastorais da Frente A.

**Headers:** `Authorization: Bearer <supabase_jwt>` · `Content-Type: application/json`

**Body:**
```json
{
  "bible_passage": "João 15:1-8",
  "audience": "Imigrantes brasileiros recém-chegados",
  "pain_point": "Solidão, saudade de casa, medo do futuro",
  "doctrine_line": "evangelical_general",
  "language": "PT",
  "pastoral_voice": "welcoming",
  "bible_version": "ARA",
  "output_modes": ["sermon", "outline", "devotional", "reels", "bilingual", "cell"]
}
```

**Response:**
```json
{
  "material_id": "uuid",
  "outputs": {
    "sermon": "texto completo...",
    "outline": "esboço...",
    "devotional": "devocional...",
    "reels": "5 frases...",
    "bilingual": "versão EN/ES...",
    "cell": "adaptação célula..."
  },
  "theology_layers_marked": true,
  "citation_audit": { "direct_quotes": 3, "paraphrases": 2, "allusions": 1 },
  "generation_time_ms": 8400,
  "generations_remaining": 35
}
```

**Erros:** `429` = limite do plano atingido · `401` = não autenticado

---

### `POST /generate-blog-article`
Gera artigo de blog cristão da Frente B.

**Body:**
```json
{
  "bible_passage": "Mateus 5:13-16",
  "audience": "Imigrantes brasileiros",
  "pain_point": "Identidade e propósito na nova terra",
  "category": "immigrant",
  "language": "PT",
  "bible_version": "ARA",
  "target_length": "medium",
  "article_goal": "encourage"
}
```

**Categorias válidas:** `devotional | sermon_article | biblical_reflection | new_converts | family | immigrant | evangelistic`

**Response:**
```json
{
  "material_id": "uuid",
  "article": {
    "title": "Sal da Terra: Como Ser Luz em Terra Estranha",
    "meta_description": "Reflexão sobre Mateus 5:13-16...",
    "body": "texto do artigo...",
    "tags": ["imigrante", "identidade"],
    "seo_slug": "sal-da-terra-luz-terra-estranha",
    "word_count": 712
  },
  "generation_time_ms": 6200,
  "generations_remaining": 34
}
```

---

### `POST /publish-to-wordpress`
Publica artigo no WordPress do usuário.

**Body:**
```json
{
  "material_id": "uuid",
  "site_url": "https://joao.livingword.app",
  "status": "publish"
}
```

**Response:** `{ "published_url": "https://...", "wp_post_id": 142 }`

---

### `POST /schedule-publication`
Agenda publicação futura.

**Body:**
```json
{
  "material_id": "uuid",
  "site_url": "https://joao.livingword.app",
  "scheduled_at": "2026-04-10T08:00:00-04:00"
}
```

---

## TABELAS SUPABASE (para queries no frontend)

Use o Supabase JS client com o JWT do usuário logado. RLS garante que cada usuário acessa apenas seus dados.

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
// O JWT do usuário é injetado automaticamente após o login
```

**Tabelas principais:**

`users` — plano, idioma, versão bíblica, blog_url, handle, generation_count_month

`materials` — todo conteúdo gerado (sermões, artigos, esboços)

`editorial_queue` — fila editorial com status: draft | scheduled | published

`generation_logs` — histórico de uso e custo por geração

---

## PLANOS E LIMITES

| Plano | Preço | Gerações/mês | Frente A | Frente B | Sites |
|---|---|---|---|---|---|
| Free | $0 | 5 | 4 formatos | 1 artigo | — |
| Pastoral | $9/mês | 40 | Todos | 20 artigos | 1 site |
| Church | $29/mês | 200 | + equipe (3) | 100 artigos | 3 sites |
| Ministry | $79/mês | 500 | + equipe (10) | Ilimitado | 10 sites |

Quando a API retornar `429`, mostrar tela de upgrade com benefícios do próximo plano.

---

## IDENTIDADE VISUAL

**Nome:** Living Word
**PT:** Palavra Viva · **ES:** Palabra Viva

**Paleta de cores:**
```
Verde ministerial principal: #1e4d2b
Verde médio:                 #2d6e3e
Verde claro (backgrounds):   #e8f2eb
Dourado envelhecido:         #9a7c3f
Dourado claro (backgrounds): #f5eed8
Off-white (fundo):           #faf8f4
Texto principal:             #1a1a1a
Texto secundário:            #5a5a5a
Borda padrão:                rgba(0,0,0,0.1)
```

**Tipografia:**
- Títulos e headers: `Playfair Display` (serif elegante — Google Fonts)
- Corpo e UI: `DM Sans` (sans-serif limpa — Google Fonts)
- Código/mono: `JetBrains Mono`

**Tom visual:** sóbrio, ministerial, moderno. Sem carnaval de features. Sem gradientes chamativos. Sem ícones genéricos de "church". Parece uma ferramenta profissional de criação de conteúdo — não um app de oração.

---

## PÁGINAS E COMPONENTES A CONSTRUIR

### 1. Landing Page (`/`)
- Hero com tagline em PT/EN/ES (toggle de idioma)
- "Do púlpito ao leitor — fiel, claro, com alcance"
- Seção de diferenciais vs SermonAI / ChatGPT
- Tabela de planos (Free / Pastoral / Church / Ministry)
- CTA: "Começar grátis — seu blog em 2 minutos"
- Depoimentos (placeholders por enquanto)
- Footer com links em PT/EN/ES

### 2. Onboarding (`/signup`)
**3 passos, sem fricção:**

**Passo 1 — Conta**
- Nome completo
- Email + senha (ou Google OAuth)
- Idioma preferido (PT/EN/ES) — detectado automaticamente, editável

**Passo 2 — Perfil Pastoral**
- Denominação / linha doutrinária (select)
- Versão da Bíblia preferida
- Estilo pastoral (select: acolhedor / expositivo / narrativo / apologético / profético)
- Público principal (texto livre)

**Passo 3 — Seu Blog**
- Exibir: "Seu blog será criado em `[nome].livingword.app`"
- Campo para customizar o handle (slug)
- Botão: "Criar minha conta e publicar meus primeiros artigos"
- Após submit: loading animado com mensagem "Criando seu blog... publicando seus primeiros artigos..."

**Após onboarding:** redirecionar para dashboard com os 2 artigos já publicados.

### 3. Dashboard Principal (`/dashboard`)
**O usuário vê ao entrar:**
- Card topo: "Seu blog está no ar" com link para `[handle].livingword.app`
- Contador de gerações usadas/disponíveis no mês (barra de progresso)
- 2 artigos publicados com nome do usuário (cards clicáveis)
- Botão grande: "Gerar novo conteúdo"
- Atalhos: Estúdio Pastoral / Novo Artigo / Fila Editorial

**Sidebar de navegação:**
- Dashboard
- Estúdio Pastoral
- Artigos de Blog
- Fila Editorial
- Biblioteca
- Meu Blog (link externo)
- Configurações
- Upgrade (se plano Free ou Pastoral)

### 4. Estúdio Pastoral (`/studio`)
**Seletor de modo (primeiro passo):**
Botões/cards em grid 3×2:
- Sermão / Esboço
- Blog Devocional
- Artigo de Prédica
- Devocional Curto
- Culto / Célula
- Evangelístico

**Campos de input (sempre visíveis):**
- Passagem bíblica (campo de texto, com sugestão de formato: "ex: João 15:1-8")
- Público & Contexto (campo de texto)
- Dor / Tema do momento (textarea 2 linhas)

**Configurações avançadas (colapsado por padrão, toggle):**
- Linha doutrinária (select)
- Idioma de saída (PT/EN/ES)
- Voz pastoral (select)
- Versão da Bíblia (select — com todas as opções disponíveis por idioma)

**Botão:** "Gerar material →" (verde principal, full width)

**Estado de loading:**
- Skeleton animado nos tabs
- Mensagem: "Preparando sua Palavra..." com animação de pulso

**Output em tabs:**
Após geração, exibir 7 tabs:
`📖 Sermão` · `✍️ Esboço` · `📝 Blog` · `💬 Devocional` · `📱 Reels` · `🌐 Bilíngue` · `🏠 Célula`

Cada tab mostra o conteúdo com:
- Botão "Copiar"
- Botão "Salvar na biblioteca"
- Botão "Publicar no blog" (abre modal de publicação)
- Watermark pastoral no rodapé (não editável)
- Badge de citações (ex: "3 citações diretas · ARA")

### 5. Artigos de Blog (`/blog`)
- Botão "Novo artigo"
- Lista de artigos com status (rascunho / agendado / publicado)
- Filtro por categoria e idioma
- Card de cada artigo: título, data, status badge, link se publicado

**Modal de novo artigo:**
Mesmos campos do Estúdio + seletor de categoria de artigo + tamanho do artigo

### 6. Fila Editorial (`/queue`)
- Calendário mensal com artigos agendados
- Lista com: título, data, site de destino, status
- Botão de agendar / publicar agora / arquivar

### 7. Biblioteca (`/library`)
- Grid de materiais salvos
- Filtro: tipo (sermão/artigo/devocional) · idioma · favoritos
- Busca por passagem ou tema
- Cada card: passagem, tipo, data, botões (copiar/publicar/arquivar)

### 8. Configurações (`/settings`)
**Abas:**
- **Perfil:** nome, idioma, denominação, versão bíblica, voz pastoral
- **Meu blog:** URL atual, handle, customizar subdomínio, conectar domínio próprio (planos Church+)
- **Sites WordPress:** adicionar/remover sites (planos pagos)
- **Plano e faturamento:** plano atual, uso do mês, link para upgrade
- **Conta:** alterar senha, excluir conta, exportar dados

### 9. Painel Admin (`/admin` — acesso restrito)
- Visão consolidada: usuários por plano, MRR, custo API/mês, margem
- Tabela por usuário: nome, plano, gerações usadas, custo gerado, receita, margem
- Gráfico: MRR × Custo × Margem (barras)
- Alertas: conversão free→pago abaixo de 0,5% | custo diário > $20 | margem < 70%

---

## COMPORTAMENTOS IMPORTANTES

### Limite de gerações
Quando `generations_remaining === 0` ou API retorna `429`:
- Bloquear botão de geração
- Exibir card de upgrade com comparativo de planos
- Nunca travar o acesso aos materiais já gerados

### Idioma
- Detectar `navigator.language` no primeiro acesso
- PT: interface em português, conteúdo em português
- EN: interface em inglês, conteúdo em inglês
- ES: interface em espanhol, conteúdo em espanhol
- Usuário pode trocar a qualquer momento em Configurações

### Watermark
Presente em todos os outputs. Cor cinza clara. Texto pequeno. Não editável.
Não remover em nenhuma versão do plano Free ou Pastoral.

### Estados de loading
Todas as chamadas de geração levam 5–15 segundos. Use sempre:
- Skeleton nos campos de output
- Mensagem de progresso contextual ("Preparando sua Palavra...")
- Nunca deixar o usuário sem feedback visual

### Erro de geração
Se a API falhar (503), exibir toast de erro amigável:
PT: "Tivemos um problema ao gerar seu conteúdo. Tente novamente."
EN: "We had trouble generating your content. Please try again."
ES: "Tuvimos un problema al generar tu contenido. Inténtalo de nuevo."
O crédito de geração não é descontado em caso de erro.

---

## FLUXO DE ONBOARDING — DETALHAMENTO

```
1. Usuário cria conta (nome + email + idioma)
         ↓
2. Supabase Auth cria usuário → trigger cria row em public.users
         ↓
3. Edge Function provision-user-blog roda automaticamente:
   - Provisiona subdomínio [handle].livingword.app
   - Gera 2 artigos devocionais assinados com o nome do usuário
   - Publica os 2 artigos
         ↓
4. Redirect para /dashboard
   - Usuário vê "Seu blog está no ar: joao.livingword.app"
   - Vê os 2 artigos com seu nome
   - Vê contador: "3 gerações gratuitas restantes"
```

**O "aha moment" acontece antes de qualquer esforço do usuário.**

---

## O QUE NÃO FAZER

- Não usar purple gradients ou qualquer visual de "startup tech genérico"
- Não usar emojis em excesso na interface
- Não colocar mais de 3 campos visíveis por padrão no Estúdio
- Não mostrar jargão técnico (tokens, API, edge functions) para o usuário
- Não usar a palavra "AI" em destaque — dizer "gerado com assistência" ou simplesmente mostrar o resultado
- Não travar a interface durante loading — sempre responsivo
- Não redirecionar o usuário para o subdomínio em nova aba sem confirmação

---

## COMPONENTES SHADCN/UI RECOMENDADOS

```
Button, Input, Textarea, Select, Tabs, Card, Badge, 
Dialog, Sheet (para mobile), Progress, Skeleton,
Toast (Sonner), Separator, Avatar, DropdownMenu,
Calendar (para fila editorial), Toggle
```

---

## ESTRUTURA DE ARQUIVOS SUGERIDA

```
src/
  pages/
    index.tsx          (landing page)
    signup.tsx         (onboarding)
    dashboard.tsx
    studio.tsx
    blog.tsx
    queue.tsx
    library.tsx
    settings.tsx
    admin.tsx
  components/
    studio/
      ModeSelector.tsx
      InputFields.tsx
      OutputTabs.tsx
      GenerateButton.tsx
    blog/
      ArticleCard.tsx
      ArticleModal.tsx
    queue/
      QueueCalendar.tsx
      QueueList.tsx
    shared/
      PlanBadge.tsx
      GenerationCounter.tsx
      WatermarkFooter.tsx
      LanguageToggle.tsx
      UpgradeModal.tsx
  lib/
    supabase.ts        (client + hooks)
    api.ts             (wrappers das Edge Functions)
    constants.ts       (planos, limites, idiomas)
  hooks/
    useUser.ts
    useGenerations.ts
    useMaterials.ts
```

---

## PRIMEIRA TAREFA — POR ONDE COMEÇAR

**Construa nesta ordem:**

1. **Layout base + autenticação** — sidebar, header, login/signup com Supabase Auth
2. **Dashboard** — com cards de boas-vindas, contador de gerações, link do blog
3. **Estúdio Pastoral** — seletor de modo + campos + botão gerar + tabs de output (conectar ao endpoint real)
4. **Biblioteca** — listagem de materiais gerados
5. **Landing page** — após ter o produto funcionando

**Para o Sprint 1, foque nos itens 1, 2 e 3.**
O backend está pronto. A primeira chamada real deve ser para `/generate-pastoral-material` com os campos do Estúdio.

---

*Living Word — contexto completo para implementação no Lovable*
*Backend: Supabase Edge Functions (implementado via Antigravity)*
*Frontend: React + Tailwind + shadcn/ui (este documento)*
