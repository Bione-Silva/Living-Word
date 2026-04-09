# Estruturação de Teologia Bíblica e Agentes (Análise de Repositórios)

Com base nos 5 repositórios fornecidos, esta análise foca exclusivamente no aspecto de **Estruturação de Teologia Bíblica**, os **Ganhos** para o projeto Living Word, e as **Skills/Agentes** que podemos derivar diretamente dessa inteligência.

---

## 1. Freely-Given.org (OpenBibleData)
*A fundação dos dados teológicos abertos e mapeamentos estruturados.*

*   **Estruturação Teológica:** Eles transformam a Bíblia de um "livro de texto corrido" para um "banco de dados teológico". Estruturam ontologias: pessoas, lugares, linhas do tempo e raízes originais (grego/hebraico).
*   **O que Ganhamos:** Combate absoluto à alucinação de IA. A nossa IA não vai adivinhar onde Paulo esteve; ela vai cruzar dados com uma ontologia exata.
*   **Agentes e Skills a criar:**
    *   🤖 **Agente: `Bibliographic Data Scientist`**: Um agente focado apenas em rastrear conexões exatas.
    *   🛠️ **Skill: `ontology-cross-referencer.md`**: Um prompt que ensina os agentes (como Spurgeon ou Calvino) a sempre embasar suas exegeses consultando grafos e dicionários originais, garantindo precisão histórica.

## 2. AndBible / sword_studybibles
*A engenharia de atrelar notas, comentários e teologia ao texto base.*

*   **Estruturação Teológica:** Mostra como a teologia é construída em camadas (Layers). O texto bíblico é a camada 0. A "Bíblia de Estudo" adiciona a Camada 1 (notas de rodapé por intervalo de versículos), Camada 2 (introdução ao livro) e Camada 3 (dicionário).
*   **O que Ganhamos:** O *blueprint* para gerar nossas próprias "Bíblias de Estudo AI" sob demanda. Em vez de raspar uma Bíblia de Estudo existente, usaremos a IA para gerar os meta-textos usando esse exato formato de dados.
*   **Agentes e Skills a criar:**
    *   🤖 **Agente: `Study Bible Compiler`**: Um arquiteto teológico. Você pede "Faça a Bíblia de Estudo da Esperança". Ele varre a base e atrela comentários a passagens específicas usando a arquitetura de *ranges*.
    *   🛠️ **Skill: `study-notes-generator.md`**: Uma habilidade que ensina a IA a escrever comentários não como "texto corrido de blog", mas como fragmentos atrelados a um `[Livro-Capítulo-Verso]`.

## 3. CrossWire / Xiphos
*Cultura de "Estudo Profundo" em janelas paralelas.*

*   **Estruturação Teológica:** Teologia levada a sério requer análise paralela. Xiphos estrutura o estudo em 4 pilares simultâneos: Texto, Léxico (Strong's), Comentário e Dicionário.
*   **O que Ganhamos:** A matriz do método indutivo. A teologia não é um pensamento isolado, mas a intersecção dessas quatro forças.
*   **Agentes e Skills a criar:**
    *   🤖 **Agente: `Hermeneutic Master (Expositor)`**: Um agente que simula a interface do Xiphos no próprio cérebro. Antes de dar o sermão final, ele obrigatoriamente processa (1) O Idioma Original, (2) O Comentário Histórico, (3) A Passagem Paralela.
    *   🛠️ **Skill: `parallel-exegesis.md`**: Força a IA a apresentar resultados no formato de "painel duplo" (O que diz a tradução X o que significa a raiz original).

## 4. CrossWire / JSword
*O motor de indexação e recuperação de chaves bíblicas.*

*   **Estruturação Teológica:** Transforma a teologia em "Buscabilidade" (Searchability). Cria chaves canônicas universais (`GEN.1.1`).
*   **O que Ganhamos:** O padrão absoluto de comunicação entre os agentes. No Antigravity, se o agente do "Billy Graham" for conversar com o agente "Calvino", eles usarão chaves canônicas para não se perderem em traduções diferentes.
*   **Agentes e Skills a criar:**
    *   🛠️ **Skill: `canonical-indexer.md`**: Uma instrução base para TODOS os agentes do Antigravity. Eles são estritamente forcidos a referenciar qualquer citação bíblica usando chaves normatizadas da API do JSword (ex: "Considere `ROM.8.1`" em vez de "Lá em Romanos 8").

## 5. AndBible / and-bible (O App Principal)
*A jornada e UX do usuário no consumo da Teologia.*

*   **Estruturação Teológica:** Como a teologia é consumida pelas ovelhas e líderes. O fluxo de hiperlinks (tocar numa palavra e abrir um conceito temático).
*   **O que Ganhamos:** O modelo mental para conexões de rede (Linked Data).
*   **Agentes e Skills a criar:**
    *   🤖 **Agente: `Topical Journey Mapper`**: Um agente que lê um texto gerado e automaticamente o transforma em uma rede de hiperlinks teológicos (ex: quando ele gerar um estudo sobre "Graça", ele automaticamente tageia e conecta com "Justificação" na base de dados).
