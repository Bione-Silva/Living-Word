# LIVING WORD — PRD v3.0
### Pastoral AI Copilot + Christian Content Publishing Platform
**PT:** Palavra Viva · **ES:** Palabra Viva · **EN:** Living Word  
**Stack:** Antigravity (Supabase + React + Tailwind) · OpenAI API (gpt-4o-mini) · OmniSeen Infrastructure  
**Data:** Abril 2026 · Autor: BX4 / Severino Bione  
**Línguas suportadas:** Português · English · Español (mesmo produto, idioma adaptado automaticamente)

---

## CHANGELOG v2.0 → v3.0

| # | Mudança estrutural |
|---|---|
| 1 | **Reposicionamento central:** produto passa a ter duas frentes co-principais (Estúdio Pastoral + Motor de Conteúdo) |
| 2 | **Nome expandido:** Living Word como marca principal trilíngue |
| 3 | **Três públicos explícitos:** brasileiros, americanos e hispânicos — mesmo produto, idioma automático |
| 4 | **Frente B formalizada:** módulo completo de geração e publicação de blogs/artigos cristãos |
| 5 | **Reuso OmniSeen reposicionado:** não é só WordPress REST API — é o DNA de automação editorial |
| 6 | **UX do Estúdio revisada:** seletor de tipo de saída como primeiro passo |
| 7 | **Proposta de valor expandida:** do púlpito ao leitor |
| 8 | **Diferenciais competitivos atualizados** com blogging cristão automatizado |
| 9 | **Métricas de conteúdo adicionadas** além das métricas pastorais |
| 10 | **Modelo de monetização revisado** com plano de publicação |

---

## 1. VISÃO E PROPÓSITO

### Por que isso existe

Não como negócio. Como chamado.

Severino Bione, pastor leigo baseado em Metro Atlanta, tem responsabilidade de pregar a Palavra com fidelidade e **alcance**. O problema não é só tempo de preparação — é que a Palavra pregada no domingo some na segunda-feira. Ela não circula, não é lida, não alcança quem não estava presente, não forma discípulos fora do culto.

O Living Word existe para resolver os dois lados desse problema:

1. **Preparar com fidelidade** — ajudar o pastor a transformar uma passagem bíblica em material pastoral de qualidade
2. **Publicar com alcance** — transformar essa mesma Palavra em conteúdo escrito que circula, é lido, forma e evangeliza

### O que ela NÃO é
- Não é gerador automático de sermão
- Não é blog de terceiros com conteúdo genérico
- Não é SermonAI ($15–$29/mês, inglês, sem contexto cultural, sem publicação)
- Não é Logos Bible Software ($500+)
- Não é ChatGPT com prompt de sermão

### O que ela É

> **"Você traz a passagem e a dor do seu povo. A plataforma transforma isso em Palavra que alcança do púlpito ao leitor — em português, em inglês, em espanhol."**

Uma plataforma com duas frentes co-principais:

**FRENTE A — Estúdio Pastoral**
Preparação de material para pregação, discipulado e célula.

**FRENTE B — Motor de Conteúdo e Publicação**
Geração e distribuição automatizada de blogs devocionais e artigos cristãos.

As duas frentes compartilham o mesmo input (passagem + público + contexto + voz pastoral) e a mesma infraestrutura de geração (OpenAI API (gpt-4o-mini)) e publicação (OmniSeen).

---

## 2. ANÁLISE DE MERCADO

> **Nota epistêmica:** Diferencia dados consolidados, pesquisas direcionais e hipóteses em validação.

### Dados macro — consolidados

- A comunidade brasileira nos EUA é estimada em 1,7–2 milhões (IBGE). Igrejas evangélicas brasileiras são a principal rede de suporte social dessa comunidade.
- A comunidade hispânica nos EUA soma mais de 62 milhões, com estimativa de 15–20% de evangélicos/protestantes (~9–12 milhões). Publicação de conteúdo em espanhol é subatendida por plataformas de IA pastoral.
- Pastores americanos bivocacionais representam ~45% do total (Barna, 2023) — público com tempo limitado e necessidade de consistência editorial.
- O mercado de ferramentas de IA para criação de conteúdo religioso é dominado por produtos em inglês, sem PT/ES nativo, sem guardrail doutrinário por linha teológica, sem contexto de imigração e **sem motor de publicação integrado**.

### Pesquisas direcionais — indicativas

- Relatórios setoriais (2024–2025) indicam crescimento acelerado de adoção de IA por líderes religiosos, com alinhamento teológico como principal preocupação. *(Verificar fonte primária antes de pitch.)*
- SermonAI recebe críticas recorrentes por interface pesada, custo elevado e ausência de PT/ES.
- Igrejas com presença digital ativa (blog + redes) reportam maior retenção de membros e alcance evangelístico. *(Tendência observada, não estudo controlado.)*

### Hipóteses em validação

- **H1:** Pastores BR/hispânicos pagam $9–$29/mês por ferramenta com PT/ES nativo + contexto imigrante. *Validar no beta.*
- **H2:** A combinação estúdio + publicação aumenta retenção vs. produto só de sermão. *Hipótese de produto.*
- **H3:** Igrejas pagam mais ($29–$79/mês) por publicação automatizada em múltiplos sites. *Validar após MVP.*
- **H4:** Pastores americanos adotam a plataforma pela qualidade do conteúdo, não pelo contexto imigrante. *Testar com grupo separado no beta.*

### Mercado-alvo (3 públicos, 1 produto)

| Público | Estimativa | Idioma | Dor principal |
|---|---|---|---|
| Pastores/líderes brasileiros nos EUA | ~3.000–8.000 igrejas | PT | Bilíngue + tempo + contexto imigrante |
| Pastores hispânicos nos EUA | ~50.000+ igrejas evangélicas | ES | Conteúdo em espanhol + alcance digital |
| Pastores americanos bivocacionais | ~150.000+ | EN | Tempo + consistência editorial |
| Pastores bivocacionais no Brasil | +40% das igrejas | PT | Tempo + profundidade + publicação |

---

## 3. PRODUTO — VISÃO GERAL

### 3.1 Princípio de design

**Um input. Duas frentes. Conteúdo que alcança do púlpito ao leitor.**

O pastor fornece os mesmos dados (passagem + público + contexto + voz) e o sistema gera tanto material pastoral para pregação quanto conteúdo para publicação digital — sem duplicação de esforço.

### 3.2 UX do Estúdio — Seletor de Tipo de Saída

O primeiro passo após o login é o seletor de modo. Simples, visual, sem sobrecarga:

```
┌──────────────────────────────────────────────────────────┐
│          O que você quer criar hoje?                     │
│                                                          │
│  🎤 Sermão / Esboço     📖 Blog Devocional               │
│  💬 Devocional Curto    ✍️  Artigo de Prédica             │
│  🏠 Culto / Célula      📢 Conteúdo Evangelístico        │
│                                                          │
│              [ Gerar tudo de uma vez ▼ ]                 │
└──────────────────────────────────────────────────────────┘
```

Após a seleção, o Estúdio abre com os campos de input:

```
┌──────────────────────────────────────────────────────────┐
│  PASSAGEM BÍBLICA          │  PÚBLICO & CONTEXTO         │
│  [João 15:1-8             ]│  [Imigrantes brasileiros   ]│
│                                                          │
│  DOR / TEMA DO MOMENTO                                   │
│  [Solidão, saudade, medo do futuro                      ]│
│                                                          │
│  ── Configurações ──────────────────────────────────────│
│  DOUTRINA      IDIOMA      VOZ PASTORAL    VERSÃO        │
│  [Evang. ▼]   [PT ▼]      [Acolhedor ▼]  [NVI ▼]       │
│                                                          │
│            [ GERAR → ]                                   │
└──────────────────────────────────────────────────────────┘
```

O idioma é detectado automaticamente pelo idioma do navegador/conta, mas sempre editável. PT, EN e ES são suportados nativamente — não como tradução, mas com geração direta no idioma escolhido.

---

## 4. FRENTE A — ESTÚDIO PASTORAL

### 4.1 Formatos de saída

| Formato | Descrição | Critério de aceite |
|---|---|---|
| Sermão completo | 800–1.500 palavras, estrutura intro-desenvolvimento-conclusão-aplicação | Camadas marcadas, versículo na versão correta |
| Esboço (outline) | 5–7 pontos hierarquizados com referências | Navegável, adaptável pelo pastor |
| Devocional curto | 100–200 palavras, 1 versículo, aplicação prática | Adequado para WhatsApp/email |
| Pontos para Reels | 5 frases ≤ 15 palavras, impacto imediato | Sem dependência de contexto externo |
| Versão bilíngue | Geração nativa no segundo idioma (PT↔EN, EN↔ES, PT↔ES) | Naturalidade pastoral, não tradução robótica |
| Adaptação célula/doméstico | Perguntas de discussão incluídas, tom conversacional | Funcional sem líder especializado |

### 4.2 Guardrails Teológicos (não negociáveis)

1. **Exegese antes de aplicação** — contexto literário e histórico antes de qualquer aplicação
2. **Camadas marcadas** — [TEXTO] / [INTERPRETAÇÃO] / [APLICAÇÃO] em toda saída
3. **Linha doutrinária** — Evangélica Geral / Batista / Assembleiana / Reformada / Pentecostal / Carismática / Catholic (EN/ES)
4. **Watermark pastoral** — *"Draft generated with AI. Review, pray, and preach with your own voice."* (adaptado ao idioma)
5. **Alerta de eisegese** — ⚠️ quando aplicação vai além do texto
6. **Rastreabilidade de citações** — [CITAÇÃO DIRETA] / [PARÁFRASE] / [ALUSÃO]
7. **Versão bíblica selecionável** — NVI/ARA/NTLH/ACF (PT) · NIV/ESV/NLT (EN) · RVR60/NVI-ES/DHH (ES)

### 4.3 Guardrails para Contextos Sensíveis

| Contexto | Comportamento |
|---|---|
| Depressão / saúde mental | Tom de acolhimento. Sem prescrições. Recomenda presença pastoral contínua |
| Trauma / abuso | Tom não normativo. Sem orientar comportamento do sobrevivente. Indica encaminhamento |
| Violência doméstica | Nunca sugere reconciliação sem segurança. Não minimiza risco físico |
| Imigração / documentação | Sem afirmações jurídicas. Tom de dignidade e esperança |
| Sofrimento severo / luto | Prioridade: lamentação e presença, não resolução |

---

## 5. FRENTE B — MOTOR DE CONTEÚDO E PUBLICAÇÃO

> Esta frente usa o mesmo input da Frente A e o mesmo DNA de automação editorial da OmniSeen, adaptado ao contexto cristão/devocional.

### 5.1 Objetivo missionário do conteúdo

A Palavra pregada no domingo deve circular na semana. O Living Word transforma uma mensagem pastoral em conteúdo escrito que:
- Alcança quem não estava no culto
- Forma discípulos por meio de leitura regular
- Evangeliza por SEO orgânico
- Mantém a igreja presente digitalmente com consistência

### 5.2 Categorias de Conteúdo Gerado

| Categoria | Público-alvo | Tom | Tamanho |
|---|---|---|---|
| Devocional | Membros da igreja | Íntimo, encorajador | 300–500 palavras |
| Prédica em formato artigo | Membros + visitantes | Expositivo | 800–1.200 palavras |
| Reflexão bíblica | Leitores cristãos | Contemplativo | 500–800 palavras |
| Artigo para novos convertidos | Recém-chegados à fé | Didático, acolhedor | 600–900 palavras |
| Artigo para família | Pais, cônjuges, filhos | Prático, pastoral | 500–800 palavras |
| Artigo para imigrantes | Comunidade imigrante | Empático, contextual | 600–900 palavras |
| Artigo evangelístico | Não-crentes | Apelativo, não confrontacional | 700–1.000 palavras |

### 5.3 Personalização Editorial por Usuário

Cada usuário configura seu perfil editorial (salvo em `user_editorial_profile`):

| Parâmetro | Opções |
|---|---|
| Tom geral | Acolhedor / Expositivo / Apologético / Profético / Evangelístico |
| Profundidade | Introdutório / Intermediário / Aprofundado |
| Estilo de escrita | Narrativo / Didático / Reflexivo / Conversacional |
| Tamanho preferido | Curto (300–500) / Médio (600–900) / Longo (1.000–1.500) |
| Frequência de publicação | Diária / 3x/semana / Semanal / Mensal |
| Temas prioritários | Até 5 categorias salvas |
| Versão bíblica padrão | Por idioma configurado |

### 5.4 Fluxo de Criação → Publicação

```
Input pastoral
(passagem + público + dor + voz)
        ↓
Geração de artigo (OpenAI API (gpt-4o-mini))
        ↓
Revisão no editor inline
        ↓
[Publicar agora] [Agendar] [Salvar rascunho]
        ↓
WordPress REST API (via OmniSeen Publisher)
        ↓
Site(s) de destino selecionados
```

### 5.5 Fila Editorial e Agendamento

- **Painel editorial:** lista de rascunhos, agendados, publicados — por site
- **Calendário editorial cristão:** sugestões automáticas por data litúrgica (Natal, Páscoa, Pentecostes, etc.)
- **Status editorial:** Rascunho / Em revisão / Agendado / Publicado / Arquivado
- **Fila de publicação:** até N artigos agendados na fila, com preview de data e site

### 5.6 Múltiplas Instâncias de Publicação

Plano Igreja e superiores podem publicar em **múltiplos sites WordPress** a partir do mesmo painel:

- Site principal da igreja
- Blog de jovens / células
- Site evangelístico separado
- Site em inglês / espanhol para públicos distintos

Cada instância tem:
- URL WordPress própria (configurada pelo usuário)
- Categorias e tags padrão configuradas
- Idioma de publicação definido

### 5.7 Reuso da Infraestrutura OmniSeen

O Living Word não apenas usa o WordPress REST API do OmniSeen — ele herda o **DNA de automação editorial**:

| Componente OmniSeen | Adaptação Living Word |
|---|---|
| Pipeline de geração de conteúdo | Reorientado para contexto cristão/devocional |
| Publicação automatizada via WordPress REST | Reuso direto — zero reescrita |
| Estrutura de múltiplas instâncias | Reuso direto com config de site por ministério |
| Perfil editorial por usuário | Adaptado com dimensões pastorais (tom, doutrina, voz) |
| Fila de publicação e agendamento | Reuso direto |
| Mecanismos de organização por categoria | Adaptado com taxonomia cristã |
| Fluxo criação → revisão → publicação | Reuso com adição de guardrails teológicos |

**Resultado prático:** Frente B não é construída do zero. É uma camada de contexto cristão sobre uma infraestrutura editorial que já existe e funciona.

---

## 6. ARQUITETURA TÉCNICA

### 6.1 Stack

```
Frontend:     React + Tailwind + shadcn/ui (Lovable)
Backend:      Supabase (Postgres + Edge Functions + Auth + RLS)
IA:           OpenAI API — modelo: gpt-4o-mini · variável LLM_MODEL para troca sem reescrita
Bible APIs:   API.Bible + ApiBiblia + Bolls.life (ver seção 6.7)
Publishing:   WordPress REST API (OmniSeen Publisher — reuso direto)
Pagamento:    Stripe (via Supabase)
i18n:         Detecção automática de idioma + seleção manual (PT/EN/ES)
```

### 6.2 Tabelas Supabase

```sql
-- Usuários e planos
users (
  id, email, plan, 
  language_preference,            -- PT | EN | ES
  doctrine_preference,
  pastoral_voice,
  bible_version,
  generation_count_month,
  created_at
)

-- Perfil editorial (Frente B)
user_editorial_profile (
  user_id,
  tone, depth, writing_style,
  preferred_length, publish_frequency,
  priority_themes TEXT[],
  active_sites JSONB             -- [{url, name, wp_token, language}]
)

-- Materiais gerados (Frentes A e B)
materials (
  id, user_id,
  mode,                          -- 'pastoral' | 'blog' | 'article' | 'devotional' | 'evangelistic'
  language,                      -- PT | EN | ES
  bible_passage, audience, pain_point, doctrine_line,
  pastoral_voice, bible_version,
  category,                      -- devocional | predica | reflexao | familia | imigrante | evangelistico
  output_sermon, output_outline, output_blog, output_devotional,
  output_reels, output_bilingual, output_cell,
  theology_layer_marked BOOLEAN,
  citation_audit JSONB,
  generation_time_ms INTEGER,
  created_at
)

-- Fila editorial
editorial_queue (
  id, user_id, material_id,
  target_site_url,
  status,                        -- draft | review | scheduled | published | archived
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  published_url TEXT,
  created_at
)

-- Séries
series (id, user_id, title, theme, passages TEXT[], total_weeks, language, created_at)

-- Biblioteca pessoal
library_tags (id, user_id, material_id, tag, is_favorite)

-- Logs de geração
generation_logs (
  id, user_id, material_id,
  input_tokens, output_tokens,
  generation_time_ms,
  language,
  theology_guardrails_triggered BOOLEAN,
  sensitive_topic_detected TEXT,
  error_code TEXT,
  created_at
)
```

### 6.3 Prompt Master v3 (trilíngue)

```
You are a pastoral theological AI copilot. Your role is to help pastors and Christian leaders 
prepare faithful, clear, and applicable biblical material — and to create written Christian 
content for digital publication.

Respond in {language}. Generate content that sounds like a native pastoral voice in that 
language — not a translation.

INVIOLABLE RULES:
1. Every generation begins: passage → literary context → historical context → interpretation → application
2. Always distinguish: [TEXT] what the passage says | [INTERPRETATION] what theologians understand | [APPLICATION] pastoral application
3. NEVER invent Bible verses. If unsure of a reference, omit it.
4. If the requested application exceeds what the text supports: ⚠️ PASTORAL WARNING: this application goes beyond what the text directly states.
5. All Bible quotes must use version: {bible_version}
6. Mark each citation: [DIRECT QUOTE] | [PARAPHRASE] | [ALLUSION]
7. Respect doctrinal line: {doctrine_line}
8. Respect pastoral voice and style: {pastoral_voice}
9. All content ends with (in the appropriate language):
   PT: ⚠️ Rascunho gerado com IA. Revise, ore e pregue/publique com sua voz.
   EN: ⚠️ AI-generated draft. Review, pray, and preach/publish with your own voice.
   ES: ⚠️ Borrador generado con IA. Revisa, ora y predica/publica con tu propia voz.

SENSITIVE CONTEXT: If pain_point or audience touches: depression, trauma, abuse, domestic violence, 
immigration/documents, severe grief, suicidal ideation — activate CAUTION MODE:
- Welcoming tone, never prescriptive
- No recommendations that could be interpreted as legal or clinical advice
- Add note recommending qualified pastoral or professional support

AUDIENCE: {audience}
PAIN / CONTEXT: {pain_point}
PASSAGE: {bible_passage}
OUTPUT MODE: {mode}
CONTENT CATEGORY (if blog/article): {category}
```

### 6.4 Edge Functions

```
/generate-pastoral-material    → Frente A: sermão, esboço, devocional, célula, bilíngue
/generate-blog-article         → Frente B: artigo devocional, prédica em blog, evangelístico
/publish-to-wordpress          → OmniSeen Publisher (reuso direto)
/schedule-publication          → adiciona item à fila editorial
/generate-series               → série de N semanas coerente
/save-to-library               → material + metadados no Supabase
```

### 6.5 Requisitos Não Funcionais

- Tempo de resposta (P95): ≤ 15 segundos por geração
- Disponibilidade: 99,5% (SLA Supabase)
- Idioma: detecção automática por `navigator.language` ou configuração de conta
- API keys OpenAI: server-side only (Edge Functions). Nunca no frontend.
- RLS habilitado em todas as tabelas
- Dados sensíveis (pain_point): não indexados para busca pública
- LGPD/GDPR: exportação e exclusão disponíveis

### 6.6 Custos Estimados por Geração (gpt-4o-mini)

Modelo: gpt-4o-mini · $0,15/M input · $0,60/M output · caching $0,075/M (80% do input é prompt master fixo)

| Tipo | Input tokens | Output tokens | Custo estimado |
|---|---|---|---|
| Pastoral completo (Frente A) | ~800 | ~2.500 | ~$0,0015 |
| Artigo de blog (Frente B) | ~600 | ~1.800 | ~$0,0011 |
| Ambas as frentes juntas | ~1.200 | ~4.000 | ~$0,0025 |
| Com prompt caching ativo | ~1.200 | ~4.000 | ~$0,0018 |

**Custo por plano/usuário/mês:**

| Plano | Gerações | Custo API/usuário | Receita | Margem bruta | % Margem |
|---|---|---|---|---|---|
| Free | 5 | ~$0,013 | $0 | -$0,013 | subsidiado |
| Pastoral | 40 | ~$0,10 | $9,00 | ~$8,90 | **99%** |
| Church | 200 | ~$0,50 | $29,00 | ~$28,50 | **98%** |
| Ministry | 500 | ~$1,25 | $79,00 | ~$77,75 | **98%** |

1.000 usuários free = ~$13/mês · 1 Pastoral cobre 692 free · conversão mínima: 0,15%

---

## 7. MODELO DE MONETIZAÇÃO

### Princípio
A plataforma começa como missão pessoal. Se paga com planos avançados para pastores, igrejas e ministérios que queiram o mesmo acesso — com mais volume e capacidade de publicação.

### Planos

| Plano | Preço | Gerações/mês | Frente A | Frente B | Sites |
|---|---|---|---|---|---|
| **Free** | $0 | 5 | ✅ 4 formatos | ✅ 1 artigo/mês | — |
| **Pastoral** | $9/mês | 40 | ✅ Todos os formatos | ✅ 20 artigos | 1 site |
| **Church** | $29/mês | 200 | ✅ + equipe (3 usuários) | ✅ 100 artigos + fila | 3 sites |
| **Ministry** | $79/mês | Ilimitado* | ✅ + equipe (10) | ✅ Ilimitado + séries + analytics | 10 sites |

*Ilimitado sujeito a fair use policy (500 gerações/mês).

**Nota estratégica:** SermonAI cobra $15–$29/mês sem publicação, sem PT/ES, sem contexto imigrante. O Living Word entrega mais por menos nos planos base, e abre um tier de $79/mês sem concorrente direto no mercado hispânico e brasileiro.

---

## 8. FUNCIONALIDADES POR FASE

### FASE 1 — MVP (semanas 1–10)

| Feature | Frente | Critério de aceite |
|---|---|---|
| Seletor de tipo de saída | UX | Visível na tela principal, ≤ 1 clique para modo blog |
| Estúdio — 6 campos + config | A | Geração em ≤ 15s, todos os campos refletidos no output |
| 6 formatos pastorais | A | Conteúdo distinto por formato, watermark presente |
| Artigo devocional completo | B | 300–600 palavras, categoria identificada, guardrails presentes |
| Artigo de prédica em formato blog | B | 800–1.200 palavras, estrutura narrativa/expositiva |
| Geração por tipo de público | B | Segmentação visível no tom e no vocabulário |
| Salvar como rascunho editorial | B | Status "draft" na fila editorial |
| Publicação manual WordPress | B | Publicado no site configurado com 1 clique |
| Biblioteca por categoria | A+B | Filtro por tipo, idioma e favoritos |
| i18n PT/EN/ES | Core | Idioma da interface + do conteúdo gerados nativamente |
| Planos Free / Pastoral / Church | Core | Limites aplicados server-side, upgrade claro |

### FASE 2 — Diferencial (semanas 11–18)

| Feature | Frente | Critério de aceite |
|---|---|---|
| Temas imigrantes pré-configurados | A+B | 12+ temas injetados automaticamente |
| Calendário editorial cristão | B | Sugestão automática por data litúrgica |
| Séries de sermões | A | 4–8 semanas coerentes a partir de livro/tema |
| Múltiplos sites / instâncias | B | Até 3 sites configurados (plano Church) |
| Agendamento de publicação | B | Fila com data/hora, publicação automática |
| Histórico de pregação | A | Evita repetição de passagem nos últimos 12 meses |
| Séries devocionais automatizadas | B | Série de 7–30 dias com coerência temática |

### FASE 3 — Escala (semanas 19–28)

| Feature | Frente | Critério de aceite |
|---|---|---|
| Transcrição de sermão → conteúdo | A+B | Áudio → texto → derivados em ≤ 5 min |
| Clusters de conteúdo por tema | B | Grupo de artigos linkados por tema bíblico |
| Analytics de distribuição | B | Leituras, taxa de abertura, engajamento por site |
| Sugestão de pauta personalizada | B | Baseada em histórico editorial + preferências |
| Reaproveitamento multi-formato | A+B | 1 sermão → blog + devocional + reel + artigo |
| Plano Ministry (10 sites) | Core | Capacidade ilimitada + analytics avançado |

---

## 9. QA TEOLÓGICA

### 9.1 Rubrica de Avaliação (por material gerado)

| Dimensão | 1 (falha) | 3 (aceitável) | 5 (excelente) |
|---|---|---|---|
| Fidelidade bíblica | Versículo inventado ou texto distorcido | Texto correto, aplicação forçada | Texto, contexto e aplicação alinhados |
| Camadas marcadas | Sem distinção | Distinção parcial | Três camadas claramente demarcadas |
| Aderência doutrinária | Vocabulário incompatível | Neutro genérico | Ênfases e vocabulário coerentes |
| Naturalidade pastoral | Robótico / parece tradução | Legível mas formal demais | Soa como pastor humano no idioma nativo |
| Adequação ao público | Sem contexto específico | Menção superficial | Referências empáticas e contextuais |
| Voz do pastor | Estilo ignorado | Levemente perceptível | Estilo claramente presente |

**Meta para lançamento:** média ≥ 4,0 em todas as dimensões nos materiais do beta.

### 9.2 Falhas que Invalidam uma Geração

- Versículo que não existe no cânon
- Afirmação doutrinária contraditória à linha escolhida
- Tom normativo em contexto de trauma ou abuso
- Citação em versão diferente da selecionada
- Conteúdo em idioma diferente do configurado

### 9.3 Processo de Revisão Humana (Beta)

1. Todo material do beta revisado por Severino antes de ir ao banco de feedback
2. Checklist por material: versículo real ✓ / camadas demarcadas ✓ / voz pastoral ✓ / idioma nativo ✓ / watermark ✓
3. Feedback qualitativo: 1 pergunta — "O que você mudaria?"
4. Iteração no prompt master a cada 5 materiais revisados
5. **Critério de saída do beta:** 3 pastores independentes (1 BR, 1 US, 1 hispânico) avaliam 10 materiais e dão média ≥ 4,0

---

## 10. DIFERENCIAL COMPETITIVO

| Critério | SermonAI | ChatGPT | Logos | **Living Word** |
|---|---|---|---|---|
| Português nativo | ❌ | Parcial | ❌ | ✅ |
| Inglês | ✅ | ✅ | ✅ | ✅ |
| Espanhol nativo | ❌ | Parcial | Parcial | ✅ |
| Contexto imigrante | ❌ | ❌ | ❌ | ✅ Embutido |
| Guardrail doutrinário | ❌ disclaimer | ❌ | Parcial | ✅ Por linha |
| Saída bilíngue PT/EN/ES | ❌ | Manual | ❌ | ✅ Automático |
| Voz/estilo pastoral | ❌ | ❌ | ❌ | ✅ |
| Blog devocional automatizado | ❌ | Manual | ❌ | ✅ |
| Publicação WordPress integrada | ❌ | ❌ | ❌ | ✅ |
| Múltiplos sites | ❌ | ❌ | ❌ | ✅ (Church+) |
| Calendário editorial cristão | ❌ | ❌ | ❌ | ✅ |
| Guardrails tópicos sensíveis | ❌ | ❌ | ❌ | ✅ |
| Preço | $15–$29/mês | $20/mês | $500+ | $0–$79/mês |

---

## 11. ROADMAP

### Sprint 1 (semanas 1–3): Fundação
- [ ] Setup Supabase: todas as tabelas com RLS
- [ ] Auth PT/EN/ES (email + Google) com detecção automática de idioma
- [ ] Edge Functions: `generate-pastoral-material` + `generate-blog-article`
- [ ] Prompt master v3 com suporte trilíngue
- [ ] Testes internos: 20 gerações em PT, EN e ES

### Sprint 2 (semanas 4–6): Estúdio MVP
- [ ] Seletor de tipo de saída (tela inicial)
- [ ] Estúdio com 6 campos + configurações colapsadas
- [ ] Output Frente A: 6 formatos pastorais
- [ ] Output Frente B: artigo devocional + artigo de prédica
- [ ] Rastreabilidade de citações no rodapé

### Sprint 3 (semanas 7–9): Editorial + Publicação
- [ ] Fila editorial (status: draft / scheduled / published)
- [ ] Edge Function `publish-to-wordpress` (OmniSeen — reuso direto)
- [ ] Configuração de site WordPress por usuário
- [ ] Biblioteca com filtro por categoria e idioma
- [ ] QA teológica interna: 50 gerações em 3 idiomas

### Sprint 4 (semanas 10–13): Beta Real
- [ ] Stripe + planos (Free / Pastoral / Church)
- [ ] Guardrails de tópicos sensíveis ativos
- [ ] Landing page trilíngue + onboarding 3 passos
- [ ] Beta fechado: 15–25 pastores (BR, US, hispânico)
- [ ] Revisão humana com rubrica de QA
- [ ] 2 rodadas de refinamento de prompt por feedback

### Sprint 5 (semanas 14–16): Lançamento
- [ ] Critério de saída do beta atingido (≥ 4,0 nas 3 audiências)
- [ ] Observabilidade: generation_logs + alertas de custo e erro
- [ ] Lançamento público: comunidades pastorais BR, EN, ES
- [ ] Agendamento de publicação ativo

---

## 12. MÉTRICAS DE SUCESSO

### Métricas de produto e negócio (3 meses)

| Métrica | Meta | Fonte |
|---|---|---|
| Usuários ativos | 100 pastores | Supabase |
| Gerações/semana | 400+ | generation_logs |
| NPS | ≥ 8,0 | Survey pós-geração |
| Conversão Free → Pastoral | ≥ 15% | Stripe |
| MRR | $1.000+ | Stripe |
| QA médio (rubrica) | ≥ 4,0 | Revisão humana |

### Métricas de conteúdo (3 meses)

| Métrica | Meta | Fonte |
|---|---|---|
| Artigos publicados/semana | 50+ | editorial_queue |
| Taxa de publicação por usuário | ≥ 40% publicam ≥ 1 artigo/semana | Supabase analytics |
| Sites WordPress ativos | 20+ | user_editorial_profile |
| Visualizações de artigos | 500+/semana | WordPress API / Analytics |
| Taxa sermão → blog | ≥ 30% dos sermões geram 1 artigo | materials JOIN queue |
| Retenção de usuários publicadores | ≥ 70% no mês 2 | Stripe + Supabase |
| Distribuição de idiomas | ≥ 20% EN, ≥ 15% ES no mês 3 | generation_logs |

---

## 13. RISCOS ABERTOS

| Risco | Impacto | Próxima ação |
|---|---|---|
| Qualidade real do prompt master v3 em 3 idiomas | Alto | Testar 60 gerações (20/idioma) antes do beta |
| Naturalidade em ES (não validada) | Alto | Revisor hispânico nativo no beta |
| WTP $9–$79/mês não validado | Médio | Confirmar no beta com 25 pastores |
| Custo real por geração trilíngue | Médio | Medir nas primeiras 100 gerações |
| Resistência de pastores americanos a IA | Médio | Posicionamento distinto por audiência no onboarding |
| Reuso do OmniSeen Publisher (compatibilidade) | Baixo | Testar Sprint 3 — infra já existe |
| Escala do QA humano após 200+ usuários | Alto | Sem solução a escala — resolver após PMF |

---

## 14. NOME E IDENTIDADE

**Nome principal:** Living Word  
**PT:** Palavra Viva · **ES:** Palabra Viva  
**Tagline EN:** *"From the pulpit to the reader — faithful, clear, scalable."*  
**Tagline PT:** *"Do púlpito ao leitor — fiel, claro, com alcance."*  
**Tagline ES:** *"Del púlpito al lector — fiel, claro, con alcance."*  

**Identidade visual:** Sóbria, ministerial, moderna. Cores: off-white, verde-escuro ministerial, dourado envelhecido. Tipografia: serif elegante (títulos) + sans-serif limpa (corpo). Sem carnaval de features.

---

## 15. NOTA FINAL

Este projeto começa como ato de fé e responsabilidade pastoral.  
A missão é simples: **levar a Palavra com fidelidade, clareza e alcance — em português, em inglês, em espanhol, para quem está longe de casa e para quem ainda não encontrou o caminho.**

> *"A Palavra de Deus não está acorrentada." — 2 Timóteo 2:9 / 2 Timothy 2:9 / 2 Timoteo 2:9*

---

*PRD v3.0 — Revisado para execução real via Antigravity + Lovable + OmniSeen*  
*Próximo passo: spec completo das Edge Functions → protótipo do Estúdio no Lovable → beta com pastores em Atlanta*

---

## ADENDO v3.1 — MODELO DE IA E BIBLE API

### Modelo de IA: gpt-4o-mini (OpenAI)

- Modelo: `gpt-4o-mini`
- Preço: $0,15/M input · $0,60/M output · caching $0,075/M (50% desconto)
- Context window: 128K tokens
- Troca futura sem reescrita: variável de ambiente `LLM_MODEL`
- Custo por geração com caching ativo (~80% do input): ~$0,0018
- Margem bruta (plano Pastoral $9/mês · 40 gerações · com caching): ~$8,90 (**99%**)

### Bible API — Arquitetura em Duas Camadas

**Camada 1 — Citações exibidas na interface:**

| API | Versões | Custo | Uso |
|---|---|---|---|
| API.Bible (scripture.api.bible) | NIV, KJV, NVI-ES, RVR60 + 2.000+ | Grátis (key) | Padrão EN + ES |
| ApiBiblia (apibiblia.com) | RVR60, NVI-ES, KJV | Pago (baixo) | ES principal |
| Bolls.life (bolls.life/api) | NIV, ESV, NLT, NVI-ES + 20 idiomas | Grátis | Backup EN |
| ESV API (api.esv.org) | ESV | Grátis não-comercial | EN formal |
| wldeh/bible-api (GitHub) | 200+ versões open source | Grátis, sem limites | Fallback PT (ARA/ACF) |

**Versões PT — situação real de licenciamento:**
- NVI-PT: direitos Biblica — sem API pública legal. MVP usa ARA como fallback; negociar licença após tração.
- ARA / ACF: domínio público — disponíveis via wldeh/bible-api.
- NTLH: licença SBB — verificar termos comerciais antes de integrar.

**Solução MVP NVI-PT:** GPT-4.1 reproduz vocabulário NVI com fidelidade suficiente para fins pastorais. Citações marcadas como [PARÁFRASE NVI-PT] até licença formal.

**Camada 2 — Geração pelo gpt-4o-mini:** instrução explícita para usar vocabulário da versão selecionada. Para [DIRECT QUOTE], Edge Function `/fetch-bible-verse` faz lookup na API correta e substitui texto gerado pelo texto oficial.

### Versões disponíveis por idioma (MVP)

| Idioma | Versões disponíveis | Via API |
|---|---|---|
| PT | ARA, ACF | wldeh/bible-api |
| PT | NVI-PT | gpt-4o-mini reproduz estilo (até licença) |
| EN | NIV, ESV, NLT, KJV, NKJV | API.Bible + Bolls.life + ESV API |
| ES | RVR60, NVI-ES, DHH | ApiBiblia + API.Bible |

Edge function adicional: `/fetch-bible-verse` → roteamento por `bible_version` → API correta → texto real substituído no conteúdo gerado.

---

## ADENDO v3.2 — CUSTOS, SUBDOMÍNIOS E ONBOARDING

### Modelo de custo real por usuário/mês (GPT-4.1 com prompt caching)

Premissas: gpt-4o-mini $0,15/M input · $0,60/M output · caching $0,075/M (80% do input é prompt master fixo).
Tokens por geração: ~1.200 input / ~4.000 output.

| Plano | Gerações | Custo API/usuário | Receita | Margem bruta | % Margem |
|---|---|---|---|---|---|
| Free | 5 | ~$0,013 | $0 | -$0,013 | — (subsidiado) |
| Pastoral | 40 | ~$0,10 | $9,00 | ~$8,90 | **99%** |
| Church | 200 | ~$0,50 | $29,00 | ~$28,50 | **98%** |
| Ministry | 500 | ~$1,25 | $79,00 | ~$77,75 | **98%** |

**Ponto crítico — plano Free:**
- Custo por usuário free: ~$0,013/mês
- 1.000 usuários free = ~$13/mês em custo subsidiado
- Breakeven: 1 usuário Pastoral cobre 692 usuários Free
- Conversão mínima necessária para cobrir o free: **0,15% Free → Pastoral**
- Onboarding com 2 artigos automáticos: ~$0,005/cadastro adicional

**Regra de risco:** se a taxa de conversão ficar abaixo de 2%, o free começa a pesar. Monitorar mensalmente. Válvula de segurança: reduzir free para 3 gerações se necessário.

### Painel Admin — Requisitos

**Visão por usuário (tabela):**
- Nome, plano, gerações consumidas/limite, % de uso do limite
- Custo API real (tokens × preço), receita, margem individual
- Alimentado por: `generation_logs` JOIN `users` no Supabase

**Visão consolidada por plano:**
- Total de usuários por tier
- MRR total, custo API total, margem bruta total
- Gráfico de barras: MRR × Custo × Margem

**Alertas automáticos (via Supabase Edge Functions + email):**
- Usuário Free que atingiu 80% do limite → trigger de upgrade suave
- Custo API diário > $10 → alerta imediato
- Taxa de conversão Free→Pago abaixo de 2% no mês → alerta estratégico
- Margem bruta total abaixo de 70% → revisão de pricing

**Tabela Supabase adicional:**
```sql
admin_cost_snapshot (
  id, snapshot_date,
  users_free, users_pastoral, users_church, users_ministry,
  total_mrr, total_api_cost, total_margin,
  tokens_input_total, tokens_output_total,
  conversion_rate_free_to_paid,
  created_at
)
```
Snapshot gerado por cron diário via Supabase Edge Function.

---

### Infraestrutura de Subdomínios — joao.livingword.app

**Decisão:** cada usuário recebe `[handle].livingword.app` no cadastro, automaticamente.

**Stack técnica:**
- DNS: wildcard `*.livingword.app` apontando para o servidor de blog
- Blog engine: WordPress Multisite OU solução headless própria (Next.js + Supabase)
- Provisionamento: Edge Function `provision-user-blog` roda no cadastro
- SSL: wildcard certificate via Let's Encrypt / Cloudflare
- Domínio próprio (planos Church+): CNAME apontando para `[handle].livingword.app`

**Recomendação de engine:**
- MVP: WordPress Multisite (reuso direto da infra OmniSeen, menor esforço)
- Escala: blog engine próprio em Next.js + Supabase (mais controle, melhor performance)
- Decisão: começar com WordPress Multisite no MVP, migrar na Fase 3 se necessário

**Edge Function: `/provision-user-blog`**
```
Trigger: novo usuário criado no Supabase Auth
Ação:
  1. Criar subsite no WordPress Multisite com slug = handle do usuário
  2. Configurar autor padrão = nome do usuário
  3. Configurar idioma = language_preference
  4. Gerar 2 artigos devocionais via /generate-blog-article
  5. Publicar os 2 artigos automaticamente
  6. Salvar blog_url em users.blog_url
  7. Retornar URL ao frontend para exibir no painel
```

**Custo de infraestrutura por blog:**
- WordPress Multisite: custo marginal por subsite ≈ $0 (compartilhado)
- SSL wildcard: ~$0 (Cloudflare)
- Storage por usuário: ~1MB/mês (só texto)
- Custo real adicional por usuário: desprezível até ~10.000 usuários

---

### Onboarding — Do Cadastro ao Primeiro Artigo Publicado

**Princípio:** o usuário vê valor ANTES de qualquer esforço.

**Fluxo (5 passos, < 2 minutos):**

1. **Cadastro** — nome, email/Google, idioma, denominação. 3 campos. 30 segundos.
2. **Subdomínio provisionado** — `joao.livingword.app` criado automaticamente. Usuário vê a URL do blog dele em tempo real.
3. **2 artigos gerados e publicados** — sistema gera 2 devocionais assinados com o nome do usuário. Publicados automaticamente. Sem input do usuário.
4. **Painel de boas-vindas** — usuário vê: blog ao vivo, 2 artigos com o nome dele, 3 gerações restantes no free, botão "Gerar novo artigo".
5. **Próximo passo sugerido** — card com passagem e tema pré-preenchidos. Um clique para gerar o terceiro artigo.

**Os 2 artigos automáticos:**
- Artigo 1: devocional de boas-vindas baseado em João 1:1 ("No princípio era o Verbo") — contextualizado para a denominação escolhida
- Artigo 2: devocional sobre propósito e missão baseado em Mateus 5:13-16 ("Vós sois o sal da terra")
- Ambos assinados com o nome do usuário
- Ambos publicados em `[handle].livingword.app`
- Custo total: ~$0,06

**Aha moment:** o usuário entra no produto já com um blog ao vivo com o nome dele e 2 artigos publicados. Não precisa entender nada antes de ver valor.

