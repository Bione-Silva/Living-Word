# 🚨 Correção da Bússola de Planos (Frontend x Backend)

Copie o texto abaixo e envie para o Lovable corrigir a barra lateral e os textos fixos que estão mentindo pro usuário.

---

**Cole isso no Lovable:**
> "Lovable, existe uma desconexão crítica entre o Frontend (UI) e a nossa arquitetura real de Backend (Edge Functions) sobre os Limites dos Planos.
> 
> No Frontend (ex: Página do Blog e Barra lateral do Dashboard), vocês deixaram HARDCODED os textos 'Plano Free: 1 artigo por mês' e uma barra de uso falsificada (ex: '1 de 5 - 20%'). É por isso que conseguiu-se gerar 2 artigos: o backend não bloqueou, porque ele trabalha com **Créditos**.
> 
> A nossa regra de ouro estruturada no backend (`credits.ts`) é: **Plano Free tem 500 créditos. Gerar 1 blog ('post') consome 5 créditos.** Ou seja, a pessoa pode gerar muitos artigos!
> 
> **Ação Imediata para Resolver a Amarração:**
> 1. Procure no Layout do Frontend (Barra lateral e Card da página Content/Blog) pelas frases hardcoded de limitação de itens ou contagem baseada em "5" e delete-as.
> 2. Substitua a mecânica da barra lateral ('USO DO MÊS'): ela deve puxar os **Créditos** reais do usuário na tabela `users` (campo `credits_balance`). Se a conta for Free, a barra total é baseada em 500. Mostre o consumo baseado nos créditos gastos, não no número de arquivos.
> 3. No banner inferior do Blog, não trave a pessoa dizendo '1 artigo'. Mude o texto para promover o upgrade para ter 'Geração Ilimitada e Modelos GPT-4o' (já que no backend, se o limite de créditos estourar, o bloqueio natural acontecerá exibindo um Upgrade CTA).
> 
> Amarre a UI à tabela `users.credits_balance`, esta é a fonte da verdade!"
