# ESTÚDIO SOCIAL - OPÇÕES DE FUNDO E OTIMIZAÇÃO DE TAMANHO

Olá Lovable! Chegamos na fase de aprimoramento final do **Estúdio Social**. A personalização e a exportação precisam ser muito mais refinadas, tanto para dar liberdade criativa quanto para economizar espaço em disco do nosso usuário final.

Por favor, implemente essas três regras de ouro na interface do Estúdio Social:

## 1. Seleção: "Imagem de Fundo" vs "Cor de Fundo"
*   O usuário precisa ter um seletor (Toggle / Radio Button) claro dizendo: **"Estilo de Fundo"**.
*   **Opção A (Cores Sólidas/Gradientes):** Se ele escolher isso, exiba aquela paleta de cores elegantes e minimalistas.
*   **Opção B (Imagens):** Se ele escolher Imagem, carregue a funcionalidade de buscar imagens de fundo no Unsplash. E mais importante: adicione uma linha de botões de "Categoria/Estilo da Imagem" (Ex: *Minimalista*, *Cenários Bíblicos*, *Natureza*, *Texturas*). As imagens bíblicas devem seguir o mesmo padrão estético de alta qualidade que usamos no módulo de Blog.

## 2. Escolha de Geração Múltipla (Quais formatos baixar?)
*   Não prenda o usuário apenas ao formato em tela! Adicione checkboxes para ele configurar o que ele quer exportar. Exemplo de pergunta: *"Para onde quer levar essas imagens?"*
    *   `[ ] TikTok / Reels / Stories (9:16)`
    *   `[ ] Feed do Instagram (4:5)`
    *   `[ ] Feed Quadrado (1:1)`
*   Se ele marcar vários, na hora de baixar (`Baixar ZIP`), o sistema deve iterar renderizando as versões marcadas, sem ele ter que mudar manualmente de aba só para baixar.

## 3. Otimização Brutal de Exportação (Reduzir de 15MB para 2~3MB)
*   Atualmente as imagens exportadas pelo Canvas estão pesando abusivos 10MB a 15MB, o que destrói a usabilidade em celulares. **Isso é inaceitável. A média obrigatória é de 2MB a 3MB, com teto máximo de 5MB.**
*   **Ação:** Refatore o script de captura (`html2canvas`, `html-to-image` ou nativo). 
    *   Se for PNG, limite a escala de captura (Ex: `scale: 1.5` ou no máximo `2`).
    *   **Dica Ouro:** Mude o método de conversão do canvas para `JPEG` passando uma taxa de compressão razoável. (Ex: `.toJpeg(node, { quality: 0.85, pixelRatio: 1.5 })`). O olho humano não verá diferença do texto numa resolução média alta, mas o peso cairá 80%.

Por favor, atualize o arquivo do painel de personalização do Estúdio Social e o Helper que lida com o Download!
