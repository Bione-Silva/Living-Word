# CORREÇÃO GLOBAL DE CONTRASTE E ACESSIBILIDADE (EMERGÊNCIA)

Olá Lovable! A última alteração de estilos que você fez acabou quebrando o contraste em vários lugares da plataforma, "desarrumando" telas que antes estavam visíveis.

O problema de texto invisível (texto muito claro em fundos também claros) se espalhou para fora do E.X.P.O.S., atingindo a **Biblioteca**, o **Dashboard** e as listas de itens.

Por favor, faça um **Check-up Geral (varredura em 100% dos componentes)** aplicando as seguintes regras de ouro imediatamente:

## 1. Varredura Global de Cores na UI (Dashboard e Biblioteca)
*   **O Problema Atual:** Nas listas de documentos (como na aba Biblioteca), o título dos artigos e os detalhes estão ficando transparentes, cinza muito claro ou com herança branca sobre fundo branco.
*   **O Fix Universal:** Qualquer componente que exiba texto principal, títulos de documentos, ou descrições no Dashboard e listas, DEVE usar cores de alto contraste, como `text-stone-800`, `text-slate-900` ou `text-foreground`.
*   **Verificação:** Analise seus componentes de Lista (`ListItem`, `Card`, tabelas de biblioteca) e remova explicitamente classes como `text-muted`, `text-white/50`, `text-slate-300`, ou `text-primary` pálidas se o fundo for branco/bege.

## 2. Textos Brancos só em Fundos Escuros
Se você tentar forçar um texto branco ou azul clarinho (`text-white`, `text-blue-100`), isso SÓ PODE acontecer se o container desse texto tiver um background comprovadamente escuro (`bg-stone-900`, `bg-primary`, `bg-black`). Nunca aplique esses modificadores em componentes cujos backgrounds são o bege/branco padrão da nossa marca.

## 3. Preservação do Export (DOCX e PDF)
Certifique-se de que a correção global que você vai fazer agora não remova a regra explícita de `color: #1a1a1a;` que adicionamos nos exportadores do PDF e DOCX do estudo E.X.P.O.S. Essa regra deve ser intocável.

Faça essa refatoração cuidadosa em todos os `.tsx` da interface, garantindo que a legibilidade do sistema volte a ser 100% perfeita para o usuário final.
