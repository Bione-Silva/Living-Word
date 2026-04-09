# Living Word - Arquitetura de Créditos e Custos (EUA)

## 1. Visão Geral e Margem de Lucro
O objetivo desta arquitetura é garantir uma margem de lucro superior a 80% (meta: manter custos de API abaixo de $3 no Starter e $6 no Pro), enquanto oferece uma experiência que parece abundante para o usuário final, mas é matematicamente controlada pela plataforma.

**Filosofia Central (SaaS Moderno):** A plataforma não bloqueia o usuário limitando "número de usos por ferramenta". O cliente é livre para focar exclusivamente nas ferramentas que ele mais gosta (ex: gastar todo o plano apenas gerando Sermões ou apenas Títulos). **O único limite que importa e que trava o usuário é o consumo do seu saldo global da carteira de créditos (Credit Wallet).** Ferramentas avançadas ou proibidas (ex: "Mentes Brilhantes" no Free) são bloqueadas de acordo com as permissões do plano, mas de resto, é a matemática dos créditos que dita o jogo.

### Regra de Ouro (Apenas Interna):
**1 Crédito = Aprox. 100 Tokens reais (Entrada + Saída)**
*(Essa não é uma regra exibida ao usuário. É a base matemática que mantém a empresa segura e altamente lucrativa)*

## 2. Novos Limites de Créditos por Plano
Com base no seu custo alvo, ajustamos levemente a quantia ofertada para proteger seu orçamento de $3 e $6:

*   **Grátis ($0/mês - O Testador)**
    *   **Créditos Ofertados:** 500 créditos (Batendo de frente com o concorrente)
    *   **Custo Máximo API (Real):** ~$0.03 a ~$0.05 centavos (Ainda absurdamente barato para gerar o lead).
    *   **Função Estratégica:** Geração de lead agressivo. O usuário tem poder suficiente para gerar de tudo um pouco, viciar no produto, mas rapidamente bater na trava de paywall caso queira constância.

*   **Starter ($9.90/mês)**
    *   **Créditos Ofertados:** 4.000 créditos *(Você ofereceu 4k, soa como muito impacto!)*
    *   **Custo Máximo API (Real):** ~$0.30 a ~$0.50 (Usando modelos como GPT-4o-mini ou Gemini Flash)
    *   **Sua Margem Bruta (API):** > 95%
    *   *Nota:* O custo ficará absurdamente longe dos $3.00 de teto que você estipulou.

*   **Pro ($29.90/mês)**
    *   **Créditos Ofertados:** 8.000 créditos *(Ajustado de 10k para 8k para proteger a margem do modelo avançado)*
    *   **Custo Máximo API (Real):** ~$2.00 a ~$6.00 (Considerando que ele gastará uma parte ligando a inteligência bruta do "Mentes Brilhantes")
    *   **Sua Margem Bruta (API):** > 80%

*   **Igreja ($79.90/mês)**
    *   **Créditos Ofertados:** 20.000 créditos *(Ajustado de 30k para 20k)*
    *   **Custo Máximo API (Real):** ~$15.00 a ~$20.00 (Uso pesado de modelos avançados e múltiplos usuários)
    *   **Sua Margem Bruta (API):** > 75%

---

## 3. Tabela de Custos por Ferramenta (As 23 Ferramentas)
Como conversamos, 1 crédito não pode equivaler a 1 geração. Dividimos as ferramentas em 4 categorias de "Peso". Você implementará esses custos no banco de dados.

| Tamanho / Complexidade | Custará pro Usuário | Equivalência Real (Tokens) | Exemplos de Ferramentas Nativas |
| :--- | :--- | :--- | :--- |
| **Pequena (Micro)** | **5 Créditos** | ~500 tokens | Títulos para Sermão, Ideias de Conteúdo, Resumo de Versículo, Post de Instagram simples, Legendas, Devocional Curto. |
| **Média (Padrão)** | **15 Créditos** | ~1.500 tokens | Esboço de Sermão, Artigo de Blog Simples, Planejamento Mensal, Tradução de Texto, Posts Longos (LinkedIn/Blog). |
| **Grande (Extensa)** | **30 Créditos** | ~3.000 tokens | **Sermão Completo Escrito**, Roteiro de Vídeo (YouTube), Guia para Célula/Pequeno Grupo, Roteiro de Podcast. |
| **Complexa (Agente)** | **60 Créditos** | ~6.000+ tokens | **Estudo Bíblico Aprofundado (Exegese)**, Análise de Contexto Histórico, Pesquisa Teológica Profunda, Criação de Curso/Série. |

### 🚨 A Mecânica "Mentes Brilhantes" (Exclusivo PRO/IGREJA)
Quando o usuário ativa o toggle "Mentes Brilhantes" (que roteia para o verdadeiro GPT-4o ou Claude 3.5 Sonnet):
*   **Multiplicador de Custo:** x3 (Triplica o custo).
*   *Exemplo prático:* Se ele gerar um "Estudo Bíblico Aprofundado" no modelo comum, gasta 60 créditos. Se ele rodar com a "Mente Brilhante", a ferramenta cobra **180 créditos**.
*   *Por que fazer isso?* Porque a API do GPT-4o custa 30x mais que a do mini. Multiplicar o custo de créditos saca o saldo dele mais rápido e impede que o seu teto de $6 vá para o ralo.

---

## 4. Teste de Estresse (A simulação que você pediu)
Vamos provar que a tabela de custos acima te protege contra qualquer cenário de abuso, observando o comportamento de 4 tipos de perfis de usuários:

### Cenário 0: O Lead "Grátis" (500 créditos)
*   **Uso:** Ele se cadastra para sentir o nível da IA. Gera 2 Sermões (60c), 3 Esboços (45c) e 5 de Títulos (25c).
*   **Gasto na Sessão:** 130 créditos.
*   *Efeito Magia do Paywall:* Ele "brinca" maravilhado e logo gasta de 100 a 200 créditos na primeira semana. Nos primeiros dias de uso real da igreja, ele zera os 500. A trava ativa cobrando o Starter de $9.90. E você pagou incríveis ~R$ 0,15 centavos para criar e converter esse lead engajado.

### Cenário 1: O "Pastor Comum"
*   **Uso:** Faz 1 Sermão Completo (30c) + 2 posts de Instagram (10c) por semana.
*   **Gasto Mensal:** 160 créditos.
*   *Efeito:* Ele tem 4.000 créditos. Ele vai sentir que o plano é literalmente infinito. Vai assinar para o resto da vida porque é barato (9.90) e o saldo nunca acaba. Seu custo vai ser centavos.

### Cenário 2: O "Pastor Heavy User"
*   **Uso:** 3 ferramentas Médias/Grandes POR DIA. (Ex: 1 Esboço, 1 Resumo, 1 Estudo).
*   **Gasto Médio Diário:** ~80 créditos.
*   **Gasto Mensal:** 2.400 créditos.
*   *Efeito:* Cabe perfeitamente no Starter de 4.000 créditos. Ele sai satisfeitíssimo. Seu custo continua abaixo de $0.50.

### Cenário 3: A "Agência / Igreja Gigante Abusiva"
*   **Uso:** Tenta usar 1 documento POR DIA em TODAS as 23 ferramentas!
*   **Gasto Médio por ferramenta:** ~20 créditos.
*   **Gasto Diário (23 x 20c):** 460 créditos.
*   **Gasto Mensal Total:** **13.800 créditos.**
*   *Efeito Mágico:* O limite do Starter (4k) trava esse cara na primeira semana! O limite do Pro (8k) trava ele na metade do mês. Se ele quiser manter esse ritmo maluco, a matemática o OBRIGA a assinar o plano Igreja (20.000 créditos - $79.90). A plataforma se autodefende.

---

## 5. Simulador de Hover (Potencial de Geração Isolada)
Se o usuário passar o mouse no ícone de interrogação (❔) ao lado dos créditos na tela de preços, ele precisa entender o valor tangível daquilo. Esta tabela mostra **quantos documentos daquele tipo** ele consegue gerar no mês, caso ele gaste 100% dos seus créditos de forma isolada apenas naquela ferramenta.

Levando em conta os créditos: **Grátis** (500c), **Starter** (3.000c - *como no seu áudio*), **Pro** (8.000c) e **Igreja** (20.000c).

| Categoria da Ferramenta | Custo | Grátis (500c) | Starter (3.000c) | Pro (8.000c) | Igreja (20.000c) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Pequena (Micro)** <br>*(Ex: Títulos, Ideias, Resumo)* | **5c** | **100** ger. | **600** ger. | **1.600** ger. | **4.000** ger. |
| **Média (Padrão)** <br>*(Ex: Esboço, Post, Artigo)* | **15c** | **33** ger. | **200** ger. | **533** ger. | **1.333** ger. |
| **Grande (Extensa)** <br>*(Ex: Sermão Escrito)* | **30c** | **16** ger. | **100** ger. | **266** ger. | **666** ger. |
| **Complexa (Agente)** <br>*(Ex: Estudo Bíblico)* | **60c** | **8** ger. | **50** ger. | **133** ger. | **333** ger. |

> *Nota de UX:* Ao exibir isso na Lovable, você pode arredondar os números (ex: mostrar `+530 integrações` ao invés de `533`) para melhor estética. E esse cálculo mostra ao cliente que no plano de $9 ele faz "até 100 Sermões", o que gera um valor percebido gigantesco, enquanto custa míseros dezenas de centavos para você de API.

---

## 6. Lista Oficial de Capacidade por Ferramenta (As 23 Ferramentas)
Aqui está a tabela completa das 23 ferramentas mapeadas para a interface (exatamente o que vai aparecer no "Hover/Tooltip" quando ele colocar o mouse sobre o plano respectivo). A tabela assume a conversão real do gasto **100% dedicado** àquela ferramenta específica.

| # | Ferramenta | Categoria (Créditos) | Grátis (500c) | Starter (3.000c) | Pro (8.000c) | Igreja (20.000c) |
|---|---|---|---|---|---|---|
| 1 | Títulos para Sermão | Pequena (5c) | 100 | 600 | 1.600 | 4.000 |
| 2 | Ideias de Conteúdo para Redes | Pequena (5c) | 100 | 600 | 1.600 | 4.000 |
| 3 | Resumo de Versículo | Pequena (5c) | 100 | 600 | 1.600 | 4.000 |
| 4 | Post de Instagram Simples | Pequena (5c) | 100 | 600 | 1.600 | 4.000 |
| 5 | Legenda Curta (TikTok/Reels) | Pequena (5c) | 100 | 600 | 1.600 | 4.000 |
| 6 | Oração Curta / Bênção | Pequena (5c) | 100 | 600 | 1.600 | 4.000 |
| 7 | Esboço de Sermão | Média (15c) | 33 | 200 | 533 | 1.333 |
| 8 | Artigo Devocional Simples | Média (15c) | 33 | 200 | 533 | 1.333 |
| 9 | Planejamento Mensal de Ensino | Média (15c) | 33 | 200 | 533 | 1.333 |
| 10 | Roteiro Completo para Reels | Média (15c) | 33 | 200 | 533 | 1.333 |
| 11 | Tradução Bíblica (Contextual) | Média (15c) | 33 | 200 | 533 | 1.333 |
| 12 | Post Longo (Blog Médio/LinkedIn)| Média (15c) | 33 | 200 | 533 | 1.333 |
| 13 | Resposta Apologética | Média (15c) | 33 | 200 | 533 | 1.333 |
| 14 | Liturgia / Layout de Culto | Média (15c) | 33 | 200 | 533 | 1.333 |
| 15 | Sermão Completo Escrito | Grande (30c) | 16 | 100 | 266 | 666 |
| 16 | Roteiro de Vídeo (YouTube) | Grande (30c) | 16 | 100 | 266 | 666 |
| 17 | Guia de Célula / Pequeno Grupo | Grande (30c) | 16 | 100 | 266 | 666 |
| 18 | Roteiro de Podcast Teológico | Grande (30c) | 16 | 100 | 266 | 666 |
| 19 | Estudo Devocional Semanal | Grande (30c) | 16 | 100 | 266 | 666 |
| 20 | Série de Esboços (1 Mês) | Grande (30c) | 16 | 100 | 266 | 666 |
| 21 | Estudo Bíblico Aprofundado | Complexa (60c)| 8 | 50 | 133 | 333 |
| 22 | Contexto Histórico/Cultural | Complexa (60c)| 8 | 50 | 133 | 333 |
| 23 | Série / Curso Formativo Inteiro| Complexa (60c)| 8 | 50 | 133 | 333 |

*(Essa tabela é o mapa perfeito para os desenvolvedores e designers implementarem a interação de "Tooltip" na tela de Assinatura, garantindo que o usuário sinta a imensidão do pacote).*

---

## 7. UX/UI: Monitoramento e Relatório de Uso
Para garantir a percepção de valor contínuo e total transparência, a interface (tanto na *Sidebar* quanto na tela de *Configurações > Plano e Uso*) deve exibir o consumo da seguinte maneira:

*   **Display Constante de Saldo:** A barra lateral inferior exibe o contador atualizado em tempo real (ex: `14.978 disponíveis`) com uma progress bar sutil, mostrando a saúde da carteira.
*   **Botão/Link "Relatório de Uso":** Na seção *Plano e Uso* (ou próximo ao mostrador de saldo), existirá uma área para o histórico detalhado.
*   **O "Extrato" de Transparência:** Quando o usuário clica para ver o histórico, ele recebe uma lista clara de onde os créditos foram parar, exatamente como um extrato bancário:
    *   *Sermão: O Bom Pastor (-30c)*
    *   *Carrossel de Instagram (-15c)*
    *   *Títulos Devocionais (-5c)*
*   **O Gatilho Psicológico:** Ao invés dele achar que os créditos estão sumindo rápido, o extrato força ele a visualizar a montanha incrível de conteúdos reais e valiosos que a plataforma gerou para o ministério dele nos últimos dias. Isso justifica a renovação do plano e derruba qualquer objeção.

---

## 8. Estratégia de Upsell: Recarga Avulsa (Credit Top-Ups)
Para aproveitar picos de urgência (ex: Sábado à noite, com o pastor sob pressão montando o culto de domingo), o usuário do plano Starter ($9.90) que esgotou seu limite não precisa ser forçado a fazer upgrade pro Pro ($29.90) no desespero. Você oferece o botão de alívio imediato (Add-on).

*   **A Oferta (Add-on):** Clique de segurança "Adicionar +4.000 Créditos Extras".
*   **O Preço de Urgência:** $7.00.
*   **A Lógica Psicológica:** Ele não quer triplicar a sua fatura mensal assinando o Pro naquele momento. Mas pagar $7 dólares pra sair do desespero e quebrar o galho é uma compra impossível de recusar.
*   **A Margem Imoral:** Você vende os mesmos pacotes de entrada de 4.000 créditos de forma pontual. O seu custo original da OpenAI/AWS continuará na faixa de ~$0.50 centavos. Seu lucro num clique desesperado é quase 95% ($6.50 puros). É literalmente vender oxigênio para quem tá sem respirar.

---

## 9. Multi-Usuários: "Assentos Extras" vs "Recargas" (O Plano Igreja)
O plano corporativo (Igreja) lida com grandes equipes. Como o usuário vai lidar com o limite? Ele tem **AS DUAS** opções à disposição dele, e ambas geram lucro bruto:

**A. Opção de Escala: Adicionar Pessoas (Venda de Assento / Seat)**
Gera e escala o seu **Faturamento Recorrente (MRR)** mensal. 
*   **O Cenário:** A igreja cresce e quer colocar o time de jovens no sistema.
*   **A Mecânica:** O administrador altera o *Slider* de "+ Membros Extras". Passa a pagar mais, por exemplo, $10.00/mês fixos por membro extra. Em troca do pagamento recorrente, o teto da carteira da igreja inteira cresce (ex: +2.000 créditos base/mês). 

**B. Opção de Abuso: Comprar Crédito Direto (Recarga Avulsa / Top-Up)**
Gera o seu **Faturamento de Impulso (NRR)**.
*   **O Cenário:** A equipe atual esgotou e afundou a conta na metade do mês organizando conferência.
*   **A Mecânica:** Eles não vao (e nem devem) assinar mais membros na fatura mensal porque não tem gente entrando. Eles só precisam rodar script pra essa semana. Ele usa o Add-on de "Adicionar +10.000 Créditos Extras" por $19,00. Checkout com 1 clique usando o cartão salvo na Stripe. A plataforma embolsa $18 dólares de lucro na hora.
