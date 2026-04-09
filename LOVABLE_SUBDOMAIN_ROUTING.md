# ARQUITETURA MULTI-TENANT POR SUBDOMÍNIO (HOST-BASED ROUTING)

Olá Lovable! Houve um erro no modelo de arquitetura de roteamento que você gerou para os Workspaces/Igrejas. No momento, o sistema está usando a rota como `/nomedaigreja` (Path-Based Routing), mas a exigência do negócio é que seja **Subdomínio** (Host-Based Routing, ex: `nomedaigreja.nossoplataforma.com`).

Precisamos migrar isso imediatamente na camada do React Router e do Contexto Geral. 

Por favor, refatore o código seguindo as 3 diretrizes abaixo:

## 1. Mudar de Path-Based para Host-Based Routing
*   **Remova** as rotas em `App.tsx` que dependem de `/:workspaceSlug` ou `/:churchSlug` explícito no caminho da URL.
*   A página principal do mini-site daquela igreja existirá na raiz `/`, independentemente da igreja acessada, pois o que muda é o domínio em si.

## 2. Lógica de Resolução do Subdomínio (Tenant Resolver)
*   Crie um Contexto ou Hook (ex: `useTenant()` ou `TenantProvider`) na camada mais alta do App.
*   Esse Hook deve capturar o subdomínio verificando o objeto `window.location.hostname`.
*   A lógica padrão é: pegar a string antes do primeiro `.` (ponto).
    * Se for `bionesilva.palavraviva.com`, o tenant é `bionesilva`.
    * Se for `app.palavraviva.com` ou `www`, entramos na plataforma principal de login (Admin / Plataforma SaaS mãe). 
*   Todas as chamadas de banco de dados e APIs dali em diante devem injetar silenciosamente o `tenant_id` ou `slug` detectado no hostname.

## 3. Mock Essencial para o Preview (Ambiente de Desenvolvimento)
*   **Aviso:** Sabemos que os ambientes de preview (como o seu canvas de renderização `lovable.app` ou `localhost:8080`) não lidam bem com requisições reais de subdomínios DNS locais (ex: `bionesilva.localhost`). 
*   **Solução para Dev:** Se o `window.location.hostname` for o seu ambiente de preview (ex: contém `lovable.app` ou `localhost`), crie uma regra de *Fallback* ou uma variável `localStorage.getItem('MOCK_SUBDOMAIN')`. Se estiver no modo dev, permita usar a `/?tenant=bionesilva` via querystring apenas para **simular** o acesso ao subdomínio nos testes locais.

Assim, teremos a URL limpa (ex: `bionesilva.seudominio.com/` na página inicial, `.../eventos`, etc), entregando a experiência real B2B (Multi-Tenant nativo) sem quebrar seus testes no ambiente temporário. Adote e ajuste o router agora.
