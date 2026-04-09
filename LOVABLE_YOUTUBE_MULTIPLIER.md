# YOUTUBE MULTIPLIER (UX E MULTI-GERAÇÃO)

Olá Lovable! A ferramenta "YouTube → Blog" na verdade deve ser uma fantástica "Máquina de Reciclagem de Conteúdo". Precisamos refatorar o modal atual para que o usuário possa ESCOLHER exatamente os tipos de conteúdo que ele quer extrair daquela transcrição.

Por favor, faça os seguintes ajustes visuais no Modal e na Apresentação do Resultado:

## 1. Descrição mais clara no Modal Inicial
*   Abaixo do título, melhore a descrição para ficar alinhada com as outras ferramentas premium: *"Transforme palestras e pregações do YouTube em um ecossistema completo: Artigos, Estudos de Célula, Frases virais e Newsletters usando IA."*

## 2. Área de Múltipla Escolha (Etiquetas / Tags)
*   Entre o campo de texto e o botão "Gerar", crie uma seção *"O que você deseja gerar?"*.
*   Insira **Etiquetas (Pills) selecionáveis** (como Botões de Toggle em formato de Tag). As opções devem ser:
    *   ✅ Artigo para Blog
    *   ✅ Estudo de Célula (Quebra-gelo e Perguntas)
    *   ✅ Frases para Redes Sociais
    *   ✅ Newsletter / E-mail Pastoral
*   O usuário pode selecionar uma, várias ou todas. O design dessas tags deve ser clicável e mostrar um estado "Ativo/Inativo".

## 3. Tela de Resultados em Abas (Tabs)
*   Quando o processamento da IA terminar, pegue a resposta (que deve vir estruturada do prompt) e **Não** exiba tudo como um bloco de texto infinito.
*   Renderize os resultados usando o componente de **Tabs (Abas)** do Shadcn UI/Tailwind:
    *   **Aba 1: Artigo** (Mostra o texto formatado para o site).
    *   **Aba 2: Estudo de Célula** (Mostra o roteiro do pequeno grupo).
    *   **Aba 3: Social** (Mostra as frases de efeito destacadas). *Opcional: Se já tiver a feature pronta, adicione os botões do 'Estúdio Social' do lado de cada frase.*
    *   **Aba 4: Newsletter** (O texto formatado para E-mail).

Esses ajustes deixarão o agrupamento visual limpíssimo e mostrarão o verdadeiro poder da ferramenta!
