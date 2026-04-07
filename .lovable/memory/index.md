# Project Memory

## Core
Living Word: SaaS trilíngue (PT/EN/ES) para pastores. Supabase externo ID: priumwdestycikzfcysg.
Design híbrido: dark landing (gold #D4A853) + warm app (parchment #F5F0E8, café #6B4F3A).
Fonts: Cormorant Garamond display, DM Sans body, JetBrains Mono mono.
Edge functions: generate-pastoral-material, generate-blog-article, fetch-bible-verse.
Conversão: 7 gatilhos, nunca bloquear geração, 1 modal/sessão, tom pastoral.
Plans: free(150cr) | starter(3000cr) | pro(10000cr) | igreja(30000cr). Central config: src/lib/plans.ts.
Free: 1x/mês por ferramenta, extras bloqueados. Nunca mostrar créditos para Free.

## Memories
- [Design System](mem://design/system) — Full palette, typography, glass-card utilities
- [DB Schema](mem://features/schema) — Tables: users, materials, editorial_queue, free_tool_usage, etc.
- [Conversion Strategy](mem://features/conversion) — 7 upgrade triggers, rules
- [Edge Functions](mem://features/edge-functions) — API endpoints and payloads
- [Plan Rules](mem://features/plan-rules) — Plan slugs, credit limits, feature gating, UI rules
