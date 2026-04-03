# LIVING WORD — Landing Page Brief
## Cole este documento no chat do Lovable para criar a LP

---

## MISSÃO DA PÁGINA

Converter visitantes em cadastros gratuitos.
CTA principal: **"Criar meu blog grátis"** — não "assinar", não "comprar".
O usuário deve sentir em 5 segundos: *"isso foi feito para mim"*.

Público que precisa se reconhecer na página:
- Pastor brasileiro em Atlanta preparando sermão às 23h
- Líder hispânico que prega em espanhol e inglês
- Líder de célula sem tempo e sem site
- Influencer cristão que quer consistência editorial
- Catholicos que lideram grupos de estudo bíblico

---

## IDENTIDADE VISUAL

### Fontes (importar do Google Fonts)
```html
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
```
- Títulos/hero/citações: `Cormorant Garamond` — serif elegante, ministerial
- Tudo interativo/corpo: `DM Sans` — limpa, moderna, legível em mobile

### Paleta de cores
```css
--primary:     #6B4F3A   /* Café Ministerial — botões, header */
--dark:        #3D2B1F   /* Teca Profunda — hero bg, footer, sidebar */
--amber:       #C4956A   /* Âmbar Pastoral — destaques, CTAs secundários */
--amber-light: #F0E6D8   /* Linho Quente — cards, backgrounds suaves */
--bg:          #F5F0E8   /* Pergaminho — fundo geral */
--linen:       #EDD9C8   /* Creme — badges, pills */
--card:        #FFFFFF   /* Cards */
--text:        #3D2B1F   /* Texto principal */
--muted:       #8B6B54   /* Texto secundário */
--border:      rgba(107,79,58,0.15)
```

### Tom visual
Cálido, acolhedor, ministerial sem ser antiquado.
Sem gradientes chamativos. Sem ícones genéricos de "church".
Parece plataforma profissional de criação de conteúdo — não app de oração.

---

## ESTRUTURA DA LP — 10 SEÇÕES

### 1. NAV (fixo no topo)
- Logo: `Living Word` com "Word" em âmbar itálico
- Links: Como funciona · Funcionalidades · Planos
- Seletor de idioma: PT · EN · ES (toggle, muda a LP inteira)
- CTA: botão "Começar grátis" em âmbar
- Background: `#3D2B1F`

---

### 2. HERO (seção mais importante)

**Background:** `#3D2B1F` (escuro quente)

**Eyebrow (acima do título):**
```
Copiloto pastoral trilíngue · PT · EN · ES
```
Fonte 11px, uppercase, letter-spacing, cor âmbar.

**Headline (H1):**
```
A Palavra que você prega
no domingo
precisa circular na semana
```
Fonte: Cormorant Garamond 44px, cor `#F5F0E8`.
"precisa circular na semana" em itálico âmbar.

**Subtítulo:**
```
Do sermão ao blog publicado em minutos.
Com fidelidade bíblica, sua voz pastoral e alcance real
— em português, inglês e espanhol.
```
14–15px, cor branca 65% opacidade, line-height 1.6.

**Badges de público** (row horizontal):
```
[Evangélicos]  [Católicos]  [Líderes]  [Influencers de fé]
```
Pills com border âmbar sutil — sinaliza que serve a todos, não só evangélicos.

**CTAs:**
- Primário: `Criar meu blog grátis →` — fundo âmbar, texto escuro
- Secundário (ghost): `Ver como funciona` — borda âmbar translúcida

**Versículo no rodapé do hero:**
```
"A Palavra de Deus não está acorrentada." — 2 Timóteo 2:9
```
Cormorant Garamond itálico, 13px, branco 30% opacidade.

---

### 3. BARRA DE SOCIAL PROOF (logo abaixo do hero)

Background: `#F5F0E8`
4 métricas separadas por divisor vertical:

```
3           7              60s                 $0
Idiomas    Formatos/geração   Do input ao blog   Para começar
nativos
```

---

### 4. SEÇÃO PROBLEMA

Background: branco
Título (Cormorant): `Você prepara horas. A mensagem some em minutos.`

Subtítulo: explica que cada sermão levou pesquisa e oração mas ao terminar o culto a mensagem desaparece.

**Grid 2×2 de pain cards** (fundo `#F5F0E8`, borda suave):
- Sem tempo para escrever (pastor bivocacional)
- Bilíngue é desafio real (PT + EN + ES)
- IA genérica não serve (ChatGPT não conhece imigrantes)
- Sem site, sem presença (sem WordPress, sem aparecer no Google)

Cada card tem ícone SVG pequeno, título e descrição de 2 linhas.

---

### 5. COMO FUNCIONA (3 passos)

Background: `#F5F0E8`
Título: `Três campos. Sete formatos. Sessenta segundos.`

**3 passos em lista vertical** com número circular em `#6B4F3A`:

**Passo 1:** Você traz a passagem e a dor do seu povo
- Passagem bíblica + público + tema do momento
- Badge exemplo: `João 15:1-8 · Imigrantes · Saudade de casa`

**Passo 2:** A plataforma gera com sua voz pastoral
- Escolha estilo, versão bíblica, linha doutrinária
- Badge: `Guardrails teológicos · Fidelidade bíblica · Sua voz`

**Passo 3:** Sete formatos prontos para circular
- Sermão, esboço, devocional, reels, bilíngue, célula, blog
- Badge: `Blog publicado automaticamente · joao.livingword.app`

---

### 6. FUNCIONALIDADES (grid de cards)

Background: branco
Título: `Do púlpito ao leitor. Fiel, claro, com alcance.`

**Grid 3×2** de feature cards:

| Feature | Destaque |
|---|---|
| 7 formatos em 1 geração | — |
| Trilíngue nativo | badge "único" |
| Blog publicado automaticamente | — |
| Contexto imigrante | badge "único" |
| Guardrails teológicos reais | — |
| Sua voz pastoral | — |

Cards com ícone SVG 36×36px, título bold, descrição 2 linhas.
Badge "único" em âmbar claro onde aplicável.

---

### 7. COMPARATIVO vs CONCORRENTES

Background: `#3D2B1F`
Título (Cormorant, branco): `Por que não o SermonSpark?`

**Grid 2 colunas** — lado a lado:

**Coluna esquerda — "Outros tools":**
- Fundo: branco 5% opacidade
- ✗ Apenas inglês — PT e ES inexistentes
- ✗ Sem contexto imigrante ou cultural
- ✗ Sem publicação — você copia e cola
- ✗ Ferramentas separadas, sem fluxo
- ✗ Guardrails teológicos são só disclaimers
- ✗ Web-only, sem app mobile nativo

**Coluna direita — "Living Word":**
- Fundo: âmbar 15% opacidade, borda âmbar sutil
- ✓ PT, EN, ES gerados nativamente
- ✓ 12 temas imigrantes embutidos
- ✓ Blog publicado automaticamente
- ✓ 7 formatos em 1 clique, 60 segundos
- ✓ Exegese + camadas + alerta de eisegese
- ✓ Mobile-first · PT · EN · ES

---

### 8. DEPOIMENTOS

Background: `#F5F0E8`
Título: `De pastores que pregam toda semana.`

**Grid 2×2** de cards brancos com border suave:

**Card 1 — Pastor brasileiro (Atlanta)**
> "Finalmente uma ferramenta que entende que minha congregação é brasileira em Atlanta. O conteúdo soa como eu prego, não como tradução de Google."
— Pr. João Silva 🇧🇷 · Igreja Brasileira · Atlanta, GA

**Card 2 — Pastor hispânico (Los Angeles)**
> "Mi congregación habla español e inglés. Ahora publico el devocional en los dos idiomas cada semana, con mi voz, en menos de un minuto."
— Pastor Miguel Cruz 🇲🇽 · Iglesia Hispana · Los Angeles, CA

**Card 3 — Pastor americano (Nashville)**
> "I was skeptical about AI for sermons. Living Word is different — it actually understands theology, not just generates text. The exegesis layer is real."
— Rev. Robert Johnson 🇺🇸 · Baptist Church · Nashville, TN

**Card 4 — Líder de célula (Miami)**
> "Sou líder de célula, não pastor. Nunca teria tempo de preparar material assim. Agora cada semana chego com devocional, perguntas e reels prontos."
— Ana Cruz 🇧🇷 · Líder de célula · Miami, FL

Cada card: citação em Cormorant Garamond itálico, avatar com iniciais, nome + flag + função.

---

### 9. PLANOS E PREÇOS

Background: branco
Título: `Comece grátis. Cresça quando precisar.`

**Grid 4 colunas:**

| Free | Pastoral | Church | Ministry |
|---|---|---|---|
| $0 | $9/mês | $29/mês | $79/mês |
| 5 ger/mês | 40 ger/mês | 200 ger/mês | 500 ger/mês |
| Sermão + esboço | Todos os 7 formatos | + equipe (3) | + equipe (10) |
| 1 artigo/mês | 20 artigos/mês | 3 sites WP | 10 sites WP |
| Blog no ar | Sem watermark | Agendamento | Analytics |

**Plano Pastoral** em destaque: border 2px `#6B4F3A`, badge "Mais escolhido".
CTA do Pastoral: `7 dias grátis →` (sem cartão).
CTA dos outros: `Começar` ou `Falar com equipe`.

---

### 10. FAQ

Background: `#F5F0E8`
4 perguntas em cards brancos colapsáveis (accordion):

**P: A IA substitui o pastor?**
R: Não. O Living Word é um copiloto — como um comentário bíblico. Você prega. A IA prepara.

**P: Funciona para católicos também?**
R: Sim. Suporta diferentes tradições: evangélica, batista, pentecostal, carismática, reformada e católica.

**P: O que acontece no cadastro?**
R: Em menos de 2 minutos seu blog (seu-nome.livingword.app) está no ar com 2 artigos publicados com seu nome.

**P: Precisa de cartão para o trial de 7 dias?**
R: Não. Só solicitamos cartão no 8º dia se quiser continuar.

---

### 11. CTA FINAL (seção de fechamento)

Background: `#6B4F3A`
Título (Cormorant, branco):
```
A Palavra que você prega
merece circular além do domingo.
```

Subtítulo (branco 65%):
```
Crie seu blog pastoral hoje.
Publique seu primeiro devocional em 60 segundos.
Grátis para sempre, sem cartão de crédito.
```

**CTA:** `Criar minha conta grátis →` — fundo `#F5F0E8`, texto escuro

Tags de público abaixo do botão:
`PT · EN · ES · Evangélicos · Católicos · Líderes · Influencers de fé`

**Versículo de fechamento:**
```
"Assim será a palavra que sair da minha boca:
não voltará para mim vazia." — Isaías 55:11
```
Cormorant itálico, 13px, branco 30% opacidade.

---

### 12. FOOTER

Background: `#1E1510`
- Logo: `Living Word · Palavra Viva · Palabra Viva`
- Links: Privacidade · Termos · Contato
- Seletor de idioma: PT · EN · ES

---

## COMPORTAMENTOS IMPORTANTES

### Idioma
- Detectar `navigator.language` no primeiro acesso
- Toggle PT/EN/ES no nav muda TODA a página
- Cada idioma tem copy próprio — não tradução automática
- Default PT para domínios .br, EN para .com, ES para .es

### Animações (sutis, não chamativos)
- Hero: fade-in staggered no H1 (palavras aparecem uma a uma)
- Pain cards: slide-up ao entrar na viewport
- Passos do "como funciona": reveal sequencial ao scrollar
- Sem parallax, sem partículas, sem efeitos pesados

### Mobile-first obrigatório
- Nav: hamburger menu em mobile
- Hero: fonte 32px (não 44px) em mobile
- Grids 2×2 viram 1 coluna em mobile
- Preços: cards empilhados, Pastoral destacado primeiro
- Bottom padding: `env(safe-area-inset-bottom)` no CTA final

### Performance
- Imagens: usar SVG para ícones (sem PNG pesado)
- Fontes: `font-display: swap` para evitar FOUT
- Sem carregamento de imagens externas no above-the-fold

### Acessibilidade
- Contraste mínimo 4.5:1 em todo texto
- Alt text em todos os elementos visuais
- Foco visível em todos os elementos interativos

---

## O QUE NÃO FAZER

- Não usar a palavra "AI" em destaque — dizer "assistência inteligente" ou simplesmente mostrar o resultado
- Não usar cruzes, pombas, igrejas como ícones — parece app genérico de fé
- Não colocar fotos de estoque de pessoas orando — parece fake
- Não usar gradientes roxos ou azuis — foge da identidade ministerial
- Não usar a palavra "assinar" — usar "começar", "criar", "entrar"
- Não mostrar o preço antes de mostrar o valor
- Não listar features antes de mostrar o problema que resolve

---

## COPY ADICIONAL POR IDIOMA

### EN (hero)
```
The Word you preach on Sunday
needs to reach people all week long

From sermon to published blog in minutes.
With biblical faithfulness, your pastoral voice,
and real reach — in Portuguese, English and Spanish.
```

### ES (hero)
```
La Palabra que predicas el domingo
necesita circular toda la semana

Del sermón al blog publicado en minutos.
Con fidelidad bíblica, tu voz pastoral y alcance real
— en portugués, inglés y español.
```

---

*Living Word LP Brief v1.0 · Abril 2026*
*Stack: React + Tailwind + shadcn/ui · Deploy: Vercel*
*Conectar ao Supabase após aprovação visual*
