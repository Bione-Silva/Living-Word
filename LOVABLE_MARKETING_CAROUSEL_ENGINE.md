# ATUALIZAÇÃO DO ESTÚDIO SOCIAL: MOTOR DE CARROSSÉIS DE ALTA CONVERSÃO

Olá Lovable! Para finalizarmos a integração do nosso Módulo de Marketing dentro do Social Studio ("Living Word"), trago os padrões de design nativos (UX/UI e CSS) extraídos do nosso framework de "Marketing-Skills".

Por favor, atualize o componente visual do Social Studio (onde o usuário escreve/visualiza a arte antes de baixar) para implementar esses padrões matemáticos.

## 1. Frame e Viewport (Obrigações para o Canvas)
O carrossel gera imagens **exatamente no Aspect Ratio 4:5** (1080x1350px no Instagram). Para o frontend web:
*   **Largura Fixa (Preview Viewport):** exatos `420px`.  
*   **Altura Fixa (Preview Viewport):** exatos `525px`.
*   A trilha central deve ser um flex swipable (`overflow-x-auto snap-x snap-mandatory`), onde cada slide ocupa exatos `420x525px` (via Tailwind: `w-[420px] h-[525px] shrink-0 snap-center`).

## 2. O Padrão Visual Base
O design deve abandonar blocos comuns e focar em elegância editorial:
*   **Tipografia Híbrida:** 
    *   **Títulos/Hooks (H1, H2):** Fonte Serifada Premium (Ex: Playfair Display) peso 600, com `tracking-tight` (letter-spacing levemente reduzido).
    *   **Corpo de Texto (P):** Fonte Sans-serif moderna (Ex: Inter), peso 400, `leading-relaxed` (line-height amplo de ~1.5).
*   **Alternância de Background:** Nos modos "Instagram Nativo", para reter o usuário no swipe, os slides devem **alternar** entre fundo Claro e Escuro.
    *   *Fundo Claro:* (Ex: `#FAFAFA`). Títulos e Textos Escuros.
    *   *Fundo Escuro:* (Ex: `#121212`). Títulos e Textos Claros.
*   **Segurança de Conteúdo (Clearance):** O texto NUNCA pode bater nas bordas ou rodapé. Padding do slide: `px-9 pt-10 pb-16`. Isso garante que o rodapé fixo nunca tampe a escrita.

## 3. Anatomia de Cada Slide (Os Elementos Nativos)
Crie o componente `<SlideCard />` equipado com os sub-elementos absolutos abaixo:

### A) Progress Bar Dinâmica (Em todo rodapé)
Posicionamento absoluto no chão do slide (`absolute bottom-0 w-full px-7 pb-5`).
*   **Track (Fundo):** Altura minúscula de `h-[3px] rounded-sm bg-black/10` (no claro) ou `bg-white/10` (no escuro).
*   **Fill (Progresso):** Cor Primária da marca (ex: Azul ou Roxo definido no app) preenchendo a % do tempo atual do slide (Ex: se é o slide 2 de 5, `w-[40%]`).
*   **Label Numérica:** Abaixo ou ao lado do Fill, em fonte size 11px, escreva `(Current / Total)`.

### B) Seta de Indução (Chevron Right)
Em **TODOS os slides**, EXCETO no último:
*   Posição: absoluto à direita (`absolute right-0 inset-y-0 w-12`).
*   UI: Centralize verticalmente um ícone ChevronRight (Lucide-react). Um fundo sutil em fade gradient para a esquerda ajuda a destacar a seta sem poluir o texto.

### C) Último Slide (O CTA Final)
Se for o último slide do carrossel (`index === totalSlides - 1`):
*   **Seta removida.**
*   A barra de progresso atinge 100%.
*   Insira no meio da tela a logotipo da marca/Igreja e um "Faux Button" elegante, como: `[ Salvar Post ]` ou `[ Compartilhe ]` (uma badge de CTA arredondada usando Tailwind `rounded-full bg-primary text-white px-6 py-2`).

## 4. Bônus: Alternância para o Modo "X/Twitter Thread"
Adicione um pequeno `Switch` ou Toggle "Estilo da Arte: [Instagram Classic | X Thread]".
Se o usuário ativar a arte "Estilo X":
*   O fundo não intercala mais nos slides; fica 100% claro ou escuro dependendo do modo base.
*   **Header Fixo:** Cada slide renderiza a foto do perfil redonda (48px), Nome, @Handle e ícone de Verificado no topo. Com um divisor/linha fraco `<hr>` abaixo.
*   **Rodapé Engagement:** Troque a barra de progresso por ícones estáticos estilo Twitter (`Reply, Repost, Heart, View`) e os numerozinhos `(ex: 18.4k, 2.3k)`. O número do slide fica escondido num mini-pill no cantinho direito.

Implemente estes requisitos puramente em React e TailwindCSS na visão do Editor Social, para que o html-to-canvas tire o screenshot de obras-de-arte que parecem feitas por designers profissionais.
