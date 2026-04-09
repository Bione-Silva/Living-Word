# Instrução para o Lovable: Integração de Metadados e Loading Rico

Copie e cole o texto abaixo no chat do Lovable:

---

**Contexto:**
Nós acabamos de atualizar todas as Supabase Edge Functions do nosso motor teológico (`generate-pastoral-material`, `generate-biblical-study`, e as funções nichadas `expos-*`). Agora, essas funções não retornam apenas o markdown do estudo, mas também um objeto de metadados contendo estatísticas reais de consumo da IA.

**O que você precisa fazer:**

### 1. Consumir e Tipar o novo Objeto `generation_meta`
As funções agora retornam a seguinte estrutura no JSON:
```typescript
{
  markdown: string;
  type: string;
  generation_meta?: {
    model: string;
    total_tokens: number;
    total_cost_usd: number;
    elapsed_ms: number;
    per_format?: Record<string, any>;
  }
}
```
Atualize os tipos TypeScript no frontend para mapear o `generation_meta` nos estados de resposta do **Estudo Bíblico** (Biblical Study) e do **Estúdio Pastoral** (Pastoral Studio).

### 2. Criar um "Rodapé de Transparência" (Metadata Footer)
No final do card ou bloco onde o resultado do texto gerado é exibido, crie um rodapé minimalista e elegante (techy/glassmorphism ou badge sutil) usando Tailwind para exibir as métricas.
- O rodapé deve exibir: **Modelo** (ex: Claude 3 Opus), **Tempo** (convertendo `elapsed_ms` para segundos, ex: 12.5s), **Tokens** (ex: 3.4k tokens) e Custo (ex: $0.015).
- Use ícones lucide-react pequenos (ex: `Cpu`, `Clock`, `Coins`, `Sparkles`) para acompanhar cada dado ao lado.
- Faça o rodapé ser acinzentado (`text-muted-foreground`) e pequeno (`text-xs` ou `text-[10px]`) para não poluir a leitura do sermão.

### 3. Melhorar o "Loading State" (Rich Loading)
As funções da Anthropic e do Gemini podem demorar de 10 a 30 segundos (são gerações longas de mais de 400 palavras estruturadas).
- Substitua a simples animação de "spinner" estático no momento do Loading por um **Loading State Dinâmico**.
- Enquanto `isLoading` for `true`, mostre esqueletos (Skeleton) bonitos para simular o texto nascendo e uma frase que alterna a cada 3 segundos, ex:
  - "Iniciando motor teológico E.X.P.O.S."
  - "Pesquisando referências bíblicas e contexto original."
  - "Aplicando hermenêutica pastoral."
  - "Processando homilética e gerando o esboço final."
- Se passar de 15 segundos no loading, mostre uma dica sutil embaixo: *"Estudos profundos requerem mais parâmetros da IA. Isso pode levar até 40s."*

Por favor, garanta que essa UI premium transpareça o valor do software para o usuário. Implemente essas mudanças com as melhores práticas de React, atualizando a interface tanto na rota do **Estúdio Pastoral** quanto no **Estudo Bíblico**.
