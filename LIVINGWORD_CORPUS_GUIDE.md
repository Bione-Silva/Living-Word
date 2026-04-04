# LIVING WORD — Guia de Corpus: Onde Baixar, Como Organizar e Como Usar
## Pregadores Clássicos: Billy Graham · Spurgeon · Wesley · Calvino
**Versão:** 1.0 · Abril 2026

---

## ENTENDENDO O QUE VOCÊ VAI FAZER

### NÃO é fine-tuning. NÃO é retreinar a IA.

Fine-tuning = modificar o modelo em si. Custa $10.000–$100.000, exige
infraestrutura complexa e não é o que você precisa.

O que você vai fazer é muito mais simples:

```
CORPUS (sermões, livros, citações)
        ↓
  Leitura humana + destilação com Claude
        ↓
  SKILL.md (system prompt da Mente)
        ↓
  Backend injeta no modelo antes de cada conversa
        ↓
  Modelo responde na voz do pregador
```

O corpus serve para VOCÊ (e o Claude) extrair os padrões de voz,
teologia e metodologia. Não vai para dentro do modelo — vai para
dentro do SKILL.md.

**O modelo já conhece Billy Graham.** Ele foi treinado com bilhões de
textos, incluindo sermões, livros e citações desses pregadores.
O corpus que você baixa serve para refinar e precisar o SKILL.md,
não para ensinar o modelo quem eles são.

---

## PARTE 1 — ONDE BAIXAR O CORPUS

### BILLY GRAHAM

**Fonte 1 — Transcrições completas (MELHOR para texto)**
- URL: `https://sermons.love/billy-graham/`
- O que tem: sermões completos em texto, com transcrição
- Como usar: copiar o texto de 10–15 sermões diretamente
- Custo: grátis
- Direitos: sermões históricos para uso educacional e ministerial

**Fonte 2 — Internet Archive (áudio + vídeo)**
- URL: `https://archive.org/details/billy_graham_202201`
- O que tem: centenas de sermões em MP4/MP3
- Marcação: Public Domain Mark 1.0 (confirmado)
- Como usar: para áudio — transcrever com Whisper API ($0,006/min)
- Custo: download grátis

**Fonte 3 — SermonIndex (texto)**
- URL: `https://www.sermonindex.net/modules/articles/index.php?view=category&cid=59`
- O que tem: sermões em texto
- Direitos: "committed to the public domain for the free spread of the gospel"

**Fonte 4 — Billy Graham Evangelistic Association**
- URL: `https://billygraham.org/sermons`
- O que tem: mais de 1.600 sermões com áudio
- Nota: esses têm copyright da BGEA — usar apenas para referência e
  extração de padrões no SKILL.md, não reproduzir o texto diretamente
  na plataforma

**Livros recomendados para corpus:**
- "Peace with God" (1953) — disponível online em versões antigas
- "How to Be Born Again" (1977) — disponível para referência
- Ambos estão no núcleo da teologia de Billy Graham

---

### CHARLES SPURGEON

**Fonte principal — CCEL (Christian Classics Ethereal Library)**
- URL base: `https://www.ccel.org/ccel/s/spurgeon/`
- O que tem: 63 volumes de sermões em PDF/HTML, domínio público
- PDFs diretos:
  ```
  https://ccel.org/ccel/s/spurgeon/sermons01/cache/sermons01.pdf
  https://ccel.org/ccel/s/spurgeon/sermons02/cache/sermons02.pdf
  ... (até sermons63)
  ```
- Direitos: "freely copied for non-commercial purposes"
- Licença comercial: requer permissão escrita do CCEL
  → Para o Living Word (uso como corpus de extração): aceitável
  → Para publicar os sermões diretamente na plataforma: verificar

**Fonte adicional — spurgeon.org**
- URL: `https://www.spurgeon.org/resource-library/sermons/`
- O que tem: sermões organizados por referência bíblica
- Excelente para encontrar sermões específicos por passagem

**Livros fundamentais do Spurgeon no CCEL:**
```
Lectures to My Students:  ccel.org/ccel/spurgeon/lectures
Morning and Evening:       ccel.org/ccel/spurgeon/morneve
All of Grace:              ccel.org/ccel/spurgeon/grace
```

---

### JOHN WESLEY

**Fonte principal — CCEL**
- URL: `https://www.ccel.org/ccel/w/wesley/sermons/`
- O que tem: os 44 Sermões Padrão completos em texto
- Domínio público (século XVIII)
- PDF: `ccel.org/ccel/wesley/sermons/cache/sermons.pdf`

**Os 44 sermões padrão são o corpus essencial de Wesley.**
São os sermões que ele mesmo considerou a base doutrinária do metodismo.
Você precisa de todos os 44 — são o DNA completo.

**Obras adicionais de Wesley no CCEL:**
```
Journal of John Wesley:     ccel.org/ccel/wesley/journal
Plain Account of Perfection: ccel.org/ccel/wesley/perfection
Notes on the NT:            ccel.org/ccel/wesley/notes
```

---

### JOÃO CALVINO

**Fonte principal — CCEL**
- URL: `https://www.ccel.org/ccel/c/calvin/`
- O que tem: Institutas completas, comentários bíblicos, tratados

**Obras fundamentais:**
```
Institutes of the Christian Religion:
  ccel.org/ccel/calvin/institutes/cache/institutes.pdf

Comentários bíblicos (por livro):
  ccel.org/ccel/c/calvin/calcom01/ (Gênesis)
  ccel.org/ccel/c/calvin/calcom32/ (João)
  ccel.org/ccel/c/calvin/calcom38/ (Romanos)
  ... (séries completas disponíveis)
```

**Para o SKILL.md de Calvino, as Institutas são obrigatórias.**
Especialmente:
- Livro I: Conhecimento de Deus e de nós mesmos
- Livro III: Graça, Fé e Justificação
- Livro IV: Igreja e Sacramentos

---

## PARTE 2 — COMO ORGANIZAR O CORPUS

### Estrutura de pastas no projeto

```
/corpus/
  billy-graham/
    sermons/
      john-316-classic.txt
      peace-with-god-excerpt.txt
      hope-for-broken-things.txt
      ... (10-15 sermões)
    quotes.txt
    theology-notes.txt (suas anotações após leitura)
  spurgeon/
    sermons/
      sermon-01-immutability.txt
      sermon-07-christ-crucified.txt
      sermon-227-compel-them.txt
      ... (15-20 sermões selecionados)
    lectures-to-my-students-excerpts.txt
    quotes.txt
  wesley/
    sermons/
      sermon-01-salvation-by-faith.txt
      sermon-05-justification-by-faith.txt
      sermon-13-sin-in-believers.txt
      ... (todos os 44 padrão)
    quotes.txt
  calvin/
    institutes/
      book1-knowledge-of-god.txt
      book3-grace-and-faith.txt
    sermons/
      ... (10-15 sermões selecionados)
    quotes.txt
```

### Quais sermões selecionar (critérios)

Não baixe tudo — selecione com inteligência:

| Critério | Por que selecionar |
|---|---|
| Sermões evangelísticos | Capturam o convite e o tom de apelo |
| Sermões sobre sofrimento | Capturam a consolação pastoral |
| Sermões sobre identidade/propósito | Relevantes para imigrantes |
| Sermões mais famosos/citados | Capturam a voz mais característica |
| Sermões em diferentes momentos da vida | Mostram consistência ou evolução |

**Para Billy Graham — 10 sermões prioritários:**
1. John 3:16 (clássico evangelístico)
2. Peace with God (identidade)
3. Hope for Broken Things (consolação)
4. Is There a Hell? (tom direto)
5. The Cross (teologia central)
6. Life's Most Important Question (metodologia de convite)
7. Who is Jesus? (cristologia)
8. The Holy Spirit (doutrina do Espírito)
9. Death and What Comes After (esperança)
10. Qualquer sermão para imigrantes/minorias (contexto cultural)

---

## PARTE 3 — COMO USAR O CORPUS (PASSO A PASSO)

### Passo 1 — Baixar e salvar (30 minutos por pregador)

Para texto:
- Acesse as URLs acima
- Copie/cole o texto em arquivos `.txt`
- Salve na pasta `/corpus/[pregador]/sermons/`

Para PDF (Spurgeon, Wesley, Calvino no CCEL):
```bash
# Baixar um volume de Spurgeon
curl -o spurgeon_vol01.pdf \
  https://ccel.org/ccel/s/spurgeon/sermons01/cache/sermons01.pdf

# Extrair texto do PDF
pdftotext spurgeon_vol01.pdf spurgeon_vol01.txt

# Ou com Python
pip install pdfplumber
python3 -c "
import pdfplumber
with pdfplumber.open('spurgeon_vol01.pdf') as pdf:
    text = '\n'.join(page.extract_text() for page in pdf.pages)
    open('spurgeon_vol01.txt', 'w').write(text)
"
```

Para áudio (Internet Archive — opcional):
```bash
# Transcrever com Whisper via API da OpenAI
# $0,006 por minuto de áudio
# Um sermão de 40 min = $0,24

from openai import OpenAI
client = OpenAI()

with open("sermon.mp3", "rb") as audio:
    transcript = client.audio.transcriptions.create(
        model="whisper-1",
        file=audio,
        language="en"
    )
    print(transcript.text)
```

---

### Passo 2 — Destilação com Claude (30–60 minutos por pregador)

Após baixar 10–15 sermões, use este prompt no Claude para extrair o DNA:

```
Você é um especialista em homilética e teologia histórica.
Analise os sermões e textos abaixo de [PREGADOR] e produza um
relatório estruturado com:

1. VOZ E ESTILO (10 características linguísticas específicas com exemplos textuais)
2. ESTRUTURA DE SERMÃO (o padrão que ele mais usa — movimentos, proporções)
3. TEOLOGIA CENTRAL (6–8 doutrinas com citações diretas dos textos)
4. FRASES MARCANTES (15 expressões únicas, citadas literalmente)
5. ILUSTRAÇÕES TÍPICAS (que tipo de exemplos ele usa — natureza, história, cotidiano)
6. O QUE ELE NUNCA DIRIA (guardrails baseados nos textos, não em suposição)
7. COMO ELE TRATA SOFRIMENTO (tom e abordagem específica)

Base tudo em evidências dos textos fornecidos.
Se algo não tiver evidência clara, diga explicitamente.

[COLE OS TEXTOS DOS SERMÕES AQUI]
```

**Limite de tokens:** o Claude Sonnet 4 aceita 200K tokens de contexto.
Um sermão tem ~3.000–5.000 tokens. Você pode enviar 10–15 sermões
em uma única chamada. Custo estimado: ~$0,15–$0,30 por destilação completa.

---

### Passo 3 — Montar o SKILL.md

Use o relatório da destilação para preencher/refinar o SKILL.md.
O template completo está no documento `LIVINGWORD_MENTES_SYSTEM.md`.

Checklist antes de finalizar o SKILL.md:
- [ ] Voz: tem pelo menos 8 características linguísticas específicas?
- [ ] Frases: tem 10+ expressões únicas e documentadas?
- [ ] Teologia: tem 6–8 doutrinas com descrição pastoral?
- [ ] Guardrails: tem pelo menos 5 coisas que ele NÃO faria?
- [ ] Sofrimento: tem instrução específica para contexto sensível?
- [ ] Imigrante: tem adaptação para o contexto imigrante?
- [ ] Metodologia: tem os movimentos do sermão claramente descritos?
- [ ] Watermark: tem o rodapé trilíngue PT/EN/ES?

---

### Passo 4 — Validar com as 10 perguntas

Use o protocolo do documento `LIVINGWORD_BILLY_GRAHAM_VALIDATION.md`.
Adapte as perguntas para cada pregador:

**Para Spurgeon:** troque o foco de "evangelismo" para "exposição bíblica rica"
**Para Wesley:** troque o foco para "santificação prática" e "comunidade"
**Para Calvino:** troque o foco para "soberania de Deus" e "exegese sistemática"

---

## PARTE 4 — ONDE OS ARQUIVOS FICAM NO PROJETO

```
/
├── agents/
│   ├── billy-graham/
│   │   └── SKILL.md          ← INJETADO no modelo (system prompt)
│   ├── spurgeon/
│   │   └── SKILL.md
│   ├── wesley/
│   │   └── SKILL.md
│   └── calvin/
│       └── SKILL.md
│
├── corpus/                    ← NÃO vai para o modelo. Uso humano.
│   ├── billy-graham/
│   ├── spurgeon/
│   ├── wesley/
│   └── calvin/
│
└── agents.json                ← Registro de todos os agentes
```

**O corpus fica LOCAL na sua máquina ou no servidor.**
Ele não é enviado para o modelo em produção.
Só é usado durante a fase de curadoria para criar o SKILL.md.

**Exceção — RAG (opcional, Sprint 3):**
Se quiser que o modelo possa citar sermões específicos por passagem,
você pode implementar um sistema RAG (Retrieval Augmented Generation):
o corpus é indexado em vetores no Supabase pgvector, e quando o usuário
pede um sermão sobre João 15, o sistema busca os sermões mais relevantes
do pregador e os injeta no contexto. Isso aumenta a fidelidade mas também
o custo e a complexidade. **Não necessário no MVP.**

---

## PARTE 5 — CUSTO TOTAL DE CRIAR AS 4 MENTES

| Atividade | Billy Graham | Spurgeon | Wesley | Calvino |
|---|---|---|---|---|
| Download corpus | $0 | $0 | $0 | $0 |
| Transcrição áudio (opcional) | ~$2–5 | N/A | N/A | N/A |
| Destilação Claude (API) | ~$0,20 | ~$0,20 | ~$0,20 | ~$0,20 |
| Validação (10 testes) | ~$0,08 | ~$0,08 | ~$0,08 | ~$0,08 |
| **Custo API total** | **~$0,30** | **~$0,28** | **~$0,28** | **~$0,28** |
| **Tempo humano** | **8–10h** | **6–8h** | **5–7h** | **7–9h** |

**Custo total das 4 Mentes: ~$1,14 em API + ~26–34 horas de trabalho.**

O custo financeiro é desprezível. O investimento real é o tempo de
curadoria cuidadosa. Uma Mente feita com pressa vai produzir conteúdo
genérico. Uma Mente feita com cuidado vai produzir conteúdo que pastores
vão querer usar toda semana.

---

## RESUMO EXECUTIVO — O QUE FAZER NA ORDEM CERTA

```
SEMANA 1 — BILLY GRAHAM
  Dia 1: Baixar 10 sermões em texto (sermons.love + sermonindex.net)
  Dia 2: Rodar destilação com Claude (30 min de trabalho)
  Dia 3: Montar/refinar SKILL.md
  Dia 4: Rodar os 10 testes de validação
  Dia 5: Ajustes finais + disponibilizar na plataforma

SEMANA 2 — SPURGEON
  Dia 1: Baixar 3 PDFs do CCEL (vols 01, 05, 09) + extrair texto
  Dia 2: Selecionar 15 sermões, rodar destilação
  Dia 3-4: Montar SKILL.md + validar
  Dia 5: Disponibilizar

SEMANA 3 — WESLEY
  Dia 1: Baixar os 44 sermões padrão do CCEL (PDF único)
  Dia 2: Selecionar 12 sermões mais representativos + destilação
  Dia 3-4: Montar SKILL.md + validar
  Dia 5: Disponibilizar

SEMANA 4 — CALVINO
  Dia 1: Baixar Institutas (Livros I e III) + 10 sermões
  Dia 2: Destilação (Calvino é mais denso — mais tempo)
  Dia 3-4: Montar SKILL.md + validar
  Dia 5: Disponibilizar
```

---

*Guia de Corpus Living Word v1.0 · Abril 2026*
*Próximo passo: baixar o primeiro lote de sermões de Billy Graham e rodar a destilação*
