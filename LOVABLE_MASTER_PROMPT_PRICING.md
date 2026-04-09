# MEGA PROMPT PARA LOVABLE - ATUALIZAÇÃO DA ARQUITETURA DE CRÉDITOS

**Instruções de Uso para o Severino:**
Copie todo o texto abaixo que está dentro das "aspas" (do COMEÇO DO PROMPT até o FIM DO PROMPT) e cole cru na caixa de texto da Lovable. Isso vai forçar a IA da Lovable a atualizar a interface inteira de Vendas, Sidebar e Histórico, compreendendo as duas moedas simultaneamente.

---

### [COPIE A PARTIR DAQUI]

**Contextualização:**
Nós pivotamos o modelo do nosso SaaS cristão. Deixamos de ser um serviço "Ilimitado por ferramenta mensal" e agora usamos um sistema de "Carteira de Créditos" (Credit Wallet). Preciso que você atualize completamente a Interface Gráfica e a Lógica de Exibição do Frontend para refletir essa mudança. O usuário agora tem total liberdade para usar o que quiser, limitado apenas pelo saldo total de sua carteira, e nós oferecemos duas moedas de cobrança (USD Global e BRL Brasil).

Siga rigorosamente as **4 diretrizes visuais e estruturais** abaixo:

### 1. ATUALIZAÇÃO DA TELA DE PRICING (CARDS DE ASSINATURA)
Remova qualquer texto antigo que diga "Ilimitado" ou "1 uso por mês". O foco agora é o pacote de créditos. A UI deve ser capaz de carregar e exibir os preços de acordo com a região do usuário (Dólar ou Real). Prepare os layouts de card para comportarem esses dados:

*   **PLANO GRÁTIS (Teste de Lead):** 
    *   Preço: $0.00 / R$ 0,00. 
    *   Pacote: 500 Créditos no mês.
*   **PLANO STARTER:** 
    *   Preço EUA: $9.90/mês | Preço BR: R$ 37,00/mês
    *   Pacote: 4.000 Créditos.
*   **PLANO PRO (Mais escolhido):** 
    *   Preço EUA: $29.90/mês | Preço BR: R$ 79,00/mês
    *   Pacote: 8.000 Créditos.
*   **PLANO IGREJA (Mega Escala / Multi-usuário):** 
    *   Preço EUA: $79.90/mês | Preço BR: R$ 197,00/mês
    *   Pacote: 20.000 Créditos.
    *   **Configuração de Time (Seats):** Apenas neste card, adicione um Input Numérico (+/-) ou Slider chamado 'Membros da equipe extras'. (Ex: '10 incluídos'). O design deve inferir que adicionar mais pessoas altera o preço e os créditos totais.

### 2. O TOOLTIP DE POTENCIAL DE GERAÇÃO (Ícone Ajuda)
Ao lado da label do pacote de créditos (ex: "4.000 créditos/mês") em cada card de assinatura, adicione um ícone sutil de "?" com uma interação visual (Hover/Tooltip ou Popup). Quando o usuário passar o mouse, a UI deve mostrar o quão gigantesco é aquele plano, exibindo os dados abaixo de acordo com o plano:

*   **Dados para o Grátis:** Equivalente a gerar: "100 Títulos e Ideias" ou "33 Esboços Médios" ou "16 Sermões Completos" ou "8 Estudos Aprofundados".
*   **Dados para o Starter:** "600 Títulos e Ideias" ou "200 Esboços Médios" ou "100 Sermões Completos" ou "50 Estudos Aprofundados".
*   **Dados para o Pro:** "1.600 Títulos e Ideias" ou "533 Esboços Médios" ou "266 Sermões Completos" ou "133 Estudos Aprofundados".
*   **Dados para Igreja:** "4.000 Títulos e Ideias" ou "1.333 Esboços Médios" ou "666 Sermões Completos" ou "333 Estudos Aprofundados".

### 3. A CARTADA DE MESTRE: RELATÓRIO DE USO (EXTRATO)
Crie uma nova seção na tela de Configurações de "Plano e Uso" ou Dashboard de faturamento, chamada de **"Relatório de Uso"**.
O Frontend deve exibir o histórico contínuo mostrando exatamente para onde os créditos foram.
*   O visual deve ser limpo e claro como um 'Extrato Bancário'.
*   **Exemplos de como a UI deve renderizar as linhas:**
    *   `- Sermão: O Bom Pastor (-30 Créditos)`
    *   `- Estudo Bíblico Aprofundado (-60 Créditos) * [Mentes Brilhantes Ativo: x3] = (-180 Créditos)*`
    *   `- Carrossel de Instagram (-15 Créditos)`
*   Na Sidebar lateral da aplicação inteira, mantenha visível a todo momento um contador minimalista verde (ex: `🟢 14.978 disponíveis`) para que o usuário sinta controle.

### 4. UPSELL: O "ADD-ON" DE RECARGA DE EMERGÊNCIA (TOP-UP)
Eu não quero forçar quem esgotou seus créditos a fazer upgrade de plano (ex: saltar de $9 dólares imediatamente para $29). Preciso de um **Botão de Upsell** cirúrgico que apareça no portal de créditos.
*   **Quando exibir:** Quando os créditos estiverem perigosamente baixos.
*   **Visualização do Botão:** Uma cor dourada ou destacada (Botão de Emergência).
*   **Texto Principal do Add-on:** "Recarga Imediata: +4.000 Créditos"
*   **Preço do Botão:** $7.00 (Se em Dólar) OU R$ 27,00 (Se em Reais).
*   **Regra UX:** A interface deve deixar claro que isso é *avulso*, sem renovação recorrente. É um pacote "socorro" para ele terminar a semana se não quiser assinar o plano maior.

Por favor, gere e implemente todos os novos componentes, telas de relatório, layouts de cartões de preço com dual-currency e os tooltips listados acima, e prepare as funções (Hooks) para que possamos plugar o banco de dados do Supabase nesses novos componentes.

### [FIM DO PROMPT]
