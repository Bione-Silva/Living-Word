# HOTFIX CRÍTICO 2 EM 1: FILTRO DA BIBLIOTECA E METADADOS DE COMPARTILHAMENTO

Olá Lovable! Chegaram dois bugs estruturais de usabilidade e compartilhamento que você precisa refatorar urgentemente.

## 1. Bug Crítico no Compartilhamento Social (WhatsApp / Redes)
Quando o usuário tenta compartilhar o link do seu Artigo de Blog publicado gerado pela plataforma, as redes sociais (WhatsApp, Twitter, Facebook) estão puxando a Imagem de Capa genérica da Landing Page, junto com o Título Genérico da Home.
*   **O Erro:** A tela de leitura do Blog/Artigo não está injetando as meta tags de Open Graph dinâmicas. Ele está herdando as tags padrão globais.
*   **A Rota de Correção:** Vá na página responsável por renderizar o artigo público do Blog. Você deve injetar tags `og:title`, `og:description` e `og:image` dinâmicas para aquele Post. 
    *   No título: O nome do Artigo.
    *   Na Imagem: A URL da primeira imagem gerada ou capa associada a este artigo.
    *   No Description: Um resumo do texto.
*   *Assegure-se de usar React Helmet ou a API correta de Metadados do framework para sobrescrever a `<head>` do documento!*

## 2. Refatoramento de UX da Biblioteca (Filtros e Chips)
A funcionalidade de salvar os estudos bíblicos do E.X.P.O.S. não foi corretamente indexada no filtro, e o dropdown atual atrapalha o uso no mobile.

*   **Abandone o Dropdown:** Remova ou oculte o Select de Filtro tradicional na barra de pesquisa da Biblioteca.
*   **Implemente Etiquetas Rápidas (Chips):** Logo abaixo da barra de pesquisa, desenhe uma linha horizontal de Categorias clicáveis no formato de Etiquetas para as principais categorias:
    *   **Todos**
    *   **Sermões**
    *   **Estudos Bíblicos** (Adicione o tipo `biblical_study` aqui para resolver o bug de sumiço deles na interface!)
    *   **Artigos**
    *   **Devocionais**
*   **Comportamento:** Essa linha deve ser rolável no celular (`flex overflow-x-auto` e `scrollbar-hide`). O chip clicado deve assumir forte contraste, filtrando a query imediatamente na lista inferior.

Aplique estas duas correções imediatamente (SEO/OpenGraph na página do Blog e os Chips na Biblioteca).
