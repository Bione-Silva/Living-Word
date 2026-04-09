# ATUALIZAÇÃO DE INTERFACE DA GERAÇÃO DE ESTUDOS (EBS-EXPÓS V1.0) E BLOG

Olá Lovable! Nós acabamos de fazer um "refactor" massivo e estrutural no backend (Supabase Edge Functions) que serve a plataforma Living Word, substituindo os antigos JSONs espalhados por uma arquitetura teológica rigorosa chamada "E.X.P.O.S."

Sua missão agora é adaptar o nosso Front-end (UI/UX) para ler e apresentar lindamente essa nova super-estrutura de JSON, substituindo a antiga.

## 1. Nova Tipagem (Interface) do Retorno
O payload que a edge function `generate-biblical-study` enviará dentro do nó \`study\` agora terá essa estrutura precisa:

```typescript
interface BiblicalStudyOutput {
  metadata: {
    versao_template: '1.0'
    tipo_uso: string
    duracao_estimada_min?: number
    criado_em: string
  }
  ancora_espiritual: { oracao_abertura?: string }
  passagem: {
    referencia: string
    texto: string
    versao: string
    genero: string
  }
  contexto: {
    historico: string
    literario: string
    canonico?: string
  }
  observacao: {
    perguntas_5wh: Array<{ pergunta: string; resposta: string }>
    palavras_chave: Array<{ palavra: string; explicacao: string }>
    elementos_notaveis?: string
  }
  interpretacao: {
    estudo_palavras?: Array<{ palavra: string; original?: string; significado: string }>
    cruzamento_escrituras?: string[]
    logica_interna?: string
    significado_original: string
  }
  verdade_central: {
    frase_central: string
    proposicao_expandida?: string
  }
  conexao_cristologica?: {
    como_aponta_para_cristo: string
    tipo_conexao: string
  }
  aplicacao: {
    crer: string
    mudar: string
    agir: string
    reflexao_pessoal?: string
  }
  perguntas_discussao: {
    observacao: string[]
    interpretacao: string[]
    aplicacao: string[]
    bonus?: string
  }
  encerramento: {
    oracao_sugerida: string
    instrucao_lider?: string
  }
  notas_lider?: {
    como_introduzir?: string
    pontos_atencao?: string[]
    erros_comuns?: string[]
    recursos_adicionais?: string[]
  }
  caution_mode?: boolean
  sensitive_topic_detected?: string | null
  rag_sources_used?: string[]
}
```

## 2. Requisitos de UI / Design para o Front-end
Para acomodar bem essa quantidade gigantesca de dados (que formam um estudo completíssimo), o frontend deve:

1. **Apresentação em Seções (Ou Accordions):** Considere segmentar o estudo lido na página usando Títulos grandes ou blocos expansíveis/colapsáveis (`Accordions` do shadcn) para não sobrecarregar o leitor.
2. **Destaque Visual para a VERDADE CENTRAL:** A chave `verdade_central.frase_central` deve ser apresentada em um Card ou Blockquote com forte realce, fonte maior e estilização "Premium". Ela é o coração do estudo homilético.
3. **Área Exclusiva para o Líder:** A seção `notas_lider` deve parecer um "bastidor". Talvez um contorno mais discreto ou com um header tipo "📝 Dicas para o Líder da Célula".
4. **Listas Bonitas:** `perguntas_discussao` possuem arrays para (Observação, Interpretação, Aplicação). Elas devem ser dispostas como listas (ul/li) bonitas com pequenos badges textuais ajudando a organizá-las sequencialmente.

## 3. Blog Generator (Imagens)
Apenas como nota para o UI, o `generate-blog-article` não sofreu alteração estrutural no JSON, porém *agora vai renderizar dinamicamente de 3 a 5 placeholders de imagem ([IMAGE_PROMPT: ...])* baseando-se no tamanho do artigo gerado (>400 palavras geram 3, e >500 geram 5).

Por favor, atualize todos os componentes de leitura/apresentação de Estudo Bíblico na interface React para refletirem essa nova modelagem sem causar erros e quebrando o layout antigo. Mantenha os avisos do \`caution_mode\` bem visíveis, como antes.
