# LOVABLE PROMPT — Back-office Master & Dashboard SaaS
# Living Word — Frontend Spec v1.0
# Usar este prompt diretamente no Lovable AI Editor

---

## CONTEXTO

Estamos implementando o **Back-office Master** da plataforma Living Word.
Essa área será responsável por visualizar as métricas globais de crescimento do SaaS (Leads, Clientes, MRR) e gerenciar as IAs operando nos bastidores sem necessidade de deploy ("A mágica acontece").

O layout que usaremos substituirá as planilhas manuais. Tente renderizar os Cards semelhantes a interfaces de KPIs premium (como Stripe).

---

## CONDIÇÃO DE ACESSO (MASTER APENAS)

Na renderização da `Sidebar`, inclua um link novo chamado `Back-office (Master)` ou o ícone `Settings/ShieldAlert`.
Esse item deve ser exibido **APENAS** se o e-mail do usuário autenticado no Supabase for o logado:
`bionicaosilva@gmail.com`

Se qualquer outro usuário acessar, deve retornar erro `403` ou não mostrar o botão.

---

## ROTA: `/admin/dashboard`
Criar a página `AdminDashboardPage` com um layout que contém 3 áreas verticais.

### ÁREA 1: VISÃO GERAL SAAS (Métricas em Tempo Real)

Carregue os dados da view `admin_saas_metrics` do Supabase via chamada `.rpc` ou `.select`:
Exibir uma grid de 4 Cards:

1. **Card 1: Contas Registradas (Leads Totais)**
   - Valor: `{data.total_users_registered}`
   - Ícone: Users (cinza/muted)

2. **Card 2: Testando (Trial) / Base Free**
   - Valor: `{data.users_trialing} em trial` + `({data.users_free} Free)`
   - Ícone: Activity (amarelo/laranja)

3. **Card 3: Assinaturas Pagas Ativas**
   - Colocar um sumário contendo a quebra do SaaS:
   - `{data.users_pastoral}` Pastoral
   - `{data.users_church}` Church
   - `{data.users_ministry}` Ministry
   - Ícone: Star (azul/indigo)

4. **Card 4: Receita Recorrente (MRR Estimado)**
   - Valor: `US$ {data.estimated_mrr_usd}`
   - Ícone: DollarSign (verde destacado)
   - Fonte maior, dando a sensação "Premium".

---

### ÁREA 2: THE VAULT (Configuração Rápida de Chaves)

Um `Card` onde a "Mágica acontece". Aqui o Master coloca as chaves ("plug-and-play") para os provedores serem usados por toda a plataforma.

O banco salva na tabela `master_api_vault` no Supabase. O formulário deve ter:

**Campos de API Keys (Inputs do tipo password)**
Mostre uma lista com os provedores que usamos:
1. `OpenRouter` (Permite usar Claude + GPT no mesmo balance) — *Recomendado*
2. `OpenAI`
3. `Groq`
4. `Anthropic`

- Ter um único botão em cada linha habilitando um input: `[ ] Salvar Chave`. O texto da chave deve ficar escondido com `type="password"` por segurança, igual painéis Cloud. As chaves devem ser inseridas no banco na tabela `master_api_vault` com as colunas `provider_id` (openrouter, openai, groq, anthropic) e `api_key`.

**Configuração das IAs Ativas**
Abaixo das chaves, um `Form` para definir na tabela `global_settings` as preferências ativas (usar Select):

- **Agente Analista Master (CFO Interno)**:
  - Opções: `gpt-4o-mini`, `gemini-2.5-flash`, `claude-3-haiku`
  - *Sugerido: gpt-4o-mini*
- **Agente de Atendimento ao Público (Helpdesk)**:
  - Opções: `gpt-4o-mini`, `gemini-2.5-flash`, `claude-3-haiku`
  - *Sugerido: gemini-2.5-flash*
- **Motor Principal (Estudo/Sermão)**:
  - Opções: `gpt-4o-mini`, `gpt-4o`, `gemini-pro`, `claude-3-sonnet`
  - *Sugerido: gpt-4o-mini*

Ao modificar qualquer select e salvar, faz um update/upsert na tabela `global_settings` (onde `key` = 'core_generation_model', 'support_agent_model', etc).

---

### ÁREA 3: CONSELHEIRO MASTER (CFO ANALYTICS AGENT)

Esse é o agente repetitivo que verifica se o Master está tendo lucro ou prejuízo.

No final da página, exiba um banner largo verde ou azul escuro:
**"Conselheiro Financeiro Analítico AI"**
Ícone: `Brain` ou `TrendingUp`.

Neste momento inicial, carregue via Edge Function (`invoke('generate-admin-analytics')`) uma recomendação que utilizará o modelo escolhido lá em cima (`cfo_analytics_model`).

O componente deve aguardar uma resposta textual gerada (exemplo simulado na interface agora):
> *"Notei visualizando o total de 200 artigos, que o Billy Graham gerou mais chamadas no mês. Usando Claude Sonnet como está na configuração, a margem mensal ficaria X, se usar o GPT-4.1 a margem cai, recomendação é travar o LLM Y para as contas trial para cortar 64% da despesa."*

O Lovable só deve renderizar o Chat Box bonitinho aguardando texto. O Backend Deno suprirá esse raciocínio com SQL Logs.

---

## OUTRO REQUISITO (Global da Aplicação)

### O AGENTE DE ATENDIMENTO
Em toda a plataforma LivingWord (barra de navegação ou bolha inferior direita), crie um componente de Modal "Central de Ajuda".
- Ícone: `LifeBuoy` ou `MessageCircleHeart`.
- Deve abrir um Chat modal flutuante: **"Olá! Eu sou o assistente oficial de treinamento da LivingWord. Dúvidas sobre pregações ou devocionais?"**
- O usuário digita as perguntas, e o frontend faz `.invoke('support-agent', { message: texto })` para conversar com a Inteligência do Atendimento. Essa interface deve lembrar um chatbot simples (Mensagens do user na direita, da IA na Esquerda).

---

## CHECKLIST DE QUALIDADE (LOVABLE)
- [ ] Protegeu a rota Admin para verificar se o e-mail não é o admin redirecionando pra home.
- [ ] O MRR verde ficou destacado visualmente igual Stripe?
- [ ] As chaves da API não são printadas como texto visível na tela (Password form).
- [ ] A bolha do Helpdesk está visível pra todos na Base Layout.
