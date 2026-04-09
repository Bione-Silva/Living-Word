# EMERGÊNCIA NO DOWNLOAD DE IMAGEM (BUG CORTANDO A ARTE)

Olá Lovable! A feature do Estúdio Social funcionou, e o visual está lindo, porém a função de Exportar/Download está com um bug gravíssimo: **A imagem exportada está saindo cortada pela metade (a esquerda da arte não entra na "foto")**.

Isso é um problema clássico na renderização do DOM usando bibliotecas como `html2canvas` ou `html-to-image` dentro de containers com Flexbox/Grid ou com Zoom/Scale. O canvas está "fotografando" na posição X/Y errada.

Por favor, refatore o componente visual e o método de Download seguindo rigorosamente estas 3 etapas:

## 1. Isolamento do Ref (A Div Capturada)
A `div` que contém a Ref de captura (a arte em si) não pode ter margens dinâmicas (`mx-auto`, `m-auto`), nem transformações de escala (`scale-75`, `transform`), caso contrário o canvas se perde nas coordenadas da tela.
*   **Solução:** Envolva o "Post" em um frame/container fixo. Use as classes de tamanho absoluto baseado na proporção, garantindo que o elemento base a ser capturado seja exato e estancado.

## 2. Parâmetros de Instância do Canvas (Ignorar Scroll da Tela)
Quando o usuário rola a tela antes de clicar, às vezes a captura corta em cima ou na esquerda. No seu método de geração de imagem (seja `html2canvas` ou `toPng`), adicione as configurações de reset de viewport e alta resolução:
```javascript
// Exemplo se for html2canvas
{
  scale: 2, // Melhor qualidade
  useCORS: true, // Para não bugar imagens externas
  scrollX: 0,
  scrollY: -window.scrollY,
  backgroundColor: '#000000',
  width: element.scrollWidth,
  height: element.scrollHeight
}
```
*(Adapte isso para a engine de captura que você codou)*

## 3. Carregamento de Fontes e Imagens (CORS)
Certifique-se de que a imagem de fundo tenha `crossOrigin="anonymous"` ativado. Se o texto estiver mudando de lugar depois de gerado, é porque o Canvas tirou a foto antes de carregar a fonte estilosa. Garanta que a fonte carregou, e que os textos estejam centralizados usando `text-center flex flex-col justify-center items-center w-full`.

Revise a função do botão Baixar agora e gere o código corrigido para que as Imagens 9:16 ou Quadradas sejam plotadas integralmente e em altíssima qualidade!
