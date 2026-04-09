# 🚀 Next Steps Lovable: Imagens, Anotações e Bíblia

Copie os blocos abaixo e envie para o Lovable, um por um, para implementar essas novas funcionalidades que você pediu no áudio.

---

## 1. Adicionando Anotações e Salvamento do Estudo (Split-Screen)
**Objetivo:** Permitir que o usuário pegue o estudo gerado, salve e faça anotações pessoais para pregar.

**Prompt para o Lovable:**
> "Lovable, precisamos criar uma experiência de 'Modo de Pregação/Estudo' para os materiais gerados (seja no chat ou no Estúdio).
> 1. Quando o estudo for gerado, quero um botão **'Salvar em Meus Projetos'**.
> 2. Ao acessar esse projeto salvo, a tela deve ser dividida (Split-Screen):
>    - **Lado Esquerdo:** O documento Markdown do estudo gerado pela IA (somente leitura ou edição rica).
>    - **Lado Direito (Sidebar):** Um bloco de 'Anotações do Pregador' (um textarea simples).
> 3. Crie uma tabela no Supabase (ou atualize a tabela `materials`) para guardar essas `notes` junto com o conteúdo do estudo. Assim o pastor tem tudo salvo no mesmo lugar."

---

## 2. Inserindo Ilustrações no Estudo (Imagens no meio do texto)
**Objetivo:** Gerar entre 3 a 5 imagens pequenas (tipo aquarela/vetor) e inserir no meio do texto, como fazemos nos artigos do blog.

*Nota Estratégica:* No **Chat ao vivo**, gerar imagens no meio da conversa é mais difícil tecnicamente. A melhor forma é fazer isso quando ele clicar em "Salvar/Gerar Estudo Oficial".

**Prompt para o Lovable e Backend:**
> "Lovable, quero que a nossa Edge Function que gera o Estudo Bíblico (`generate-biblical-study`) faça a mesma coisa que o gerador de Blog faz:
> 1. Invoque a API de geração de Imagem (OpenAI DALL-E) umas 3 vezes durante a criação do estudo, usando trechos da Exegese ou da Ilustração Bíblica como prompt visual.
> 2. O estilo da imagem deve ser 'Aquarela sutil e bíblica' (ou vetor elegante).
> 3. Insira a URL dessas imagens no markdown do Estudo (`![Ilustração](url)`) alinhadas à direita ou centralizadas e em tamanho pequeno. O objetivo é que o pastor vá lendo o estudo e veja as cenas (ex: Zaqueu na árvore) ambientando a pregação."

---

## 3. Criando a Aba "Bíblia" na Plataforma
**Objetivo:** O pastor não precisar abrir outra aba no navegador para ler um capítulo enquanto estuda.

**Prompt para o Lovable:**
> "Lovable, precisamos criar uma nova página na plataforma acessível pelo menu lateral: **A Bíblia**.
> 1. Crie uma rota `/bible`.
> 2. Implemente uma interface limpa onde o usuário possa selecionar o Livro e o Capítulo.
> 3. Como fonte de dados (API), conecte inicialmente a uma API gratuita de Bíblia (como a `https://bible-api.com/` ou crie uma rota no Supabase para puxar os livros).
> 4. O design deve ser focado em leitura livre, com tipografia grande e limpa. Quero que na barra lateral do 'Estúdio' tenha um atalho rápido para abrir essa Bíblia em um Modal/Gaveta sem perder o texto que ele está escrevendo."
