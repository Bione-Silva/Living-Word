# Instruções de Correção Crítica para o Lovable: UX e UI do Leitor (Frontend)

Lovable, nossa plataforma está passando por ajustes de arquitetura. O Backend (Supabase Edge Functions) agora assumiu 100% da responsabilidade de gerar as imagens, criar a inteligência, mesclar tudo e formatar.

A partir de agora, a sua responsabilidade e o "payload" que você irá ler é um **Texto Markdown puro, já contendo tags HTML de imagens** `![alt](url)`.

Aplique as seguintes correções visuais e arquiteturais na interface:

## 1. O Modal de Leitura (Substituição da Tela Escura)
**O Problema:** Quando clica no ícone de "olho" (visualizar) nos cards da Biblioteca, a plataforma abre uma tela feia escura que não condiz com a beleza do conteúdo.
**A Solução (Padrão Omniseen):**
- Destrua essa visualização escura e genérica.
- Implemente um **Modal Full-Screen / Popup Modal** largo, de fundo bege claro (`#f7f5f0`).
- Ao clicar no olho, a interface deve renderizar o artigo e seu título lá dentro.
- Ele deve ser elegante, centralizado, permitindo fechar o modal e voltar para a biblioteca de imediato.

## 2. Renderização do Texto Markdown Intercalado com Imagens 
**O Processo:** O backend agora devolve a string completa no formato Markdown via variável `"body"`. Nesta string existem Headers (`##`, `###`), Parágrafos de texto denso, e imersos no meio do texto, as imagens.
**A Solução:**
- Instale e utilize um ecosistema de parse elegante: pacotes como `react-markdown` combinados com as classes tipográficas oficiais do tailwind (ex: `className="prose prose-stone max-w-none"`).
- O backend enviará marcações no estilo `![Ilustração editorial](url)`. Seu renderer de Markdown pegará essa marcação e simplesmente a plotará visualmente dentro do fluxo de texto. As imagens ficarão organicamente intercaladas na leitura (após o H2, ou entre parágrafos) graças ao backend!
- Regra Visual: As imagens devem ocupar o `width: 100%` da coluna de conteúdo legível, arredondadas moderadamente (`rounded-xl` ou `rounded-md`).

## 3. Correção UX: YouTube ➔ Blog (Fim do Chatbot)
**A Solução:**
- O erro bizarro onde o modelo diz "Sou uma inteligência artificial..." é fruto de enviar o Link do Youtube diretamente no Input base.
- Se a extração automatizada de Youtube (via API de scraper) ainda não foi conectada ou ativada no seu frontend, exiba um formulário estrito com passos claros (ex: "Cole o texto da transcrição", ou "Resuma em tópicos"). Não permita que a interface lide com links do Youtube como se estivesse batendo-papo livremente com a Inteligência. Modele o input visualmente como um **Formulário de Geração Controlado** e isole o erro bizarro.
