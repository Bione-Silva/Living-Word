# QA: Roteamento de Onboarding, Light Theme e Checkout

Olá Lovable! Chegou a hora de fazer uma checagem rigorosa de Qualidade (QA) no fluxo financeiro e no Onboarding do cliente. 
O cliente notou que após se cadastrar/comprar, parece haver um "desconector" (a tela não flui para o Onboarding limpo) e, dependendo do browser, a tela aparece em "Dark Mode" ou "Meio Escura". 

A Living Word é uma plataforma *Clear & Clean*. Por favor, corrija rigorosamente os seguintes pontos:

## 1. UX da Página de Cadastro e Onboarding Mestre
*   A página que hospeda o *Login/Cadastro* (Auth) e a página sequencial de *Onboarding do Cliente* devem forçar o **Light Theme absoluto**.
*   **Ação exigida:** Identifique o painel do `ThemeProvider` destas sub-rotas ou injete a classe `force-light` no `<body>` ou no wrapper principal (`<div className="bg-background text-foreground light">`) da tela de Onboarding. NADA PODE FICAR DARK. Tudo deve ser muito branco, creme ("clarinho") e nítido.

## 2. A Sequência do Funil de Pós-Cadastro
*   **O Problema Atual:** O usuário entra pela página de "Planos", clica no Botão de Comprar. Cria a conta de Autenticação e, do nada, se perde no dashboard.
*   **A Ação de Ouro:** Revise o Redirecionamento (Redirect Hook) após a Autenticação. 
    *   Se no ato do clique (lá em *Pricing.tsx*) ele indicou que quer comprar (Ex: enviou via URL State o ID do Plano), após ser cadastrado ele NÃO VAI para o dashboard inicial da aplicação! 
    *   Ele deve ser encaminhado compulsoriamente (redirect direto) para a Rota Onde o Supabase Invoca o Checkout! Ou se preferir, chame a Edge Function `create-checkout` de forma *Silent* após criar a conta e redirecione ele pro Stripe já com o ID.
    *   Garanta que a tela que exibe a "transição" para o Checkout Stripe use **cores claras e neutras** e tenha um Spinner bonito dizendo *"Preparando sua assinatura Living Word..."*.

## 3. Prevenção do erro "Checkout indisponível"
*   O erro "Checkout indisponível" acontece quando o Front-end recebe falhas da chamada ao `invoke` do backend em vez do Link da Sessão do Stripe.
*   **Ação exigida:** Certifique-se de que se o Backend do Supabase (A Edge Function `create-checkout`) cair ou demorar, a UI mostre uma tela limpa clara com:
    *(Ícone de Erro) "Ops, nossa tesouraria encontrou um contratempo. Você pode pagar na aba Ferramentas > Assinatura dentro do Painel."*
    (Isso evita que a UX quebre de forma assustadora).

Ajuste estas rotas, remova os resquícios de dark-mode da tela de Onboarding/Planos e passe o pente fino no redirect!
