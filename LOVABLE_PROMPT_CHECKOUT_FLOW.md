# Roteamento Inteligente do Fluxo de Compras (SaaS Flow)

## Contexto e Regra de Ouro (SaaS Architecture)
Atualmente, o clique na Landing Page manda o usuário para "Criar Conta" (Cadastro). **ISTO ESTÁ 100% CORRETO!** 
O sistema *precisa* que o usuário se cadastre para registrar a assinatura Stripe na tabela `users` do nosso banco de dados. Nunca abrimos um Stripe Checkout para um "visitante fantasma".

**O Problema Atual:** O usuário entra na Landing Page, clica no plano, faz o cadastro e *o fluxo morre ali*. Ele é jogado no dashboard e esquece de pagar. O fluxo correto é "Fricção Zero":
Ao terminar o cadastro, o sistema deve lembrar o plano escolhido e **redirecioná-lo automaticamente ao Checkout do Stripe**.

Crie este fluxo nas 3 páginas envolvidas seguindo as regras abaixo:

## 1. Landing Page (`Landing.tsx`)
Quando o usuário (visitante não autenticado) clicar no botão do plano na Pricing Section:
- Altere a propriedade `onClick` de roteamento (ou o `<Link>`) do plano escolhido para encapsular o id do plano na Rota.
- Exemplo: 
  Se ele clicou no plano "Pro", envie para `/cadastro?plan=pro`.
  Se ele clicar em "Igreja", envie para `/cadastro?plan=church`.

## 2. Autenticação (`Cadastro.tsx` / `Login.tsx`)
- Capture o parâmetro `plan` usando `new URLSearchParams(window.location.search).get('plan')`.
- Após o cadastro/login bem sucedido, o redirect normal enviaria o usuário para `/dashboard`. Altere isso:
  Se o parâmetro `plan` existir na rota, redirecione o usuário para: `/upgrade?autoCheckout=${plan}`.
  Se não existir, jogue pro `/dashboard`.

## 3. Página de Planos Interna (`Upgrade.tsx`)
- Use o hook do React Router para detectar a URL atual ou os `searchParams`.
- Implemente um `useEffect` ao carregar a página:
  Se a URL contiver `?autoCheckout=pro`, encontre o plano correspodente na lista de `plans` e chame imediatamente a sua função `handleSubscribe(plan)` (ou a função equivalente local que se comunica com o Supabase edge-function), invocando o pagamento em auto-pilot.
  Não se esqueça de usar um controle (como um estado booleano) para impedir que a function dispare duas vezes no ciclo de vida do React (useRef / StrictMode prevention).

---
> **Resumo do Fluxo Esperado:**
> Landing Page (Clica Checkout Pro) -> Redirecionado para `/cadastro?plan=pro` -> Usuário cria conta e loga -> Redirecionado para `/upgrade?autoCheckout=pro` -> Gatilho automático chama a Edge Function Edge -> Câmera corta para a URL do Stripe rodando lindamente!
