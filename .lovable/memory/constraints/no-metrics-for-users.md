---
name: No metrics for end users
description: Generation metrics (model, tokens, cost) must only be shown to admin users, never to regular users
type: constraint
---
The `GenerationMetaFooter` component (model name, token count, generation time, cost in USD) must NEVER be visible to end users. It checks `is_admin()` via RPC and returns `null` for non-admins. **Why:** Exposing API costs and token details to customers is a business risk and confusing UX. Only admin users should see this debug information.
