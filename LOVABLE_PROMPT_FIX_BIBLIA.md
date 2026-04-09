# 🛠️ Ajuste da Bíblia (Tradução, Layout e Busca Rápida)

Copie o texto abaixo e envie para o Lovable corrigir tudo de uma vez.

---

**Cole isso no Lovable:**
> "Lovable, a página da Bíblia e o `BibleDrawer` precisam de 3 correções importantes de usabilidade e internacionalização:
> 
> 1. **Tradução Dinâmica (PT/ES/EN):** A API `bible-api.com` está fixa em `?translation=web` (Inglês). Você deve tornar isso dinâmico baseado no `lang` do usuário:
>    - Se `PT`: use `?translation=almeida`
>    - Se `ES`: use `?translation=valera`
>    - Se `EN`: use `?translation=web` ou `kjv`
> 
> 2. **Contraste dos Botões de Capítulo:** Os botões dos capítulos estão invisíveis (fundo e texto com cores conflitantes, falha de contraste). Ajuste o layout do seletor para usar o tema do nosso sistema (shadcn/ui), garantindo que os números fiquem legíveis.
> 
> 3. **Busca Rápida de Livro e Versículo:** O usuário NÃO quer ficar rolando uma lista de 66 livros. O seletor de "Livro" não pode ser um Select (Dropdown) comum, ele precisa ser um **Input pesquisável (Combobox do shadcn ou input text com autocomplete)**. Quando o pastor digitar "Mat", precisa sugerir "Mateus".
>    - Adicione também um seletor rápido para focar diretamente em um **Versículo** específico, fazendo rolagem até a linha correspondente."
