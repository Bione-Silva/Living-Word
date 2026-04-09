# Prompt para o Lovable: Painel de Controle de Gastos de IA 📊

Copie e cole o texto abaixo no Lovable para que ele gere o seu painel do Backoffice:

---

**Objetivo:**
Crie uma nova página de "Backoffice / Control Panel" chamada `AIBillingDashboard`. Esta página será um painel administrativo para visualizar todos os custos e consumo de tokens de Inteligência Artificial (OpenAI e Gemini) da plataforma, agrupados geral e por *tenant* (blog/usuário).

**Estilo Visual:**
- Design Premium, moderno, dark-mode preferencial (ou de acordo com o tema principal do app), utilizando cards com glassmorphism, gráficos interativos e tabelas limpas.
- Use a biblioteca de gráficos `recharts` para exibir as tendências.
- Utilize ícones pertinentes (Lucide React).

**Fonte de Dados (Supabase):**
A página deve buscar dados fazendo chamadas RPC para o Supabase ou lendo da tabela (via funções que irei disponibilizar no backend). As queries principais devem usar dados que refletem a tabela `generation_logs` unida com `users`.
- Estrutura de dados esperada para uso em tela:
  - `total_cost_usd`: Custo total em dólar.
  - `total_tokens`: Soma de `input_tokens` e `output_tokens`.
  - `models_usage`: Array com consumo por modelo (`gpt-4o`, `gemini-1.5-pro`, etc).
  - `features_usage`: Array com consumo por ferramenta/feature (`mode` como: pastoral, blog, devotional, series, resumos).
  - `tenants_usage`: Array de uso por cliente contendo `{ blog_url ou email, cost_usd, total_tokens, generations_count }`.

**Componentes da Interface:**
1. **Cards de Resumo (Hero/KPIs):**
   - Custo Total Acumulado ($).
   - Total de Tokens Processados.
   - Total de Gerações Realizadas.
   - Ferramenta Mais Utilizada (Ex: "Blog Creator").

2. **Gráficos de Consumo (Recharts):**
   - *Gráfico de Rosca/Donut*: Distribuição de custos por Modelo de IA (OpenAI vs Gemini).
   - *Gráfico de Barras*: Consumo de Tokens e Custos separados por Funcionalidade/Ferramenta da Plataforma.

3. **Tabela de Consumo por Blog / Tenant:**
   - Colunas: `Blog / Usuário`, `Plano`, `Gerações Solicitadas`, `Tokens Consumidos`, `Custo Acumulado ($)`.
   - Ordenação padrão decrescente pelo `Custo Acumulado ($)` para vermos rapidamente quem mais gasta.
   - Um campo de texto simples para filtrar/buscar por email ou blog.

**Regras de Negócio e Implementação:**
- Lembre-se que o banco de dados tem a tabela `generation_logs` com as colunas `input_tokens`, `output_tokens`, `cost_usd`, `llm_model`, e `mode`, vinculada à tabela `users` (onde temos o `blog_url` e `email`).
- Para facilitar e contornar restrições de RLS (Row Level Security) no frontend, chame uma função RPC chamada `get_admin_ai_metrics()` usando o cliente do Supabase (`supabase.rpc('get_admin_ai_metrics')`).
- Crie mock data (dados falsos bem realistas de consumo de tokens, tipo centenas de milhares de tokens fracionados custando alguns centavos/dólares) enquanto a função RPC carrega ou se não encontrar o backend.
- Deixe o código limpo, separado em componentes (Ex: `AICostKPIs`, `AICharts`, `TenantsUsageTable`).

---

**Nota para o Desenvolvedor (Contexto do Backend / Supabase):**
Junto com este prompt, estou criando o script SQL que você precisará rodar no seu Supabase pelo SQL Editor para ativar esta função `get_admin_ai_metrics` e permitir que o painel do Lovable funcione magicamente puxando os dados reais.
