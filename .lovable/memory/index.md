# Memory: index.md
Updated: now

# Project Memory

## Core
Living Word: SaaS trilíngue (PT/EN/ES) para pastores. Supabase externo ID: priumwdestycikzfcysg.
Stack: React + Vite + TS + Tailwind + shadcn/ui + Supabase. Proibido Next/Vue/Angular/MUI/Bootstrap.
Pastoral Minds System: Billy Graham, Spurgeon, Wesley, Calvin — vozes distintas, nunca misturar.
Design híbrido: dark landing (gold #D4A853) + warm app (parchment #F5F0E8, café #6B4F3A). Mobile-first + dark mode obrigatório. Interface reverente, sem excesso visual.
Fonts: Cormorant Garamond display, DM Sans body, JetBrains Mono mono.
Edge functions: generate-pastoral-material, generate-blog-article, fetch-bible-verse, translate-content. Prompts/IA SEMPRE em Edge Functions — nunca no frontend.
Conversão: 7 gatilhos, nunca bloquear geração, 1 modal/sessão, tom pastoral.
Free: 5 gerações/mês, 3 formatos, 1 blog article, watermark. Trial 7d sem cartão.
**AI: APENAS Gemini (2.5-flash, 3.1) ou GPT (gpt-4o, gpt-4o-mini, gpt-5*). Proibido Claude, Llama, Mistral, DeepSeek, HF.**
**TS: proibido `any`. Citação bíblica sempre com livro+cap+vers. i18n: nunca hardcode PT no JSX.**

## Memories
- [Design System](mem://design/system) — Full palette, typography, glass-card utilities
- [DB Schema](mem://features/schema) — Tables: users, materials, editorial_queue, etc.
- [Conversion Strategy](mem://features/conversion) — 7 upgrade triggers, rules
- [Edge Functions](mem://features/edge-functions) — API endpoints and payloads
- [AI Models Allowed](mem://constraints/ai-models-allowed) — Apenas Gemini e GPT permitidos
- [CLAUDE.md Rules](mem://constraints/claude-md-rules) — Master operational rules from project CLAUDE.md
