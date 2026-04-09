# INTEGRAÇÃO: ROTEIRO REELS → ESTÚDIO SOCIAL

Olá Lovable! O modal de geração "Roteiro Reels" está gerando o texto (Dicas de edição, Legenda, Cenas) maravilhosamente bem. Mas precisamos conectar esse modal diretamente à nossa feature visual do **Estúdio Social**! O usuário não pode apenas "ler" o roteiro, ele tem que poder transformá-lo em arte visual instantaneamente.

Por favor, faça a seguinte interligação na interface:

## 1. A Ponte (O Botão de Transição)
No final do texto gerado dentro do modal "Roteiro Reels" (logo abaixo de onde termina a Legenda ou Dicas), adicione um Botão Principal/CTA grande e chamativo: 
**"🎨 Transformar Cenas em Imagens (Estúdio Social)"**

## 2. A Passagem de Dados (State)
Quando o usuário clicar neste botão:
*   A interface não deve perder o roteiro gerado! Você deve mapear o texto que a IA gerou (as cenas/frases do Reels).
*   Encaminhe o usuário (via Rota ou mudando a View do Modal atual) diretamente para a interface do **Estúdio Social Canvas** que implementamos com `html2canvas` ou `html-to-image`.
*   O Estúdio Social deve abrir com os textos das Cenas já injetados nos primeiros slides do preview!

## 3. O Fluxo de UX Ideal
A jornada perfeita para o usuário na plataforma será:
1. Clica em "Gerar Roteiro Reels" sobre Salmo 23.
2. A IA retorna o texto, a narração e a legenda. O usuário lê e gosta.
3. Ele clica em **"Transformar em Imagens"**.
4. A tela carrega o renderizador, plota o Salmo 23 nos slides 9:16, e dá a opção de trocar a cor antes de **Baixar as Imagens**.

Faça com que as duas funcionalidades operem integradas! O roteiro é apenas o Passo 1; a exportação da Imagem é o Passo 2. Adicione essa aba/botão na resposta do Roteiro agora mesmo.
