

# Living Word — Full Plan Rules Implementation (Revised)

## Corrections Applied

| Item | Old (wrong) | New (correct) |
|------|-------------|---------------|
| Free credits | 500 | 150 |
| Starter credits | 1000 | 3,000 |
| Pro credits | 3000 | 10,000 |
| Igreja credits | 10000 | 30,000 |
| Free per-tool tracking | deferred | included in this scope |

---

## Implementation (10 steps)

### Step 1 — DB Migration: rename plan slugs + fix credit limits + create `free_tool_usage` table

```sql
-- Rename old plan slugs
UPDATE profiles SET plan = 'starter' WHERE plan = 'pastoral';
UPDATE profiles SET plan = 'pro' WHERE plan = 'church';
UPDATE profiles SET plan = 'igreja' WHERE plan = 'ministry';

-- Fix credit limits
UPDATE profiles SET generations_limit = 150 WHERE plan = 'free';
UPDATE profiles SET generations_limit = 3000 WHERE plan = 'starter';
UPDATE profiles SET generations_limit = 10000 WHERE plan = 'pro';
UPDATE profiles SET generations_limit = 30000 WHERE plan = 'igreja';
ALTER TABLE profiles ALTER COLUMN generations_limit SET DEFAULT 150;

-- Free per-tool monthly tracking
CREATE TABLE public.free_tool_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tool_id text NOT NULL,
  used_at timestamptz NOT NULL DEFAULT now(),
  month_key text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM'),
  UNIQUE (user_id, tool_id, month_key)
);
ALTER TABLE public.free_tool_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own usage" ON public.free_tool_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own usage" ON public.free_tool_usage FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Step 2 — Create `src/lib/plans.ts` (~220 lines)

Single source of truth:

- `PlanSlug = 'free' | 'starter' | 'pro' | 'igreja'`
- `PLAN_CREDITS = { free: 150, starter: 3000, pro: 10000, igreja: 30000 }`
- `TOOL_CREDITS` map — every tool ID → credit cost (from the spec: studio=20, biblical-study=30, blog=15, etc.)
- `PlanFeature` type + `PLAN_FEATURES` map (which plan unlocks which feature set)
- `hasAccess(userPlan, feature): boolean`
- `getMinPlanFor(feature): PlanSlug`
- `isToolLockedForPlan(toolId, userPlan): boolean`
- `getUpgradeBadge(currentPlan, requiredPlan): 'lock' | 'crown' | 'church'`
- `PLAN_PRICES` for USD monthly/annual

### Step 3 — Update `AuthContext.tsx`

- Change plan type: `'free' | 'pastoral' | 'church' | 'ministry'` → `'free' | 'starter' | 'pro' | 'igreja'`

### Step 4 — Create `src/components/UpgradeModal.tsx` (~120 lines)

Contextual modal when clicking locked tools:
- Title: "Esta ferramenta está disponível no plano [NOME]"
- Subtitle with price
- Badge: 🔒 (→Starter), 👑 (→Pro), 🏛️ (→Igreja)
- CTA → `/upgrade?feature=X&from_plan=Y`
- Secondary → `/upgrade`

### Step 5 — Update `src/layouts/AppLayout.tsx`

Major changes:
- Replace hardcoded `planCredits` map → import `PLAN_CREDITS` from `plans.ts`
- Replace `isFree` binary lock → `isToolLockedForPlan(tool.id, profile.plan)`
- All Extras tools get `locked: true` (blocked for Free)
- `illustrations` locked for Free+Starter (requires Pro)
- `youtube-blog` locked for Free+Starter (requires Pro)
- Tool click: if locked → open `UpgradeModal` (not navigate to /upgrade)
- Sidebar credits section: **hide credit numbers for Free users**, show upgrade CTA instead
- Paid plans: credit color green/yellow/red based on remaining
- Tool groups: update lock flags per spec

### Step 6 — Update `GenerationCounter.tsx` + `AccountInfoBar.tsx`

- Import `PLAN_CREDITS` from `plans.ts`
- `GenerationCounter`: return `null` for Free plan (hide credits entirely)
- `AccountInfoBar`: hide credit numbers for Free, show "Plano Free" with upgrade CTA only

### Step 7 — Update `LockedTab.tsx`

- Replace hardcoded "plano Pastoral" → use `getMinPlanFor()` to dynamically name the required plan
- Show correct badge icon per plan gap

### Step 8 — Update `src/pages/Upgrade.tsx`

- Rename `PlanKey` type: `'starter' | 'pro' | 'church'` → `'starter' | 'pro' | 'igreja'`
- Rename Church plan card to "Igreja" with slug `igreja`
- Update `geoPricing.ts` interface: rename `church` key → `igreja` in `RegionPricing.plans`
- Update Stripe price IDs accordingly in `PRICING_MAP`
- Add monthly/annual toggle (annual = 2 months free discount)
- Add BRL/USD currency toggle
- Update features lists per spec
- Update CTAs: Starter → "7 dias grátis", Pro → "Começar agora", Igreja → "Começar"
- Add feature comparison table below cards
- Highlight Pro as "Mais Popular"

### Step 9 — Create `src/pages/Pricing.tsx` + add route

Public pricing page (no auth required):
- Same plan cards as Upgrade but with public CTAs (Free → /cadastro, Starter → /upgrade?autoCheckout=starter, etc.)
- Monthly/Annual toggle, BRL/USD toggle
- Feature comparison table
- Route: `/pricing` added in `App.tsx`

### Step 10 — Update tool lock flags

- `ExtraToolsSections.tsx`: add `locked: true` to ALL 9 extra tools
- `Dashboard.tsx` `researchTools`/`createTools`: remove `locked: true` from `original-text` and `lexical` (spec says Free gets 1x/month for all research tools)
- `CoreToolsGrid.tsx`: update lock logic to use `isToolLockedForPlan()`

### Step 11 — Update DB functions

- `get_admin_saas_metrics`: rename `pastoral`→`starter`, `church`→`pro`, `ministry`→`igreja` in the SQL counts + MRR calc

---

## Files Summary

| Action | File |
|--------|------|
| Create | `src/lib/plans.ts` |
| Create | `src/components/UpgradeModal.tsx` |
| Create | `src/pages/Pricing.tsx` |
| Modify | `src/contexts/AuthContext.tsx` |
| Modify | `src/layouts/AppLayout.tsx` |
| Modify | `src/components/GenerationCounter.tsx` |
| Modify | `src/components/dashboard/AccountInfoBar.tsx` |
| Modify | `src/components/LockedTab.tsx` |
| Modify | `src/pages/Upgrade.tsx` |
| Modify | `src/utils/geoPricing.ts` |
| Modify | `src/components/ExtraToolsSections.tsx` |
| Modify | `src/pages/Dashboard.tsx` |
| Modify | `src/components/dashboard/CoreToolsGrid.tsx` |
| Modify | `src/App.tsx` |
| Migration | Rename plan slugs, fix credit limits, create `free_tool_usage` table |
| Migration | Update `get_admin_saas_metrics` function |

