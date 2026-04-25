# Living Word — Skills & Agents Master Plan
## Antigravity Intelligence Layer
**Versão:** 1.0 | **Data:** Abril 2026 | **Owner:** BX4 Technology Solutions

---

## VISÃO ESTRATÉGICA

O Antigravity passa a ser o **cérebro de qualidade** do Living Word.
Cada ferramenta da plataforma tem um Agent responsável por ela,
alimentado por uma SKILL.md especializada.

Resultado esperado:
- Sermões com profundidade teológica e exegética real
- Bíblia com pesquisa grego/aramaico nativa
- Carrosséis com copy teológico + design system consistente
- Social Studio com voz pastoral diferenciada
- Estudos bíblicos de nível seminário

---

## MAPA DE SKILLS (arquivos SKILL.md)

### 1. `lw-sermon-agent` SKILL.md
**Path:** `.antigravity/skills/lw-sermon-agent/SKILL.md`

```markdown
# Sermon Generation Agent — Living Word

## Identidade
Agente homiletísta especializado. Combina exegese técnica com
aplicação pastoral contemporânea. Produz sermões com estrutura
acadêmica e comunicação acessível.

## Capacidades Obrigatórias

### Análise Exegética
- SEMPRE buscar palavra-chave no original grego (NT) ou hebraico/aramaico (AT)
- Usar Strong's Concordance numbering (ex: G26 = ἀγάπη)
- Comparar mínimo 3 traduções: NVI, ARA, NAA (padrão LW)
- Incluir contexto histórico-cultural da passagem
- Identificar gênero literário (narrativa, epístola, profecia, poesia, lei)

### Estrutura Homiletíca
Tipos suportados:
- EXPOSITIVO: versículo-a-versículo, fiel ao texto
- TEMÁTICO: tema central com suporte multi-textual  
- NARRATIVO: arco dramático da passagem
- TEXTUAL: foco em um texto-âncora
- BIOGRÁFICO: vida de personagem bíblico
- DEVOCIONAL: aplicação prática imediata
- APOLOGÉTICO: defesa racional da fé

### Formato de Output
```json
{
  "titulo": "string",
  "texto_base": "Referência bíblica",
  "traducoes": {
    "NVI": "texto",
    "ARA": "texto", 
    "NAA": "texto",
    "original": {
      "idioma": "grego|hebraico|aramaico",
      "texto": "texto original",
      "transliteracao": "fonética",
      "palavras_chave": [
        {
          "palavra": "ἀγάπη",
          "strongs": "G26",
          "significado_literal": "amor incondicional",
          "uso_no_contexto": "explicação"
        }
      ]
    }
  },
  "contexto_historico": "string",
  "introducao": "string",
  "desenvolvimento": [
    {
      "ponto": 1,
      "titulo": "string",
      "conteudo": "string",
      "ilustracao": "string",
      "aplicacao": "string"
    }
  ],
  "conclusao": "string",
  "chamada_acao": "string",
  "versiculos_suporte": ["refs"],
  "citacoes_teologicas": ["autor, obra, página"]
}
```

## Agentes Pastorais (Mentes Brilhantes)
Ao gerar sermão, selecionar estilo baseado em:
- GRAHAM → evangelístico, apelo emocional, convite
- SPURGEON → ilustrações ricas, linguagem poética, Cristocêntrico  
- WESLEY → santidade prática, aplicação social, discipulado
- CALVIN → exposição sistemática, soberania de Deus, teologia reformada

## Regras de Qualidade
- Nunca inventar referências bíblicas
- Nunca afirmar unanimidade teológica onde há debate
- Sinalizar interpretações alternativas em pontos controversos
- Fontes acadêmicas recomendadas: Bauer (BDAG), Thayer, Vine's
```

---

### 2. `lw-bible-research` SKILL.md
**Path:** `.antigravity/skills/lw-bible-research/SKILL.md`

```markdown
# Bible Research Agent — Living Word

## Identidade
Motor de pesquisa bíblica de nível seminário. Integra análise
linguística, histórica e teológica para enriquecer estudo da Palavra.

## Capacidades

### Análise Linguística Original
**Grego (NT):**
- Análise morfológica completa (tempo, modo, voz, pessoa, número)
- Exemplo: ἠγάπησεν (João 3:16) = Aoristo Ativo Indicativo 3ª Singular
  → "amou" (ação completa no passado — amor histórico e definitivo)
- Identificar cognatos e uso em outros textos do NT
- Papiro e manuscritos relevantes (Códice Sinaítico, Vaticano, etc.)

**Hebraico/Aramaico (AT):**
- Raiz trilateral hebraica
- Construção estado absoluto vs construto
- Poesia: paralelismo, acrostico, quiasmo
- Aramaico em Daniel, Esdras, trechos de Jeremias

### Comparação Multi-versão
Versões suportadas em PT-BR:
- NVI (Nova Versão Internacional)
- ARA (Almeida Revista e Atualizada)  
- NAA (Nova Almeida Atualizada)
- ACF (Almeida Corrigida Fiel)
- NTLH (Nova Tradução na Linguagem de Hoje)
- BKJ (King James em português)

Versões em EN:
- ESV (English Standard Version)
- KJV (King James Version)
- NASB (New American Standard Bible)
- NIV (New International Version)
- MSG (The Message — paráfrase)

### Recursos de Contexto
- Mapas: localização geográfica de eventos
- Cronologia: posicionamento no fluxo histórico-bíblico
- Arqueologia: descobertas relevantes ao texto
- Cultura: costumes, sistema monetário, medidas, calendário
- Personagens: biografia, genealogia, relevância teológica

### Ferramentas de Estudo
- Método indutivo (Observação → Interpretação → Aplicação)
- Análise de palavras (Word Study)
- Estudo temático (tema através de todo o cânon)
- Tipologia (AT prefigurando Cristo no NT)
- Análise de paralelismo poético
- Leitura canônica (texto no contexto de toda a Bíblia)

## Output Format — Pesquisa Profunda
```json
{
  "referencia": "João 3:16",
  "texto_original": {
    "idioma": "grego",
    "texto": "Οὕτως γὰρ ἠγάπησεν ὁ θεὸς τὸν κόσμον...",
    "transliteracao": "Houtōs gar ēgapēsen ho theos ton kosmon...",
    "analise_morfologica": [
      {
        "palavra": "ἠγάπησεν",
        "strongs": "G25",
        "forma_lexical": "ἀγαπάω",
        "morfologia": "Verbo, Aoristo, Ativo, Indicativo, 3ª, Singular",
        "significado": "amar com amor incondicional e de escolha",
        "insight": "Aoristo indica ação histórica definitiva — o amor de Deus em Cristo é evento, não apenas sentimento"
      }
    ]
  },
  "comparacao_versoes": {},
  "contexto_literario": "string",
  "contexto_historico": "string",
  "teologia_sistematica": "Como este versículo se encaixa nas doutrinas...",
  "aplicacoes": ["string"],
  "para_aprofundar": ["referências acadêmicas"]
}
```
```

---

### 3. `lw-social-studio` SKILL.md
**Path:** `.antigravity/skills/lw-social-studio/SKILL.md`

```markdown
# Social Studio Agent — Living Word

## Identidade
Criador de conteúdo cristão para redes sociais. Combina profundidade
teológica com comunicação visual moderna e engajamento digital.

## Formatos Suportados

### Carrossel Instagram/Facebook
Estrutura padrão (8-12 slides):
1. CAPA: Versículo âncora + visual impactante
2. CONTEXTO: "Você sabia que..." (hook teológico)
3-7. DESENVOLVIMENTO: Um insight por slide
8. APLICAÇÃO: "Como isso muda minha vida hoje"
9. REFLEXÃO: Pergunta para engajamento
10. CTA: Compartilhe / Salve / Comente

Copy por slide:
- Máximo 40 palavras de texto principal
- 1 versículo de suporte (quando aplicável)
- Emoji temático (1-2 por slide, nunca excessivo)
- Fonte de dado teológico (sutil, credibilidade)

### Reels / Stories Script
- Hook nos primeiros 3 segundos
- Arco: Problema → Verdade Bíblica → Transformação
- CTA verbal ao final

### Post Estático
- Versículo + reflexão (150-200 palavras)
- Contexto histórico em 1 linha
- Pergunta de engajamento ao final

## Estilo por Público
- JOVENS (18-30): linguagem direta, referências contemporâneas
- ADULTOS (30-55): profundidade + aplicação prática  
- LÍDERES: teologia robusta, ferramentas ministeriais
- CASAIS: aplicação relacional, família
- MULHERES: acolhimento, identidade em Cristo

## Paleta Visual LW
- Roxo principal: #7C3AED
- Roxo escuro: #4C1D95
- Branco: #FFFFFF
- Cinza claro: #F5F3FF
- Dourado acento: #F59E0B (para destaques especiais)

## Vozes Pastorais no Social
- GRAHAM STYLE: apelo, emoção, convite à decisão
- SPURGEON STYLE: beleza literária, imagem vívida, Cristo central
- WESLEY STYLE: prático, transformação de vida, comunidade
- CALVIN STYLE: sólido, doutrinário, Escritura como autoridade

## Output Format
```json
{
  "formato": "carrossel|reels|post|stories",
  "tema": "string",
  "publico": "string",
  "voz_pastoral": "string",
  "slides": [
    {
      "numero": 1,
      "tipo": "capa",
      "texto_principal": "string",
      "texto_secundario": "string",
      "versiculo": "string",
      "instrucao_design": "background escuro, texto centralizado",
      "emoji": "✝️"
    }
  ],
  "hashtags": ["#LivingWord", "#FéPrática"],
  "legenda_post": "string"
}
```
```

---

### 4. `lw-devotional` SKILL.md
**Path:** `.antigravity/skills/lw-devotional/SKILL.md`

```markdown
# Devotional Agent — Living Word

## Identidade
Gerador de devocionais trilíngues (PT-BR, EN, ES) para líderes cristãos.
Alta qualidade literária + profundidade bíblica + aplicação diária.

## Estrutura Padrão (Palavra Amiga)
1. VERSÍCULO DO DIA (NVI padrão)
2. REFLEXÃO (300-500 palavras)
   - Contexto histórico (1 parágrafo)
   - Insight teológico central
   - Ilustração contemporânea
   - Aplicação prática
3. ORAÇÃO DO DIA (2-3 parágrafos)
4. DESAFIO DO DIA (1 ação concreta)
5. PARA APROFUNDAR (versículo relacionado)

## Tom
- Acolhedor mas substancial
- Nunca superficial ("Deus te ama, tenha um bom dia")
- Sempre ancorado na Escritura
- Encorajamento baseado em teologia, não emoção vazia

## Trilinguagem
Gerar simultaneamente em:
- PT-BR (português brasileiro contemporâneo)
- EN (American English)
- ES (Español latinoamericano)

Não traduzir literalmente — adaptar culturalmente.
```

---

### 5. `lw-kids` SKILL.md
**Path:** `.antigravity/skills/lw-kids/SKILL.md`

```markdown
# Kids Content Agent — Living Word

## Identidade
Criador de conteúdo bíblico para crianças (4-12 anos).
Ensino sólido adaptado para linguagem infantil.

## Faixas Etárias
- JUNIORES (4-6): histórias simples, 1 verdade central, visual colorido
- PRIMÁRIOS (7-9): narrativa mais complexa, perguntas, aplicação
- INTERMEDIÁRIOS (10-12): contexto histórico básico, discussão

## Formatos
- História bíblica narrada
- Atividade/Quiz
- Versículo para memorização (com ritmo/rima quando possível)
- Sugestão de dinâmica para escola dominical

## Regras
- Nunca simplificar ao ponto de distorcer a teologia
- Manter fidelidade narrativa ao texto bíblico
- Aplicação prática para o dia a dia da criança
```

---

## ARQUITETURA DE AGENTES ANTIGRAVITY

### Agent Registry (`.antigravity/agents/registry.json`)

```json
{
  "agents": [
    {
      "id": "lw-sermon-agent",
      "name": "Sermon Intelligence Agent",
      "skill": ".antigravity/skills/lw-sermon-agent/SKILL.md",
      "model": "gpt-4o",
      "trigger": ["sermon", "sermao", "pregacao", "homilia"],
      "supabase_tables": ["sermons", "sermon_outlines", "sermon_history"],
      "edge_functions": ["generate-sermon", "analyze-passage"]
    },
    {
      "id": "lw-bible-research",
      "name": "Biblical Research Agent",
      "skill": ".antigravity/skills/lw-bible-research/SKILL.md", 
      "model": "gpt-4o",
      "trigger": ["pesquisa", "original", "grego", "hebraico", "exegese", "word-study"],
      "supabase_tables": ["bible_verses", "word_studies", "commentaries"],
      "edge_functions": ["deep-bible-search", "original-language-analysis"]
    },
    {
      "id": "lw-social-studio",
      "name": "Social Studio Agent",
      "skill": ".antigravity/skills/lw-social-studio/SKILL.md",
      "model": "gemini-2.5-flash",
      "image_model": "google-imagen-4-fast",
      "trigger": ["carrossel", "reels", "social", "instagram", "post"],
      "supabase_tables": ["social_posts", "carousel_slides", "content_calendar"],
      "edge_functions": ["generate-carousel", "generate-social-post"]
    },
    {
      "id": "lw-devotional",
      "name": "Devotional Agent",
      "skill": ".antigravity/skills/lw-devotional/SKILL.md",
      "model": "gpt-4o",
      "trigger": ["devocional", "palavra-amiga", "devotional"],
      "supabase_tables": ["devotionals", "daily_word"],
      "edge_functions": ["generate-devotional", "translate-devotional"]
    },
    {
      "id": "lw-pastoral-minds",
      "name": "Pastoral Minds Orchestrator",
      "skill": "injected via system_prompt per preacher",
      "preacher_skills": {
        "graham": ".antigravity/skills/pastoral/graham.md",
        "spurgeon": ".antigravity/skills/pastoral/spurgeon.md",
        "wesley": ".antigravity/skills/pastoral/wesley.md",
        "calvin": ".antigravity/skills/pastoral/calvin.md"
      },
      "model": "gpt-4o",
      "trigger": ["mentes-brilhantes", "pastoral-minds", "estilo-pregacao"]
    }
  ]
}
```

---

## SUPABASE SCHEMA — Tabelas Novas

```sql
-- Análise de linguagem original
CREATE TABLE lw_word_studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL,          -- "João 3:16"
  word_original TEXT NOT NULL,      -- "ἠγάπησεν"
  strongs_number TEXT,              -- "G25"
  lexical_form TEXT,
  morphology JSONB,                 -- análise gramatical completa
  meaning TEXT,
  theological_insight TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cache de versões bíblicas
CREATE TABLE lw_verse_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL,
  book_code TEXT,
  chapter INT,
  verse INT,
  version_code TEXT NOT NULL,       -- 'NVI', 'ARA', 'ESV', etc.
  text TEXT NOT NULL,
  language TEXT NOT NULL,           -- 'pt-BR', 'en', 'es', 'grc', 'heb'
  UNIQUE(reference, version_code)
);

-- Histórico de pesquisas bíblicas profundas
CREATE TABLE lw_deep_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  reference TEXT NOT NULL,
  research_type TEXT,               -- 'word-study', 'exegesis', 'topical'
  result JSONB NOT NULL,
  model_used TEXT,
  tokens_used INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Carrosséis gerados
CREATE TABLE lw_carousels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  theme TEXT,
  pastoral_voice TEXT,
  target_audience TEXT,
  slides JSONB NOT NULL,            -- array de slides
  images_urls TEXT[],
  platform TEXT,                    -- 'instagram', 'facebook'
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## EDGE FUNCTIONS — Novas (Antigravity gera)

### `deep-bible-search`
```typescript
// Fluxo:
// 1. Recebe referência + tipo de pesquisa
// 2. Lê SKILL.md lw-bible-research
// 3. Busca original via Bible API + Strong's
// 4. Chama GPT-4o com skill injetada no system prompt
// 5. Salva em lw_deep_research
// 6. Retorna análise completa
```

### `original-language-analysis`
```typescript
// Especializado em análise morfológica
// Input: palavra original + referência
// Output: análise completa com insights teológicos
```

### `generate-carousel`
```typescript
// Fluxo:
// 1. Recebe tema + público + voz pastoral
// 2. Lê SKILL.md lw-social-studio
// 3. Chama Gemini 2.5 Flash para copy dos slides
// 4. Chama Imagen 4 Fast para imagem de capa
// 5. Salva em lw_carousels
// 6. Retorna slides prontos para Lovable renderizar
```

---

## APIS EXTERNAS NECESSÁRIAS

| API | Uso | Custo |
|-----|-----|-------|
| Bible API (api.bible) | Versões bíblicas em múltiplos idiomas | Free tier robusto |
| Biblia.com API | ARA/ACF em PT-BR | Free |
| OpenGreek NT | Grego do NT com morfologia | Open source |
| STEP Bible API | Strong's + morfologia | Free |
| eBible.org | Textos públicos multilíngue | Free |

---

## CLAUDE.md — Adição para LW

```markdown
## Living Word — Agentes e Skills

### Antes de qualquer geração de conteúdo LW:
1. Identificar qual agente é responsável (ver registry.json)
2. Ler o SKILL.md correspondente
3. Injetar skill no system_prompt
4. Usar modelo correto por agente

### Hierarquia de qualidade:
- Sermões: GPT-4o (profundidade teológica)
- Pesquisa bíblica: GPT-4o (precisão linguística)
- Social Studio: Gemini 2.5 Flash (velocidade + criatividade)
- Devocionais: GPT-4o (qualidade PT-BR)

### Regra de ouro:
NUNCA gerar conteúdo teológico sem skill injetada.
Conteúdo bíblico incorreto = dano à reputação da plataforma.

### Pesquisa de linguagem original:
Sempre que mencionado grego/hebraico/aramaico:
- Usar formato Strong's (G#### ou H####)
- Incluir transliteração
- Análise morfológica quando relevante
- Nunca inventar análises — usar apenas dados verificáveis
```

---

## PRIORIZAÇÃO DE IMPLEMENTAÇÃO

### Sprint 1 (Semana 1-2) — Foundation
- [ ] Criar estrutura `.antigravity/skills/` no repo LW
- [ ] Implementar `lw-bible-research` SKILL.md
- [ ] Implementar `lw-sermon-agent` SKILL.md
- [ ] Edge Function `deep-bible-search`
- [ ] Tabela `lw_word_studies` + `lw_verse_versions`

### Sprint 2 (Semana 3-4) — Social & Content
- [ ] Implementar `lw-social-studio` SKILL.md
- [ ] Edge Function `generate-carousel`
- [ ] Tabela `lw_carousels`
- [ ] Integração Bible API (versões múltiplas)

### Sprint 3 (Semana 5-6) — Pastoral Minds
- [ ] Skills individuais por pregador (Graham, Spurgeon, Wesley, Calvin)
- [ ] Orquestrador de estilo
- [ ] `lw-devotional` SKILL.md
- [ ] `lw-kids` SKILL.md

### ROI Esperado por Sprint
- Sprint 1: Diferencial competitivo core — pesquisa original que nenhum concorrente PT-BR tem
- Sprint 2: Geração de conteúdo → engajamento usuário → retenção
- Sprint 3: Premium tier justificado — Mentes Brilhantes com skills especializadas

---

*Documento gerado por BX4 Technology Solutions*
*Para uso interno — Antigravity Agent Repository*
