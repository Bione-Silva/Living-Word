# ESTÚDIO SOCIAL - MULTI-FORMATO INTELIGENTE E HISTÓRICO

Olá Lovable! Precisamos elevar o Estúdio Social para um nível "GoHighLevel/Canva". O modelo atual obriga o usuário a gerar tudo de novo se ele quiser mudar a proporção da imagem. Precisamos de um redimensionamento dinâmico e um histórico das artes geradas.

Por favor, implemente as duas lógicas abaixo na UI do Estúdio:

## 1. Adequação Automática de Formatos (Magic Resize)
*   **O Problema Atual:** O usuário tem que escolher a proporção antes e ficar preso nela.
*   **A Solução (Estilo GHL):** O usuário deve gerar o conteúdo/arte UMA ÚNICA VEZ. Acima do Preview do Canva/Estúdio, crie botões de navegação rápida (Tabs):
    *   `[📱 Stories / Reels (9:16) ]`
    *   `[🖼️ Feed / Carrossel (4:5) ]`
    *   `[⏹️ Quadrado (1:1) ]`
*   **Comportamento React:** Ao clicar nessas abas, o *aspect-ratio* do container CSS (a "tela" onde o Salmo/Frase está renderizado) deve mudar instantaneamente. O Tailwind/CSS deve usar Flexbox ou Grid para que a imagem de fundo e o texto se adequem à nova proporção automaticamente, sem perder o que ele acabou de construir!

## 2. Salvar na Nuvem (Galeria "Minhas Artes")
*   Não podemos deixar a arte morrer se o usuário fechar a página. O que ele cria de valor precisa ser dele.
*   **Nova Seção na UI:** Adicione uma barra lateral, aba ou botão chamado **"Minhas Artes"** ou **"Histórico"**.
*   **Lógica de Salvamento:** Toda vez que ele exportar ou publicar uma imagem, pegue o arquivo gerado (Blob/Base64) e faça um Upload para um Bucket do Supabase (ex: `social_arts`), atrelado ao `user_id`. 
*   Exiba essas artes salvas em uma grade (Grid) na seção "Minhas Artes", permitindo que o usuário baixe novamente ou compartilhe no futuro, criando verdadeiro valor e retenção no nosso SaaS.

Faça essas alterações na arquitetura da página. A transição de CSS entre o 9:16 e o 1:1 tem que ser o mais suave possível!
