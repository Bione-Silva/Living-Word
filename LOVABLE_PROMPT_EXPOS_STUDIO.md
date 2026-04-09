# LOVABLE PROMPT — E.X.P.O.S. Studio: Geração e Edição
# Living Word — Frontend Spec v2.0
# Copie e cole este prompt integralmente no Lovable AI Editor

---

## OBJETIVO DA TELA
Criar a interface "E.X.P.O.S. Studio" para as 5 mentes de estudo teológico. 
Diferente daquele retorno clássico de abas estáticas, o resultado aqui deve ser renderizado dentro de um **Documento Editável (Estilo Notion / Rich Text Editor)**. O pastor/líder precisa conseguir ler a saída da IA, clicar no texto, editar, adicionar suas próprias anotações, salvar no banco e compartilhar.

---

## CONTEXTO DE BACKEND (Já implementado)
A tabela "expos_studies" já está criada no banco de dados Supabase e 5 Edge Functions estão funcionais.

Edge Functions disponíveis:
- expos-individual
- expos-celula
- expos-classe
- expos-discipulado
- expos-sermao

Payload de Envio para a Function (JSON): { "passagem": "João 3:16-18" }
Payload de Retorno: { "markdown": "# Título...\n\nConteúdo...", "type": "celula" }

---

## LAYOUT E ARQUITETURA DE COMPONENTES

### 1. Sidebar de Configuração (30% da tela)
- Input de Texto: "Passagem Bíblica ou Tópico"
- Seleção de Formato: Crie um componente visual de RadioGroup estilizado para escolher a Mente:
  * Individual (Devocional e Oração)
  * Célula (Estudo para Pequenos Grupos)
  * Classe (Escola Bíblica / Estudo Teológico)
  * Discipulado (Aconselhamento 1-a-1)
  * Sermão (Esboço Homilético Profundo)
- Botão de Ação Primário: "Gerar Documento E.X.P.O.S."

### 2. Área Central do Documento (70% da tela)
Esta parte é crucial. Quando o backend retornar o markdown, ele não deve ser apenas um componente ReactMarkdown estático.
O Lovable deve implementar um **Editor Rich Text** (use wrappers nativos do shadcn, TipTap, ou semelhante).
O editor deve parecer uma folha de papel digital elegante (fundo branco/claro, maxWidth legível max-w-prose, tipografia focada em leiturabilidade).

Barra de Ferramentas do Documento (Toolbar Fixa no Topo):
1. Salvar no Acervo: Salva o conteúdo atual do editor na nossa tabela expos_studies.
2. Copiar Texto: Copia todo o conteúdo visível para a área de transferência do sistema.
3. Exportar PDF: Imprime o estado atual do documento ou converte para PDF.
4. Compartilhar: Botão que abre um Share Dialog.

---

## REGRAS DE INTEGRAÇÃO COM SUPABASE (Front-to-Back)

1. Invocação: Use o SDK oficial do Supabase. Chame a function correspondente (ex: supabase.functions.invoke) e insira o valor retornado na área editável.

2. Persistência de Dados (Botão Salvar):
Ao salvar, use o método insert do Supabase na tabela "expos_studies", enviando os campos:
- passagem: texto digitado
- formato: o tipo de estudo selecionado
- conteudo_markdown: o valor atual do editor
- user_id: o id do usuário autenticado

Se der sucesso, mostre um toast confirmando.

## MENSAGEM FINAL PARA A INTELIGÊNCIA DO LOVABLE
"Construa esta interface com um padrão premium SaaS. Foque intensamente na UX de edição. O usuário não deve ter a sensação de estar mexendo em um formulário técnico, mas sim de estar em um 'Estúdio de Criação' contínuo, imersivo e sem distrações. NÃO FECHE A TAREFA SEM CONSIDERAR TODAS AS ETAPAS ACIMA. USE CLASSES 'prose prose-stone' DO TAILWIND PARA O TEXTO."
