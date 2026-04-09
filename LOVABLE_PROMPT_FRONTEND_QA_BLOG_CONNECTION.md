# Audit de Conexão: Sistema de Blog Omniseen 

Olá Lovable, precisamos garantir que o Frontend (App) está consumindo corretamente as nossas *Edge Functions* de arquitetura editorial recém-atualizadas.

Por favor, faça um **Pente-Fino / Audit Strict** em todos os fluxos de criação e Onboarding ligados ao Blog, buscando pelos métodos que chamam as seguintes edge functions nativas no Supabase:

### O que você deve procurar:
1. **`generate-blog-article`**
   - Esta é a principal função de geração de artigos avulsos / sob demanda. 
   - Verifique onde ela é chamada (ex: na tela de "Criar Post" ou "Transformar em Blog"). O Frontend NÃO deve enviar prompts massivos ou estruturais; ele deve apenas passar o tema, idioma, etc., pois o prompt rígido já está embutido no backend. 
   - O retorno virá formatado em Markdown, com a estrutura H1, H2, H3, FAQ e link da Imagem Hero pronta. O Frontend só precisa cuidar de renderizar bonito esse Markdown.

2. **`provision-user-blog`**
   - Esta é a função de Onboarding / Setup Inicial de novos usuários.
   - Ela gera os 3 artigos iniciais na conta do usuário.
   - Verifique o fluxo completo de *Signup/Onboarding* e garanta que ele chama esta function. Confirme se as variáveis necessárias estão sendo passadas. 

### Regra de Ouro da Auditoria
Nenhuma geração de "Blog", "Artigo" ou "Estudo de Onboarding" no Frontend deve chamar diretamente o LLM via SDK client-side ou usar uma "route handler" antiga. TUDO deve passar exclusivamente pelas Edge Functions do Supabase listadas acima, pois nelas residem o **Motor Teológico Omniseen** (que controla a estrutura SEO, extensão, e exige a imagem illustration vector via Gemini Imagen 3.0 por baixo dos panos).

**Sua tarefa:**
1. Leia o código fonte da aplicação client-side React.
2. Identifique e mapeie cada clique de botão e submissão de formulário que gera um "Blog" ou que cria o Onboarding do usuário.
3. Confirme e liste para mim quais arquivos estão fazendo corretamente o `supabase.functions.invoke('generate-blog-article', ...)` e o `supabase.functions.invoke('provision-user-blog', ...)`.
4. Se encontrar algum botão ou fluxo usando outro serviço ou passando um prompt antigo de blog na interface, **remova-o ou atualize para chamar essas Edge Functions de forma seca (apenas repassando tema e parâmetros).** 
5. Me responda com um relatório detalhado das conexões encontradas e confirmando que nosso frontend não tem "vida própria" nesses processos.
