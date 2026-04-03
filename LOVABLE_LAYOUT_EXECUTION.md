# Sprint de Layout: Efeito Abundância (UI Unbundling)

> **INSTRUÇÃO PARA VOCÊ:** Copie este texto inteiro e cole no chat do Lovable logo após sincronizar o GitHub e o Supabase. Isso guiará a IA de interface para executar as mudanças visuais baseadas no novo `LOVABLE_PROMPT.md`.

---

**PROMPT PARA O LOVABLE:**

Olá! O backend e o banco de dados (Supabase) do projeto já foram 100% atualizados no GitHub pela equipe de infraestrutura técnica.
Sua missão agora é estritamente Visual/Frontend. Precisamos atualizar o **Dashboard Principal (`/dashboard` ou `/estudio`)** para aplicar a estratégia de "Desmembramento de Ferramentas" (UI Unbundling) descrita rigorosamente no arquivo `LOVABLE_PROMPT.md` que está no repositório.

**Por favor, execute estas mudanças de layout passo a passo:**

### Passo 1: Layout Core do Grid
- Apague qualquer interface estilo "Chat gigante/vazio" que esteja dominando a tela no `/estudio`.
- Implemente uma visualização majestosa em **Grid Responsivo** (múltiplas colunas no Desktop) expondo todas as ferramentas abertamente.
- O fundo da área central deve ser limpo (`slate-50`), enquanto a Sidebar principal de navegação deve ser escura (`slate-950`).
- Adicione o Título `H1` acolhedor (conforme o prompt) e o Subtítulo para incentivar o uso.

### Passo 2: Construir as 4 Frentes de Abundância (Grids)
Gere os botões/cards independentes exatamente conforme especificado no arquivo mestre. Agrupe visualmente em 4 frentes:
1. **Grid 1:** Ferramentas de Pesquisa (7 ferramentas, 2 com selo 🔒 Premium)
2. **Grid 2:** Ferramentas de Escrita e Criação (6 ferramentas, 1 com selo 🔒 Premium)
3. **Grid 3:** Ferramentas de Alcance (5 ferramentas). *Nota: essas ferramentas compartilham a mesma chamada central, elas apenas têm fachadas diferentes focando em um output específico (`reels`, `cell`, etc) para facilitar a usabilidade para o pastor.*
4. **Grid 4:** Ferramentas Divertidas e Dinâmicas (Essas chamam a Edge Function nova `search-pastoral-tools` com o `tool: trivia | poetry | kids_story | deep_translation`). A deep_translation precisa conter o badge 🔒 Premium.

### Passo 3: O Componente "Card de Ferramenta"
Faça cada ferramenta ser um belo `<ToolCard>`:
- Design: Fundo branco ou sutil, borda fina com efeito de _hover_ destacando com um glow nos tons do nosso Dourado Living Word (`#D4A853`).
- Conteúdo: Ícone do `lucide-react` super representativo, Título em peso Semibold, e a clássica uma linha explicativa menor em baixo.
- Premium: Para as ferramentas trancadas, adicione o ícone de cadeado (`Lock`) e certifique-se de que exibirão o Modal de Upgrade ao ser clicado.

### Passo 4: UX das Interações
Garanta que ao clicar numa dessas ferramentas, a tela faça um slide/fade suave (um painel lateral dinâmico `Sheet` ou formulário focado) com o respectivo campo de input, em vez de jogar o usuário para a mesma tela de sermão antiquada. Queremos manter a sensação de modernidade.

**Por favor, confirme quando tiver concluído a reescrita do layout do Dashboard para exibirmos as 4 frentes simultâneas debaixo dos nossos rígidos conceitos de UI.** Lembre-se: NÃO toque em nada fora de React e Estilos, a infraestrutura API está pronta para ser consumida.
