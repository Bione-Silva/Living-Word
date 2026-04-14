# Análise de Concorrente: Sermonary

Este documento foi criado para catalogarmos as capturas de tela e melhores ideias de UX/UI extraídas do aplicativo concorrente (Sermonary), que servirão de base para a futura modelagem da nossa área de Sermões.

## Lote 1 - Imagens Recebidas

1. **Dashboard de Séries / Recursos**
   - Grade visual de Séries de Sermões, bem semelhante a serviços de streaming.
   - Filtros laterais bem definidos (Tópicos Populares, Tipo de Recurso, Categoria de Livros Bíblicos).

2. **Detalhes do Recurso / Upsell**
   - Descrição simples da série.
   - Gatilho claro de Upsell: "Faça upgrade para Sermonary+"
   - Checklists visuais informando o que está incluído no pacote (Perguntas para pequenos grupos, vídeos, arquivos de Photoshop, etc).

3. **Tela de Modelos (Templates de Sermões)**
   - Categorização muito inteligente e pronta para uso (Tradicional 3 pontos, Método EU-NÓS-DEUS-VOCÊ-NÓS, Comentário Verso a Verso, Esboço do Defensor).
   - Botões diretos para pré-visualização ou usar o modelo imediato.

4. **Sermon Settings / Configurações do Sermão (Sidebar)**
   - Sidebar à direita, sobrepondo sutilmente a interface ("Sermon Settings").
   - Inputs organizados: Título, Série Relacionada, Passagem Bíblica, "Grande Ideia" da Mensagem (Big Idea).
   - Contagem de palavras visível (Word Count) baseada nos blocos.

5. **Modo Pódio (Podium Mode)**
   - Um botão de "Multiplicar" na interface do editor (referência a ser profundamente investigada e aproveitada).
   - Um menu "Configurações do Modo Pódio" muito voltado para a hora da pregação.
   - Controle de contagem regressiva vs horário atual.
   - Controles rápidos para Aumentar/Diminuir fonte na hora.
   - Botões integrados de compartilhamento de URL privada do pódio, Download e Imprimir.

*Aguardando... Lote 2 de imagens.*

## Lote 2 - Imagens Modo Escuro (Dark Mode)

6. **Modelos em Dark Mode**
   - A mesma categorização inteligente, mas provando que a interface se sustenta muito bem num dark mode acinzentado (foco em leitura sem fadiga visual).

7. **Sermon Settings (Dark Mode)**
   - A gaveta lateral converte-se graciosamente. O visual contrasta muito bem com os campos de Input (passagem bíblica, big idea).

8. **Recursos com Hover State Mágico**
   - Efeito Netflix: ao passar o mouse sobre o cover da série, um overlay azul sobe exibindo a sinopse/descrição completa da série, otimizando o espaço sem precisar de muitos cliques.

## Lote 3 - Estrutura de Blocos do Editor (Dark Mode)

9. **Modelo de Ensino Criativo (Visão do Editor)**
   - O editor de sermões é dividido em **"Blocos"**. 
   - A hierarquia visual é baseada em grandes "Containers" numéricos verticais (Ex: `1 Gancho`, `2 Livro`) que englobam sub-blocos menores.
   - Textos de ajuda/placeholders bem sugestivos dentro de cada bloco vazio (Ex: *"Cative a atenção do seu público..."*), o que ajuda quem vai redigir a sair do bloqueio criativo.
   - Presença clara dos botões de ação ("+") sutis entre os blocos para inserir novos elementos.

## Lote 4 - Dashboard de Sermões Salvos

10. **Aba Sermões**
   - Exibe os sermões individuais salvos pelo usuário em formato de cards bem amplos e limpos.
   - O botão principal azul 'Escreva novo' fica isolado no canto superior direito ao lado da barra de busca.

## Lote 5 - Escolha de Editor, Módulos Laterais e Exportação Master

11. **Duas vias de Editor (Escolha de Editor)**
   - O aplicativo mostra um Modal perguntando se o usuário prefere o **"Editor de Blocos"** (guiado, formatado, estilo lego) ou o **"Abrir editor"** livre (texto corrido simples). É uma excelente sacada de empatia com usuários que têm bloqueio com interfaces complexas.

12. **Sidebar de "Add a Block" (Adicionar Bloco)**
   - Excelente detalhe visual: cada tipo de bloco tem uma cor de linha no topo:
     - *Bible Passage* (Vermelho)
     - *Point* (Amarelo)
     - *Illustration* (Azul claro)
     - *Application* (Cinza)
     - *Quote* (Verde)
     - *Media* (Roxo)
   - Isso ajuda a "esculturar" e varrer os olhos pelo sermão sentindo o ritmo da mensagem facilmente pelas cores de demarcação lateral.

13. **Podium Mode e Exportação Omnichannel**
   - No menu lateral do Podium (Configurações do Modo Pódio), podemos gerar um **Link Público** na hora para o pastor entregar pra mesa de som ou outro dispositivo.
   - Os botões de **PDF, PowerPoint e MS Word** sugerem que eles encapsulam e cospem a estrutura do sermão já em vários formatos vitais para arquivar.
   - O Contador regressivo grandão fica posicionado no centro-topo, com tela toda preta focada no "Teleprompter". Nenhuma distração para quem está no altar pregando!

## Lote 6 - Podium Mode Light Mode e Limpeza Visual

14. **Flexibilidade de Iluminação (Teleprompter Light Mode)**
   - O aplicativo também suporta projetar o Modo Pódio em fundo branco com letras escuras. Isso prova uma maturidade de UX: algumas igrejas a céu aberto ou com muita iluminação podem sofrer com reflexo no dark mode, e o Light Mode salva o pastor nesses ambientes claros.
   - A taxonomia continua impecável. Mesmo no pódio, os blocos mantêm os rótulos finos (Ex: "EXPLICAÇÃO", "ILUSTRAÇÃO", "APLICATIVO") com a barrinha colorida discreta embaixo, ajudando o cérebro a transitar a entonação da voz do pregador.
