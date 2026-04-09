# IMPLEMENTAÇÃO DE DESIGN PREMIUM: ESTÚDIO SOCIAL

Olá Lovable! Chegou a hora de transformar a engine do nosso "Estúdio Social" num gerador Profissional.
Até hoje, a UI adotava uma abordagem aleatória e de "jogar texto no fundo". Essa lógica amadora não tem padrão nem qualidade e não serve para o nosso app.

Eu exijo que a geração gráfica do Canvas agora OBRIGUE o usuário a usar um dos **3 TEMPLATES DE LAYOUT FIXOS**, regidos por uma matemática de Grid e CSS de classe mundial.

Por favor, refatore o componente de geração visual (Canvas) e crie uma seleção rápida chamada "Estilo do Cartaz" (Buttons ou Select) com essas 3 opções pré-programadas:

## TEMPLATE 1: "EDITORIAL MINIMALISTA"
**A Lógica Visual:** Dividir o post rigorosamente em metades.
*   **Background (Divisório):** A imagem gerada (background) ou foto ocupa EXATAMENTE do topo até 60% da altura (`h-[60%]`).
*   **Base do Cartaz:** Do `60%` até o bottom (`h-[40%]`), a cor de fundo deve ser obrigatoriamente *SÓLIDA* (branco, bege, ou uma cor escura, a critério do tema escolhido pelo usuário).
*   **Tipografia:** O versículo ou frase *NUNCA* fica por cima da imagem original. O texto deve ser ancorado nesse terço inferior liso. Use uma tipografia serifada fina e justificada ou centralizada à perfeição. Assinatura do "Living Word" super discreta no `padding-bottom`.

## TEMPLATE 2: "SWISS TYPOGRAPHY" (Tipografia Brutalista/Suíça)
**A Lógica Visual:** A informação e a legibilidade são as rainhas da matemática. Nenhuma imagem concorre com as palavras.
*   **Background:** Cor escura sólida OU fundo claro super plano. Nenhuma fotografia fotorealista agressiva. Apenas minimalismo.
*   **Tipografia & Grid CSS:** Texto do versículo MASSIVO. Use fonte bold limpa (ex: Inter/Roboto sem serifa). O versículo encosta na margem lateral esquerda numa proporção desbalanceada moderna.
*   A "Referência" (Livro e Capítulo, ex: Salmos 23) deve alinhar de maneira assíncrona, flutuando para o canto inferior direito da tela. Traços finos horizontais e verticais (`border-l`, `border-t-2`) devem separar as informações como um jornal financeiro ou diagrama técnico.

## TEMPLATE 3: "CINEMATIC OVERLAY"
**A Lógica Visual:** Para quando a foto do usuário for espetacular e dever tomar toda a tela.
*   **Background:** A Imagem preenche 100% da tela CSS (`object-cover w-full h-full`).
*   **O Truque de Legibilidade:** Nenhuma gota de texto pode tocar a imagem crua. Injete um `<div>` com Gradiente Profundo de baixo para cima `bg-gradient-to-t from-black/90 via-black/40 to-transparent`. Isso criará uma "zona de proteção visual".
*   **Tipografia:** Posicionada **exclusivamente na metade inferior** (dentro do gradiente). Texto minimalista na cor Branco Puro ou Creme Suave, espaçamento elegante (`tracking-wide`). 

## REGRAS DE HIERARQUIA VISUAL DO CÓDIGO REACT:
Crie constantes robustas ou utilitários para essas 3 Lógicas de "CSS Mates".
*   **Nada se sobrepõe errôneamente.** Os contêineres (`divs`) que hospedam os textos têm de ser independentes, construídos em Flexbox rígido (`flex flex-col justify-end / justify-center`).
*   **Sem improvisos.** Acabe com a aleatoriedade e alinhe a proporção perfeitamente seja em `9:16`, `4:5` ou `1:1`.

Aja agora e reconstrua a engine visual com essas 3 arquiteturas. A plataforma Palavra Viva requer qualidade de museu e revista para o estúdio de postagens dos pastores!
