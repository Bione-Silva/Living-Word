

# Reorganização do Sidebar — Plano

## Estrutura ATUAL (desktop sidebar, dentro de `<nav>`)

```text
FERRAMENTAS
├── Dashboard
├── 📂 Pesquisa (collapsible)
├── 📂 Criar (collapsible)
├── 📂 Extras (collapsible)
├── 🧠 Mentes Brilhantes
│
├── ── CONTA ──────────────
├── Meu Perfil        → /configuracoes
├── Plano e Uso       → /upgrade
├── Portal            → /blog/{handle}
├── Blog              → /blog
├── Biblioteca        → /biblioteca
├── Workspaces        → /workspaces
├── Estúdio Social    → /social-studio
├── Central de Ajuda  → /ajuda
├── Configurações     → /configuracoes
├── Back-office       → /admin (master only)
│
╞══ USO DO MÊS (footer fixo) ══╡
├── Progress bar
├── Upgrade CTA (free)
└── Avatar + nome + logout
```

## Estrutura NOVA (proposta)

```text
FERRAMENTAS
├── Dashboard
├── 📂 Pesquisa (collapsible)
├── 📂 Criar (collapsible)
├── 📂 Extras (collapsible)
├── 🧠 Mentes Brilhantes
│
├── Biblioteca        ← produto, fica perto de Mentes
├── Workspaces        ← produto
├── Estúdio Social    ← produto
│
│   (espaço visual grande — mt-auto / flex spacer)
│
├── ── CONTA ──────────────
├── Meu Perfil        → /configuracoes
├── Plano e Uso       → /upgrade
├── Portal            → /blog/{handle}
├── Blog              → /blog
├── Central de Ajuda  → /ajuda
├── Configurações     → /configuracoes
├── Back-office       → /admin (master only)
│
╞══ USO DO MÊS (footer fixo) ══╡
├── Progress bar
├── Upgrade CTA (free)
└── Avatar + nome + logout
```

### Resumo das mudanças

1. **Biblioteca, Workspaces, Estúdio Social** sobem para logo abaixo de "Mentes Brilhantes" (são produtos/conteúdo do app).
2. **Perfil, Plano e Uso, Portal, Blog, Central de Ajuda, Configurações, Back-office** descem para a seção "CONTA" na parte inferior.
3. Um **spacer flex** (`mt-auto` ou `<div className="flex-1" />`) é adicionado entre o bloco de produtos e o bloco CONTA, empurrando CONTA para perto do footer "Uso do mês".

### Arquivo editado
- `src/layouts/AppLayout.tsx` — reordenar os `<Link>` dentro do `<nav>` do sidebar desktop (linhas ~387–544). Nenhum componente novo, apenas mover blocos e ajustar o spacer.

