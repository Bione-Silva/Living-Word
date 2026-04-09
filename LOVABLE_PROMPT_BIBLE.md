Crie a Rota Mestre `/biblia` (Bíblia Interativa Premium) baseada na UI do APP "Zeal". O objetivo é oferecer uma leitura imersiva idêntica ao papel físico + motor digital avançado de gamificação.

### Arquitetura da Tela:
1. **Top Nav (Tab Bar Principal):**
   - Exibir 4 abas segmentadas por Pílulas: `Ler` | `Planos` | `Progresso` | `Recursos`.
   
2. **Aba "Ler" (Leitura Principal):**
   - **Header Subtop:** Exibe o Ícone de Engrenagem (configurações) na esquerda, o "Contador de Ofensivas/Dias (🔥)" na esquerda e o Seletor de Livro atual no centro da barra superior. Ao lado a versão ex: `(NVI)`.
   - **Grid de Livraria (Ao selecionar Livro):** Mostre um grid bonito dividindo em (Antigo Testamento) - (Novo Testamento). Cada "Livro" no grid tem seu nome, a contagem de capítulos abaixo (ex: "50 capítulos") e uma mini descrição visual.
   - **Dentro do Capítulo (Viewer):** 
     - Renderizar os `bible_verses` que chegam do banco de dados puro, utilizando uma formatação Serif (Playfair/Georgia) em tamanho generoso, com altura de linha (line-height) `loose` garantindo respirabilidade.
     - [CRÍTICO] Seleção (Highlights/Notes): Se o usuário sublinhar ou clicar nos numerais do versículo exibir um menu flutuante (Tooltip-Action) no estilo Notion: `Destacar Cor 🟨`, `Anotar 📝`, `Compartilhar`.

3. **Aba "Planos" e "Progresso":**
   - Progresso Diário: Exiba o Dashboard do Usuário consultando a tabela base usando hooks para atualizar a pontuação de XP do jogador conectado às APIs.

UX PREMIUM:
- Utilize uma barra de progresso visual luxuosa mostrando Capítulos Lidos / Capítulos Totais da bíblia (1189).
- Cores de papiro macio: `#F3EFE7`. Borda suave, sombras discretas. Animações de Fade fluidas Framer-Motion do componente.
