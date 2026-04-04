# LOVABLE PROMPT — Estudo Teológico: UI Completa
# Living Word — Frontend Spec v1.0
# Usar este prompt diretamente no Lovable AI Editor

---

## CONTEXTO

Estamos implementando o módulo **Estudo Bíblico** (mode = `biblical_study`) na plataforma Living Word.

O backend já está implementado: a Edge Function `generate-biblical-study` retorna um **objeto JSON estruturado** com schema_version `"1.0"`.

**REGRA ABSOLUTA**: O frontend NUNCA deve tentar parsear texto livre para exibir o estudo.
Ele APENAS deve renderizar o JSON recebido, campo a campo, tab a tab.

---

## INTERFACE A CRIAR

### Rota: `/estudos/novo`

Criar uma nova page chamada `EstudoBiblicoPage` com layout de **duas colunas**:

- **Coluna esquerda (sidebar ~380px)**: Formulário de configuração
- **Coluna direita (main)**: Área de resultado em tabs

---

## COLUNA ESQUERDA — Formulário de Geração

Criar um `Card` com título "Configurar Estudo" e os seguintes campos:

```
1. bible_passage (required)
   Label: "Passagem Bíblica"
   Placeholder: "Ex: João 3:16 ou Romanos 8:1-11"
   Type: Input text

2. theme (optional)
   Label: "Tema ou Foco (opcional)"
   Placeholder: "Ex: graça, fé, cura, salvação"
   Type: Input text

3. doctrine_line (Select)
   Label: "Linha Doutrinária"
   Opções:
   - evangelical_general → "Evangélico Geral"
   - reformed → "Reformada / Calvinista"
   - pentecostal → "Pentecostal / Carismática"
   - baptist → "Batista"
   - methodist → "Metodista"
   - catholic → "Católica"
   - lutheran → "Luterana"
   - interdenominational → "Interdenominacional"

4. pastoral_voice (Select)
   Label: "Tom Pastoral"
   Opções:
   - welcoming → "Acolhedor"
   - prophetic → "Profético"
   - didactic → "Didático"
   - evangelistic → "Evangelístico"
   - contemplative → "Contemplativo"

5. bible_version (Select)
   Label: "Versão Bíblica"
   Opções: ARA, NVI, NAA, KJV, ESV, NKJV, NIV, ARC

6. depth_level (RadioGroup ou Select)
   Label: "Profundidade"
   Opções:
   - basic → "Básico (grupos, células, iniciantes)"
   - intermediate → "Intermediário (líderes, professores)"
   - advanced → "Avançado (pastores, teólogos)"

7. language (Select)
   Label: "Idioma do Estudo"
   Opções: PT, EN, ES
```

**Botão Principal**:
```
Label: "Gerar Estudo Bíblico"
Icon: BookOpen
Estado de loading: "Gerando estudo teológico..." (loading spinner)
Variante: default (cor primária da plataforma)
Full width
```

---

## CAUTION MODE BANNER

Se o JSON retornado tiver `caution_mode: true`, exibir um banner FIXO no topo da área de resultado:

```
Alert variant="warning"
Icon: ⚠️ ShieldAlert
Título: "Tópico Pastoral Sensível Detectado"
Texto: "Este estudo aborda um tema delicado: '{sensitive_topic_detected}'. O conteúdo foi gerado com linguagem cuidadosa e acolhedora. Sempre consulte um pastor ou conselheiro cristão qualificado ao usar este material."
```

---

## COLUNA DIREITA — Resultado em Tabs

### Estado inicial (antes de gerar)
Exibir um estado vazio com:
- Ícone BookOpen centralizado
- Texto: "Configure os parâmetros e gere seu estudo teológico"
- Cor: muted/secondary

### Após geração bem-sucedida

Exibir as seguintes tabs em ordem:

```
Tab 1: "Resumo"
Tab 2: "Contexto"
Tab 3: "Exegese"
Tab 4: "Teologia"
Tab 5: "Aplicação"
Tab 6: "Perguntas"
Tab 7: "Conclusão"
Tab 8: "Avisos"
```

---

### Tab 1 — Resumo

Renderizar:
- **Título**: `study.title` (h1, grande, bold)
- **Passagem**: `study.bible_passage` (badge/tag azul)
- **Ideia Central**: `study.central_idea` (citação destacada, border-left, italic)
- **Resumo**: `study.summary` (texto com boa legibilidade, prose)
- **Metadados em linha**: `depth_level` + `doctrine_line` + `language` (chips/badges secundários)

---

### Tab 2 — Contexto

Renderizar dois sub-cards:

**Card 1: Contexto Histórico**
- Texto: `study.historical_context.text`
- Badge de confiança: `study.historical_context.source_confidence`
  - high → Badge verde "Alta Confiança"
  - medium → Badge amarelo "Confiança Média"
  - low → Badge laranja "Fonte Incerta"

**Card 2: Contexto Literário**
- Gênero: `study.literary_context.genre` (badge)
- Posição no livro: `study.literary_context.position_in_book`
- Badge de confiança: mesma lógica acima

**Card 3: Estrutura do Texto**
- Renderizar `study.text_structure` como tabela com 3 colunas:
  - Seção | Versículos | Descrição

**Card 4: Texto Bíblico Base**
- Renderizar `study.bible_text` como bloco de citação bíblica por elemento
- Cada item: referência em bold + texto em itálico + versão em badge smaller

---

### Tab 3 — Exegese

Para cada item em `study.exegesis`, renderizar um Accordion collapsible:

```
Accordion trigger: study.exegesis[n].focus (negrito)
Accordion content:
  - Seção "Nota Linguística": study.exegesis[n].linguistic_note (se não vazio)
  - Seção "Contribuição Teológica": study.exegesis[n].theological_insight
  - Badge de confiança: study.exegesis[n].source_confidence
```

---

### Tab 4 — Teologia

**Interpretações Teológicas**

Para cada item em `study.theological_interpretation`:
- Card individual com:
  - Perspectiva (h3 + badge se `is_debated: true` → Badge amarelo "Interpretação Debatida")
  - Texto da interpretação
  - Fontes (se existirem): lista de chips em muted
  - Badge de confiança

**Conexões Bíblicas**

Table com 3 colunas:
- Passagem | Tipo de Relação | Nota
- `relationship` deve ser traduzido:
  - typology → "Tipologia"
  - fulfillment → "Cumprimento"
  - parallel → "Paralelo"
  - contrast → "Contraste"
  - echo → "Eco"

---

### Tab 5 — Aplicação

Para cada item em `study.application`, renderizar um Card com:
- Badge do contexto: `application[n].context`
- Texto da aplicação: `application[n].application`
- Seção destacada "Ação Prática" com ícone ✅ + `application[n].practical_action`

---

### Tab 6 — Perguntas

Renderizar `study.reflection_questions` como lista numerada:
- Cada item: número + pergunta em negrito
- Se tiver `target_audience`, exibir como badge muted ao lado

---

### Tab 7 — Conclusão

Renderizar `study.conclusion` como bloco de texto pastoral, com bom espaçamento e tipografia grande.

---

### Tab 8 — Avisos

Renderizar um Alert com variante "info":
- Ícone: Info
- Texto: `study.pastoral_warning` (texto completo, sem truncar)

Se `rag_sources_used` tiver itens, exibir abaixo:
- Título: "Fontes históricas utilizadas (RAG):"
- Lista de chips com os nomes dos comentaristas

---

## BOTÕES DE AÇÃO (header do resultado)

Quando o estudo estiver carregado, exibir um grupo de botões no topo direito:

```
1. Botão: "Exportar PDF"
   Icon: FileDown
   Ação: Gerar PDF a partir dos dados JSON (não captura de tela)
   Nota: Usar html2pdf ou jsPDF consumindo os campos da BiblicalStudyOutput

2. Botão: "Exportar DOCX"
   Icon: FileText
   Ação: Gerar DOCX a partir dos dados JSON

3. Dropdown "Transformar em..."
   Opções:
   - "Transformar em Sermão" → chama generate-pastoral-material com mode=pastoral
   - "Transformar em Devocional" → chama generate-pastoral-material com mode=devotional
   - "Transformar em Aula" → chama generate-pastoral-material com mode=pastoral (didactic voice)
   - "Transformar em Post" → chama generate-blog-article
```

---

## CHAMADA À EDGE FUNCTION

```typescript
// Hook: useGenerateBiblicalStudy
const res = await supabase.functions.invoke('generate-biblical-study', {
  body: {
    bible_passage: formData.bible_passage,
    theme: formData.theme,
    language: formData.language,
    bible_version: formData.bible_version,
    doctrine_line: formData.doctrine_line,
    pastoral_voice: formData.pastoral_voice,
    depth_level: formData.depth_level,
  },
})

// res.data conterá:
// {
//   success: true,
//   material_id: string,
//   caution_mode: boolean,
//   sensitive_topic_detected: string | null,
//   study: BiblicalStudyOutput
// }
```

Tratar os seguintes erros:
- `generation_limit_reached` → Toast warning "Você atingiu o limite do seu plano"
- `schema_validation_failed` → Toast error "Erro na geração. Tente novamente."
- Erro genérico → Toast error "Erro inesperado. Contate o suporte."

---

## CHECKLIST DE QUALIDADE (obrigatório antes de submeter)

Antes de gerar o código, confirmar:
- [ ] Nunca renderiza texto livre — sempre usa campos do JSON
- [ ] Caution Mode Banner aparece quando `caution_mode === true`
- [ ] source_confidence aparece em todos os campos que têm esse campo
- [ ] is_debated exibe badge "Interpretação Debatida" em amarelo
- [ ] Exportação usa os dados JSON — não screenshot/HTML
- [ ] Estado de loading fecha ANTES de exibir resultado
- [ ] Accordion de exegese começa fechado
- [ ] Tab inicial ativa: "Resumo"

---

## PADRÃO VISUAL

- Seguir o design system existente da Living Word (cores, tipografia, cards, badges)
- NÃO criar novos tokens de cor
- Usar `prose` classes do Tailwind Typography para blocos de texto longo
- Cards com `border`, `rounded-lg`, `shadow-sm`
- Tabs usando o componente Tabs do shadcn/ui
- Accordion usando o componente Accordion do shadcn/ui
