---
name: Use existing Shadcn tokens, not --lw-*
description: Never create --lw-* CSS tokens. Use existing Shadcn/Tailwind tokens (bg-background, bg-card, text-primary, etc.)
type: constraint
---
The PRD references `--lw-*` tokens but they do NOT exist. The project uses Shadcn tokens:

| PRD says | Use instead |
|---|---|
| `--lw-bg` | `bg-background` (dark #17110c) |
| `--lw-bg-card` | `bg-card` (#1f1814) |
| `--lw-primary` | `text-primary` / `bg-primary` (#d89f4b) |
| `--lw-accent` | `bg-accent` (#c2946b) |
| `--lw-text-muted` | `text-muted-foreground` |
| `--lw-border` | `border-border` |

Dashboard = dark background. Sidebar = light (cream). New components must match dark theme.
