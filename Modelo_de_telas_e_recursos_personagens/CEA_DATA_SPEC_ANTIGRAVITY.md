# CEA — Especificação de Dados para o Antigravity
## Obriga o Antigravity a buscar dados nos ebooks e salvar no Supabase
**Versão:** 1.0 | BX4 Technology Solutions | 2026-04-23

---

## INSTRUÇÃO MESTRE PARA O ANTIGRAVITY

Antigravity: ao executar qualquer tarefa do CEA, você DEVE:
1. Ler os arquivos JSON já extraídos em `/scripts/`
2. Enriquecer com GPT-4o (campos marcados como `[GPT-4o]`)
3. Salvar no Supabase na tabela correta
4. NUNCA inventar dados — apenas enriquecer o que está no PDF

---

## MÓDULO 1: PERSONAGENS BÍBLICOS
**Fonte:** `personagens_parsed.json` (extraído do ebook "200 Personagens Bíblicos")
**Tabela Supabase:** `lw_characters`
**Edge function:** `cea-ingest-characters`

### Schema completo da tabela `lw_characters`

```sql
CREATE TABLE lw_characters (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- DADOS BÁSICOS (do ebook, obrigatórios)
  nome                  text NOT NULL,
  nome_hebraico         text,          -- ex: אַבְרָהָם
  nome_transliterado    text,          -- ex: "Avraham"
  significado_nome      text,          -- ex: "pai de uma multidão"
  nome_original         text,          -- nome antes de mudança (ex: "Abrão")
  cargo                 text NOT NULL, -- ex: "Patriarca", "Profeta", "Rei"
  testamento            text NOT NULL CHECK (testamento IN ('AT','NT')),
  secao_canonica        text,          -- ex: "Pentateuco", "Evangelhos"
  periodo_historico     text,          -- ex: "~2000 aC"
  origem_geografica     text,          -- ex: "Ur dos Caldeus, Mesopotâmia"

  -- FAMÍLIA
  pai                   text,
  mae                   text,
  conjuge               text,          -- ex: "Sara"
  filhos                jsonb,         -- ["Isaque","Ismael","Zinrã"...]
  irmãos                text,

  -- DADOS BIOGRÁFICOS (do ebook)
  idade_morte           int,           -- em anos
  referencia_principal  text,          -- ex: "Gênesis 11–25"
  capitulos_principais  text[],        -- ["Gn 12","Gn 15","Gn 17","Gn 22"]

  -- CONTEÚDO TEXTUAL (do ebook — campo `biografia`)
  biografia_completa    text NOT NULL, -- texto bruto do PDF
  contexto_historico    text,          -- [GPT-4o: extrai do biography_completa]
  resumo_3_linhas       text,          -- [GPT-4o: síntese para card]

  -- ANÁLISE DO ORIGINAL (do ebook + GPT-4o)
  palavras_hebraico     jsonb,         -- [{palavra, transliteracao, strongs, significado, insight}]
  nome_strongs          text,          -- Strong's do nome principal

  -- LIÇÕES E APLICAÇÕES (do ebook + GPT-4o)
  licoes_principais     jsonb,         -- [{numero, titulo, descricao}]
  fatos_rapidos         text[],        -- lista de fatos notáveis do ebook
  aplicacao_pastoral    text,          -- [GPT-4o: específico para líderes]

  -- TIPOLOGIA EM CRISTO (GPT-4o)
  tipologia_cristologica jsonb,        -- [{tipo, antitype, referencia, descricao}]

  -- REFERÊNCIAS NO NT (GPT-4o + verificação manual)
  referencias_nt        jsonb,         -- [{livro, capitulo_versiculo, contexto, autor}]
  quantidade_citacoes_nt int DEFAULT 0,

  -- CONEXÕES CANÔNICAS
  personagens_relacionados text[],    -- outros personagens conectados
  livros_relacionados    text[],

  -- TAGS E TEMAS
  tags                  text[],        -- ["fé","aliança","obediência","sacrifício"]
  temas_teologicos      text[],        -- ["eleição","aliança","fé","tipologia"]

  -- METADATA
  fonte_ebook           text DEFAULT '200_Personagens_Biblicos',
  extraido_pdf          boolean DEFAULT true,
  enriquecido_gpt       boolean DEFAULT false,
  qualidade_score       int,           -- 1-10 (avaliação da completude dos dados)
  embedding             vector(768),   -- Gemini text-embedding-004

  -- PROGRESSO DO USUÁRIO (separado por user_id em lw_cea_progress)
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);
```

### Exemplo de registro completo — ABRAÃO

```json
{
  "nome": "Abraão",
  "nome_hebraico": "אַבְרָהָם",
  "nome_transliterado": "Avraham",
  "significado_nome": "pai de uma multidão",
  "nome_original": "Abrão (אַבְרָם) — 'pai exaltado'",
  "cargo": "Patriarca / Pai da Fé",
  "testamento": "AT",
  "secao_canonica": "Pentateuco",
  "periodo_historico": "~2000 aC",
  "origem_geografica": "Ur dos Caldeus, Mesopotâmia",
  "pai": "Terá",
  "conjuge": "Sara (Sarai)",
  "filhos": ["Isaque (com Sara)", "Ismael (com Agar)", "Zinrã", "Jocsã", "Medã", "Midiã", "Jisbaque", "Suá (com Quetura)"],
  "idade_morte": 175,
  "referencia_principal": "Gênesis 11–25",
  "capitulos_principais": ["Gn 12", "Gn 15", "Gn 17", "Gn 22"],
  "resumo_3_linhas": "Patriarca do povo hebreu chamado por Deus a deixar Ur e ir a uma terra desconhecida. Pai da fé — justificado por crer em Deus antes de qualquer lei. Figura tipológica central: seu sacrifício de Isaque prefigura o sacrifício de Cristo.",
  "palavras_hebraico": [
    {
      "palavra": "אַבְרָהָם",
      "transliteracao": "Avraham",
      "strongs": "H85",
      "significado": "pai de uma multidão",
      "insight": "Deus adicionou a sílaba 'ha' ao nome Abrão tornando-o profético — não apenas pai biológico, mas pai espiritual de todos os que creem (Gl 3:7)"
    },
    {
      "palavra": "אֱמוּנָה",
      "transliteracao": "emunah",
      "strongs": "H530",
      "significado": "fé, fidelidade, firmeza",
      "insight": "Vem da raiz 'aman' — ser firme. A fé de Abraão não era crença passiva, era apoio sobre a firmeza do caráter de Deus"
    },
    {
      "palavra": "בְּרִית",
      "transliteracao": "berit",
      "strongs": "H1285",
      "significado": "aliança, pacto",
      "insight": "Em Gênesis 15, Deus confirmou a aliança sozinho — indicando que era incondicional, não dependente da performance de Abraão"
    }
  ],
  "licoes_principais": [
    {"numero": 1, "titulo": "Fé que obedece antes de entender", "descricao": "Abraão saiu 'sem saber para onde ia' (Hb 11:8). A fé bíblica não espera certeza total — age em resposta ao caráter de Deus."},
    {"numero": 2, "titulo": "Deus cumpre promessas no tempo Dele", "descricao": "Isaque nasceu 25 anos após a promessa. O atraso não significa abandono."},
    {"numero": 3, "titulo": "Fé não é perfeição", "descricao": "Abraão mentiu sobre Sara duas vezes, gerou Ismael por impotência de esperar — e ainda assim é chamado amigo de Deus."},
    {"numero": 4, "titulo": "A aliança é incondicional", "descricao": "Em Gênesis 15, Deus fez a aliança sozinho. A permanência das promessas não depende da performance humana."},
    {"numero": 5, "titulo": "O sacrifício de Isaque — a maior lição de confiança", "descricao": "A obediência de Abraão foi completa porque confiava que Deus poderia ressuscitar Isaque (Hb 11:19). Esta cena prefigura o sacrifício do Filho de Deus."}
  ],
  "fatos_rapidos": [
    "A Bíblia nada fala de sua vida antes dos 75 anos",
    "Era quase nômade mas muito poderoso e rico",
    "Utilizava 318 servos como exército",
    "Teve encontros pessoais com Deus em forma humana",
    "Recebeu a palavra de Deus em sonhos",
    "Foi chamado pelo próprio Deus de profeta (Gn 20:7)",
    "Por duas vezes apresentou Sara como irmã — tecnicamente verdade (irmã por parte de pai, Gn 20:12)",
    "É chamado 'amigo de Deus' — único título deste tipo nas Escrituras",
    "Teve Ismael aos 86 anos e Isaque aos 100 anos",
    "Após Moisés, é o personagem do AT mais citado no NT"
  ],
  "tipologia_cristologica": [
    {"tipo": "Abraão oferecendo Isaque", "antitype": "Deus Pai oferecendo Cristo", "referencia": "Gn 22:2 → Jo 3:16", "descricao": "A linguagem é quase idêntica: 'teu filho, teu único filho, a quem amas'"},
    {"tipo": "Isaque carregando a madeira", "antitype": "Cristo carregando a cruz", "referencia": "Gn 22:6 → Jo 19:17", "descricao": "O filho amado carrega o instrumento de seu sacrifício"},
    {"tipo": "O carneiro substituto", "antitype": "Cristo como substituto vicário", "referencia": "Gn 22:13 → 1Co 5:7", "descricao": "'Jeová-Jiré' — o Senhor proverá. Deus mesmo proveu o substituto."}
  ],
  "referencias_nt": [
    {"livro": "Romanos", "capitulo_versiculo": "4:3", "contexto": "Paulo usa Abraão para provar justificação pela fé — justificado antes da circuncisão", "autor": "Paulo"},
    {"livro": "Gálatas", "capitulo_versiculo": "3:6-9", "contexto": "Os que são da fé são filhos de Abraão — a promessa foi feita à sua descendência: Cristo", "autor": "Paulo"},
    {"livro": "Hebreus", "capitulo_versiculo": "11:8-19", "contexto": "Hall da Fé — Abraão como exemplo central de fé obediente", "autor": "Anônimo"},
    {"livro": "João", "capitulo_versiculo": "8:56", "contexto": "Jesus diz que Abraão 'viu o meu dia e ficou alegre'", "autor": "João"},
    {"livro": "Tiago", "capitulo_versiculo": "2:23", "contexto": "Abraão 'amigo de Deus' — o sacrifício de Isaque como fé demonstrada em obras", "autor": "Tiago"}
  ],
  "quantidade_citacoes_nt": 5,
  "tags": ["fé", "aliança", "obediência", "sacrifício", "patriarca", "promessa"],
  "temas_teologicos": ["eleição", "aliança abraâmica", "fé e obras", "tipologia cristológica", "justificação pela fé"],
  "fonte_ebook": "200_Personagens_Biblicos",
  "extraido_pdf": true,
  "enriquecido_gpt": true,
  "qualidade_score": 10
}
```

---

## MÓDULO 2: PANORAMA BÍBLICO
**Fonte:** `panorama_parsed.json` (extraído do ebook "Panorama Bíblico")
**Tabela Supabase:** `lw_bible_books`
**Edge function:** `cea-ingest-books`

### Schema completo da tabela `lw_bible_books`

```sql
CREATE TABLE lw_bible_books (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- IDENTIFICAÇÃO (obrigatório)
  numero_canon          int NOT NULL UNIQUE,  -- 1-66
  nome                  text NOT NULL,
  abreviacao            text NOT NULL,
  testamento            text NOT NULL CHECK (testamento IN ('AT','NT')),
  secao_canonica        text NOT NULL,        -- Pentateuco, Histórico, Poético...

  -- DADOS BÁSICOS (do ebook)
  autor                 text,
  data_escrita          text,                 -- "~430 aC"
  idioma_original       text,                 -- hebraico, grego, aramaico
  capitulos             int,
  versiculos            int,
  tempo_leitura_min     int,
  destinatarios         text,

  -- CONTEÚDO DO EBOOK
  resumo                text,                 -- do campo `resumo_from_pdf`
  periodo_historico     text,                 -- contexto do ebook
  estrutura_literaria   text,                 -- tipo literário (narrativa, poesia, profecia...)
  conteudo_completo     text,                 -- página completa do ebook

  -- ENRIQUECIMENTO GPT-4o
  mensagem_central      text,                 -- [GPT-4o: 1 frase]
  resumo_3_linhas       text,                 -- [GPT-4o: para card]
  contexto_historico    text,                 -- [GPT-4o: detalhado]
  proposito_livro       text,                 -- por que foi escrito

  -- VERSÍCULOS-CHAVE
  versiculos_chave      jsonb,                -- [{referencia, texto, insight, strongs?}]

  -- ESTRUTURA DO LIVRO
  estrutura_capitulos   jsonb,                -- [{secao, caps, titulo, descricao}]
  temas_principais      text[],

  -- CONEXÕES CANÔNICAS
  profecia_cumprimento  jsonb,                -- [{profecia, cumprimento_ref, descricao}]
  livros_relacionados   text[],
  cita_livros           text[],              -- quais livros este cita
  citado_por            text[],              -- quais livros citam este

  -- TIMELINE
  timeline_eventos      jsonb,               -- [{ano, evento, referencia}]

  -- PALAVRAS DO ORIGINAL
  palavras_chave_original jsonb,             -- [{palavra, idioma, strongs, insight}]

  -- METADATA
  fonte_ebook           text DEFAULT 'Panorama_Biblico',
  extraido_pdf          boolean DEFAULT true,
  enriquecido_gpt       boolean DEFAULT false,
  embedding             vector(768),

  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);
```

### Exemplo de registro completo — MALAQUIAS

```json
{
  "numero_canon": 39,
  "nome": "Malaquias",
  "abreviacao": "ML",
  "testamento": "AT",
  "secao_canonica": "Profetas Menores",
  "autor": "Malaquias — 'meu mensageiro' (Ml 1:1)",
  "data_escrita": "~430 aC",
  "idioma_original": "hebraico",
  "capitulos": 4,
  "versiculos": 55,
  "tempo_leitura_min": 15,
  "destinatarios": "Judá pós-exílio sob domínio persa",
  "mensagem_central": "Retornem a Deus antes do grande Dia do Senhor — Ele ainda é fiel",
  "resumo_3_linhas": "Último profeta do AT. Repreende Israel por negligência espiritual, sacerdotes corruptos e dízimos retidos. Profetiza o mensageiro precursor (João Batista) e encerra o AT com promessa de restauração e 400 anos de silêncio.",
  "estrutura_literaria": "6 disputas dialógicas (Deus afirma → povo questiona → Deus responde)",
  "versiculos_chave": [
    {"referencia": "Ml 1:2", "texto": "Eu vos amei, diz o Senhor. E vós dizeis: Em que nos amaste?", "insight": "ahavti — perfeito hebraico. O livro começa com Deus declarando amor antes de qualquer exigência"},
    {"referencia": "Ml 3:1", "texto": "Eis que enviarei o meu mensageiro, e ele preparará o caminho diante de mim...", "insight": "Cumprido em João Batista (Mt 11:10). mal'akhi = 'meu mensageiro'"},
    {"referencia": "Ml 3:6", "texto": "Porque eu, o Senhor, não mudo; por isso vós não sois consumidos.", "insight": "lo shaniti — a imutabilidade divina como fundamento da misericórdia. Eco em Hb 13:8"},
    {"referencia": "Ml 3:10", "texto": "Trazei todos os dízimos... e provai-me nisto", "insight": "beḥanuni — único lugar onde Deus convida a ser testado. Não é fórmula: é convite à confiança"},
    {"referencia": "Ml 4:5-6", "texto": "Eis que eu vos enviarei o profeta Elias...", "insight": "Último versículo do AT. Cumprido em João Batista (Lc 1:17). 400 anos de silêncio começam aqui"}
  ],
  "estrutura_capitulos": [
    {"secao": "Ml 1:2-5", "titulo": "Disputa 1 — O amor de Deus questionado", "descricao": "'Eu vos amei' → 'Em que nos amaste?' — Deus prova seu amor pela eleição sobre Edom"},
    {"secao": "Ml 1:6–2:9", "titulo": "Disputa 2 — Os sacerdotes desonram a Deus", "descricao": "Animais defeituosos no altar. Maldição sobre os sacerdotes negligentes"},
    {"secao": "Ml 2:10-16", "titulo": "Disputa 3 — Casamentos mistos e divórcio", "descricao": "'Odeio o repúdio, diz o Senhor.' Israel abandona esposas hebreias"},
    {"secao": "Ml 2:17–3:6", "titulo": "Disputa 4 — Onde está o Deus da justiça?", "descricao": "Povo questiona justiça divina. Anúncio do mensageiro purificador"},
    {"secao": "Ml 3:7-12", "titulo": "Disputa 5 — Os dízimos retidos", "descricao": "'Vocês me roubam.' O único lugar onde Deus pede para ser provado"},
    {"secao": "Ml 3:13–4:6", "titulo": "Disputa 6 — É inútil servir a Deus?", "descricao": "Promessa de distinção no Dia do Senhor. Profecia de Elias."}
  ],
  "profecia_cumprimento": [
    {"profecia": "Ml 3:1", "cumprimento_ref": "Mt 11:10; Mc 1:2; Lc 7:27", "descricao": "João Batista como o mensageiro precursor"},
    {"profecia": "Ml 4:5-6", "cumprimento_ref": "Lc 1:17; Mt 17:11-12", "descricao": "João Batista no espírito e poder de Elias"},
    {"profecia": "Ml 1:11", "cumprimento_ref": "Jo 4:21-23; Rm 15:16", "descricao": "Adoração universal que vai além de Israel"}
  ],
  "palavras_chave_original": [
    {"palavra": "מַלְאָכִי", "idioma": "hebraico", "strongs": "H4397", "insight": "Mesmo radical do nome do profeta. 'Meu mensageiro' — o profeta é o mensageiro enviando mensagem sobre outro mensageiro"},
    {"palavra": "בְּחָנוּנִי", "idioma": "hebraico", "strongs": "H974", "insight": "Único lugar nas Escrituras onde Deus usa este verbo em relação a Si mesmo"},
    {"palavra": "לֹא שָׁנִיתִי", "idioma": "hebraico", "strongs": "H8138", "insight": "'Não mudei' — negação enfática. A imutabilidade divina como base de tudo"}
  ],
  "temas_principais": ["amor soberano", "imutabilidade de Deus", "sacerdócio", "dízimos", "casamento", "mensageiro precursor", "Dia do Senhor"],
  "timeline_eventos": [
    {"ano": "445 aC", "evento": "Artaxerxes autoriza o retorno do exílio"},
    {"ano": "444 aC", "evento": "Dedicação dos muros por Neemias"},
    {"ano": "~430 aC", "evento": "Malaquias profetiza em Judá"},
    {"ano": "431 aC", "evento": "Neemias retorna à Pérsia"},
    {"ano": "420 aC", "evento": "Neemias retorna a Jerusalém"},
    {"ano": "~400 aC", "evento": "Início de 400 anos de silêncio profético"}
  ],
  "fonte_ebook": "Panorama_Biblico",
  "extraido_pdf": true,
  "enriquecido_gpt": true
}
```

---

## MÓDULO 3: PARÁBOLAS
**Fonte:** `parabolas_parsed.json` (já implementado — ver LW_PDF_Arsenal_Master.md)
**Tabela:** `lw_parables` (já criada)

---

## MÓDULO 4: QUIZ
**Fonte:** `quiz_parsed.json` (já implementado)
**Tabela:** `lw_quiz` (já criada)

---

## SCRIPT DE INGESTÃO — Antigravity executa isso

```javascript
// scripts/ingest-all-cea-data.js
// Antigravity: execute este script após deploy das edge functions

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

const personagens = require('./personagens_parsed.json');
const panorama = require('./panorama_parsed.json');

// ── Enrich and insert PERSONAGENS ──────────────────────────────────────────
async function ingestPersonagens() {
  console.log(`Processing ${personagens.length} personagens...`);
  
  for (const p of personagens) {
    // 1. Enrich with GPT-4o
    const enriched = await enrichPersonagem(p);
    
    // 2. Generate Gemini embedding
    const embedding = await generateEmbedding(
      `${p.nome} ${p.biografia} ${enriched.tags?.join(' ')}`
    );
    
    // 3. Upsert to Supabase
    const response = await fetch(`${SUPABASE_URL}/rest/v1/lw_characters`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        ...enriched,
        embedding,
        extraido_pdf: true,
        enriquecido_gpt: true
      })
    });
    
    if (!response.ok) {
      console.error(`Failed: ${p.nome}`, await response.text());
    } else {
      console.log(`✓ ${p.nome}`);
    }
    
    await sleep(300); // rate limit
  }
}

// ── Enrich and insert PANORAMA ─────────────────────────────────────────────
async function ingestLivros() {
  console.log(`Processing ${panorama.length} livros...`);
  
  for (const livro of panorama) {
    const enriched = await enrichLivro(livro);
    const embedding = await generateEmbedding(
      `${livro.nome} ${livro.resumo} ${enriched.mensagem_central}`
    );
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/lw_bible_books`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({ ...enriched, embedding })
    });
    
    if (!response.ok) console.error(`Failed: ${livro.nome}`);
    else console.log(`✓ ${livro.nome}`);
    
    await sleep(400);
  }
}

async function enrichPersonagem(p) {
  const prompt = `
Dado este personagem bíblico extraído do ebook:
Nome: ${p.nome}
Biografia: ${p.biografia.slice(0,2000)}

Retorne SOMENTE JSON com estas chaves:
{
  "nome_hebraico": "...",
  "nome_transliterado": "...",
  "significado_nome": "...",
  "cargo": "...",
  "testamento": "AT ou NT",
  "periodo_historico": "...",
  "origem_geografica": "...",
  "pai": "...",
  "conjuge": "...",
  "filhos": ["..."],
  "idade_morte": 0,
  "referencia_principal": "...",
  "resumo_3_linhas": "...",
  "palavras_hebraico": [{"palavra":"","transliteracao":"","strongs":"","significado":"","insight":""}],
  "licoes_principais": [{"numero":1,"titulo":"","descricao":""}],
  "fatos_rapidos": ["..."],
  "tipologia_cristologica": [{"tipo":"","antitype":"","referencia":"","descricao":""}],
  "referencias_nt": [{"livro":"","capitulo_versiculo":"","contexto":"","autor":""}],
  "quantidade_citacoes_nt": 0,
  "tags": ["..."],
  "temas_teologicos": ["..."],
  "qualidade_score": 8
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000
    })
  });
  
  const data = await response.json();
  const enriched = JSON.parse(data.choices[0].message.content);
  return { ...enriched, nome: p.nome, biografia_completa: p.biografia };
}

async function generateEmbedding(text) {
  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({ model: 'models/text-embedding-004', content: { parts: [{ text: text.slice(0, 2000) }] } })
    }
  );
  const data = await response.json();
  return data.embedding.values;
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Run
(async () => {
  await ingestPersonagens();
  await ingestLivros();
  console.log('✅ CEA data ingestion complete');
})();
```

---

## CHECKLIST DO ANTIGRAVITY

Para cada módulo, verificar antes de marcar como completo:

```
PERSONAGENS:
[ ] 191 personagens no JSON extraído
[ ] Schema lw_characters criado no Supabase
[ ] Script de enriquecimento GPT-4o rodou para Abraão (teste)
[ ] Abraão retornou qualidade_score >= 8
[ ] Embedding gerado e salvo (verificar: SELECT id, nome, embedding IS NOT NULL FROM lw_characters LIMIT 5)
[ ] Ingestão completa: SELECT COUNT(*) FROM lw_characters (deve ser >= 180)

PANORAMA:
[ ] 60 de 66 livros com conteúdo do PDF (6 sem conteúdo usam metadata padrão)
[ ] Schema lw_bible_books criado
[ ] Malaquias como teste — verificar todos os campos
[ ] versiculos_chave e estrutura_capitulos populados
[ ] Ingestão completa: SELECT COUNT(*) FROM lw_bible_books (deve ser 66)

PARÁBOLAS + QUIZ:
[ ] Já implementados na sessão anterior
[ ] Verificar: SELECT COUNT(*) FROM lw_parables (deve ser 40)
[ ] Verificar: SELECT COUNT(*) FROM lw_quiz (deve ser >= 190)
```

---

## COMANDO DE EXECUÇÃO PARA O ANTIGRAVITY

```bash
# 1. Certifique-se que os JSONs estão em scripts/
ls scripts/personagens_parsed.json scripts/panorama_parsed.json

# 2. Rode as migrations no Supabase SQL Editor (nesta ordem):
# a) supabase/migrations/20260423_lw_characters_schema.sql
# b) supabase/migrations/20260423_lw_bible_books_schema.sql

# 3. Execute a ingestão
OPENAI_API_KEY=... GEMINI_API_KEY=... SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  node scripts/ingest-all-cea-data.js

# 4. Verifique no Supabase
SELECT nome, qualidade_score, enriquecido_gpt FROM lw_characters ORDER BY nome LIMIT 10;
SELECT nome, mensagem_central FROM lw_bible_books WHERE testamento='AT' LIMIT 5;
```
