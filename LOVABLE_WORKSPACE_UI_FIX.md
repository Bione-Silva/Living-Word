# AJUSTE FINO DE UI E CONTRASTES NOS WORKSPACES

Olá Lovable! A estrutura de base que você criou para os Workspaces está ótima, mas a execução de Design (Paleta de Cores, Botões e Etiquetas) apresentou graves problemas de legibilidade e estética nas telas geradas. Precisamos consertar isso imediatamente.

Por favor, faça os seguintes ajustes nos botões, modais e elementos da tela de Workspaces:

## 1. O Botão "Compartilhar Workspace" está INVISÍVEL
*   **Problema:** Na visão interna de um Workspace, o botão "Compartilhar Workspace" está com a linha e o texto em um cinza/branco extremamente claro contra o fundo claro da plataforma, tornando-o ilegível.
*   **Ação:** Refatore este botão para garantir Alto Contraste! Utilize um formato preenchido (`default` variant com cor sólida e texto contrastante) ou um estilo de contorno forte (`outline` com borda e texto em um tom bem escuro, como `border-stone-800 text-stone-900`).

## 2. O Botão "Novo Workspace" (Cor opaca e duplo '+')
*   **Problema:** Na tela principal, o botão está renderizando com ícones duplicados ("+ + Novo Workspace"). Além disso, o tom de marrom usado ficou opaco de baixa qualidade estética, que perde totalmente o destaque quando a plataforma entra no Modo Escuro (Fica um botão escuro em um fundo escuro).
*   **Ação:** Remova o `+` duplicado no código. Substitua essa cor "enlameada" pelo padrão principal (`primary`) que seja vibrante e tenha ótimo contraste *tanto* no modo claro quanto no modo escuro. 

## 3. Contraste no Modal de Criação (Inputs e Backgrounds)
*   **Problema:** O Modal para criar "Novo Workspace" no Modo Escuro está problemático. O fundo do Input de texto ficou puramente preto e denso sem limite visual visível com o fundo do Modal, e o botão inferior (mostarda/dourado) carece de harmonia.
*   **Ação:** Melhore a sobreposição das camadas no Modo Escuro. O Input precisa de um fundo levemente destacado (`bg-stone-800/50`) ou de uma borda mais presente para delimitar a área de digitação. Ajuste a saturação do botão Dourado principal do modal para ser elegante em texto claro.

## 4. Legibilidade das Etiquetas (Labels) e Textos de Suporte
*   **Problema:** Etiquetas que mostram o número de documentos ou descritivos pequenos ("Nenhum material neste workspace", "0 documentos") estão tão claras que falham nos testes de acessibilidade visual.
*   **Ação:** Substitua utilitários que dão muita transparência (como `text-muted-foreground/40`) por um tom de cinza ou marrom mais forte e definido que ancore bem no fundo. Todo texto deve poder ser lido sem esforço ocular.

Por favor, faça um passe de "embelezamento" nos botões e modais mantendo a interface chique, rica e contrastante!
