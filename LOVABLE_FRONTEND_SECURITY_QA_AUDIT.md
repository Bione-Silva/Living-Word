# AUDITORIA GERAL DE SEGURANÇA E QA (FRONT-END)

Olá Lovable! Chegou o momento de fazermos uma varredura completa de Qualidade e Segurança no seu próprio código (Front-End). Como você está construindo a plataforma de forma iterativa, precisamos garantir que nenhuma falha crítica tenha passado despercebida.

Por favor, faça um **Self-Audit** em todo o repositório React/Vite e implemente as correções automaticamente para as seguintes regras de segurança e estabilidade:

## 1. Auditoria de Segurança Crítica (Vazamento e XSS)
*   **Vazamento de Chaves de API:** Faça um scan em todos os arquivos `.tsx`, `.ts` e serviços do frontend. **NENHUMA** chave privada (Stripe Secret, OpenAI, Gemini, etc.) pode estar hardcoded no frontend. Se houver alguma lógica tentando usar chaves sensíveis diretamente no React, remova e transfira a lógica para ser chamada via Edge Function do Supabase. As únicas chaves permitidas no front são as públicas (ex: `VITE_SUPABASE_ANON_KEY` e `VITE_SUPABASE_URL`).
*   **Vulnerabilidade XSS (Cross-Site Scripting):** Verifique se estamos usando `dangerouslySetInnerHTML` em algum lugar (ex: renderizando os artigos de blog ou roteiros do Reels). Se estivermos, garanta que a string injetada está sendo sanitizada (use bibliotecas como `DOMPurify` ou sanitize a saída caso necessário) para evitar execução maliciosa.

## 2. Auditoria de Autenticação e Rotas Protegidas
*   **Bloqueio Real de Rotas:** Analise o seu Router (ex: `App.tsx` ou arquivos de Rotas). Garanta que rotas privadas (Dashboard, Workspace, Estúdio Social, Biblioteca) tenham um componente "Guardião" de Autenticação (`ProtectedRoute` ou similar). Se um usuário deslogado tentar acessar a URL diretamente, ele obrigatoriamente tem que ser redirecionado para `/login`.
*   **Gestão da Sessão Supabase:** Verifique se o listener de auth state change (`supabase.auth.onAuthStateChange`) está implementado corretamente e cobrindo os casos de logout / expiração de token.

## 3. QA: Prevenção de Quebras e Vazamento de Memória
*   **Tratamento de Erros Silenciosos (Try/Catch):** Revise todas as funções assíncronas que chamam o Supabase (banco de dados ou edge functions). Garanta que `catch (error)` e `toast.error()` estão implementados amigavelmente. O usuário não pode clicar num botão e o sistema travar sem nenhum aviso na tela porque a API demorou.
*   **Loading States:** Verifique os botões de ação críticos (Gerar Roteiro, Baixar Imagem, Assinar). Todos precisam de `disabled={isLoading}` durante o tráfego de dados para evitar cliques duplos que gastem créditos de IA ou gerem cobranças duplas.
*   **Limpeza (Cleanup):** Se houver `useEffect` com timers, listeners ou canvas elements instanciados, garanta seu devido retorno de cleanup. Remova também excessos de `console.log()` perdidos no ambiente de produção que deixam a aba de network poluida.

**Missão:** Promova uma refatoração em bloco consertando qualquer dessas falhas ou *tech debts* (dívidas técnicas) que você encontrar e confirme para mim que a auditoria e as correções foram finalizadas de forma segura.
