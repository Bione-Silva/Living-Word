# 🎯 PROMPT MASTER PARA O LOVABLE — Living Word

> **Cole este prompt inteiro no Lovable ao criar o projeto. Ele deve ler e seguir RIGOROSAMENTE todos os documentos anexados ao projeto.**

---

## INSTRUÇÃO PRINCIPAL

Você vai construir o **Living Word** — uma plataforma SaaS de geração de conteúdo cristão com IA para pastores, líderes de célula e influenciadores evangélicos. Pense nela como o "Omniseen" (ferramenta de geração de conteúdo automatizado com blog integrado), mas voltada 100% para o público evangélico/cristão.

**ANTES DE QUALQUER COISA:**
1. Leia TODOS os arquivos anexados ao projeto, especialmente:
   - `LOVABLE_INTEGRATION_GUIDE.md` — contém as credenciais do Supabase e GitHub, os endpoints das Edge Functions, e os componentes que devem ser criados
   - `LIVINGWORD_CONVERSION_STRATEGY.md` — contém a estratégia de conversão Free → Pago com 7 gatilhos de upgrade
   - `LIVINGWORD_EDGE_FUNCTIONS_SPEC.md` — especificação técnica das APIs
   - `LIVINGWORD_ANTIGRAVITY_SPRINT1.md` — schema SQL e arquitetura completa
2. Conecte-se ao Supabase usando as credenciais do guia de integração
3. Conecte-se ao GitHub no repositório `Bione-Silva/Living-Word` (branch `main`)
4. Siga RIGOROSAMENTE as regras de UX da Conversion Strategy

---

## CONCEITO CENTRAL DO PRODUTO

### O Problema
A grande maioria dos pastores e líderes evangélicos **NÃO tem site, NÃO tem blog, NÃO tem presença digital**. Eles pregam todo domingo mas seu conteúdo morre na igreja. Não têm tempo, não sabem criar, e acham caro demais contratar alguém.

### A Solução
O Living Word resolve isso em **3 cliques**:
1. O pastor cria a conta
2. No ato do cadastro, ele escolhe um **subdomínio** (ex: `pastor-marcos.livingword.app`)
3. O sistema **gera automaticamente 2 devocionais** baseados no momento litúrgico atual e publica no blog dele — que já está no ar antes mesmo do pastor terminar o onboarding

**Quando o pastor termina o cadastro, ele já tem um blog cristão profissional no ar, com conteúdo real, acessível pelo público.** Isso é o "Aha moment" — valor entregue antes de qualquer esforço.

---

## ARQUITETURA DAS TELAS

### Tela 1: Landing Page (`/`)

Uma landing page premium, moderna e dark com:

**Hero Section:**
- Headline: "Sua pregação merece ir além do púlpito"
- Sub: "Gere sermões, devocionais e artigos de blog com IA pastoral — e publique automaticamente no seu blog cristão profissional"
- CTA primário: "Criar meu blog grátis" → vai para `/cadastro`
- CTA secundário: "Ver exemplo ao vivo" → abre um blog demo

**Seção "Como funciona":**
1. Crie sua conta → blog no ar em 30 segundos
2. Escolha uma passagem bíblica → IA gera seu conteúdo
3. Publique com um clique → ou agende para a semana

**Seção de Formatos:**
Cards visuais mostrando os 7 formatos: Sermão, Esboço, Devocional, Reels, Bilíngue, Célula, Artigo de Blog.
Os 3 primeiros sem cadeado (Free). Os outros 4 com badge "Pastoral".

**Seção de Preços:**
- Free: 5 gerações/mês, 3 formatos, blog com watermark
- Pastoral ($9/mês): 40 gerações, todos os formatos, sem watermark, domínio próprio
- Church ($29/mês): equipe, multi-autor, API
- Ministry ($79/mês): white label, ilimitado

**Footer:** Links, legal, "Feito com fé e tecnologia"

**Design:** Use cores escuras (slate/zinc), com acentos em âmbar/dourado (#D4A853). Tipografia: Inter ou Outfit. Ícones de Lucide React. Animações suaves com Framer Motion.

---

### Tela 2: Cadastro (`/cadastro`)

**Passo 1 — Dados básicos:**
- Nome completo
- Email
- Senha
- Idioma preferido (PT / EN / ES) — detectar pelo browser

**Passo 2 — Seu Blog (FUNDAMENTAL):**
- Campo para escolher o handle/subdomínio: `[________].livingword.app`
- Validação em tempo real (disponibilidade via Supabase query na tabela `users.handle`)
- Preview visual: mostra como ficará o blog com o nome dele
- Texto: "Seu blog cristão profissional estará online em segundos. Sem configuração, sem hospedagem, sem custos."

**Passo 3 — Perfil Pastoral (opcional mas incentivado):**
- Linha doutrinária (Evangélico geral / Reformado / Pentecostal / Católico)
- Tom pastoral preferido (Acolhedor / Expositivo🔒 / Narrativo🔒 / Apologético🔒 / Profético🔒)
- Com o badge 🔒 e a nota: "Desbloqueie sua voz real no plano Pastoral"

**Ao clicar "Criar minha conta":**
1. Cria o usuário no Supabase Auth
2. O trigger `handle_new_user` cria o perfil automaticamente
3. O frontend chama a Edge Function `generate-blog-article` **2 vezes** automaticamente em background:
   - 1º devocional: passagem contextual ao momento litúrgico (ex: quaresma, páscoa, advento)
   - 2º devocional: passagem clássica de encorajamento (Salmo 23, Filipenses 4:13, Josué 1:9)
4. Os artigos são salvos na tabela `materials` e inseridos na `editorial_queue` com status `published`
5. O blog do usuário fica imediatamente acessível em `handle.livingword.app`

**Após cadastro → redireciona para o Estúdio Pastoral (`/estudio`)**

---

### Tela 3: Dashboard Principal (`/dashboard`) — TELA PRINCIPAL

**INSTRUÇÃO CRÍTICA DE UX (Baseada nos anexos do SermonSpark):** 
O Estúdio NÃO deve abrir direto em um formulário vazio gigante ou chat estilo ChatGPT (isso gera "Síndrome da folha em branco"). Ele deve ser um **Hub/Dashboard visual em Grid**, idêntico às imagens de referência `sermonspark.ai` anexadas ao projeto.

**Layout Principal (Inspirado nas Referências Visuais):**
- **Sidebar Fixa (Esquerda):** Fundo escuro/roxo ministerial.
  - Título/Logo do Living Word.
  - Navegação agrupada: "Criar", "Pesquisar", "Publicar".
  - Seção Minha Conta com botão de upgrade.
  - **Componente `<GenerationCounter />`:** Badge colorido (ex: "1000 créditos" / "5 gerações") sempre visível, preenchendo a psicologia de consumo de créditos.
- **Painel Central (Main Area):** Fundo limpo (slate-50).
  - Título H1 "Ferramentas Pastorais ao seu alcance".
  - Banner dinâmico de Upsell alertando personalizações (ex: "Personalize sua voz pastoral em todos os materiais").

**Sessões do Grid de Ferramentas (Cards brancos clicáveis):**

1. **Grid: 🖋️ Escrever e Criar**
   - *Estúdio Pastoral (O Clássico)*: Abre o modal/tela dividida com a Passagem Bíblica, Público-Alvo e outputs simultâneos (Esboço, Devocional, Reels, etc).
   - *Artigo Livre*: Gerador de conteúdo de blog puro a partir de um tema.
   - *Gerador de Títulos (🔒 Pastoral)*.

2. **Grid: 🎥 Vídeo para Blog (NOVA FEATURE PRIORITÁRIA)**
   - *Transformar Vídeo em Blog*: Ao clicar neste card, abre um modal simples pedindo apenas:
     - URL do vídeo do YouTube.
     - Público-alvo.
     - Seleção de Voz Pastoral (Configurações herdadas).
   - Ao confirmar, dispara disparo POST para o endpoint `/process-youtube-audio`. Mostrar Loading State elegante ("Extraindo legendas e gerando sabedoria..."). Retorna texto para publicação no blog.

3. **Grid: 🔎 Pesquisar (Ferramentas Rápidas)**
   - *Explorador de Versículo* (Input de tema → Traz as referências).
   - *Ilustrações Contemporâneas* (Traz cenas de filmes/histórias diárias aplicáveis).
   - *Pesquisa Lexical (🔒 Pastoral)* (Explora Grego e Hebraico simplificado via Vector Search).

**Dinâmica dos Cards:**
- Cards contêm: Ícone (Lucide), Título curto, Descrição em 1 linha.
- Cards bloqueados no plano Free exibem um pequeno cadeado laranja ou dourado 🔒. Se clicados, disparam o `<UpgradeModal />`.

**Após interagir com o Estúdio ou Youtube, a tela se divide para mostrar o resultado e botões de ação final:**
- Botões: "Copiar" | "Salvar na Biblioteca" | "Publicar no Blog (WordPress)".

**COMPONENTES DE CONVERSÃO (implementar da Conversion Strategy):**
1. `<LockedTab />` e Cards Bloqueados: Sempre visíveis para despertar o desejo.
2. `<UpgradeModal />`: Trial de 7 dias grátis focado no benefício sem usar culpa.

---

### Tela 4: Blog do Usuário (`/blog` ou `handle.livingword.app`)

Um blog cristão bonito, responsivo e minimalista:

**Layout:**
- Header: nome do pastor, foto (ou avatar gerado), bio de uma linha
- Grid de artigos (cards com título, data, passagem bíblica, preview de 2 linhas)
- Cada artigo abre em página full com:
  - Título
  - Data e passagem bíblica
  - Corpo do artigo (markdown renderizado)
  - Watermark no Free: "Gerado com Living Word" no rodapé
  - Sem watermark no Pastoral
  - Botão de compartilhar (WhatsApp, Twitter/X, copiar link)
- SEO: meta tags, Open Graph, título dinâmico

**Subdomínio:**
- A rota `/blog/[handle]` serve de proxy para `handle.livingword.app`
- No Free: subdomínio da plataforma com watermark
- No Pastoral: possibilidade de conectar domínio próprio (Sprint 2)

---

### Tela 5: Biblioteca (`/biblioteca`)

Grid de todos os materiais gerados pelo usuário:

- Cards com: tipo (sermão/blog/devocional), título, passagem bíblica, data
- Filtros: por tipo, por data, favoritos
- **REGRA FREE**: Apenas os 10 materiais mais recentes. O 11º material aparece com blur + cadeado + "Arquivado — desbloqueie no Pastoral" (Gatilho 6 da Conversion Strategy)
- Busca por texto
- Ações: ver, editar, publicar, duplicar, excluir

---

### Tela 6: Calendário Editorial (`/calendario`)

Visão mensal dos conteúdos agendados:

- Calendário visual com os domingos destacados
- Cards inline mostrando o que está agendado para cada dia
- **Free**: Calendário visível mas botão "Agendar" desabilitado com tooltip "Disponível no Pastoral"
- **Pastoral**: Arrastar e soltar para agendar publicações

---

### Tela 7: Configurações (`/configuracoes`)

- Perfil: nome, foto, bio, handle
- Plano: informações do plano atual + botão upgrade
- Blog: configurar WordPress (Pastoral+), personalizar cores do blog
- Doutrina: preferências teológicas
- Idioma e versão bíblica padrão
- Conta: alterar email, senha, excluir conta

---

## DESIGN SYSTEM

### Cores
- **Background principal:** slate-950 (#0a0a0f) ou zinc-950
- **Cards/surfaces:** slate-900 com borda slate-800
- **Acento primário:** Âmbar/Dourado (#D4A853) — cor da fé, do sagrado
- **Acento secundário:** Azul celeste (#60A5FA) — confiança, céu
- **Texto principal:** slate-100
- **Texto secundário:** slate-400
- **Sucesso:** emerald-500
- **Alerta:** amber-500
- **Erro:** rose-500
- **Gradiente hero:** de slate-950 para slate-900 com blur radial dourado sutil

### Tipografia
- **Headlines:** Outfit (Google Fonts) — moderna e elegante
- **Corpo:** Inter — limpa e legível
- **Versículos bíblicos:** Serif (Lora ou Merriweather) — tradição e autoridade

### Componentes visuais
- Cantos arredondados: 12px em cards, 8px em botões
- Sombras suaves com glow dourado sutil nos CTAs
- Ícones: Lucide React (Book, Church, Cross, Mic, Calendar, Lock)
- Micro-animações: Framer Motion para transições de tabs, modais, e contadores
- Glassmorphism sutil nos cards de pricing

---

## REGRAS TÉCNICAS

### Supabase
- Use **APENAS a Anon Key** no frontend. NUNCA a Service Role Key.
- Todas as queries respeitam RLS automaticamente (o Supabase filtra por `auth.uid()`)
- Para gerar conteúdo: chame as Edge Functions via `supabase.functions.invoke()`
- Auth: use `supabase.auth.signUp()` e `supabase.auth.signInWithPassword()`

### Edge Functions (Endpoints)
```
POST /functions/v1/generate-pastoral-material
POST /functions/v1/generate-blog-article  
POST /functions/v1/fetch-bible-verse
```

Todas requerem `Authorization: Bearer <user_jwt>` no header.
O JWT é obtido automaticamente com `supabase.auth.getSession()`.

### Response das Edge Functions
As responses incluem:
- `outputs` — conteúdo gerado por formato
- `blocked_formats` — array de formatos bloqueados (mostrar com cadeado)
- `generations_remaining` — número de gerações restantes no mês
- `upgrade_hint` — se não null, exibir mensagem de upgrade (Gatilho 1)
- `blog_limit_hint` — se não null, exibir aviso de limite de blog (Gatilho 4)

### Regras de UX Invioláveis (da Conversion Strategy)
1. **Nunca bloquear a geração** — bloquear apenas o formato
2. **Mostrar o bloqueado, nunca esconder** — tabs com cadeado sempre visíveis  
3. **Um gatilho por sessão** — nunca empilhar modais de upgrade
4. **Nunca usar culpa** — usar contexto pastoral ("Você ainda tem 2 domingos este mês")
5. **Trial de 7 dias sem cartão** como CTA principal de todos os upgrades
6. **Pitch personalizado por perfil** (pastor/influencer/líder)

---

## FLUXO DE ONBOARDING (CRÍTICO)

```
1. Usuário acessa livingword.app → Landing Page
2. Clica "Criar meu blog grátis" → /cadastro
3. Preenche nome, email, senha
4. Escolhe handle do blog: [____].livingword.app  
5. Seleciona idioma e doutrina (opcional)
6. Clica "Criar minha conta"
7. [BACKGROUND] Sistema cria conta + gera 2 devocionais automaticamente
8. [BACKGROUND] Publica os 2 devocionais no blog do usuário
9. Redirect → /estudio com toast: "Seu blog está no ar! 🎉 2 devocionais já publicados"
10. Usuário vê link clicável para seu blog: handle.livingword.app
```

**O usuário NUNCA deve ver uma tela vazia. Quando chegar no estúdio, ele já tem conteúdo publicado.**

---

## PRIORIDADE DE CONSTRUÇÃO

1. **Landing Page** — primeira impressão e conversão
2. **Cadastro com blog automático** — o diferencial do produto
3. **Estúdio Pastoral** — tela principal de trabalho
4. **Blog do usuário** — onde o conteúdo vive
5. **Biblioteca** — histórico de materiais
6. **Calendário** — agendamento editorial
7. **Configurações** — perfil e plano

---

## TOM DA MARCA

- **Profissional mas acessível** — não é fofo demais, não é frio demais
- **Pastoral, não comercial** — a linguagem sempre gira em torno do ministério, não do produto
- **Confiante sem ser arrogante** — "IA que respeita a teologia"
- **Trilíngue** — PT (principal), EN, ES. Interface inicialmente em PT-BR.

---

*Este prompt define a visão completa do Living Word. Siga cada detalhe. Leia todos os arquivos anexos. O banco de dados já está pronto no Supabase com 10 tabelas, RLS ativo, triggers e funções. As Edge Functions estão codificadas. Seu trabalho é construir a interface que conecta tudo isso e entrega valor ao pastor desde o primeiro segundo.*
