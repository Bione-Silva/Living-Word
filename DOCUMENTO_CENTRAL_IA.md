# Documento Central de Arquitetura de Inteligência Artificial — Living Word

Este é o documento "Master" que compila **todas as funcionalidades, telas, ferramentas, modelos e fluxos de execução** da plataforma Living Word. 

Este catálogo visa dar o panorama exato do que acontece no backend (Supabase Edge Functions) toda vez que o usuário (Pastor, Líder de Célula, etc.) aperta um botão na interface construída no Lovable.

---

## 💡 1. Comparativo Estratégico de Modelos (Unit Economics)

Conforme análise de viabilidade, temos dois motores principais. O modelo do **Google (Gemini 2.5 Flash)** é cerca de 50% mais barato que o modelo da **OpenAI (GPT-4o-mini)** em processamento de texto, tornando-o a escolha ideal para extração de dados e consultas.

| Modelo             | Provedor | Custo (Input - 1M Tokens) | Custo (Output - 1M Tokens) | Casos de Uso Ideais |
|--------------------|----------|---------------------------|----------------------------|---------------------|
| **Gemini 2.5 Flash** | Google   | ~$0.075                   | ~$0.30                     | Processamento de vídeos pesados (YouTube), busca bíblica nativa, pesquisas factuais, traduções. |
| **GPT-4o-mini**      | OpenAI   | ~$0.150                   | ~$0.600                    | Redação de devocionais longos, emulação de voz pastoral rica em sentimentos (gratuitos). |
| **GPT-4o**           | OpenAI   | ~$2.500                   | ~$10.000                   | Nível hiper-premium de teologia para planos pagos, textos criativos profundos. |

> **Decisão de Arquitetura:** Tarefas como a [14] (YouTube para Blog) e ferramentas de busca na Bíblia não "criam do zero", elas apenas resumem e reestruturam. Portanto, delegar essas tarefas ao **Gemini 2.5 Flash** corta nossos custos de processamento desses recursos críticos **pela metade**, com uma velocidade de resposta superior.

---

## 🛠️ 2. Mapeamento Total de Ferramentas (A Interface)

Abaixo estão relacionadas todas as ferramentas distribuídas no layout do painel (Dashboard), apontando o que cada botão faz debaixo dos panos.

### Grid 1: Ferramentas de Pesquisa
*Foco: Extração, Pesquisa Bíblica, Busca de Contexto Histórico.*
* **Modelo Executante:** Gemini 2.5 Flash
* **Edge Function Base:** `search-pastoral-tools`
* **Tela:** `/estudio` (Aba Pesquisar)

1. **Explorador de Tópicos:** Recebe um tema ("perdão") e retorna tópicos de pregação.
2. **Encontre Versículos sobre o Tema:** Faz match semântico e traz os versos, consultando a base da API Bíblica/Gemini.
3. **Contexto Histórico do Verso:** Retorna o panorama sócio-histórico daquela passagem.
4. **Localizador de Cotações:** Traz citações de teólogos clássicos (Spurgeon, Agostinho, etc) sobre o tema.
5. **Localizador de Cenas de Filmes:** Sugere filmes comerciais que podem ser usados como ilustração do sermão.
6. **Explorador de Texto Original (🔒 Premium):** Exibe a raiz hebraica/grega do texto.
7. **Localizador de Letras Originais (🔒 Premium):** Sugere hinos e canções clássicas sobre o texto.

---

### Grid 2: Ferramentas de Escrita & Criação 
*Foco: Originalidade, Escrita do Zero, Tom de Voz Pastoral (Empatia/Exposição).*
* **Modelo Executante:** GPT-4o-mini (Free) | GPT-4o (Premium)
* **Edge Function Base:** `generate-pastoral-material`
* **Tela:** `/estudio` (Aba Criador)

8. **Estúdio Pastoral (O Clássico):** É o gerador mestre que devolve 6 formatos (Esboço, Texto, etc) de uma vez.
9. **Gerador de Títulos Criativos:** Sugere ganchos de atenção (Clickbaits cristãos éticos).
10. **Criador de Metáforas:** Inventa parábolas modernas para ilustrar a dor da audiência.
11. **Ilustrações para Sermões (🔒 Premium):** Traz contos baseados em fatos reais para a pregação.
12. **Modernizador de Histórias Bíblicas:** Reescreve perícopes em linguagem atual com cenário contemporâneo.
13. **Artigo Livre e Redator Universal:** Criação longa de texto para blog (Função `generate-blog-article`).

---

### Grid 3: Ferramentas de Alcance
*Foco: Reestruturação, Formatação Diferenciada, Transcrição.*
* **Tela:** `/estudio` (Aba Alcance)

14. **Transformar Vídeo em Blog:** Lê o áudio/Closed Captions do YouTube e estrutura em post de Blog.
    * *Modelo Executante:* **Gemini 2.5 Flash** (Novo! Mais barato e ideal para leitura longa de vídeo).
    * *Edge Function Base:* `process-youtube-audio`.
15. **Postagens para Redes Sociais:** Cria carrosséis e roteiro focado no Instagram/TikTok.
    * *Modelo Executante:* GPT-4o-mini (Free) | GPT-4o (Premium) usando `generate-pastoral-material`.
16. **Perguntas para Grupos / Célula:** Quebra-gelo e perguntas de aplicação.
    * *Modelo Executante:* GPT-4o-mini (Free) | GPT-4o (Premium) usando `generate-pastoral-material`.
17. **Resumo Rápido de Sermão:** Criação de resumos executivos.
    * *Modelo Executante:* GPT-4o-mini (Free) | GPT-4o (Premium) usando `generate-pastoral-material`.
18. **Criador de Boletim / Newsletter Semanal:** E-mail de motivação curta.
    * *Modelo Executante:* GPT-4o-mini (Free) | GPT-4o (Premium) usando `generate-pastoral-material`.

---

### Grid 4: Ferramentas Divertidas e Dinâmicas
*Foco: Criatividade rápida, engajamento.*
* **Modelo Executante:** Gemini 2.5 Flash
* **Edge Function Base:** `search-pastoral-tools`
* **Tela:** `/estudio` (Aba Dinâmicas)

19. **Curiosidades Bíblicas Obscuras:** Gera fatos interessantes quase desconhecidos.
20. **Textos em Poesia / Compositor:** Transforma um ensino num cordel ou poema.
21. **Histórias para o Ministério Infantil:** Adapta o contexto teológico profundo para linguagem de até 10 anos.
22. **Tradução Exegética Profunda (🔒 Premium):** Traz as minúcias que se perdem na tradução tradicional portuguesa.

---

## ⚡ 3. Funções Automatizadas em Background (Orquestração)
Estas não são ferramentas "clicáveis" no painel frontal, mas sim serviços automáticos que mantêm o software operando com zero atrito para o usuário.

23. **Criação de Subdomínio (Onboarding):** Assim que o usuário cria conta, a Edge Function `provision-user-blog` roda no webhook gerando 2 devocionais com o **GPT-4o-mini** e cria subdomínio e blog WordPress.
24. **Busca na Bíblia (`fetch-bible-verse`):** Função backend que resgata os limites do banco de dados (API free ou, como plano de contigência RAG, no **Gemini 2.5 Flash**).
25. **Motor de Cobrança (`stripe-webhook`):** Monitora assinaturas e destrava os cadeados (🔒) das ferramentas Premium instantaneamente no painel.
26. **Publicador Direto (`publish-to-wordpress`):** O módulo que transporta o texto puro para HTML via API REST do WordPress no blog do pastor com 1 botão "Publicar Imediato".
27. **Robô de Fila (`schedule-publication`):** Cronjob do banco Supabase que checa a cada hora se um artigo tem "Data Agendada" e executa a postagem na hora certa.

---
*Fim do Relatório Central Living Word*
