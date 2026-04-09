# 🌍 Living Word: Integração de Geo-Pricing & Anti-Fraude no Checkout

A infraestrutura de cobrança no backend foi completamente refatorada para suportar cobrança global nativa (BRL, USD, LATAM) com bloqueio de arbitragem e fraude (geo-blocking no Stripe).

Sua missão agora é **remover qualquer link fixo do Stripe antigo** (buy.stripe.com/...) da página de planos (`/planos` ou `Pricing.tsx`) e passar a usar a orquestração segura via Supabase Edge Functions.

## 1. Identificação da Região (Geo-Tz)
Crie um utilitário (ex: `src/utils/geoPricing.ts`) que determine a região com base no fuso horário do navegador (Intl) ou via API (ex: ipapi).
- **Regras:**
  - Brasil (`pt-BR`, `America/Sao_Paulo`) -> **Região `BRL`**
  - América Latina (`es-AR`, etc) -> **Região `LATAM`**
  - Resto do mundo/EUA -> **Região `USD`**

## 2. Dicionário de Preços (Source of Truth)
Implemente e importe esta constante exata com os IDs de preço de Produção:

export const PRICING_MAP = {
  BRL: {
    currency: 'BRL',
    symbol: 'R$',
    plans: {
      starter: { id: 'price_1TIbCqEaDBbHafP6rVx4M0iq', amount: 19.00 },
      pro: { id: 'price_1TIbCsEaDBbHafP6jMjpjCWF', amount: 49.00 },
      church: { id: 'price_1TIbCtEaDBbHafP6dIYl8Fjg', amount: 97.00 },
    },
    addon: { id: 'price_1TIbCuEaDBbHafP6fQWCkE7l', amount: 9.00 } // Assento extra Igreja
  },
  USD: {
    currency: 'USD',
    symbol: '$',
    plans: {
      starter: { id: 'price_1TIbCqEaDBbHafP6AqYI1lQ3', amount: 9.90 },
      pro: { id: 'price_1TIbCsEaDBbHafP6qOWGnzjp', amount: 29.90 },
      church: { id: 'price_1TIbCtEaDBbHafP6D1krnMzA', amount: 79.90 },
    },
    addon: { id: 'price_1TIbCuEaDBbHafP6FhfTaKnh', amount: 5.90 } // Assento extra Igreja
  },
  LATAM: {
    currency: 'USD',
    symbol: '$',
    plans: {
      starter: { id: 'price_1TIbCrEaDBbHafP6gO6Z5UPt', amount: 5.90 },
      pro: { id: 'price_1TIbCsEaDBbHafP6kY9apvOc', amount: 19.00 },
      church: { id: 'price_1TIbCtEaDBbHafP6Rh4uTD5Q', amount: 49.00 },
    },
    addon: { id: 'price_1TIbCvEaDBbHafP6DM4entar', amount: 3.90 } // Assento extra Igreja
  },
  TEST: { // Oculto: Apenas Devs/Parceiros VIP
    currency: 'USD',
    symbol: '$',
    plans: {
      starter: { id: 'price_1TIbCrEaDBbHafP6dRTQO3m2', amount: 1.00 },
      pro: { id: 'price_1TIbCsEaDBbHafP6ximO1Myd', amount: 1.00 },
      church: { id: 'price_1TIbCuEaDBbHafP6RlbFZvJH', amount: 1.00 },
    },
    addon: { id: 'price_1TIbCvEaDBbHafP6WaieVawh', amount: 1.00 } // Assento extra Igreja
  }
};

## 3. UI da Página de Pricing
- Utilize a região detectada para exibir nativamente a moeda e o valor correto (ex: R$ 49,00 no BR, $ 29.90 se EUA).
- **Customização do Plano Igreja:**
  - O Plano Igreja deve ter um Controle Deslizante (Slider) ou input numérico de **Membros da Equipe**.
  - Quantidade inicial = 0 extras.
  - A cada membro extra adicionado no UI, some o valor do `addon` correspondente à região atual no total do plano.

## 4. Disparo do Checkout via Supabase Edge Function
Ao clicar em "Assinar", você chamará a edge function genérica `create-checkout` e aguardará o URL retornado por ela (exibindo Loading State).

A Edge Function exige os seguintes parâmetros no Body (JSON):
- priceId: string (ID do plano base da região).
- successUrl: string.
- cancelUrl: string.
- extraSeats: number (apenas para o plano Igreja. Se for 0, não envie ou envie 0).
- stripeAddonPriceId: string (se extraSeats > 0, você DEVE enviar o ID do addon da mesma região selecionada. Opcional).

### Exemplo de Chamada:

const { data, error } = await supabase.functions.invoke('create-checkout', {
  body: {
    priceId: PRICING_MAP[userRegion].plans.church.id,
    extraSeats: 3,
    stripeAddonPriceId: PRICING_MAP[userRegion].addon.id,
    successUrl: `${window.location.origin}/dashboard?checkout_success=true`,
    cancelUrl: `${window.location.origin}/planos`
  }
});

if (data?.url) {
  window.location.href = data.url; // Redireciona para o checkout gerado com Anti-Fraud Billing
}

## Requisitos de UX e Segurança
1. A seleção da moeda é invisível. O usuário não escolhe "Pagar em BRL". O sistema impõe baseado no navegador/IP e o frontend renderiza.
2. Não armazene variáveis de Geo temporárias que possam ser interceptadas via ferramenta de DevTools para compra fraudulenta ("compra de preço barato via VPN", pois o backend agora exige o `billing_address` na ponta do Stripe validando o país real do Cartão de Crédito com o Checkout gerado).
3. Demonstre visualmente os "benefícios atrelados a assentos": Ao deslizar o cursor para adicionar um usuário no Plano Igreja, mostre que o Sistema libera "+10% de créditos (Sermões/Estudos)" proporcionalmente.
