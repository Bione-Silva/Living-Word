# Project Memory

## Core
Living Word: SaaS trilíngue (PT/EN/ES) para pastores. Supabase externo ID: priumwdestycikzfcysg.
Design híbrido: dark landing (gold #D4A853) + warm app (parchment #F5F0E8, café #6B4F3A).
Fonts: Cormorant Garamond display, DM Sans body, JetBrains Mono mono.
Edge functions: generate-pastoral-material, generate-blog-article, fetch-bible-verse.
Conversão: 7 gatilhos, nunca bloquear geração, 1 modal/sessão, tom pastoral.
Free: 5 gerações/mês, 3 formatos, 1 blog article, watermark. Trial 7d sem cartão.

## Memories
- [Design System](mem://design/system) — Full palette, typography, glass-card utilities
- [DB Schema](mem://features/schema) — Tables: users, materials, editorial_queue, etc.
- [Conversion Strategy](mem://features/conversion) — 7 upgrade triggers, rules
- [Edge Functions](mem://features/edge-functions) — API endpoints and payloads
- [Dashboard Hierarchy](mem://features/dashboard-hierarchy) — Mobile-first layout order
- [Use Shadcn Tokens](mem://constraints/use-shadcn-tokens) — Never create --lw-* tokens, use existing Shadcn tokens
- [Brand Name](mem://constraints/brand-name) — Brand naming rules
- [No Metrics for Users](mem://constraints/no-metrics-for-users) — No stats cards for end users
- [No Streaming](mem://constraints/no-streaming) — No streaming in generation
- [Plan Rules](mem://features/plan-rules) — Plan gating logic
