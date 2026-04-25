# ANTIGRAVITY — INSTRUÇÃO MESTRE
## Centro de Estudos Avançados (CEA) — Living Word Platform
**Versão:** 1.0 | **Proprietário:** BX4 Technology Solutions | **Data:** Abril 2026

---

## O QUE É ESTA INSTRUÇÃO

Este documento é a **ordem de execução completa** para o Antigravity construir
o Centro de Estudos Avançados do Living Word — uma área dedicada que transforma
conteúdo bíblico de nível seminário em experiência acessível para líderes e leigos.

**Antigravity deve:**
1. Ler este documento integralmente antes de qualquer ação
2. Executar os blocos na ordem: Schema → Backend → Skills → Frontend
3. Reportar cada etapa concluída com evidência (COUNT, URL, screenshot)
4. NUNCA declarar sucesso sem health check funcionando

---

## VISÃO DO PRODUTO

### O que é o Centro de Estudos Avançados

Uma área dentro do Living Word que funciona como um **seminário teológico digital**:
- Estudos completos de parábolas, personagens e livros bíblicos
- Pesquisa do idioma original (grego/hebraico/aramaico) com morfologia
- Quiz gamificado com progressão e conquistas
- Geração de materiais de estudo prontos para uso pastoral
- Conexão direta com Sermões e Social Studio

### Diferencial competitivo
Nenhuma plataforma PT-BR entrega exegese do grego original + aplicação prática
+ geração de material pastoral em uma única interface. Este é o CEA.

---

## BLOCO 1: BANCO DE DADOS (Supabase)

### 1.1 Executar Migration Principal

```
Arquivo: supabase/migrations/[timestamp]_lw_bible_content.sql
Conteúdo: lw_bible_content_migration.sql (já gerado)
```

Verificar após execução:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_name LIKE 'lw_%' ORDER BY table_name;
-- Deve retornar: lw_bible_books, lw_characters, lw_parables,
--               lw_quiz, lw_quiz_sessions, lw_word_studies,
--               lw_verse_versions, lw_deep_research, lw_carousels
```

### 1.2 Tabelas Adicionais do CEA

```sql
-- Progresso do usuário no CEA
CREATE TABLE IF NOT EXISTS lw_cea_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  modulo TEXT NOT NULL,
  -- 'parabolas' | 'personagens' | 'panorama' | 'quiz' | 'pesquisa'
  item_id UUID NOT NULL,
  status TEXT DEFAULT 'nao_iniciado',
  -- 'nao_iniciado' | 'em_andamento' | 'concluido'
  percentual INT DEFAULT 0,
  notas TEXT,
  favorito BOOLEAN DEFAULT FALSE,
  ultima_visita TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, modulo, item_id)
);

-- Conquistas e gamificação
CREATE TABLE IF NOT EXISTS lw_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  achievement_key TEXT NOT NULL,
  -- 'quiz_mestre', 'parabola_explorer', 'first_study', etc.
  achievement_name TEXT NOT NULL,
  achievement_description TEXT,
  badge_icon TEXT,
  pontos INT DEFAULT 0,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_key)
);

-- Materiais gerados pelo usuário no CEA
CREATE TABLE IF NOT EXISTS lw_cea_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  tipo TEXT NOT NULL,
  -- 'estudo_parabola' | 'estudo_personagem' | 'word_study'
  -- 'plano_leitura' | 'estudo_grupo' | 'devocional'
  titulo TEXT NOT NULL,
  source_table TEXT,
  source_id UUID,
  conteudo JSONB NOT NULL,
  status TEXT DEFAULT 'rascunho',
  exportado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE lw_cea_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE lw_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE lw_cea_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cea_progress_own" ON lw_cea_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "achievements_own" ON lw_achievements FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "cea_materials_own" ON lw_cea_materials FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "cea_progress_service" ON lw_cea_progress FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "achievements_service" ON lw_achievements FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "cea_materials_service" ON lw_cea_materials FOR ALL USING (auth.role() = 'service_role');
```

---

## BLOCO 2: EDGE FUNCTIONS (Supabase)

Criar as seguintes Edge Functions em `supabase/functions/`:

### 2.1 `cea-search` — Busca Semântica Unificada

```typescript
// supabase/functions/cea-search/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { query, tables = ['parables', 'characters', 'books'], limit = 5 } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  )

  // Gerar embedding da query
  const embeddingRes = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: query
    })
  })
  const { data } = await embeddingRes.json()
  const embedding = data[0].embedding

  // Buscar em cada tabela
  const results = []

  if (tables.includes('parables')) {
    const { data: parables } = await supabase.rpc('search_bible_parables', {
      query_embedding: embedding,
      match_threshold: 0.65,
      match_count: limit
    })
    results.push(...(parables || []).map(p => ({ ...p, tipo: 'parabola' })))
  }

  if (tables.includes('characters')) {
    const { data: chars } = await supabase.rpc('search_bible_characters', {
      query_embedding: embedding,
      match_threshold: 0.65,
      match_count: limit
    })
    results.push(...(chars || []).map(c => ({ ...c, tipo: 'personagem' })))
  }

  if (tables.includes('books')) {
    const { data: books } = await supabase.rpc('search_bible_books', {
      query_embedding: embedding,
      match_threshold: 0.65,
      match_count: limit
    })
    results.push(...(books || []).map(b => ({ ...b, tipo: 'livro' })))
  }

  // Ordenar por similaridade
  results.sort((a, b) => b.similarity - a.similarity)

  return new Response(JSON.stringify({ results: results.slice(0, limit * 2) }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### 2.2 `cea-deep-study` — Estudo Profundo com IA

```typescript
// supabase/functions/cea-deep-study/index.ts
// Input: { tipo, item_id, nivel, user_id }
// Fluxo:
//   1. Buscar dados da tabela correspondente (lw_parables | lw_characters | lw_bible_books)
//   2. Ler SKILL.md correspondente
//   3. Chamar GPT-4o com skill + dados como contexto
//   4. Retornar estudo estruturado
//   5. Salvar em lw_deep_research
//   6. Atualizar lw_cea_progress

// O model é sempre GPT-4o para estudos profundos
// Custo estimado: ~$0.02-0.05 por estudo completo
```

### 2.3 `cea-word-study` — Análise do Original

```typescript
// supabase/functions/cea-word-study/index.ts
// Input: { word, reference, language: 'grego'|'hebraico'|'aramaico' }
// Fluxo:
//   1. Verificar cache em lw_word_studies
//   2. Se não existe: chamar GPT-4o com lw-bible-research SKILL
//   3. Estruturar análise morfológica completa
//   4. Salvar em lw_word_studies
//   5. Retornar análise
```

### 2.4 `cea-generate-material` — Gerar Material de Estudo

```typescript
// supabase/functions/cea-generate-material/index.ts
// Input: { tipo, source, formato, user_id }
// Tipos de material:
//   'estudo_grupo': perguntas + dinâmicas para grupo pequeno
//   'plano_leitura': plano personalizado de leitura
//   'devocional': devocional pessoal baseado no estudo
//   'word_study_pdf': exportar word study em PDF
//   'resumo_pregacao': resumo executivo para o pregador
```

### 2.5 `cea-quiz-session` — Gerenciar Sessão de Quiz

```typescript
// supabase/functions/cea-quiz-session/index.ts
// Input: { action, session_id?, user_id, params? }
// Actions:
//   'start': criar nova sessão com perguntas filtradas
//   'answer': registrar resposta e retornar próxima pergunta
//   'finish': calcular score final, checar achievements
//   'history': retornar histórico do usuário
```

---

## BLOCO 3: SKILLS DO ANTIGRAVITY

Criar os seguintes arquivos em `.antigravity/skills/`:

### 3.1 `cea-orchestrator/SKILL.md`

```markdown
# CEA Orchestrator — Centro de Estudos Avançados
## Agente Principal do CEA | Living Word

### IDENTIDADE
Orquestrador central do Centro de Estudos Avançados.
Recebe qualquer solicitação de estudo bíblico e redireciona
para o agente especializado correto.

### ROTEAMENTO INTELIGENTE

| Solicitação | Agente | Função |
|-------------|--------|--------|
| "estuda a parábola X" | lw-parables-agent | cea-deep-study |
| "quem foi [personagem]" | lw-characters-agent | cea-deep-study |
| "resumo do livro de X" | lw-panorama-agent | cea-deep-study |
| "o que significa [palavra] em grego" | lw-bible-research | cea-word-study |
| "quiz sobre [tema]" | lw-quiz-agent | cea-quiz-session |
| "busca [tema livre]" | semantic search | cea-search |
| "gera estudo para grupo" | cea-generate-material | estudo_grupo |
| "plano de leitura" | cea-generate-material | plano_leitura |

### FLUXO PADRÃO
1. Identificar intenção do usuário
2. Verificar cache (já estudou este item?)
3. Chamar edge function correspondente
4. Estruturar resposta com dados + insights de IA
5. Oferecer ações complementares (sermão, carrossel, material)
6. Atualizar progresso do usuário

### OFERTA AUTOMÁTICA APÓS ESTUDO
Após qualquer estudo concluído, sempre oferecer:
- "Gerar sermão baseado neste estudo" → lw-sermon-agent
- "Criar carrossel para Instagram" → lw-social-studio
- "Gerar estudo para grupo pequeno" → cea-generate-material
- "Fazer quiz sobre este tema" → lw-quiz-agent

### REGRA DE QUALIDADE
Estudos do CEA têm padrão mínimo de:
- 1 análise do idioma original (quando aplicável)
- Contexto histórico (período, cultura, geografia)
- Mensagem central em 1 frase
- Mínimo 3 aplicações práticas
- Conexão com outro texto bíblico relacionado
```

### 3.2 Arquivos adicionais de skill já descritos em:
- `.antigravity/skills/lw-bible-research/SKILL.md` ✅ (já criado)
- `.antigravity/skills/lw-sermon-agent/SKILL.md` ✅ (já criado)
- `.antigravity/skills/lw-social-studio/SKILL.md` ✅ (já criado)
- `.antigravity/skills/lw-parables-agent/SKILL.md` ✅ (já criado)
- `.antigravity/skills/lw-characters-agent/SKILL.md` ✅ (já criado)
- `.antigravity/skills/lw-panorama-agent/SKILL.md` ✅ (já criado)
- `.antigravity/skills/lw-quiz-agent/SKILL.md` ✅ (já criado)

---

## BLOCO 4: FRONTEND (Lovable / React)

### 4.1 Estrutura de Rotas

```
/estudos                          → CEA Home (landing)
/estudos/parabolas                → Grid das 40 parábolas
/estudos/parabolas/[id]           → Estudo individual de parábola
/estudos/personagens              → Grid dos 200 personagens
/estudos/personagens/[id]         → Estudo individual de personagem
/estudos/livros                   → Grid dos 66 livros (AT/NT)
/estudos/livros/[id]              → Panorama individual do livro
/estudos/pesquisa                 → Word Study / Pesquisa do original
/estudos/quiz                     → Hub de quiz
/estudos/quiz/[sessao]            → Sessão de quiz ativa
/estudos/meu-progresso            → Dashboard do usuário
```

### 4.2 Instrução de Design para o Lovable

**INSTRUÇÃO EXATA PARA PASSAR AO LOVABLE:**

```
Crie a área "Centro de Estudos Avançados" do Living Word.

CONTEXTO: É uma seção premium da plataforma Living Word.
Os usuários são pastores, líderes e estudantes de teologia.

DESIGN SYSTEM:
- Paleta primária: roxo #7C3AED, roxo escuro #4C1D95
- Background: #0F0A1E (quase preto com tom roxo)
- Cards: #1A1040 com borda #2D1F6E
- Texto: branco #FFFFFF, cinza #9CA3AF
- Destaque/acento: dourado #F59E0B
- Fonte títulos: Crimson Pro (serif clássico, tom acadêmico)
- Fonte corpo: Inter
- Fonte código/referências bíblicas: JetBrains Mono

COMPONENTES NECESSÁRIOS:

1. CEAHome — página principal do centro
   - Hero com título "Centro de Estudos Avançados"
   - Subtítulo: "Teologia de seminário. Profundidade real."
   - 5 cards de módulos (Parábolas, Personagens, Livros, Pesquisa, Quiz)
   - Seção "Continue de onde parou" (progresso do usuário)
   - Seção "Estudo do Dia" (personagem ou parábola destaque)

2. StudyCard — card reutilizável
   - Thumbnail/ícone do item
   - Título + referência bíblica
   - Tags de temas (chips coloridos)
   - Badge de progresso (círculo %)
   - Indicador de dificuldade (básico/intermediário/avançado)
   - Botão "Estudar" → abre DeepStudyPanel

3. DeepStudyPanel — painel de estudo completo
   - Header: título + referência + botões de ação
   - Tab "Contexto": contexto histórico, cultura, geografia
   - Tab "Original": palavra em grego/hebraico + morfologia + insights
   - Tab "Mensagem": mensagem central + desenvolvimento teológico
   - Tab "Aplicação": lições práticas + perguntas reflexivas
   - Tab "Recursos": versículos relacionados + material gerado
   - Footer fixo: "Gerar Sermão" | "Criar Carrossel" | "Material de Grupo"

4. WordStudyCard — card de análise do original
   - Palavra em caractere original (ἀγάπη, שָׁלוֹם)
   - Transliteração fonética
   - Strong's number
   - Análise morfológica em tabela visual
   - Insight teológico em destaque

5. QuizCard — interface de quiz
   - Pergunta em destaque
   - 4 opções como botões grandes
   - Timer visual (arco circular)
   - Feedback imediato (verde/vermelho)
   - Explicação da resposta + referência

6. ProgressDashboard — painel de progresso
   - Streak de dias
   - Módulos completados (% por categoria)
   - Conquistas desbloqueadas (badges)
   - Histórico de estudos recentes
   - Stats: perguntas respondidas, acerto%, tempo estudado

COMPORTAMENTO:
- Deep Study Panel abre como side panel (não modal)
- Transições suaves entre tabs
- Loading states com skeleton
- Conteúdo gerado por IA chega em streaming (typewriter effect)
- Mobile: panels abrem como full-screen sheet
```

---

## BLOCO 5: NAVEGAÇÃO — INTEGRAR AO SIDEBAR LW

### Adicionar ao sidebar existente:

```tsx
// Adicionar APÓS "Bíblia" no sidebar
{
  label: "Centro de Estudos",
  icon: GraduationCap,
  href: "/estudos",
  badge: "NOVO",
  badgeColor: "gold",
  subItems: [
    { label: "Parábolas", href: "/estudos/parabolas", icon: BookOpen },
    { label: "Personagens", href: "/estudos/personagens", icon: Users },
    { label: "Livros da Bíblia", href: "/estudos/livros", icon: Library },
    { label: "Pesquisa do Original", href: "/estudos/pesquisa", icon: Search },
    { label: "Quiz Bíblico", href: "/estudos/quiz", icon: Brain },
    { label: "Meu Progresso", href: "/estudos/meu-progresso", icon: Trophy },
  ]
}
```

---

## BLOCO 6: CLAUDE.md — ADIÇÕES

Adicionar ao `CLAUDE.md` do repositório Antigravity:

```markdown
## Centro de Estudos Avançados (CEA)

### Agente responsável: cea-orchestrator
### Rota base: /estudos
### Tabelas: lw_parables, lw_characters, lw_bible_books, lw_quiz,
###          lw_quiz_sessions, lw_cea_progress, lw_achievements, lw_cea_materials

### Antes de qualquer task do CEA:
1. Ler .antigravity/skills/cea-orchestrator/SKILL.md
2. Identificar qual sub-agente é necessário
3. Verificar se dado já existe em cache no Supabase
4. Chamar edge function correspondente

### Stack do CEA:
- Estudos profundos: GPT-4o (qualidade máxima)
- Quiz e conteúdo rápido: GPT-4o-mini (economia)
- Carrosséis: Gemini 2.5 Flash + Imagen 4 Fast
- Embeddings: text-embedding-3-small

### Regras de qualidade do CEA:
- NUNCA gerar análise do original sem base verificável (Strong's)
- NUNCA fabricar datas ou contextos históricos
- SEMPRE incluir referência bíblica para cada afirmação
- SEMPRE oferecer ações downstream (sermão, carrossel, material)

### Purple Ban (válido para o CEA):
- Sem localStorage
- Sem .env em commit
- Sem any no TypeScript  
- Sem sucesso declarado sem teste real
```

---

## BLOCO 7: INGESTÃO DOS PDFs

### Ordem de execução:

```bash
# 1. Instalar dependências
cd living-word && npm install @supabase/supabase-js openai pdf-parse

# 2. Copiar PDFs para pasta de assets
mkdir -p scripts/pdf-sources
# Mover os 4 PDFs para scripts/pdf-sources/

# 3. Executar ingestão (baixo custo ~$0.10 total)
node scripts/ingest-bible-content.js quiz       # 250 perguntas primeiro
node scripts/ingest-bible-content.js parables   # 40 parábolas
node scripts/ingest-bible-content.js characters # 200 personagens
node scripts/ingest-bible-content.js panorama   # 66 livros

# 4. Verificar contagens
# SELECT COUNT(*) FROM lw_quiz;        -- 250
# SELECT COUNT(*) FROM lw_parables;    -- 40
# SELECT COUNT(*) FROM lw_characters;  -- 200
# SELECT COUNT(*) FROM lw_bible_books; -- 66

# 5. Testar busca semântica
# SELECT * FROM search_bible_parables(
#   '[embedding da query "amor ao próximo"]',
#   0.65, 3
# );
# Deve retornar: Bom Samaritano, Filho Pródigo, Ovelha Perdida
```

---

## CHECKLIST DE ENTREGA DO CEA

### Database ✅
- [ ] 9 tabelas criadas e com RLS
- [ ] pgvector ativo com índices ivfflat
- [ ] 3 funções de busca semântica deployadas
- [ ] 250 quiz inseridos com embeddings
- [ ] 40 parábolas inseridas com embeddings
- [ ] 200 personagens inseridos com embeddings
- [ ] 66 livros inseridos com embeddings

### Backend ✅
- [ ] `cea-search` Edge Function deployada
- [ ] `cea-deep-study` Edge Function deployada
- [ ] `cea-word-study` Edge Function deployada
- [ ] `cea-generate-material` Edge Function deployada
- [ ] `cea-quiz-session` Edge Function deployada

### Skills ✅
- [ ] `cea-orchestrator/SKILL.md` criada
- [ ] 7 SKILL.md anteriores em `.antigravity/skills/`
- [ ] `registry.json` atualizado com todos os agentes CEA
- [ ] `CLAUDE.md` atualizado com seção CEA

### Frontend ✅
- [ ] Rota `/estudos` funcionando
- [ ] 6 sub-rotas funcionando
- [ ] CEAHome com 5 módulos
- [ ] StudyCard com progresso
- [ ] DeepStudyPanel com 5 tabs
- [ ] WordStudyCard com morfologia
- [ ] QuizCard com timer
- [ ] ProgressDashboard com achievements
- [ ] Sidebar integrado com badge "NOVO"

### Integrações ✅
- [ ] CEA → Sermões (passar contexto do estudo)
- [ ] CEA → Social Studio (passar dados para carrossel)
- [ ] CEA → Bíblia (link reverso de versículos)
- [ ] CEA → Modo Púlpito (resumo executivo)

---

## RESULTADO ESPERADO

Quando concluído, o Centro de Estudos Avançados entrega:

**Para o pastor:**
Entra com "quero pregar sobre o Filho Pródigo" →
- Estudo completo (contexto histórico, grego σπλαγχνίζομαι, AT)
- Sermão gerado com estilo pastoral escolhido
- Carrossel de 9 slides para o Instagram da igreja
- Material para o grupo pequeno de quarta
Tudo em menos de 5 minutos.

**Para o estudante:**
- 40 parábolas para estudar com profundidade real
- 200 personagens com biografia e lições
- 66 livros com panorama completo
- Quiz para testar e fixar o conhecimento
- Dashboard de progresso com conquistas

**Diferencial de mercado:**
Nenhuma plataforma PT-BR entrega este nível de integração entre
pesquisa acadêmica do original, aplicação pastoral e geração de material.
O CEA posiciona o Living Word como a ferramenta de referência para
líderes cristãos no Brasil e na diáspora brasileira nos EUA.

---

*Instrução Mestre — Centro de Estudos Avançados*
*BX4 Technology Solutions | Antigravity Intelligence Layer*
*Living Word Platform — github.com/Bione-Silva/living-word-8c0451d6*
