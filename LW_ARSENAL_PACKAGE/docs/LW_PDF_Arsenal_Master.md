# LW — PDF Arsenal → Skills & Agents
## Guia Completo de Ingestão de Conhecimento Bíblico
**BX4 Technology Solutions | Antigravity Layer | Versão 1.0**

---

## OS 4 PDFs E SEU POTENCIAL

| PDF | Conteúdo | Páginas | Tipo de Dado |
|-----|----------|---------|--------------|
| **40 Parábolas de Jesus** | Cada parábola: contexto histórico, AT, mensagem central, aplicação | 248 | Estruturado por item |
| **200 Personagens Bíblicos** | Cada personagem: biografia, lições, ensinos | 238 | Estruturado por item |
| **Panorama Bíblico** | Todos 66 livros: autor, data, resumo, contexto | 215 | Estruturado por livro |
| **250 Quiz Bíblico** | 250 perguntas + respostas gabaritadas | 33 | Pares Q&A |

**Total:** ~734 páginas de conteúdo teológico estruturado, pronto para virar base de conhecimento.

---

## ESTRATÉGIA: ONDE E COMO USAR

### Arquitetura de 3 Camadas

```
CAMADA 1 — Supabase (Banco de Conhecimento)
  └── Tabelas estruturadas com todo conteúdo dos PDFs
  └── Busca semântica via pgvector (embeddings)

CAMADA 2 — Antigravity Skills (Comportamento dos Agentes)
  └── SKILL.md ensina COMO usar o conhecimento
  └── Injeta regras no system_prompt

CAMADA 3 — Edge Functions (Acesso em Runtime)
  └── Recupera dados do Supabase
  └── Combina conhecimento + skill → resposta rica
```

---

## CAMADA 1: SCHEMA SUPABASE

### Tabela: `lw_parables` (40 Parábolas)

```sql
CREATE TABLE lw_parables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INT NOT NULL,                    -- 1 a 40
  titulo TEXT NOT NULL,                   -- "O bom samaritano"
  referencia TEXT NOT NULL,               -- "Lucas 10:30-37"
  evangelho TEXT NOT NULL,               -- "Lucas" | "Mateus" | "Marcos" | "João"
  contexto_epoca TEXT,                   -- contexto histórico detalhado
  tensoes_culturais TEXT,                -- divisões sociais/religiosas do tempo
  conexao_at TEXT,                       -- link com Antigo Testamento
  mensagem_central TEXT,                 -- tese principal da parábola
  licoes JSONB,                          -- array de lições práticas
  aplicacao_moderna TEXT,                -- como aplicar hoje
  personagens JSONB,                     -- personagens e seus papéis teológicos
  temas TEXT[],                          -- ["misericórdia", "graça", "perdão"]
  embedding vector(1536),                -- para busca semântica
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca semântica
CREATE INDEX ON lw_parables USING ivfflat (embedding vector_cosine_ops);
```

### Tabela: `lw_characters` (200 Personagens)

```sql
CREATE TABLE lw_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INT NOT NULL,
  nome TEXT NOT NULL,                    -- "Abigail"
  nome_alternativo TEXT,                 -- "Beltessazar" para Daniel
  testamento TEXT NOT NULL,             -- "AT" | "NT" | "AT/NT"
  livros_principais TEXT[],             -- ["1 Samuel", "1 Reis"]
  periodo_historico TEXT,               -- "Período dos Juízes" | "Exílio"
  tribo_origem TEXT,                    -- tribo de Israel quando aplicável
  cargo_funcao TEXT,                    -- "General", "Profeta", "Rei"
  biografia TEXT,                       -- narrativa completa
  principais_acoes JSONB,              -- array de ações/eventos marcantes
  licoes JSONB,                         -- array de lições extraídas
  conexoes JSONB,                       -- outros personagens relacionados
  temas TEXT[],                         -- ["liderança", "fé", "traição"]
  versiculo_chave TEXT,                 -- versículo mais representativo
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabela: `lw_bible_books` (Panorama — 66 Livros)

```sql
CREATE TABLE lw_bible_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_canon INT NOT NULL,            -- 1 a 66
  nome TEXT NOT NULL,                   -- "Gênesis"
  abreviacao TEXT NOT NULL,             -- "GN"
  testamento TEXT NOT NULL,            -- "AT" | "NT"
  secao TEXT NOT NULL,                 -- "Pentateuco" | "Histórico" | "Poético" | etc.
  autor TEXT,                           -- "Moisés" | "Paulo" | "Desconhecido"
  data_escrita TEXT,                    -- "~1440 aC" | "~60 dC"
  idioma_original TEXT,                -- "hebraico" | "grego" | "aramaico"
  destinatarios TEXT,                  -- audiência original
  proposito TEXT,                      -- por que foi escrito
  resumo TEXT,                         -- visão geral completa
  mensagem_central TEXT,               -- tese teológica central
  versiculos_chave TEXT[],             -- versículos mais importantes
  temas_principais TEXT[],             -- temas teológicos
  conexoes_canonicas TEXT,             -- como se conecta com outros livros
  personagens_principais TEXT[],       -- personagens mais relevantes
  estrutura JSONB,                     -- divisão interna do livro
  contexto_historico TEXT,
  arqueologia TEXT,                    -- achados arqueológicos relevantes
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabela: `lw_quiz` (250 Perguntas)

```sql
CREATE TABLE lw_quiz (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INT NOT NULL,                  -- 1 a 250
  pergunta TEXT NOT NULL,
  opcoes JSONB NOT NULL,               -- {"A": "texto", "B": "texto", "C": "texto", "D": "texto"}
  resposta_correta TEXT NOT NULL,      -- "C"
  explicacao TEXT,                     -- por que esta é a resposta (gerada por AI)
  referencia_biblica TEXT,             -- onde encontrar na Bíblia
  nivel_dificuldade TEXT,             -- "basico" | "intermediario" | "avancado"
  categoria TEXT,                      -- "personagens" | "eventos" | "doutrina" | "geografia"
  testamento TEXT,                     -- "AT" | "NT" | "geral"
  temas TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabela: `lw_quiz_sessions` (Sessões de Quiz dos Usuários)

```sql
CREATE TABLE lw_quiz_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  categoria TEXT,
  nivel TEXT,
  perguntas_ids UUID[],
  respostas JSONB,                     -- {pergunta_id: resposta_dada}
  pontuacao INT,
  total_perguntas INT,
  percentual_acerto DECIMAL(5,2),
  tempo_segundos INT,
  completado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## CAMADA 2: SKILL.md — lw-knowledge-base

**Path:** `.antigravity/skills/lw-knowledge-base/SKILL.md`

```markdown
# Knowledge Base Agent — Living Word
## Motor de Conhecimento Bíblico Estruturado

### FONTES DISPONÍVEIS NO SUPABASE

Antes de qualquer resposta sobre conteúdo bíblico, verificar se
o dado está disponível na base estruturada:

| Consulta sobre | Tabela | Coluna de busca |
|----------------|--------|-----------------|
| Parábola específica | lw_parables | titulo, referencia, temas |
| Personagem bíblico | lw_characters | nome, nome_alternativo |
| Livro da Bíblia | lw_bible_books | nome, abreviacao |
| Quiz / Trivia | lw_quiz | categoria, nivel, temas |
| Busca semântica | todas | embedding (pgvector) |

### PRIORIDADE DE FONTES
1. lw_parables / lw_characters / lw_bible_books → dados verificados
2. lw-bible-research SKILL → análise do original
3. Conhecimento de treino do modelo → complemento

### FORMATO DE RESPOSTA ENRIQUECIDA
Sempre que retornar dado da base, incluir:
- Campo: contexto_epoca → "No século I..."
- Campo: conexao_at → "No Antigo Testamento..."
- Campo: mensagem_central → tese da parábola/personagem/livro
- Campo: licoes → aplicações práticas numeradas

### BUSCA SEMÂNTICA
Para perguntas abertas ("qual parábola fala de perdão?"):
- Gerar embedding da query
- Buscar por similaridade coseno nas 4 tabelas
- Retornar top 3 resultados com score de relevância
```

---

## CAMADA 2: SKILL.md — lw-parables-agent

**Path:** `.antigravity/skills/lw-parables-agent/SKILL.md`

```markdown
# Parables Agent — Living Word
## 40 Parábolas de Jesus — Motor de Estudo

### IDENTIDADE
Especialista em parábolas de Jesus.
Conhece profundamente contexto histórico, hermenêutica e aplicação.

### CONTEÚDO DISPONÍVEL (lw_parables)
40 parábolas estruturadas com:
- Contexto do século I (tensões sociais, culturais, religiosas)
- Conexão com o AT (tipologia, citações, eco)
- Mensagem central (o que Jesus quis ensinar)
- Licões práticas (aplicação contemporânea)
- Personagens e seus papéis teológicos

### CAPACIDADES

#### Para cada parábola, gerar:
1. ESTUDO COMPLETO
   - Contexto histórico detalhado
   - Análise narrativa (personagens, conflito, resolução)
   - Palavra-chave em grego quando aplicável
   - Conexão AT
   - Mensagem central
   - 5 aplicações práticas

2. SERMÃO BASEADO NA PARÁBOLA
   → Passar para lw-sermon-agent com dados da parábola como input

3. CARROSSEL SOCIAL
   → 8 slides: contexto → insight → aplicação
   → Passar para lw-social-studio com dados estruturados

4. QUIZ TEMÁTICO
   → Gerar 5-10 perguntas sobre a parábola específica
   → Diferentes níveis (básico, intermediário, avançado)

5. ESTUDO EM GRUPO (Escola Dominical)
   → Perguntas de discussão
   → Dinâmica sugerida
   → Material para líder

### PARÁBOLAS DISPONÍVEIS (índice rápido)
Perdão/Graça: Filho pródigo (#4), Trabalhadores do vinhedo (#36),
  Empregado mau (#35), Dois devedores (#14)
Missão/Evangelismo: Bom samaritano (#1), Rede (#34), Ovelha perdida (#2),
  Moeda perdida (#3), Grande festa (#26)
Mordomia: Talentos (#9), Administrador desonesto (#5), Rico sem juízo (#19)
Escatologia: Dez virgens (#39), Ovelhas e cabras (#40), Retorno do
  proprietário (#29), Joio (#31)
Oração: Viúva e o juiz (#8), Amigo persistente (#18), Fariseu e cobrador (#28)
Reino: Semente de mostarda (#23), Fermento (#24), Tesouro (#32), Pérola (#33)

### OUTPUT FORMAT
```json
{
  "parabola": "O Filho Pródigo",
  "referencia": "Lucas 15:11-32",
  "contexto_historico": "...",
  "analise_personagens": {
    "pai": "representa Deus — amor que aguarda e corre",
    "filho_novo": "o pecador arrependido",
    "filho_velho": "o religioso ressentido"
  },
  "palavra_chave_grego": {
    "palavra": "σπλαγχνίζομαι",
    "transliteracao": "splanchnizomai",
    "significado": "ser movido nas entranhas — compaixão visceral"
  },
  "mensagem_central": "...",
  "licoes": ["...", "..."],
  "para_sermao": {...},
  "para_carrossel": {...},
  "perguntas_grupo": ["..."]
}
```
```

---

## CAMADA 2: SKILL.md — lw-characters-agent

**Path:** `.antigravity/skills/lw-characters-agent/SKILL.md`

```markdown
# Biblical Characters Agent — Living Word
## 200 Personagens Bíblicos — Motor Biográfico

### IDENTIDADE
Especialista em personagens bíblicos.
Combina biografia, teologia e aplicação pastoral.
Base: 200 personagens estruturados (do Abdom ao Zebulom).

### CONTEÚDO DISPONÍVEL (lw_characters)
200 personagens com:
- Biografia completa e contextualizada
- Período histórico e tribo
- Principais ações e eventos
- Lições extraídas pelo teólogo autor
- Conexões com outros personagens

### CAPACIDADES

#### Para cada personagem, gerar:

1. PERFIL BIOGRÁFICO COMPLETO
   - Quem era + família + contexto histórico
   - Cronologia dos eventos principais
   - Falhas e virtudes
   - Papel no plano redentor

2. ESTUDO TIPOLÓGICO
   - Como este personagem prefigura Cristo (quando aplicável)
   - Paralelos NT
   - Leitura cristocêntrica

3. SERMÃO BIOGRÁFICO
   → Estrutura: Quem era → O que fez → O que falhou → O que aprendemos
   → Passar para lw-sermon-agent (tipo: BIOGRÁFICO)

4. SÉRIE TEMÁTICA
   → Agrupar personagens por tema:
     "Mulheres de Fé" (Débora, Rute, Ester, Maria, etc.)
     "Líderes Imperfeitos" (Moisés, Davi, Pedro, etc.)
     "Convertidos Improváveis" (Paulo, Zaqueu, Raabe, etc.)

5. CARROSSEL SOCIAL
   → "Você conhece [NOME]?" → história em slides

### CATEGORIAS DE PERSONAGENS
AT: Patriarcas, Juízes, Reis, Profetas, Mulheres, Guerreiros, Sacerdotes
NT: Apóstolos, Discípulas, Convertidos, Antagonistas, Figuras Secundárias
Especiais: Anjos, Arcanjos, Entidades espirituais

### LOOKUP RÁPIDO
Para perguntas do tipo "Quem foi [X]?":
1. Buscar em lw_characters por nome
2. Retornar: cargo_funcao + periodo + versiculo_chave + resumo_3_linhas
3. Oferecer: "Quer o estudo completo, sermão ou carrossel?"
```

---

## CAMADA 2: SKILL.md — lw-panorama-agent

**Path:** `.antigravity/skills/lw-panorama-agent/SKILL.md`

```markdown
# Bible Panorama Agent — Living Word
## 66 Livros da Bíblia — Motor de Contexto

### IDENTIDADE
Guia especializado nos 66 livros da Bíblia.
Provê visão macro (panorama) e micro (detalhes do livro).
Base: Panorama Bíblico estruturado + análise do original (lw-bible-research).

### CONTEÚDO DISPONÍVEL (lw_bible_books)
66 livros com: autor, data, idioma, destinatários,
propósito, resumo, mensagem central, versículos chave,
temas, conexões canônicas, contexto histórico.

### CAPACIDADES

1. VISÃO PANORÂMICA DO LIVRO
   - Quem escreveu, quando, para quem, por quê
   - Estrutura interna (seções/divisões)
   - Mensagem central em 1 frase
   - Tema(s) teológico(s) principais
   - Como se encaixa no plano redentor

2. INTRODUÇÃO PARA SÉRIE DE MENSAGENS
   → Sermon series opener baseado no livro
   → "Vamos estudar X porque..."

3. MAPA CANÔNICO
   → Posição do livro no cânon
   → Conexões AT↔NT
   → Cumprimento de profecias

4. VERSÍCULOS-CHAVE POR LIVRO
   → 5-10 versículos mais importantes
   → Com contexto de cada um

5. PLANO DE LEITURA PERSONALIZADO
   → Input: objetivo do usuário ("entender Paulo", "ler o AT em 3 meses")
   → Output: plano estruturado dia-a-dia

### ESTRUTURA CANÔNICA DISPONÍVEL
AT (39 livros):
- Pentateuco: Gn, Ex, Lv, Nm, Dt
- Históricos: Js, Jz, Rt, 1-2Sm, 1-2Rs, 1-2Cr, Ed, Ne, Et
- Poéticos: Jó, Sl, Pv, Ec, Ct
- Profetas maiores: Is, Jr, Lm, Ez, Dn
- Profetas menores: Os até Ml (12 livros)

NT (27 livros):
- Evangelhos: Mt, Mc, Lc, Jo
- História: At
- Paulinas: Rm, 1-2Co, Gl, Ef, Fp, Cl, 1-2Ts, 1-2Tm, Tt, Fm
- Epístolas gerais: Hb, Tg, 1-2Pe, 1-3Jo, Jd
- Profecia: Ap
```

---

## CAMADA 2: SKILL.md — lw-quiz-agent

**Path:** `.antigravity/skills/lw-quiz-agent/SKILL.md`

```markdown
# Quiz Agent — Living Word
## Motor Gamificado de Conhecimento Bíblico

### IDENTIDADE
Facilitador de aprendizado gamificado.
Torna o estudo bíblico envolvente através de quiz e desafios.
Base: 250 perguntas estruturadas + capacidade de gerar novas.

### CAPACIDADES

#### 1. QUIZ PADRÃO
- Sortear N perguntas da base lw_quiz
- Filtrar por: categoria, nível, testamento, tema
- Controlar perguntas já respondidas por usuário
- Tracking de score em lw_quiz_sessions

#### 2. GERAÇÃO DE NOVAS PERGUNTAS
Com base em qualquer conteúdo de lw_parables / lw_characters / lw_bible_books:
Gerar perguntas de múltipla escolha com:
- 1 resposta correta
- 3 distratores plausíveis mas incorretos
- Explicação da resposta correta com referência bíblica

Template de geração:
```
Dado o seguinte conteúdo: [dado da tabela]
Gere 5 perguntas de múltipla escolha:
- Nível: [básico|intermediário|avançado]
- Cada pergunta: 4 opções, 1 correta
- Inclua referência bíblica para cada resposta
- Distratores devem ser plausíveis, não óbvios
```

#### 3. QUIZ COMPETITIVO (MULTI-PLAYER)
- Sala de quiz com código
- Tempo por pergunta (30s padrão)
- Ranking em tempo real
- Compartilhamento de resultado

#### 4. QUIZ PERSONALIZADO
- "Teste seus conhecimentos sobre parábolas"
- "Quiz sobre mulheres da Bíblia"
- "Desafio: livros de Paulo"
- "Quiz de profetas menores"

#### 5. FLASHCARDS
Formato compacto para memorização:
- Frente: pergunta
- Verso: resposta + contexto
- Sistema spaced repetition (próxima revisão)

### CATEGORIAS DISPONÍVEIS
- personagens (200 personagens)
- parabolas (40 parábolas)
- livros (66 livros)
- historia_biblica (cronologia)
- doutrina (teologia sistemática)
- geografia (lugares bíblicos)
- versiculos (memorização)

### NÍVEIS
- BÁSICO: fatos diretos, personagens famosos
- INTERMEDIÁRIO: contexto, cronologia, relações
- AVANÇADO: teologia, idiomas originais, detalhes obscuros

### OUTPUT FORMAT
```json
{
  "sessao_id": "uuid",
  "pergunta": {
    "id": "uuid",
    "numero": 42,
    "texto": "Qual foi o primeiro milagre de Jesus?",
    "opcoes": {
      "A": "Curou o cego Bartimeu",
      "B": "Andou sobre as águas",
      "C": "Multiplicou pães e peixes",
      "D": "Transformou água em vinho"
    },
    "nivel": "basico",
    "categoria": "eventos_jesus"
  },
  "resposta_correta": "D",
  "explicacao": "Em João 2:1-11, Jesus realizou seu primeiro milagre nas bodas de Caná da Galileia, transformando água em vinho...",
  "referencia": "João 2:1-11"
}
```
```

---

## CAMADA 3: EDGE FUNCTIONS

### `ingest-pdf-content` (rodar uma vez para popular Supabase)

```typescript
// Fluxo de ingestão:
// 1. Ler texto do PDF (já extraído e parseado)
// 2. Chunkar por item (parábola/personagem/livro/pergunta)
// 3. Para cada chunk:
//    a. Parsear campos estruturados
//    b. Gerar embedding via OpenAI text-embedding-3-small
//    c. Inserir em tabela correspondente
// Custo estimado: ~$2-5 para todos os 4 PDFs

async function ingestParables(parsedData: ParableData[]) {
  for (const parable of parsedData) {
    const embedding = await generateEmbedding(
      `${parable.titulo} ${parable.mensagem_central} ${parable.temas.join(' ')}`
    );
    await supabase.from('lw_parables').insert({
      ...parable,
      embedding
    });
  }
}
```

### `semantic-bible-search`

```typescript
// Input: query em linguagem natural
// Output: resultados das 4 tabelas com score de relevância
async function semanticSearch(query: string, tables: string[]) {
  const queryEmbedding = await generateEmbedding(query);
  const results = await Promise.all(
    tables.map(table =>
      supabase.rpc('match_bible_content', {
        query_embedding: queryEmbedding,
        table_name: table,
        match_threshold: 0.7,
        match_count: 5
      })
    )
  );
  return rankAndMerge(results);
}
```

### `generate-quiz-session`

```typescript
// Input: categoria, nível, quantidade, user_id
// Output: sessão de quiz com perguntas não repetidas
async function generateQuizSession(params: QuizParams) {
  // 1. Buscar perguntas já respondidas pelo usuário
  // 2. Selecionar N perguntas inéditas com filtros
  // 3. Embaralhar ordem
  // 4. Criar registro em lw_quiz_sessions
  // 5. Retornar primeira pergunta
}
```

### `generate-new-questions`

```typescript
// Gera novas perguntas baseadas no conteúdo das tabelas
// Input: source_table, source_id, count, level
// Output: array de perguntas no formato lw_quiz
async function generateNewQuestions(params) {
  const content = await getSourceContent(params.source_table, params.source_id);
  const skill = readSkill('lw-quiz-agent');
  // Chama GPT-4o-mini (mais barato para geração de quiz)
  const questions = await callGPT4oMini(skill, content, params);
  return await insertToQuizTable(questions);
}
```

---

## REGISTRY — Novos Agentes

Adicionar ao `.antigravity/agents/registry.json`:

```json
{
  "id": "lw-parables-agent",
  "name": "Parables Study Agent",
  "skill": ".antigravity/skills/lw-parables-agent/SKILL.md",
  "model": "gpt-4o",
  "supabase_tables": ["lw_parables"],
  "trigger": ["parabola", "parabolas", "samaritano", "prodigo", "talento"],
  "edge_functions": ["semantic-bible-search", "generate-quiz-session"]
},
{
  "id": "lw-characters-agent",
  "name": "Biblical Characters Agent",
  "skill": ".antigravity/skills/lw-characters-agent/SKILL.md",
  "model": "gpt-4o",
  "supabase_tables": ["lw_characters"],
  "trigger": ["personagem", "quem foi", "historia de", "biografia"],
  "edge_functions": ["semantic-bible-search"]
},
{
  "id": "lw-panorama-agent",
  "name": "Bible Panorama Agent",
  "skill": ".antigravity/skills/lw-panorama-agent/SKILL.md",
  "model": "gpt-4o",
  "supabase_tables": ["lw_bible_books"],
  "trigger": ["livro de", "panorama", "resumo do livro", "quem escreveu"],
  "edge_functions": ["semantic-bible-search"]
},
{
  "id": "lw-quiz-agent",
  "name": "Biblical Quiz Agent",
  "skill": ".antigravity/skills/lw-quiz-agent/SKILL.md",
  "model": "gpt-4o-mini",
  "supabase_tables": ["lw_quiz", "lw_quiz_sessions"],
  "trigger": ["quiz", "teste", "pergunta", "desafio", "quantos", "qual foi"],
  "edge_functions": ["generate-quiz-session", "generate-new-questions"]
}
```

---

## PROCESSO DE INGESTÃO — PASSO A PASSO

### Para o Antigravity executar:

```bash
# 1. Criar script de parsing e ingestão
# Antigravity deve baixar do GitHub:
# github.com/Bione-Silva/living-word-8c0451d6
# Path: scripts/ingest-bible-content/

# 2. Executar migration SQL no Supabase
# (tabelas listadas acima)

# 3. Rodar script de ingestão para cada PDF
node scripts/ingest-parables.js     # lw_parables
node scripts/ingest-characters.js   # lw_characters
node scripts/ingest-panorama.js     # lw_bible_books
node scripts/ingest-quiz.js         # lw_quiz

# 4. Verificar contagens
# SELECT COUNT(*) FROM lw_parables;     -- deve ter 40
# SELECT COUNT(*) FROM lw_characters;   -- deve ter 200
# SELECT COUNT(*) FROM lw_bible_books;  -- deve ter 66
# SELECT COUNT(*) FROM lw_quiz;         -- deve ter 250
```

---

## FUNCIONALIDADES LW QUE ISSO DESTRAVA

### Seção Bíblia → Recursos

**Antes:** cronologia estática, mapas básicos
**Depois com os agentes:**

1. **"Estude uma Parábola"** → Usuário clica em qualquer parábola →
   lw-parables-agent entrega: contexto histórico, palavra grega, lições, quiz

2. **"Personagem do Dia"** → Destaque diário rotativo dos 200 personagens →
   lw-characters-agent gera card biográfico + lição + versículo

3. **"Quiz Bíblico"** → 250 perguntas + geração infinita →
   lw-quiz-agent controla sessões, evita repetição, gera novas

4. **"Panorama do Livro"** → Antes de pregação, líder consulta o livro →
   lw-panorama-agent entrega: contexto, estrutura, versículos-chave

### Seção Sermão

**Novo fluxo possível:**
```
1. Pastor seleciona parábola (ex: "Filho Pródigo")
2. lw-parables-agent carrega dados da lw_parables
3. Passa contexto enriquecido para lw-sermon-agent
4. Sermon agent gera sermão JÁ com contexto histórico e grego
5. Pastor recebe sermão de nível seminary em 30 segundos
```

### Seção Social Studio

**Novo fluxo:**
```
1. "Gerar carrossel sobre o personagem Esther"
2. lw-characters-agent busca dados de Ester na lw_characters
3. Passa dados para lw-social-studio
4. Social studio gera 9 slides com história + teologia + aplicação
```

---

## ESTIMATIVA DE CUSTO DE INGESTÃO

| Item | Volume | Modelo | Custo Est. |
|------|--------|--------|------------|
| Embeddings (4 PDFs) | ~50K tokens | text-embedding-3-small | ~$0.01 |
| Parsing estruturado (GPT) | ~200K tokens | GPT-4o-mini | ~$0.06 |
| Geração de explicações quiz | 250 perguntas | GPT-4o-mini | ~$0.03 |
| **TOTAL INGESTÃO** | | | **~$0.10** |

**Custo de runtime por query:** ~$0.001-0.005 (busca semântica + response)

---

## INSTRUÇÃO PARA O ANTIGRAVITY

```markdown
## TAREFA: Ingestão de PDFs Bíblicos

### Arquivos fonte (já no servidor):
- /uploads/40_Para_bolas_de_JEsus.pdf
- /uploads/200_PERSONAGENS_BI_BLICOS.pdf
- /uploads/Panorama_Bi_blico.pdf
- /uploads/250_quiz_bi_blico.pdf

### Execute na ordem:
1. Criar tabelas SQL (rodar migration no Supabase)
2. Criar scripts de parsing em /scripts/ingest-bible-content/
3. Extrair texto de cada PDF com pdftotext
4. Parsear estrutura de cada documento
5. Gerar embeddings (OpenAI text-embedding-3-small)
6. Popular tabelas via Supabase client
7. Criar índices pgvector
8. Criar as 4 SKILL.md em .antigravity/skills/
9. Atualizar registry.json com novos agentes
10. Criar edge functions no Supabase

### Verificação de sucesso:
- 40 registros em lw_parables com embeddings
- 200 registros em lw_characters com embeddings
- 66 registros em lw_bible_books com embeddings
- 250 registros em lw_quiz com explicações
- Busca semântica: "amor ao próximo" → retorna Bom Samaritano
- Quiz: sessão criada, progressão funcionando
```

---

*LW PDF Arsenal — BX4 Technology Solutions*
*Antigravity Intelligence Layer — Living Word Platform*
