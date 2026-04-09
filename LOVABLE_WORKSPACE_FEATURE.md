# CRIAÇÃO DO AMBIENTE WORKSPACE / SÉRIES (UI E LAYOUT)

Olá Lovable! Chegamos a um momento chave do produto. Precisamos criar o agrupador de conteúdo para que o usuário não fique com os estudos perdidos em uma lista infinita na Biblioteca, e possa organizá-los e compartilhá-los.

## 1. Nomenclatura e Internacionalização (i18n)
O cliente decidiu adotar uma nomenclatura universal, forte, mas amigável ao público. Vamos usar o conceito de **"Workspaces"** (ou Coleções). 
*   **PT:** "Meus Workspaces" (ou "Minhas Séries")
*   **EN:** "My Workspaces" (ou "My Series")
*   **ES:** "Mis Workspaces" (ou "Mis Series")
*OBS: Adote a string `workspaces.title` no arquivo de tradução. O design pode exibir "Workspaces" no menu lateral ou dentro de uma aba na Biblioteca.*

## 2. A UI do Workspace (Hierarquia Sophisticada)
Você deve criar uma nova página ou uma aba dedicada dentro da Biblioteca chamada *Workspaces*.
O fluxo visual básico que você fará é o seguinte:

### Tela A: Lista de Workspaces
*   Um botão elegante `[ + Novo Workspace ]` ou `[ Criar Série ]`.
*   Uma View em Grid de cards representando as pastas/séries criadas (Ex: *Série: O Antídoto para a Ansiedade*).
*   Cada card exibe a quantidade de itens lá dentro (Ex: *3 documentos*).

### Tela B: Visão Interna do Workspace (A Área de Trabalho)
Ao clicar no card do Workspace, a pessoa "entra" nele. O que ela vê:
*   **Cabeçalho da Série/Workspace** com o título.
*   **O Botão de Ouro (Viral):** Um botão `[ Compartilhar Workspace ]`. Esse botão deve ter um ícone de "Share". Ao clicar, o sistema deve acionar a API nativa de compartilhamento (`navigator.share`) do celular ou copiar um link mágico para a área de transferência no Desktop. (Não precisa criar banco de dados novo agora, faça a UI do botão e um mock de copiar link).
*   **A Lista de Arquivos (Items do Workspace):** Uma lista mostrando o que tem alocado ali: o Estudo Bíblico base, os Sermões gerados e Artigos. Todos atrelados a este Workspace.

## 3. O Botão "Salvar em..." nos Documentos
Tanto lá na tela final do Estudo Bíblico E.X.P.O.S., quanto nos relatórios de Sermões e Artigos, você deve incluir a capacidade de "Adicionar a um Workspace". 
*   Pode ser um Modal rápido `[ Salvar em qual Workspace? ]` aparecendo ao gerar, ou um Dropdown no cabeçalho `Mover para Workspace...`.

Não crie estruturas de banco de dados complexas de organização B2B agora. Mantenha B2C. Apenas crie a tabela simples (ou mock no frontend) de `workspaces` e vincule os `materials` a um `workspace_id`. O foco é o Design luxuoso, a facilidade de organizar os estudos daquela "Mensagem" e o botão de Compartilhar para espalhar no WhatsApp!
