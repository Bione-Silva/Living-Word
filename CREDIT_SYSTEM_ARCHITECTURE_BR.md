# Living Word - Arquitetura de Créditos e Custos (BRASIL)

## 1. Visão Geral e Margem de Lucro
O objetivo desta arquitetura é garantir uma margem de lucro superior a 80% operando com mensalidades em Reais (BRL), enquanto oferece uma experiência abundante para o usuário final no mercado brasileiro.

**Filosofia Central (SaaS Moderno):** A plataforma não bloqueia o usuário limitando "número de usos por ferramenta". O cliente é livre para focar exclusivamente nas ferramentas que ele mais gosta (ex: gastar todo o plano apenas gerando Sermões ou apenas Títulos). **O único limite que importa e que trava o usuário é o consumo do seu saldo global da carteira de créditos (Credit Wallet).** Ferramentas avançadas ou proibidas (ex: "Mentes Brilhantes" no Free) são bloqueadas de acordo com as permissões do plano.

### Regra de Ouro (Apenas Interna):
**1 Crédito = Aprox. 100 Tokens reais (Entrada + Saída)**
*(Essa não é uma regra exibida ao usuário. É a base matemática que mantém a empresa segura contra o dólar e altamente lucrativa)*

## 2. Limites de Créditos por Plano (Brasil)
Assumindo os preços sugeridos para o mercado brasileiro (ajustáveis de acordo com sua estratégia de marketing), a quantia de créditos se mantém a mesma da versão EUA para facilitar a gestão do banco de dados (Supabase único), mas com o retorno financeiro calculado baseado na cotação para proteger e evidenciar sua margem de lucro real.

*   **Grátis (R$ 0/mês - O Testador)**
    *   **Créditos Ofertados:** 500 créditos (Batendo de frente com a concorrência nacional)
    *   **Custo Máximo API (USD):** ~$0.03 a ~$0.05 centavos de Dólar.
    *   **Custo na AWS/OpenAI em Reais:** ~ R$ 0,15 a R$ 0,25.
    *   **Função Estratégica:** Geração de lead agressivo no Brasil. O usuário brinca, se maravilha e o paywall trava logo que o uso passa de ocasional para rotina.

*   **Starter (R$ 37,00/mês)**
    *   **Créditos Ofertados:** 4.000 créditos
    *   **Custo Máximo API (USD):** ~$0.30 a ~$0.50.
    *   **Custo na AWS/OpenAI em Reais:** ~ R$ 1,50 a R$ 2,50 de custo num plano de 37 reais.
    *   **Sua Margem Bruta:** > 93%

*   **Pro (R$ 79,00/mês)**
    *   **Créditos Ofertados:** 8.000 créditos
    *   **Custo Máximo API (USD):** ~$2.00 a ~$6.00 (Caso use muito o Mentes Brilhantes).
    *   **Custo na AWS/OpenAI em Reais:** ~ R$ 10,00 a R$ 30,00.
    *   **Sua Margem Bruta:** > 60% a 80% (Depende do peso de uso avançado)

*   **Igreja (R$ 197,00/mês)**
    *   **Créditos Ofertados:** 20.000 créditos
    *   **Custo Máximo API (USD):** ~$15.00 a ~$20.00.
    *   **Custo na AWS/OpenAI em Reais:** ~ R$ 75,00 a R$ 100,00.
    *   **Sua Margem Bruta:** > 50% a 70% (Lucro total por cabeça é o maior do mix)

---

## 3. Tabela de Custos por Ferramenta (As 23 Ferramentas)
*(A mecânica no banco de dados é idêntica ao Global, o custo do produto não muda com a região).*

| Tamanho / Complexidade | Custará pro Usuário | Equivalência Real (Tokens) | Exemplos de Ferramentas Nativas |
| :--- | :--- | :--- | :--- |
| **Pequena (Micro)** | **5 Créditos** | ~500 tokens | Títulos para Sermão, Ideias de Conteúdo, Resumo de Versículo, Post de Instagram simples, Legendas, Devocional Curto. |
| **Média (Padrão)** | **15 Créditos** | ~1.500 tokens | Esboço de Sermão, Artigo de Blog Simples, Planejamento Mensal, Tradução de Texto, Posts Longos (LinkedIn/Blog). |
| **Grande (Extensa)** | **30 Créditos** | ~3.000 tokens | **Sermão Completo Escrito**, Roteiro de Vídeo (YouTube), Guia para Célula/Pequeno Grupo, Roteiro de Podcast. |
| **Complexa (Agente)** | **60 Créditos** | ~6.000+ tokens | **Estudo Bíblico Aprofundado (Exegese)**, Análise de Contexto Histórico, Pesquisa Teológica Profunda, Criação de Curso/Série. |

### 🚨 A Mecânica "Mentes Brilhantes" (Exclusivo PRO/IGREJA)
Quando o usuário ativa o toggle "Mentes Brilhantes" (que roteia para o verdadeiro GPT-4o ou Claude 3.5 Sonnet):
*   **Multiplicador de Custo:** x3 (Triplica o custo).
*   *Por que fazer isso?* Porque a API em dólar dos modelos ponta de linha é quase 30x mais cara. Multiplicar o custo local do lado do usuário blinda a margem de R$ 149,90 dele contra sustos na conversão de dólar da sua fatura no fim do mês.

---

## 4. Teste de Estresse (Cenários Reais no Brasil)

### Cenário 0: O Lead "Grátis" (500 créditos)
*   **Uso:** Um pastor/líder que acabou de achar o software no Instagram e está curioso. Faz o trial e gera 2 Sermões (60c), 3 Esboços (45c) e 5 de Títulos (25c).
*   **Gasto na Sessão:** 130 créditos.
*   *Efeito Magia do Paywall:* Os 500 créditos vão secar nos primeiros 3 dias de uso da igreja dele. A trava levanta oferecendo o plano de R$ 37,00 logo após ele ter percebido que o software te dá semanas de trabalho. Custo da aquisição via IA: R$ 0,25.

### Cenário 1: O "Pastor Comum brasileiro"
*   **Uso:** Prepara o culto do domingo: 1 Sermão Completo (30c) + manda gerar 2 posts de Instagram (10c) pra divulgação do culto.
*   **Gasto Mensal:** Menos de 200 créditos.
*   *Efeito:* Ele paga R$ 37,00 e tem 4.000 créditos. Ele sente que achou ouro infinito. Fica assinante por anos porque está absurdamente barato. O custo dele fica em ridículos 50 centavos de real.

### Cenário 2: O "Pastor Heavy User Diário"
*   **Uso:** Entra todo dia e puxa 3 ferramentas Médias/Grandes. (Ex: Planeja aula da escola dominical, faz roteiro pra jovem, resumo do de ontem).
*   **Gasto Mensal:** ~2.400 créditos.
*   *Efeito:* Cabe folgadamente no Starter de 4.000 (R$ 37,00). Você continua faturando quase toda a mensalidade como lucro bruto.

### Cenário 3: A "Equipe de Mídia Mega Igreja Nacional"
*   **Uso:** Eles dividem a mesma senha ou usam o mesmo plano pra 5 pessoas (Agência/Voluntários). Passam o dia pedindo conteúdo pesadíssimo em lote em todas as ferramentas.
*   **Gasto Diário (10 Pessoas operando):** +400 créditos/dia
*   **Gasto Mensal Total:** **+ 12.000 créditos.**
*   *Efeito Ouro:* Esse ritmo frenético esmaga o Starter e depois acaba com o plano Pro rapidamente antes da metade do mês. A usabilidade brutal dessa Igreja VAI empurrar ("forçar") a equipe deles a assinar o plano "Igreja" Nacional por R$ 197,00, ou eles param de trabalhar. O limite da carteira defende a margem.

---

## 5. Simulador de Hover (Potencial de Geração - Brasil)
*(Idêntico ao contexto Global para unificar a apresentação de interface na Lovable, apenas moldando o apelo de preço).*

| Categoria da Ferramenta | Custo | Grátis (500c) | Starter (3.000c) | Pro (8.000c) | Igreja (20.000c) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Pequena (Micro)** | **5c** | **100** ger. | **600** ger. | **1.600** ger. | **4.000** ger. |
| **Média (Padrão)** | **15c** | **33** ger. | **200** ger. | **533** ger. | **1.333** ger. |
| **Grande (Extensa)** | **30c** | **16** ger. | **100** ger. | **266** ger. | **666** ger. |
| **Complexa (Agente)** | **60c** | **8** ger. | **50** ger. | **133** ger. | **333** ger. |

---

## 6. Lista Oficial de Capacidade por Ferramenta (As 23 Ferramentas)
*(Tabela de referência técnica para cruzamento de dados com a UI do Pricing).*

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

---

## 7. UX/UI: Monitoramento e Relatório de Uso (Módulo BR e Global)
Para garantir a percepção de valor contínuo e total transparência, a visão de relatório funciona exatamente da mesma maneira para qualquer mercado:

*   **Display Constante de Saldo:** A barra lateral inferior exibe o contador atualizado em tempo real (ex: `14.978 disponíveis`) com uma progress bar sutil, mostrando a saúde da carteira.
*   **Botão/Link "Relatório de Uso":** Ligado direto na aba de *Plano e Assinatura* com todo o histórico consolidado.
*   **O "Extrato" de Transparência:** Quando o usuário acessa em PT-BR:
    *   *Sermão: O Bom Pastor (-30c)*
    *   *Carrossel de Instagram (-15c)*
    *   *Títulos Devocionais (-5c)*
*   **O Gatilho Psicológico:** No instinto natural brasiro, ele tende a querer "acompanhar a conta". Ao rolar o extrato longo dele e olhar para trás e ver dezenas e dezenas de tarefas da igreja resolvidas com 1 só clique, a objeção de "está caro renovar os R$ 37" some instantâneamente, gerando retenção alta.

---

## 8. Estratégia de Upsell: Recarga Avulsa (Credit Top-Ups)
Para aproveitar picos de urgência (ex: Sábado à noite, pastor desesperado com o esboço inacabado de domingo), o usuário que esgotou seu limite no plano Starter (R$ 37) não deve ser forçado imediatamente ao plano Pro (R$ 79) - ele pode querer apenas uma "recarga rápida" de emergência.

*   **A Oferta (Add-on):** Botão "Adicionar +4.000 Créditos" destacado em vermelho/dourado quando o limite está abaixo de 5%.
*   **O Preço de Urgência:** R$ 27,00 reais.
*   **A Lógica Psicológica:** Ele não quer assumir o compromisso de dobrar a assinatura mensal (R$ 79), mas desembolsar mais R$ 27 "só pra quebrar o galho" na urgência é instintivo.
*   **O Tiro Certeiro na Margem:** Você entrega apenas 4.000 créditos virtuais. O custo real dessa recarga na API é de ridículos **R$ 1,50 a R$ 2,50**. O lucro imediato na venda desse "bote salva-vidas" é de R$ 24,50 (margem absurda de +90%).

---

## 9. Multi-Usuários: "Assentos Extras" vs "Recargas" (O Plano Igreja)
O plano corporativo (Igreja) lida com grandes equipes. Como o usuário vai lidar com o limite? Ele tem **AS DUAS** opções à disposição dele, e ambas geram lucro puro para o seu caixa de duas maneiras diferentes:

**A. Opção de Escala: Adicionar Pessoas (Venda de Assento / Seat)**
Gera e escala o seu **Faturamento Recorrente (MRR)**. 
*   **O Cenário:** A igreja cresce e quer colocar o time do "Ministério Infantil" pra usar o software com senha separada.
*   **A Mecânica:** Ele usa o *Slider* de "+ Membros Extras". Passa a pagar mais, por exemplo, R$ 19,90/mês fixos por cada conta extra adicionada. Em troca do pagamento recorrente, o teto da carteira da igreja cresce permanentemente (ex: +2.000 créditos por cabeça). 

**B. Opção de Abuso: Comprar Crédito Direto (Recarga Avulsa / Top-Up)**
Gera o seu **Faturamento de Impulso (NRR)**.
*   **O Cenário:** A equipe atual gastou as cotas em lote de forma violenta pra criar todo o evento de Páscoa e esgotou a conta na metade do mês. 
*   **A Mecânica:** Eles não precisam contratar mais funcionários (assentos) pra pagar mensalmente. Precisam de "combustível" na veia pra fechar a semana. Ele ignora adicionar contas e apenas aperta o botão de "Adicionar +10.000 Créditos Extras" (por R$ 47,00 por exemplo). Venda feita num único clique. 
