

# BRL Pricing Patch + free_tool_usage Tracking

## 1. `src/utils/geoPricing.ts` — Fix BRL prices

Update BRL region block (lines 20-29):
- starter: amount `19.00` → `37.00`, id → `'price_starter_brl_monthly'`
- pro: amount `49.00` → `79.00`, id → `'price_pro_brl_monthly'`
- igreja: amount `97.00` → `197.00`, id → `'price_igreja_brl_monthly'`
- addon: amount `9.00` → `19.00`, id → `'price_addon_brl'`

Note: Stripe price IDs are placeholders until real BRL products are created in Stripe Dashboard.

## 2. `src/lib/plans.ts` — Add `PLAN_PRICES_BRL`

After the existing `PLAN_PRICES` block (line 186), add:

```typescript
export const PLAN_PRICES_BRL = {
  monthly: { starter: 37.00, pro: 79.00, igreja: 197.00 },
  annual: { starter: 308.00, pro: 660.00, igreja: 1640.00 },
  annualSavings: { starter: 136.00, pro: 158.00, igreja: 394.00 },
} as const;
```

## 3. `src/pages/Upgrade.tsx` — BRL-aware price display

Update `getDisplayPrice` (lines 195-207) to use `PLAN_PRICES_BRL` when `pricing.currency === 'BRL'`:

```typescript
const getDisplayPrice = (plan: PlanData) => {
  if (plan.isFree) return `${pricing.symbol}0`;
  if (!plan.planKey) return '';
  const isBRL = pricing.currency === 'BRL';

  if (plan.planKey === 'igreja') {
    const addonAmt = isBRL ? 19.00 : pricing.addon.amount;
    let base: number;
    if (isBRL) {
      base = isAnnual ? PLAN_PRICES_BRL.annual.igreja / 12 : PLAN_PRICES_BRL.monthly.igreja;
      base += extraSeats * addonAmt;
    } else {
      base = isAnnual ? igrejaTotal * 10 / 12 : igrejaTotal;
    }
    return formatPrice(base, pricing.symbol, pricing.currency);
  }

  const amount = isBRL
    ? isAnnual ? PLAN_PRICES_BRL.annual[plan.planKey] / 12 : PLAN_PRICES_BRL.monthly[plan.planKey]
    : isAnnual ? pricing.plans[plan.planKey].amount * 10 / 12 : pricing.plans[plan.planKey].amount;
  return formatPrice(amount, pricing.symbol, pricing.currency);
};
```

Also update the Igreja slider addon display (line 307) — replace `pricing.addon.amount` with:
```typescript
const addonAmount = pricing.currency === 'BRL' ? 19.00 : pricing.addon.amount;
```
Use `addonAmount` in the slider text lines.

Import `PLAN_PRICES_BRL` from `@/lib/plans`.

## 4. `src/pages/Pricing.tsx` — BRL note

Add a note below the billing toggle (after line 92):

```tsx
<p className="text-xs text-muted-foreground text-center mt-2">
  {lang === 'PT' && 'Preços em R$ disponíveis no checkout para usuários do Brasil.'}
  {lang === 'EN' && 'BRL pricing available at checkout for Brazil users.'}
  {lang === 'ES' && 'Precios en R$ disponibles en el pago para usuarios de Brasil.'}
</p>
```

## 5. `supabase/functions/ai-tool/index.ts` — free_tool_usage tracking

This is the main change. The edge function needs to:
1. Accept an optional `toolId` parameter from the request body
2. Extract user from JWT auth header
3. If user's plan is `'free'` and `toolId` is provided: check `free_tool_usage` for existing entry this month. If found, return 403 `already_used_this_month`.
4. After successful AI generation, INSERT into `free_tool_usage`.

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Inside the handler, after parsing body:
const { systemPrompt, userPrompt, toolId } = await req.json();

// Create supabase admin client
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Get user from auth header
const authHeader = req.headers.get("authorization") || "";
const token = authHeader.replace("Bearer ", "");
const { data: { user } } = await supabaseAdmin.auth.getUser(token);
const userId = user?.id;

// Check free plan usage if toolId provided
if (userId && toolId) {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .single();

  if (profile?.plan === "free") {
    const monthKey = new Date().toISOString().slice(0, 7);
    const { data: existing } = await supabaseAdmin
      .from("free_tool_usage")
      .select("id")
      .eq("user_id", userId)
      .eq("tool_id", toolId)
      .eq("month_key", monthKey)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ error: "already_used_this_month" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }
}

// ... existing AI generation code ...

// AFTER successful generation, record usage for free users
if (userId && toolId) {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .single();

  if (profile?.plan === "free") {
    const monthKey = new Date().toISOString().slice(0, 7);
    await supabaseAdmin.from("free_tool_usage").insert({
      user_id: userId,
      tool_id: toolId,
      month_key: monthKey,
    });
  }
}
```

Key rule: INSERT happens **after** successful generation only. If AI fails, the user doesn't lose their monthly use.

## 6. Frontend callers — pass `toolId`

Update `ToolModal.tsx` (line 148-153) and `ToolSheet.tsx` (line 247-252) to include `toolId` in the `ai-tool` invocation body:

```typescript
const { data, error } = await supabase.functions.invoke('ai-tool', {
  body: {
    systemPrompt: config.systemPrompt(genLangLabel),
    userPrompt: input,
    toolId,  // ← add this
  },
});
```

## 7. Manual action required (Stripe)

After implementation, you'll need to create BRL products in the Stripe Dashboard and replace the placeholder price IDs (`price_starter_brl_monthly`, etc.) in `geoPricing.ts` with the real Stripe-generated IDs.

## Files Summary

| Action | File |
|--------|------|
| Modify | `src/utils/geoPricing.ts` |
| Modify | `src/lib/plans.ts` |
| Modify | `src/pages/Upgrade.tsx` |
| Modify | `src/pages/Pricing.tsx` |
| Modify | `supabase/functions/ai-tool/index.ts` |
| Modify | `src/components/ToolModal.tsx` |
| Modify | `src/components/ToolSheet.tsx` |

