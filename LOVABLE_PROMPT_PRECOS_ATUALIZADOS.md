# 🌍 Sincronização Final de Preços e Checkout (Stripe)

A nossa infraestrutura de backend (Webhook) foi 100% blindada e agora precisamos garantir que o Frontend chame o `create-checkout` corretamente com as novas varáveis e lógica de bônus.

## 1. Atualizar o `geoPricing.ts` (Coração Financeiro)

Substitua todo o conteúdo do seu array de preços (ou arquivo `geoPricing.ts`) por este código exato:

```typescript
export const PRICING_MAP = {
  BRL: {
    currency: 'BRL',
    symbol: 'R$',
    plans: {
      starter: { id: 'price_1TJg0mEaDBbHafP6EjCuGgmk', amount: 37.00 },
      pro:     { id: 'price_1TJg0oEaDBbHafP6bC747uSG', amount: 79.00 },
      igreja:  { id: 'price_1TJg0qEaDBbHafP6gyw9BqQ1', amount: 197.00 },
    },
    annual: {
      starter: { id: 'price_1TJg0nEaDBbHafP6R0XrOxCo', amount: 370.00 },
      pro:     { id: 'price_1TJg0pEaDBbHafP6ToL24iXI', amount: 790.00 },
      igreja:  { id: 'price_1TJg0rEaDBbHafP69yZFNvtc', amount: 1970.00 },
    },
    addon_topup: { id: 'price_1TJl2SEaDBbHafP6pmEHdFEq', amount: 39.90 }
  },
  USD: {
    currency: 'USD',
    symbol: '$',
    plans: {
      starter: { id: 'price_1TIbCqEaDBbHafP6AqYI1lQ3', amount: 9.90 },
      pro:     { id: 'price_1TIbCsEaDBbHafP6qOWGnzjp', amount: 29.90 },
      igreja:  { id: 'price_1TIbCtEaDBbHafP6D1krnMzA', amount: 79.90 },
    },
    annual: {
      starter: { id: 'price_1TIbCqEaDBbHafP6AqYI1lQ3', amount: 99.00 },
      pro:     { id: 'price_1TIbCsEaDBbHafP6qOWGnzjp', amount: 299.00 },
      igreja:  { id: 'price_1TIbCtEaDBbHafP6D1krnMzA', amount: 799.00 },
    },
    addon_topup: { id: 'price_1TJl2TEaDBbHafP6X6urHSkN', amount: 9.90 }
  }
};
```

## 2. Lógica do Botão de "Upgrade / Assinar" na página de Planos

O botão de Upgrade precisa chamar o `create-checkout` corretamente para criar a sessão do Stripe. Garanta que o fluxo de clique faça exatamente isso:

1. Chamar a Edge function `create-checkout-session` ao invés de `create-checkout`.
2. O corpo do Request deve enviar: `priceId`, `plan` (slug) e `interval`.
3. Passar a propriedade de `allow_promotion_codes: true` se não estiver implementado.

```typescript
const handleUpgrade = async (planKey: string, interval: 'monthly' | 'annual') => {
  setIsLoading(true);
  const region = detectRegion(); // 'BRL' ou 'USD'
  const priceId = PRICING_MAP[region][interval === 'monthly' ? 'plans' : 'annual'][planKey].id;
  
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: {
      priceId: priceId,
      plan: planKey,
      interval: interval,
      success_url: `${window.location.origin}/dashboard?upgraded=true`,
      cancel_url: `${window.location.origin}/planos`
    }
  });

  if (error) {
    toast.error("Erro ao gerar link de pagamento. Tente novamente.");
    setIsLoading(false);
    return;
  }

  if (data?.checkout_url) {
    window.location.href = data.checkout_url;
  }
};
```
