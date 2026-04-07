---
name: Plan Rules
description: Plan slugs (free/starter/pro/igreja), credit limits, feature gating, tool locking, UI badge rules
type: feature
---

## Plan Slugs & Credits
- free: 150 credits/mês, 1x/mês per tool
- starter: 3,000 credits/mês
- pro: 10,000 credits/mês
- igreja: 30,000 credits/mês

## Central Config
`src/lib/plans.ts` — single source of truth for: PlanSlug, PLAN_CREDITS, TOOL_CREDITS, hasAccess(), isToolLockedForPlan(), getMinPlanForTool()

## DB
- `profiles.plan` CHECK constraint: free | starter | pro | igreja
- `free_tool_usage` table: tracks 1x/month per tool for free users (user_id, tool_id, month_key UNIQUE)

## UI Rules
- Free: NEVER show credit numbers. Show upgrade CTA instead.
- Paid: Show remaining credits with color (green >500, yellow 100-500, red <100)
- Locked tool badges: 🔒 (→Starter), 👑 (→Pro), 🏛️ (→Igreja)
- UpgradeModal component: contextual modal when clicking locked tools

## geoPricing
- `src/utils/geoPricing.ts` uses `igreja` key (not `church`)
- Stripe price IDs mapped per region (BRL/USD/LATAM/TEST)
