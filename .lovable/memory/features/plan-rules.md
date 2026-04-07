---
name: Credit Wallet model
description: Plan credits (500/4k/8k/20k), top-up add-on, pricing tooltips, usage report, sidebar credit counter
type: feature
---

## Credit Wallet Model
Users have a credit wallet. They spend credits freely across any tool — no per-tool monthly limits.

## Plan Slugs & Credits
- free: 500 credits/mês
- starter: 4,000 credits/mês
- pro: 8,000 credits/mês
- igreja: 20,000 credits/mês

## Central Config
`src/lib/plans.ts` — single source of truth for: PlanSlug, PLAN_CREDITS, TOOL_CREDITS, PLAN_PRICES_BRL, PLAN_GENERATION_POTENTIAL, TOPUP_CREDITS, LOW_CREDITS_THRESHOLD, hasAccess(), isToolLockedForPlan(), getMinPlanForTool()

## DB
- `profiles.plan` CHECK constraint: free | starter | pro | igreja
- `generation_logs` — usage tracking for extrato/statement
- Edge function `ai-tool` enforces credit deduction

## UI Rules
- ALL plans: Show green credit counter 🟢 in sidebar (always visible)
- Color coding: green >500, yellow 100-500, red <100
- Tooltips on pricing cards show generation potential (titles/outlines/sermons/studies)
- Usage Report (extrato bancário) in Settings > Plan tab and /upgrade page
- Locked tool badges: 🔒 (→Starter), 👑 (→Pro), 🏛️ (→Igreja)
- UpgradeModal: contextual modal when clicking locked tools

## Top-Up Add-on
- +4,000 créditos avulso (one-time, no subscription)
- Price: $7.00 (USD) / R$27,00 (BRL)
- Show when credits < 200 (LOW_CREDITS_THRESHOLD)

## Pricing
- BRL: Starter R$37, Pro R$79, Igreja R$197, addon R$19/seat
- USD: Starter $9.90, Pro $29.90, Igreja $79.90, addon $5.90/seat
- Annual = 10 months (2 free)
- `src/utils/geoPricing.ts` uses `igreja` key (not `church`)
- Stripe price IDs mapped per region (BRL/USD/LATAM/TEST)
