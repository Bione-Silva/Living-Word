# ESTÚDIO SOCIAL PREMIUM (CARROSSÉIS, TIKTOK E VERSÍCULO DO DIA)

Olá Lovable! Nós vamos evoluir o recurso de Relatórios Sociais/Reels para algo muito mais avançado: um **Estúdio de Imagens Automático** "Canva-like" dentro da própria plataforma. O objetivo é gerar imagens incríveis e baixáveis (HTML-to-Image) a partir da IA.

Por favor, implemente o seguinte escopo completo no frontend:

## 1. O Componente de Tela Visual e Engine Escrita
Quando o usuário visualizar um Roteiro de Carrossel ou um Versículo Gerado, você deve renderizar um componente React puramente visual (sem quebras) que represente literalmente o "Post".
*   Incorpore bibliotecas como `html2canvas` ou `html-to-image` para permitir o download.
*   Crie um Master Button **"Baixar Imagens (Pronto para Postar)"** que tira a "foto" da div em alta resolução e baixa o PNG localmente para o ambiente do usuário.

## 2. Controle de Formatos de Exportação (Aspect Ratios)
Acima do preview da arte, adicione seletores de formato que alteram o contêiner dinamicamente com Tailwind:
*   📱 **Stories / TikTok (9:16):** Usando `aspect-[9/16]`.
*   📸 **Feed Instagram / Carrossel (4:5):** Usando `aspect-[4/5]`.
*   ⬛ **Quadrado / Feed Clássico (1:1):** Usando `aspect-square`.

## 3. Customização Canva-Like (Cores e Fontes) ANTES da Exportação
*   **Adicione uma barra de ferramentas de personalização:** Antes de o usuário clicar em "Baixar", ele precisa ter o poder de **personalizar cores e fontes do slide**.
*   **Opções necessárias:**
    *   Um color picker ou uma seleção de paletas pré-definidas elegantes (ex. minimalista claro, dark luxuoso, sépia teológico) que altera o background e a cor do texto combinando de forma inteligente.
    *   Um seletor de tipografias (Ex: Inter para estilosos, Playfair Display para clássicos, Roboto para legibilidade).

## 4. Input Aberto e Anti-Alucinação (Versículos Escolhidos)
O motor do estúdio deve lidar com a geração de conteúdo baseada no que o usuário escolher:
*   **A) Input de Versículo Livre:** 
    * O usuário não fica restrito ao "Versículo do Dia". Crie um campo de input: `Qual versículo você quer desenhar hoje? (Ex: João 3:16)`. 
*   **B) Proteção Anti-Alucinação (A Prova Real):**
    * Você deve invocar a nossa Supabase Edge Function nativa chamada `fetch-bible-verse`. Passe como payload `{ passage: "João 3:16", version: "ARA", language: "PT" }`. 
    * Essa função conectará à nossa API bíblica oficial (garantindo 100% de integridade no texto). Só depois que ela retornar a string sagrada, você renderiza no Slide 1 do Carrossel.
*   **C) Comentário Devocional Acoplado (Slide 2 em diante):**
    * Quando o usuário buscar o versículo, exiba a opção (checkbox): `[√] Gerar Roteiro de Carrossel para este versículo`.
    * Se ativado, chame a edge function `generate-social-carousel` enviando o versículo no body (`{ verse: "...", topic: "..." }`). A IA devolverá um JSON ESTRUTURADO com 7 slides (`[ { slide, type, title, content } ]`) que você mapeará diretamente nos Slides seguintes do Carrossel usando as setinhas (⬅️ ➡️). Isso evita que você tenha que implementar lógica complexa de parse de texto!

## 5. Roteamento (Sidebar) e Tradução
*   **Adicione a rota `/social-studio` no AppLayout.**
*   Implemente essa rota na **Sidebar** (Menu Lateral) com um ícone pertinente (como um ícone de Pincel, Imagem ou Câmera).
*   Use as ferramentas de **Internationalization (i18n)** para ter a label de menu **trilíngue** (`Estúdio Social` no PT, `Social Studio` no EN, `Estudio Social` no ES).

## 6. Autoteste de Geração Lovable (Simulação)
Por fim, assim que você concluir essas alterações de código:
1. **Navegue até a página `/social-studio` no seu preview.**
2. **Ative a geração de um "Versículo do Dia" real.**
3. **Mude as paletas (cores e formatos 9:16 para Quadrado) para checar responsividade.**
4. **Verifique e realize um teste na função de download da imagem final para garantir que o Canvas capturou os estilos e fontes aplicados corretamente.**
