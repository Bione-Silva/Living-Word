# REGRA DE MARCA D'ÁGUA (WATERMARK) E TIERS DE ASSINATURA

Olá Lovable! Precisamos refinar a marca d'água estática que está sendo renderizada nas imagens exportadas pelo **Estúdio Social** e nos outros artefatos. Atualmente está escrito "PALAVRA VIVA", mas precisamos globalizar a marca e atrelar isso ao plano de assinatura do usuário.

Por favor, implemente a seguinte lógica condicional na plataforma:

## 1. Alteração da Marca Institucional
*   Modifique o texto da marca d'água de "PALAVRA VIVA" para o nome em inglês: **"LIVING WORD"**.

## 2. Lógica de Cobrança / Tiers (Remoção da Marca)
A presença da marca d'água nos exports (Cursos, Imagens de Redes Sociais, Artigos em PDF, etc.) será condicionada ao plano (`subscription_tier`) do usuário que está logado.

*   **Tier 1 (Plano Básico / $9.90):** A marca d'água **"LIVING WORD" DEVE APARECER** em todos os artefatos visuais gerados (HTML-to-Image) ou exportados.
*   **Tier 2 (Plano Intermediário) em diante:** A marca d'água **NÃO DEVE APARECER**. É um privilégio dos planos superiores gerar os carrosséis, publicações e posts de forma limpa ("White-label").

## 3. Implementação Técnica Recomendada (Context/Hook)
Para fazer isso funcionar adequadamente no React:
1.  Você deve checar a sessão do usuário ou um Contexto de Assinatura (ex: `useSubscription()`) que retorne o plano atual do usuário.
2.  No componente que renderiza a arte do Estúdio Social (ou do gerador de PDFs), crie a condicional:
    ```jsx
    {userTier === 'basic' && (
       <div className="watermark opacity-30 text-xs tracking-widest uppercase">
          LIVING WORD
       </div>
    )}
    ```
3.  Simule (mock) essa diferença no seu ambiente de *Preview* colocando um botão temporário para testar a conta como "Plano Básico" e "Plano Intermediário", certificando-se de que quando clicamos em "Baixar Imagem", o `html2canvas` só captura a logo da "LIVING WORD" no plano básico.

Essa "parede de pagamento" (paywall de white-label) é fundamental para nossas regras de negócios. Implemente essa proteção nos componentes de design de artefato agora.
