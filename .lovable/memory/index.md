# Memory: index.md
Updated: 6d ago

# Project Memory

## Core
Living Word: SaaS trilíngue (PT/EN/ES) para pastores. Supabase externo ID: priumwdestycikzfcysg.
Design híbrido: dark landing (gold #D4A853) + warm app (parchment #F5F0E8, café #6B4F3A).
Fonts: Cormorant Garamond display, DM Sans body, JetBrains Mono mono.
Edge functions: generate-pastoral-material, generate-blog-article, fetch-bible-verse.
Conversão: 7 gatilhos, nunca bloquear geração, 1 modal/sessão, tom pastoral.
Free: 5 gerações/mês, 3 formatos, 1 blog article, watermark. Trial 7d sem cartão.
Image gen: HF (SDXL) primeiro, Gemini fallback. Nunca usar outras APIs pagas.

## Memories
- [Design System](mem://design/system) — Full palette, typography, glass-card utilities
- [DB Schema](mem://features/schema) — Tables: users, materials, editorial_queue, etc.
- [Conversion Strategy](mem://features/conversion) — 7 upgrade triggers, rules
- [Edge Functions](mem://features/edge-functions) — API endpoints and payloads
- [Image Gen Priority](mem://constraints/image-gen-priority) — HF first, Gemini fallback, no other APIs
