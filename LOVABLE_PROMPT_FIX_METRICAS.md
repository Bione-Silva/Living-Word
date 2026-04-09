# 🚨 Correção Urgente: Vazamento de Métricas (Custo e Tokens)

Copie o texto abaixo e envie imediatamente para o Lovable ocultar o painel de métricas que está aparecendo para os clientes.

---

**Cole isso no Lovable:**
> "Lovable, URGENTE: No componente de visualização final do Estudo/Sermão (logo abaixo da pergunta 'O que achou deste material?'), está aparecendo uma barra de metadados da geração contendo o modelo da IA, quantidade de tokens, tempo de geração e o **CUSTO em dólares ($)** (ex: `gemini-3-flash | 3.229 tokens | $0.0012`).
> 
> **Ação Imediata:** 
> 1. Remova TOTALMENTE essa barra de métricas da interface do usuário final (cliente). Os clientes NUNCA devem ver os nossos custos de API ou detalhes de processamento de tokens.
> 2. Se essa barra for componente de Debug, certifique-se de que ela só seja renderizada se o usuário logado tiver uma flag de `role === 'admin'` ou `isDevMode`, ou simplesmente a exclua/oculte (display: none) da interface."
