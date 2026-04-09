# LIVING WORD — Integração do Dashboard com Identidade Visual & Artigos GEO

Olá, Lovable. Nós acabamos de finalizar a reestruturação severa do Onboarding no nosso backend (Supabase Edge Functions).
O Gerador de Contas agora persiste a Identidade Visual do usuário e o Motor de Artigos foi atualizado para **Generative Engine Optimization (GEO)** focado em SEO semântico, com Imagens geradas ativamente via Gemini 3.

Nossa missão atual é amarrar o **Frontend** para exibir os frutos desse motor.

## OBJETIVOS DESTA EXECUÇÃO

1. **Dashboard Start-Up:** Garantir que após o carregamento do Onboarding, a página de Dashboard/Blog renderize os 3 primeiros materiais gerados.
2. **Dynamic Styling:** O site deve injetar dinamicamente as variáveis de UI selecionadas pelo usuário (`theme_color`, `font_family`, `layout_style`).
3. **Markdown Rendering Seguro:** Como o novo LLM do Supabase agora devolve Markdown rico contendo Headings (H2, H3), Citações (Blockquotes), Imagens (nativas do Gemini) e a seção explícita de FAQ, precisamos de um renderizador Markdown altamente confiável no Frontend.

---

## 1. CONSUMO DO THEME DO USUÁRIO

No arquivo raiz do seu Layout (`src/App.tsx`, `src/components/layout/DashboardLayout.tsx` ou contexto similar de Autenticação stateful):
- Faça uma query na tabela `user_editorial_profile` filtrando por `user_id = usuário.logado`.
- Extraia os campos: `theme_color`, `font_family`, `layout_style`.
- Aplique essas propriedades na raiz:
  - Estilize na tag `<body>` ou no `<ThemeProvider>` as variáveis CSS injetando a cor primária dinâmica (`--primary: {theme_color}`).
  - Troque a classe global de fonte se houver intersecção (por ex, usando um switcher para aplicar a `font_family` selecionada como var `--font-sans`).

*Se você não tiver contexto global para isso, crie um `ThemeContext`.*

---

## 2. RENDERIZAÇÃO ESTENDIDA DE ARTIGOS (GEO SUPPORT)

No componente que exibe um Artigo (provavelmente `src/pages/ArticleView.tsx` ou similar):
- Você vai buscar o material na tabela `materials`. O campo que guarda o conteúdo do blog de conteúdo é `output_blog`.
- **Hero Image:** A primeira imagem em formato `![alt](url)` no começo do Markdown é a **Hero**. Se certifique de injetar classes Tailwind fluidas nas imagens (`w-full rounded-2xl object-cover shadow-lg`) para dar um tom cinematográfico.
- **Render do Conteúdo:** Como agora há **FAQ** e **Citações** rigorosas (Blockquotes) criadas para Omniseen SEO, garanta que a lib `react-markdown` ou similar na sua tela tenha plugins como `remark-gfm` ativados!
- Faça o estilo do `prose prose-lg` ter marcações de `h2`, `h3` e `blockquote` puxando a `--primary` do usuário! Exemplo de classe:
  `prose-h2:text-primary prose-h3:text-primary prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-img:rounded-xl`

---

## 3. FIX DA TELA "MEUS ARTIGOS"

No componente de Dashboard onde está a listagem (Grid) de artigos gerados (`src/pages/Index.tsx` ou similar):
- Garanta uma query Real-time ou poller no `materials` ordernados por `created_at DESC` `where mode='blog'`.
- Como são 3 artigos massivos da integração, monte o Grid em `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`.
- O Card de Preview deve tentar achar a primeira imagem do `output_blog` (via regex simples) para servir de thumbnail no Grid, visto que as imagens vêm direto do Gemini no escopo Markdown.

Execute essas integrações sem quebrar o layout existente e avise se precisar criar algum novo componente.
