# Project Memory

## Core
Living Word: SaaS trilíngue (PT/EN/ES) para pastores. Supabase externo ID: priumwdestycikzfcysg.
Design híbrido: dark landing (gold #D4A853) + warm app (parchment #F5F0E8, café #6B4F3A).
Fonts: Cormorant Garamond display, DM Sans body, JetBrains Mono mono.
Edge functions: generate-pastoral-material, generate-blog-article, fetch-bible-verse.
Conversão: 7 gatilhos, nunca bloquear geração, 1 modal/sessão, tom pastoral.
Free: 5 gerações/mês, 3 formatos, 1 blog article, watermark. Trial 7d sem cartão.
Copy vem do PRD + plataforma existente, NUNCA das screenshots de referência.
Devocionais: tabela `devotionals` (read-only no frontend). Áudio/imagem via cron job externa.

## Memories
- [Design System](mem://design/system) — Full palette, typography, glass-card utilities
- [DB Schema](mem://features/schema) — Tables: users, materials, editorial_queue, etc.
- [Conversion Strategy](mem://features/conversion) — 7 upgrade triggers, rules
- [Edge Functions](mem://features/edge-functions) — API endpoints and payloads
- [Copy source rule](mem://constraints/copy-source) — Screenshots = layout only, copy from PRD/platform
- [Dashboard hierarchy](mem://features/dashboard-hierarchy) — Mobile-first layout order and components
- [Devotional architecture](mem://constraints/devotional-architecture) — Devotionals from `devotionals` table, edge fn read-only, cron generates audio/image
