# LIVING WORD — REORGANIZAÇÃO DA SIDEBAR
## Documento para o Lovable
## Versão 1.0 — Abril 2026

---

## ⚠️ REGRAS ABSOLUTAS DESTA TAREFA

1. **NÃO remover nenhuma funcionalidade** — apenas reorganizar onde ela aparece
2. **NÃO alterar** cores, tipografia, ícones ou identidade visual
3. **NÃO mexer** no conteúdo do dashboard (área central da tela)
4. **NÃO alterar** nenhuma rota existente — apenas a sidebar
5. Todas as ferramentas que existem hoje devem continuar acessíveis,
   apenas em lugares mais organizados

---

## PROBLEMA ATUAL

A sidebar atual tem 20+ itens visíveis simultaneamente, causando:
- Sobrecarga visual para o usuário
- Duplicação com os cards do dashboard central
- Mistura de ferramentas de trabalho com itens de conta
- Sub-menus expandidos por padrão ocupando toda a tela

---

## NOVA ESTRUTURA DA SIDEBAR

### Antes → Depois (visão geral)

```
ANTES (20+ itens):                    DEPOIS (8 itens):
─────────────────────                 ─────────────────
FERRAMENTAS                           FERRAMENTAS
  Dashboard                             🏠 Dashboard
  Pesquisa ▾                            ✨ Criar
    Explorador de Temas 🔒              🔍 Pesquisar
    Versículos 🔒                       📖 Bíblia
    Contexto Histórico 🔒
    Citações 🔒                       RECURSOS
    Texto Original 🔒                   🧠 Mentes Brilhantes [Premium]
    Análise Lexical 🔒                  📚 Biblioteca
  Criar ▾                               🗓️ Calendário
    Estúdio Pastoral 🔒
    Estudo Bíblico 🔒                 ─────────────────
    Blog & Artigos 🔒                 👤 Conta ▾  (colapsado)
    Títulos 🔒
    Metáforas 🔒
    Ilustrações ✨
    Modernizador 🔒
    YouTube → Blog ✨
  Extras ▾
    Roteiro Reels 🔒
    Célula 🔒
    [... 7 mais itens ...]
  Mentes Brilhantes [Premium]
  Biblioteca
  Workspaces
  Calendário
  Estúdio Social
  Bíblia
CONTA
  Meu Perfil
  Plano e Uso
  Portal
  Blog
  Central de Ajuda
  Configurações
  Back-office
```

---

## ESPECIFICAÇÃO DETALHADA

### SEÇÃO 1 — FERRAMENTAS (sempre visível, 4 itens)

#### Item 1.1 — Dashboard
```
Ícone:  existente (grid/home)
Label:  "Dashboard"
Rota:   /dashboard
Comportamento: igual ao atual
```

#### Item 1.2 — Criar (NOVO — agrupa tudo que era Criar + Extras)
```
Ícone:  ✨ (sparkles — existente no design system)
Label:  "Criar"
Rota:   /dashboard (já está na tela central)
Comportamento: AO CLICAR → NÃO abre sub-menu na sidebar
               → Faz scroll suave até a seção "COMECE AQUI"
               do dashboard OU navega para /criar se essa
               rota existir

SUB-MENU (mostrado apenas se hover/expandido pelo usuário):
  Ferramentas que eram em "Criar":
  - Estúdio Pastoral      → rota existente
  - Estudo Bíblico        → rota existente
  - Blog & Artigos        → rota existente
  - Títulos               → rota existente
  - Metáforas             → rota existente
  - Ilustrações           → rota existente
  - Modernizador          → rota existente
  - YouTube → Blog        → rota existente

  Ferramentas que eram em "Extras":
  - Roteiro Reels         → rota existente
  - Célula                → rota existente
  - Legendas              → rota existente
  - Newsletter            → rota existente
  - Avisos                → rota existente
  - Quiz Bíblico          → rota existente
  - Poesia                → rota existente
  - Infantil              → rota existente
  - Tradução              → rota existente
  - Conteúdo Social       → rota existente

IMPORTANTE: Sub-menu inicia FECHADO por padrão.
O usuário expande clicando na seta ▾ ao lado do label.
```

#### Item 1.3 — Pesquisar (NOVO — agrupa tudo que era Pesquisa)
```
Ícone:  🔍 (lupa — existente)
Label:  "Pesquisar"
Rota:   /dashboard ou rota de pesquisa existente
Comportamento: AO CLICAR → navega para a ferramenta de pesquisa

SUB-MENU (fechado por padrão, expande ao clicar ▾):
  - Explorador de Temas   → rota existente
  - Versículos            → rota existente
  - Contexto Histórico    → rota existente
  - Citações              → rota existente
  - Texto Original        → rota existente
  - Análise Lexical       → rota existente
```

#### Item 1.4 — Bíblia
```
Ícone:  📖 (existente)
Label:  "Bíblia"
Rota:   /biblia (existente)
Comportamento: igual ao atual
```

---

### SEÇÃO 2 — RECURSOS (sempre visível, 3 itens)

Separador visual sutil (linha 1px --lw-border) entre Ferramentas e Recursos.

#### Item 2.1 — Mentes Brilhantes
```
Ícone:  🧠 (existente)
Label:  "Mentes Brilhantes"
Badge:  [Premium] — manter exatamente como está hoje
Rota:   /mentes-brilhantes (existente)
Comportamento: igual ao atual
```

#### Item 2.2 — Biblioteca
```
Ícone:  existente
Label:  "Biblioteca"
Rota:   /biblioteca (existente)
Comportamento: igual ao atual
```

#### Item 2.3 — Calendário
```
Ícone:  existente
Label:  "Calendário"
Rota:   /calendario (existente)
Comportamento: igual ao atual
```

**ITENS REMOVIDOS DA SIDEBAR PRINCIPAL:**
- Workspaces → mover para dentro de "Conta" ou acessar via Configurações
- Estúdio Social → mover para sub-menu de "Criar"

---

### SEÇÃO 3 — CONTA (colapsado por padrão)

No rodapé da sidebar, após os Recursos.
Separador visual antes deste bloco.

#### Item 3.1 — Bloco de usuário (existente, manter)
```
Avatar + Nome + Plano (já existe no rodapé — MANTER EXATAMENTE IGUAL)
```

#### Item 3.2 — Menu de conta (ícone de engrenagem ou "..." ao lado do nome)
```
Ao clicar → dropdown com:
  - Meu Perfil         → /perfil (existente)
  - Plano e Uso        → /plano (existente)
  - Portal             → /portal (existente)
  - Blog               → /blog (existente)
  - Central de Ajuda   → /ajuda (existente)
  - Configurações      → /configuracoes (existente)
  - Back-office        → /back-office (existente, só admin)
  - Sair               → logout (existente)
```

---

## COMPORTAMENTO DOS SUB-MENUS

### Estado padrão ao abrir o app:
```
Dashboard         ← selecionado/ativo
Criar             ← fechado (sem sub-menu visível)
Pesquisar         ← fechado
Bíblia            ← fechado
────────────────
Mentes Brilhantes
Biblioteca
Calendário
────────────────
[Avatar] Severino ···
```

### Ao clicar em "Criar":
```
Dashboard
Criar ▾           ← expande
  ├ Estúdio Pastoral
  ├ Estudo Bíblico
  ├ Blog & Artigos
  ├ ... (todos os itens)
  └ [Ver todos ▾] ← se lista for longa, mostrar top 5 + expandir
Pesquisar
Bíblia
```

### Regra de expansão:
- Apenas UM sub-menu aberto por vez
- Ao clicar em "Pesquisar" com "Criar" aberto → fecha Criar, abre Pesquisar
- Estado de expansão persiste durante a sessão (localStorage)

---

## INDICADORES VISUAIS

### Item ativo (rota atual):
```
Fundo:  --lw-primary com 10% opacidade (#C4956A1A)
Texto:  --lw-primary (#C4956A)
Borda:  2px esquerda solid --lw-primary
```
*(Igual ao comportamento atual do "Dashboard" selecionado)*

### Item com sub-menu fechado:
```
Ícone de seta ▾ à direita do label (ChevronDown — Lucide)
Cor da seta: --lw-text-muted (#7A7A7A)
```

### Item com sub-menu aberto:
```
Ícone de seta ▲ (ChevronUp)
Cor da seta: --lw-primary (#C4956A)
```

### Itens bloqueados (🔒) dentro dos sub-menus:
```
Manter exatamente o comportamento atual:
ícone de cadeado + texto esmaecido
Ao clicar: abre modal de upgrade
```

---

## O QUE NÃO MUDA

```
✅ Topbar (header) — não tocar
✅ Área central do dashboard — não tocar
✅ Todas as rotas existentes — não alterar
✅ Comportamento dos modais de upgrade (🔒)
✅ Badge [Premium] do Mentes Brilhantes
✅ Bloco de créditos no rodapé
✅ Bloco de usuário (avatar + nome + plano) no rodapé
✅ Versão mobile (BottomNavBar) — avaliar separadamente
✅ Modo colapsado da sidebar (ícones apenas)
```

---

## VERSÃO MOBILE — BottomNavBar

A BottomNavBar mobile deve refletir os 4 itens principais:

```
[🏠 Dashboard] [✨ Criar] [📖 Bíblia] [🧠 Mentes] [👤 Conta]
```

- "Criar" abre bottom sheet com todas as ferramentas de criação
- "Conta" abre bottom sheet com os itens de conta
- Pesquisar fica acessível via barra de pesquisa no topo do dashboard

---

## CHECKLIST DE VALIDAÇÃO (testar após implementação)

```
[ ] Dashboard ainda funciona e é o item ativo por padrão
[ ] Clicar em "Criar" expande sub-menu com TODAS as ferramentas antigas
[ ] Clicar em "Pesquisar" expande sub-menu com TODAS as ferramentas de pesquisa
[ ] Itens bloqueados (🔒) ainda abrem modal de upgrade ao clicar
[ ] "Bíblia" navega para /biblia corretamente
[ ] "Mentes Brilhantes" mantém badge [Premium]
[ ] "Biblioteca" e "Calendário" funcionam igual ao atual
[ ] Conta dropdown contém todos os itens: Perfil, Plano, Portal, Blog, Ajuda, Config, Back-office
[ ] Back-office só aparece para admin (bionicaosilva@gmail.com)
[ ] Bloco de créditos (14.978 disponíveis) continua visível no rodapé
[ ] Bloco de usuário (avatar + nome + plano) continua no rodapé
[ ] Sidebar colapsada (modo ícones) ainda funciona
[ ] Mobile BottomNavBar não quebrou
[ ] Nenhuma rota existente foi removida ou alterada
```
