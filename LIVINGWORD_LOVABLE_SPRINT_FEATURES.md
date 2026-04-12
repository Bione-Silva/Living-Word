# LIVING WORD — PROMPT LOVABLE
## Sprint: 5 Killer Features (Sermon Builder v2)
## Versão: 1.0 | Abril 2026

---

## ⚠️ REGRAS INVIOLÁVEIS — LEIA ANTES DE TUDO

**REGRA 1 — NÃO QUEBRAR O QUE JÁ FUNCIONA**
A plataforma já está rodando em produção com usuários reais.
Não altere, remova ou reescreva NENHUMA tela ou componente existente.
Apenas ADICIONE os componentes e rotas especificados abaixo.

**REGRA 2 — IDENTIDADE VISUAL CONGELADA**
Use exclusivamente os tokens CSS abaixo. Nunca use valores hardcoded de cor.

```css
--lw-bg:           #F5F0E8;   /* fundo geral creme quente */
--lw-bg-card:      #FFFFFF;   /* cards */
--lw-primary:      #6B4F3A;   /* marrom principal */
--lw-amber:        #C4956A;   /* âmbar — destaque */
--lw-amber-l:      #F0E6D8;   /* âmbar claro — badges */
--lw-dark:         #3D2B1F;   /* texto principal */
--lw-muted:        #8B6B54;   /* texto secundário */
--lw-border:       #EDD9C8;   /* bordas */
--lw-green:        #1E4D2B;   /* sucesso */
--lw-green-l:      #E8F2EB;   /* sucesso claro */
--lw-blue:         #1A4FA0;   /* info */
--lw-blue-l:       #E8EEF8;   /* info claro */
--lw-red:          #991B1B;   /* erro */
--lw-red-l:        #FCE8E8;   /* erro claro */
```

**REGRA 3 — COORDENAÇÃO COM O ANTIGRAVITY**
Cada feature abaixo depende de uma Edge Function já criada (ou a ser criada)
pelo Antigravity no Supabase. Para cada feature, o Lovable deve:
- Chamar o endpoint especificado
- Exibir estado de loading enquanto aguarda
- Tratar erros com toast não-intrusivo
- NUNCA fazer lógica de negócio no frontend — apenas UI + chamada de API

**REGRA 4 — CRÉDITOS**
Toda geração por IA consome créditos. Antes de qualquer chamada de Edge Function
de geração, verifique se `profile.generations_used < profile.generations_limit`.
Se limite atingido, exibe modal de upgrade (componente `UpgradeModal` já existente).

**REGRA 5 — CONSUME_CREDITS**
Após qualquer geração bem-sucedida, chame a função RPC `consume_credits`:
```typescript
await supabase.rpc('consume_credits', {
  p_user_id: user.id,
  p_credits: TOOL_CREDITS[tool_name]
})
```
Onde `TOOL_CREDITS`:
```typescript
const TOOL_CREDITS = {
  'generate-from-template':  20,
  'research-suite':          10,
  'generate-illustration':   10,
  'multiply-sermon':         50,
  'social-calendar':         20,
}
```

---

## ARQUITETURA — O QUE JÁ EXISTE vs O QUE VOCÊ VAI CRIAR

### Já existe (NÃO TOCAR):
- `/dashboard` — painel principal
- `/sermon-builder` ou `/materiais` — editor atual
- `/pricing` — página de preços
- Sistema de autenticação e perfis
- Sistema de créditos (`profiles.generations_used`, `profiles.generations_limit`)
- Componente `UpgradeModal`
- Design system com tokens `--lw-*`

### Você vai ADICIONAR (5 features novas):
1. **Painel lateral de pesquisa** no editor existente (aba nova no sidebar)
2. **Seletor de templates gerativos** na criação de sermão
3. **Biblioteca de ilustrações + Gerador** no editor (bloco de ilustração)
4. **Painel Multiply** após o sermão ser marcado como pronto
5. **Calendário Editorial Social** na tela de conteúdo

---

## FEATURE 1 — PAINEL LATERAL: RESEARCH SUITE + ILUSTRAÇÕES

### Localização
Adicionar ao editor de sermão existente um painel lateral direito recolhível
com 3 abas: **Pesquisa**, **Ilustrações**, **Mentes**.

### UI — Painel Lateral (320px, recolhe para 48px)

```
[PAINEL LATERAL — estado expandido]
┌─────────────────────────────────────┐
│ [🔬 Pesquisa] [◎ Ilustrações] [✦ Mentes] │
├─────────────────────────────────────┤
│                                     │
│  ABA: PESQUISA BÍBLICA              │
│  ┌───────────────────────────┐      │
│  │ 🔍 João 15:5 ou "perdão"  │      │
│  └───────────────────────────┘      │
│  Contexto: [imigrante ▾]            │
│  Idioma:   [PT ▾]                   │
│  [Pesquisar com IA]                 │
│  ────────────────────────────       │
│  Resultado (síntese gerada):        │
│  ┌─────────────────────────┐        │
│  │ 📖 Síntese Exegética    │        │
│  │ "menō (μένω) significa…"│        │
│  │                         │        │
│  │ Passagens cruzadas:     │        │
│  │ • João 8:31 • João 6:56 │        │
│  │                         │        │
│  │ [Arrastar para o sermão]│        │
│  └─────────────────────────┘        │
│                                     │
│  ABA: ILUSTRAÇÕES                   │
│  ┌───────────────────────────┐      │
│  │ 🔍 perdão, fé, esperança  │      │
│  └───────────────────────────┘      │
│  Mente: [Billy Graham ▾]            │
│  [Gerar nova] [Buscar no acervo]    │
│  ────────────────────────────       │
│  Card de ilustração:                │
│  ┌─────────────────────────┐        │
│  │ "Um fazendeiro um dia…" │        │
│  │ Tema: perdão, graça     │        │
│  │ [Arrastar] [Salvar]     │        │
│  └─────────────────────────┘        │
│                                     │
│  ABA: MENTES PASTORAIS              │
│  Mente ativa: [Billy Graham ▾]      │
│  ────────────────────────────       │
│  [Billy Graham]  evangelístico      │
│  [Spurgeon]      expositivo rico    │
│  [Wesley]        prático            │
│  [Calvino]       teológico          │
└─────────────────────────────────────┘
```

### Comportamento
- Painel abre/fecha com botão `›` no canto direito do editor
- Bloco selecionado no editor define contexto automático da pesquisa
- Arrastar um card de pesquisa ou ilustração sobre um bloco → substitui/insere conteúdo
- Se nenhum bloco selecionado, inserção cria novo bloco no final

### Chamadas de API

**Pesquisa bíblica:**
```typescript
// Endpoint: POST /functions/v1/research-suite
// Coordenar com Antigravity antes de implementar
const response = await supabase.functions.invoke('research-suite', {
  body: {
    passage: searchQuery,     // ex: "João 15:5"
    mind: selectedMind,       // 'billy_graham' | 'spurgeon' | null
    context: context,         // 'imigrante' | 'jovens' | 'geral'
    language: language        // 'PT' | 'EN' | 'ES'
  }
})
// Retorna: { synthesis: string, greek_notes: object, cross_refs: string[] }
```

**Gerar ilustração:**
```typescript
// Endpoint: POST /functions/v1/generate-illustration
const response = await supabase.functions.invoke('generate-illustration', {
  body: {
    block_text: selectedBlock?.text,   // texto do bloco ativo
    mind: selectedMind,
    congregation_context: context,
    language: language
  }
})
// Retorna: { illustration: string }
```

### Estados de UI obrigatórios
- `idle`: formulário de busca vazio
- `loading`: skeleton de 3 linhas com animação pulse
- `success`: card com resultado + botão arrastar
- `error`: toast "Não foi possível gerar. Tente novamente."
- `no_credits`: não chama API, mostra `UpgradeModal`

---

## FEATURE 2 — SELETOR DE TEMPLATES GERATIVOS

### Localização
Na tela de criação de novo sermão (modal ou página `/sermon-builder/new`),
substituir ou ADICIONAR ao fluxo atual a opção de templates gerativos.

### UI — Modal de Criação com Templates

```
[MODAL: Novo Sermão]
┌─────────────────────────────────────────┐
│  Criar Novo Sermão                    ✕ │
├─────────────────────────────────────────┤
│  Passagem bíblica *                     │
│  ┌─────────────────────────────────┐    │
│  │ ex: João 15:1-8                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Escolha um template:                   │
│                                         │
│  ┌──────────────┐ ┌──────────────┐     │
│  │ ✦ Expositivo │ │ → 3 Pontos   │     │
│  │ IA preenche  │ │ IA preenche  │     │
│  │ sugestão     │ │ sugestão     │     │
│  └──────────────┘ └──────────────┘     │
│  ┌──────────────┐ ┌──────────────┐     │
│  │ ◎ Narrativo  │ │ ✝ Célula     │     │
│  │ IA preenche  │ │ IA preenche  │     │
│  └──────────────┘ └──────────────┘     │
│  ┌──────────────┐ ┌──────────────┐     │
│  │ 🌎 Imigrante │ │ ★ Evangelíst.│     │
│  │ PT/EN/ES     │ │ Chamada final│     │
│  └──────────────┘ └──────────────┘     │
│                                         │
│  Mente pastoral: [Nenhuma ▾]           │
│  Contexto: [Geral ▾]                   │
│  Idioma: [Português ▾]                 │
│                                         │
│  [Começar do zero]  [Gerar com IA →]   │
└─────────────────────────────────────────┘
```

### Comportamento
- "Começar do zero" → comportamento atual (abre editor com blocos vazios)
- "Gerar com IA" → chama Edge Function, exibe loading, abre editor com blocos pré-preenchidos
- Template selecionado fica com borda `--lw-amber` e checkmark
- Badge "IA preenche" em verde em todos os templates gerativos

### Chamada de API

```typescript
// Endpoint: POST /functions/v1/generate-from-template
const response = await supabase.functions.invoke('generate-from-template', {
  body: {
    template_slug: selectedTemplate,  // 'expositivo' | '3-pontos' | 'imigrante' etc
    passage: passage,                  // "João 15:1-8"
    mind: selectedMind || null,
    context: selectedContext,          // 'imigrante' | 'jovens' | 'geral'
    language: selectedLanguage         // 'PT' | 'EN' | 'ES'
  }
})
// Retorna: { blocks: Block[] }  — array de blocos JSON já preenchidos
// Abrir editor com esses blocos como estado inicial
```

### Estados de UI
- Loading: "Preparando sua mensagem…" com spinner âmbar (duração ~8–15s)
- Erro: toast + fallback para "Começar do zero" automático
- Sucesso: fecha modal + abre editor com blocos preenchidos

---

## FEATURE 3 — PAINEL MULTIPLY

### Localização
Adicionar botão **"✦ Multiplicar"** na barra de ações do sermão,
visível quando `material.status === 'ready'`.
Ao clicar, abre painel de multiplicação (bottom sheet ou página dedicada).

### UI — Painel Multiply

```
[PAINEL MULTIPLY — bottom sheet ou /sermon-builder/:id/multiply]
┌─────────────────────────────────────────────────────┐
│  ✦ Multiplicar Mensagem                           ✕ │
│  "João 15:1-8 — A Videira Verdadeira"               │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Idiomas:  [☑ PT]  [☑ EN]  [☐ ES]                 │
│  Mente:    [Billy Graham ▾]                         │
│                                                     │
│  Selecione o que gerar:                             │
│                                                     │
│  [☑] 📝 Artigo de blog       ~600 palavras · 20cr  │
│  [☑] ☀️ 5 Devocionais        diários · 10cr        │
│  [☑] 💬 Posts sociais        7 posts · 15cr        │
│  [☑] 👥 Perguntas célula     5 perguntas · 5cr     │
│  [☐] 📧 Newsletter           resumo · 10cr         │
│  [☐] 🎠 Carrossel            slides · 15cr         │
│                                                     │
│  Total estimado: 50 créditos                        │
│  Seus créditos: 3.240 disponíveis                   │
│                                                     │
│  Publicação automática:                             │
│  [☑] WordPress (blog.suaigreja.com) configurado    │
│  [☐] Calendário social (preencher semana)           │
│                                                     │
│  [Cancelar]            [Multiplicar agora →]        │
└─────────────────────────────────────────────────────┘
```

### Tela de Resultado

```
[RESULTADO MULTIPLY]
┌─────────────────────────────────────────────────────┐
│  ✅ Mensagem multiplicada!                           │
│  5 formatos gerados · 50 créditos usados            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  📝 ARTIGO DE BLOG                                  │
│  ┌─────────────────────────────────────────────┐    │
│  │ "Separados de Cristo, somos estéreis…"      │    │
│  │ [Visualizar] [Editar] [Publicar no WP] [PT] │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ☀️ DEVOCIONAIS (5)                                 │
│  ┌─────────────────────────────────────────────┐    │
│  │ Seg: "Permanecer não é esforço, é escolha…"│    │
│  │ Ter: "A videira não carrega o galho…"       │    │
│  │ [Visualizar todos] [Agendar no calendário]  │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  💬 POSTS SOCIAIS (7)                               │
│  ┌─────────────────────────────────────────────┐    │
│  │ Seg: "Sem Cristo somos capazes de tudo…"   │    │
│  │         exceto do que realmente importa     │    │
│  │ [Ver todos] [Aprovar e agendar]             │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  [Ir para o Calendário Editorial]                   │
└─────────────────────────────────────────────────────┘
```

### Chamada de API

```typescript
// Endpoint: POST /functions/v1/multiply-sermon
// ⚠️ Esta chamada pode demorar 30-60s — use timeout longo e loading state adequado
const response = await supabase.functions.invoke('multiply-sermon', {
  body: {
    material_id: sermon.id,
    languages: selectedLanguages,       // ['PT','EN']
    targets: selectedTargets,           // ['blog','devotional','social','cell']
    mind: selectedMind || null,
    publish_to_wordpress: publishToWP,
    fill_calendar: fillCalendar
  }
})
// Retorna: { outputs_created: number, outputs: MultiplyOutput[] }
```

### Estados de UI obrigatórios
- Loading: progress bar com mensagens rotativas ("Gerando artigo…", "Criando devocionais…", "Preparando posts…")
- Progresso: se a Edge Function suportar streaming, exibir outputs conforme chegam
- Erro parcial: exibir o que foi gerado + aviso do que falhou
- Sucesso: tela de resultado com todos os outputs

---

## FEATURE 4 — CALENDÁRIO EDITORIAL SOCIAL

### Localização
Nova rota: `/conteudo/calendario` ou aba "Calendário" na área de conteúdo existente.

### UI — Calendário Semanal

```
[CALENDÁRIO EDITORIAL — /conteudo/calendario]
┌─────────────────────────────────────────────────────┐
│  📅 Calendário Editorial         Semana 15–21 Abr ▾ │
│  [Gerar semana com IA]  [Vincular sermão ▾]          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  SEG 15        TER 16        QUA 17                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ Instagram│  │ WhatsApp │  │ Instagram│           │
│  │          │  │          │  │          │           │
│  │ "Sem     │  │ ☀️ Devoc.│  │ ❓Pergunta│           │
│  │ Cristo…" │  │ "Permane-│  │ reflexiva│           │
│  │          │  │ cer não é│  │          │           │
│  │ [rascunho│  │ esforço" │  │ [rascunho│           │
│  │ ✏️ editar│  │ ✅ agendar│  │ ✏️ editar│           │
│  └──────────┘  └──────────┘  └──────────┘           │
│                                                     │
│  QUI 18        SEX 19        SAB 20       DOM 21    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐┌────────┐│
│  │ Blog     │  │ Instagram│  │ WhatsApp ││Facebook││
│  │          │  │          │  │          ││        ││
│  │ 📝 Artigo│  │ Aplicação│  │ Teaser   ││Recap   ││
│  │ João 15  │  │ prática  │  │ domingo  ││sermão  ││
│  │          │  │          │  │          ││        ││
│  │ ✅ publicad│  │ ✏️ editar│  │ ✏️ editar││✏️ edit ││
│  └──────────┘  └──────────┘  └──────────┘└────────┘│
│                                                     │
│  Legenda: ✅ publicado  📤 agendado  ✏️ rascunho    │
└─────────────────────────────────────────────────────┘
```

### Modal de Edição de Post

```
[MODAL: Editar Post]
┌─────────────────────────────────────────┐
│ Editar Post — Segunda, 15 Abr         ✕ │
├─────────────────────────────────────────┤
│ Plataforma: [Instagram ▾]               │
│ Idioma: [PT ▾]                          │
│                                         │
│ Conteúdo:                               │
│ ┌─────────────────────────────────┐     │
│ │ "Sem Cristo somos capazes de   │     │
│ │ tudo... exceto do que realmente│     │
│ │ importa. João 15:5             │     │
│ │                                 │     │
│ │ #VidaEmCristo #Fé              │     │
│ └─────────────────────────────────┘     │
│ 180 / 2.200 caracteres                  │
│                                         │
│ [Regenerar com IA]                      │
│                                         │
│ [Cancelar]    [Salvar rascunho]  [✅ Aprovar]│
└─────────────────────────────────────────┘
```

### Chamada de API (geração da semana)

```typescript
// Endpoint: POST /functions/v1/social-calendar-generator
const response = await supabase.functions.invoke('social-calendar-generator', {
  body: {
    user_id: user.id,
    week_start: startOfWeek,              // ISO date
    sermon_material_id: linkedSermon?.id, // opcional
    language: userLanguage                // 'PT' | 'EN' | 'ES'
  }
})
// Retorna: { calendar: SocialPost[] }  — array de 7 posts

// Leitura do calendário existente:
const { data } = await supabase
  .from('social_calendar')
  .select('*')
  .eq('user_id', user.id)
  .gte('scheduled_for', weekStart)
  .lte('scheduled_for', weekEnd)
  .order('scheduled_for')
```

---

## FEATURE 5 — MELHORIAS NO EDITOR DE BLOCOS EXISTENTE

### Contexto
O editor de blocos já existe. Não reescreva. Adicione apenas os itens abaixo
que ainda não estão implementados.

### 5.1 — Botões de IA por bloco (se não existir)
Adicionar ao menu "…" de cada bloco as opções:
- "✦ Gerar ilustração" → chama `generate-illustration` com texto do bloco
- "↗ Expandir ponto" → chama Edge Function `expand-block` (coordenar com Antigravity)
- "✂️ Resumir" → chama Edge Function `summarize-block`

### 5.2 — Indicador de tempo estimado (se não existir)
Exibir na barra superior do editor:
```
📊 347 palavras · ~2.7 min · 8 blocos · 5 visíveis no púlpito
```
Calculado no frontend: `words / 130 = minutos`.

### 5.3 — Hook Queue / Fila de Ganchos (se não existir)
Área colapsável no TOPO do editor com título "💡 Fila de Ideias":
- Textarea livre para anotações rápidas
- Botão "+ Virar bloco" → cria novo bloco de nota com o conteúdo
- Não consome créditos, não chama API

### 5.4 — Status do sermão (se não existir)
Badge clicável na barra superior do editor:
```
[● Rascunho ▾]  →  [○ Pronto ▾]  →  [✅ Publicado ▾]
```
Apenas quando status muda para "Pronto" → o botão "✦ Multiplicar" aparece.

### 5.5 — Modo bilíngue (se não existir)
Toggle na barra do editor: `[PT] [EN] [PT/EN]`
Quando "PT/EN" selecionado: cada bloco exibe duas colunas — PT e EN lado a lado.
A coluna EN é gerada automaticamente por Edge Function `translate-block` ao perder foco.

---

## COMPONENTES COMPARTILHADOS — CRIAR UMA VEZ, USAR EM TODOS

### `<MindSelector />`
Dropdown de seleção de Mente Pastoral reutilizado em todas as features.
```tsx
// Props
interface MindSelectorProps {
  value: string | null
  onChange: (mind: string | null) => void
  allowNull?: boolean  // "Nenhuma / Genérico"
  size?: 'sm' | 'md'
}

// Opções
const MINDS = [
  { value: null,           label: 'Genérico',      icon: '🎙️' },
  { value: 'billy_graham', label: 'Billy Graham',  icon: '✝️' },
  { value: 'spurgeon',     label: 'Spurgeon',       icon: '📖' },
  { value: 'wesley',       label: 'John Wesley',    icon: '🕊️' },
  { value: 'calvino',      label: 'Calvino',        icon: '⚖️' },
]
```

### `<ContextSelector />`
Dropdown do contexto da congregação:
```tsx
const CONTEXTS = [
  { value: 'geral',      label: 'Geral' },
  { value: 'imigrante',  label: 'Comunidade Imigrante' },
  { value: 'jovens',     label: 'Jovens' },
  { value: 'hispanico',  label: 'Hispânico (ES)' },
  { value: 'academico',  label: 'Acadêmico / Seminário' },
]
```

### `<GenerationLoading />`
Loading state para qualquer geração por IA:
```tsx
// Exibe spinner âmbar + mensagem rotativa
const messages = [
  'Consultando as Escrituras…',
  'Preparando sua mensagem…',
  'Aplicando a voz pastoral…',
  'Quase pronto…'
]
// Rotaciona a cada 3s
```

### `<CreditCost />`
Badge de custo em créditos:
```tsx
// Ex: <CreditCost cost={20} />
// Renderiza: "20 créditos" em badge âmbar suave
```

---

## FLUXO DE COORDENAÇÃO COM O ANTIGRAVITY

### Para cada feature, ANTES de implementar o componente:

**Passo 1** — Verifique com o Antigravity se a Edge Function já está deployada:
```
research-suite          → /functions/v1/research-suite
generate-illustration   → /functions/v1/generate-illustration
generate-from-template  → /functions/v1/generate-from-template
multiply-sermon         → /functions/v1/multiply-sermon
social-calendar-generator → /functions/v1/social-calendar-generator
```

**Passo 2** — Se a função não estiver deployada ainda, implemente a UI com
`isFunctionReady: false` e exiba:
```tsx
// Placeholder quando backend ainda não está pronto
<div style={{ padding: 24, textAlign: 'center', color: 'var(--lw-muted)' }}>
  ⏳ Esta feature está sendo preparada pelo backend.
  Disponível em breve.
</div>
```

**Passo 3** — Quando o Antigravity confirmar deploy, remova o placeholder
e ative a chamada real.

### Tabelas necessárias (confirmar existência antes de usar)
```sql
-- Verificar se existem:
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'sermon_templates',
  'illustrations',
  'research_cache',
  'social_calendar',
  'multiply_outputs'
);
```
Se alguma tabela não existir, usar dados mock e avisar o Antigravity.

---

## ORDEM DE IMPLEMENTAÇÃO RECOMENDADA

```
Sprint 1 (esta semana):
  1. Painel lateral (Feature 1) — maior impacto imediato, usa editor já existente
  2. Seletor de templates (Feature 2) — entry point do fluxo, 2-3h
  3. Melhorias no editor (Feature 5) — incrementais, não quebram nada

Sprint 2 (próxima semana):
  4. Painel Multiply (Feature 3) — depende de backend mais complexo
  5. Calendário Editorial (Feature 4) — feature de conteúdo independente
```

---

## CRITÉRIOS DE ACEITE — CHECKLIST

### Feature 1 — Painel Lateral
- [ ] Abre/fecha sem quebrar layout do editor
- [ ] Busca por passagem retorna síntese em PT
- [ ] Card de resultado tem botão "Arrastar para o sermão"
- [ ] Arrastar insere conteúdo no bloco correto
- [ ] Geração de ilustração retorna em < 15s
- [ ] `MindSelector` funcional nas 2 abas
- [ ] Sem créditos → `UpgradeModal` aparece

### Feature 2 — Templates Gerativos
- [ ] 6 templates exibidos corretamente
- [ ] "Começar do zero" mantém comportamento atual
- [ ] "Gerar com IA" exibe `GenerationLoading`
- [ ] Editor abre com blocos pré-preenchidos após geração
- [ ] Erro de geração → fallback para editor vazio com toast

### Feature 3 — Multiply
- [ ] Botão "Multiplicar" aparece apenas quando status = 'ready'
- [ ] Contador de créditos atualiza ao selecionar/deselecionar formatos
- [ ] Loading com progresso dura enquanto aguarda (pode ser 30-60s)
- [ ] Resultado exibe todos os outputs organizados por tipo
- [ ] "Publicar no WP" só aparece se WordPress configurado no perfil

### Feature 4 — Calendário
- [ ] Semana atual exibida corretamente
- [ ] Navegação entre semanas funciona
- [ ] "Gerar semana" popula 7 posts
- [ ] Modal de edição salva alterações
- [ ] Badge de status (rascunho/agendado/publicado) atualiza

### Feature 5 — Editor
- [ ] Contador de palavras/tempo exibido
- [ ] Hook Queue abre/fecha sem bug
- [ ] Badge de status clicável e funcional
- [ ] "Multiplicar" aparece quando status = 'pronto'

---

## ❌ NÃO FAZER NESTE SPRINT

- Não reescreva o editor de blocos existente
- Não altere o sistema de auth
- Não altere a tela de preços
- Não adicione dependências npm desnecessárias
- Não faça chamadas diretas à API da Anthropic — SEMPRE via Edge Functions
- Não calcule créditos no frontend — use sempre a RPC `consume_credits`
- Não publique direto no WordPress — sempre via Edge Function `multiply-sermon`

---

*Living Word — Prompt Lovable Sprint Killer Features v1.0 · Abril 2026*
*Coordenar com Antigravity antes de cada feature backend-dependente*
