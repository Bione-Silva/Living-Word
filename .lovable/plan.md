

# Living Word — Plano de Implementação

## Visão Geral
Plataforma SaaS trilíngue (PT/EN/ES) para pastores e líderes cristãos, com duas frentes: **Estúdio Pastoral** (geração de sermões e materiais) e **Motor de Conteúdo** (blog cristão automatizado). Conecta ao Supabase externo existente (ID: `priumwdestycikzfcysg`) com edge functions já implementadas.

---

## 1. Design System & Infraestrutura Base

**Design híbrido:**
- **Landing page:** tema escuro premium (fundo slate-950/zinc-950, acentos âmbar/dourado #D4A853)
- **App autenticado:** tema quente pergaminho (fundo #F5F0E8, primária #6B4F3A Café Ministerial)

**Tipografia:** Cormorant Garamond (títulos/display), DM Sans (corpo/UI), JetBrains Mono (metadados)

**Paleta app:** Primary #6B4F3A, Dark #3D2B1F, Amber #C4956A, BG #F5F0E8, Cards #FFF

**Configurar:** Tailwind com tokens customizados `lw-*`, Google Fonts import, Supabase client apontando para o projeto externo

---

## 2. Landing Page (`/`)
- **Hero section** escura com gradiente e blur dourado sutil
  - Headline: "Sua pregação merece ir além do púlpito"
  - CTAs: "Criar meu blog grátis" → `/cadastro` | "Ver exemplo ao vivo"
- **Seção "Como funciona"** — 3 passos visuais
- **Seção de Formatos** — 7 cards (3 free, 4 com badge "Pastoral 🔒")
- **Tabela de Preços** — Free / Pastoral $9 / Church $29 / Ministry $79 com glassmorphism
- **Footer** — links, legal, "Feito com fé e tecnologia"
- Toggle de idioma PT/EN/ES no header

---

## 3. Autenticação & Onboarding (`/cadastro`)
**Fluxo em 3 passos:**
1. **Dados básicos** — nome, email, senha, idioma (detectado por browser)
2. **Seu Blog** — escolha de handle `[___].livingword.app` com validação em tempo real + preview visual
3. **Perfil Pastoral** (opcional) — doutrina, tom pastoral (Acolhedor free, outros 🔒)

**Pós-cadastro:** criar conta via Supabase Auth, chamar `generate-blog-article` 2x em background, redirecionar ao Estúdio com toast "Seu blog está no ar! 🎉"

**Login** (`/login`) — email + senha, link "Esqueci senha", redirect para dashboard

---

## 4. Layout Autenticado
- **Desktop:** Sidebar fixa (220px, fundo #3D2B1F) com nav items: Dashboard, Estúdio, Blog, Biblioteca, Calendário, Configurações, Upgrade
- **Mobile:** Bottom navigation (4 ícones) + header arredondado #6B4F3A
- Componente `<GenerationCounter />` no header — barra de progresso com cores dinâmicas (verde → amarelo → vermelho)

---

## 5. Dashboard (`/dashboard`)
- Card topo: "Seu blog está no ar" com link clicável para `handle.livingword.app`
- Contador de gerações usadas/disponíveis (barra visual)
- Cards dos artigos publicados automaticamente
- Botão grande "Gerar novo conteúdo" → Estúdio
- Atalhos rápidos para Estúdio, Blog, Fila Editorial

---

## 6. Estúdio Pastoral (`/estudio`) — Tela Principal
**Coluna esquerda (input):**
- Passagem Bíblica (autocomplete 66 livros)
- Público-alvo (dropdown)
- Contexto/Dor (textarea)
- Idioma, Versão Bíblica (com versões 🔒), Voz Pastoral (com vozes 🔒)
- Botão "Gerar Material" (grande, dourado)

**Coluna direita (output em tabs):**
- ✅ Sermão | ✅ Esboço | ✅ Devocional | 🔒 Reels | 🔒 Bilíngue | 🔒 Célula
- Markdown renderizado com tags de auditoria coloridas `[CITAÇÃO DIRETA]`, `[PARÁFRASE]`, `[APLICAÇÃO]`
- Watermark no Free: "⚠️ Rascunho gerado com IA. Revise, ore e pregue com sua voz."
- Botões: Copiar | Salvar na Biblioteca | Publicar no Blog
- Chama `generate-pastoral-material` endpoint real

**Componentes de conversão:**
- `<LockedTab />` — cadeado + drawer com preview + CTA "7 dias grátis"
- `<VoiceSelector />` — mini-card ao clicar em voz bloqueada
- `<UpgradeModal />` — contextual, máx 1 por sessão (sessionStorage)

---

## 7. Blog do Usuário (`/blog/[handle]`)
- Layout minimalista: header com nome/foto do pastor, grid de artigos
- Cada artigo: título, data, passagem, corpo markdown, botões de compartilhar (WhatsApp, X, link)
- Watermark no Free: "Gerado com Living Word" no rodapé
- SEO: meta tags dinâmicas, Open Graph

---

## 8. Biblioteca (`/biblioteca`)
- Grid de materiais com filtros (tipo, data, favoritos) e busca por texto
- **Free:** apenas 10 mais recentes, 11º com blur + cadeado + "Arquivado — desbloqueie no Pastoral" (Gatilho 6)
- Ações: ver, editar, publicar, duplicar, excluir

---

## 9. Calendário Editorial (`/calendario`)
- Visão mensal com domingos destacados
- Cards inline de conteúdo agendado
- **Free:** calendário visível mas "Agendar" desabilitado com tooltip
- **Pastoral:** drag & drop para agendar

---

## 10. Configurações (`/configuracoes`)
- Tabs: Perfil | Blog | Plano | Doutrina | Idioma | Conta
- Upgrade CTA inline no tab Plano
- Configuração de WordPress (Pastoral+)

---

## 11. Regras de Conversão (implementadas em todos os fluxos)
1. Gatilho 1: Geração 4/5 — barra inline no Estúdio
2. Gatilho 2: Formatos bloqueados — drawer lateral com preview
3. Gatilho 3: Voz bloqueada — mini-card contextual
4. Gatilho 4: Blog 1/1 artigo — card inline pós-publicação
5. Gatilho 5: Versão bíblica bloqueada — tooltip pastoral
6. Gatilho 6: Biblioteca >10 itens — blur no 11º
7. Gatilho 7: Watermark — link sutil "Remover marca d'água"

**Regras invioláveis:** nunca bloquear geração (só formatos), mostrar o bloqueado nunca esconder, 1 gatilho modal por sessão, tom pastoral (não comercial), trial 7 dias sem cartão

---

## Integração Técnica
- Supabase client com URL e Anon Key do projeto externo
- Auth via `supabase.auth.signUp/signInWithPassword`
- Edge functions via `supabase.functions.invoke()`
- RLS automático via JWT do usuário
- i18n: detecção por `navigator.language`, troca manual

