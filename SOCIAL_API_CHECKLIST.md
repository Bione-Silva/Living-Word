# Setup de Integrações Oficiais (APIs)

Assim que o App estiver rodando, precisaremos das chaves dessas plataformas coladas no Supabase Cofre (Vault/Secrets) para o sistema enviar as imagens automáticas. 

O Seu papel (Fundador) é entrar nestes links, logar com a sua conta proprietária e criar os Aplicativos Oficiais da *Palavra Viva*:

### 🟢 NÍVEL 1: Aprovadas na Hora (Rápidas)

1. **Pinterest (Para postar Infográficos e Imagens do Estúdio)**
   - **Onde ir:** [Pinterest Developers (App)](https://developers.pinterest.com/apps/)
   - **Ação:** Clique em "Connect App", preencha nome e descrição. 
   - **O que pegar:** O `App ID` e o `App Secret`.

2. **LinkedIn (Para postar artigos no feed do Pastor)**
   - **Onde ir:** [LinkedIn Developers](https://www.linkedin.com/developers/apps)
   - **Ação:** "Create App". Tem que vincular com uma *Company Page* da Palavra Viva. Ative a aba "Products" > "Share on LinkedIn".
   - **O que pegar:** Na aba Auth, copie o `Client ID` e `Client Secret`.

3. **X (Ex-Twitter)**
   - **Onde ir:** [X Developer Portal](https://developer.twitter.com/en/portal/dashboard)
   - **Ação:** Crie um "Project" > "App". Marque que a permissão (`App permissions`) é **Read and Write** e habilite o Web App OAuth 2.0.
   - **O que pegar:** O `Client ID` e o `Client Secret`.

---

### 🟡 NÍVEL 2: A Fila de Avaliação (Meta e TikTok)
Essa é a etapa final. Você criará a requisição e submeterá um texto em inglês junto com um vídeo gravado da sua tela provando que o App não faz spam.

1. **Instagram e Facebook (Meta)**
   - **Onde ir:** [Meta for Developers](https://developers.facebook.com/apps/)
   - **Ação:** "Create App" (Do tipo Business). 
   - **Onde clicar:** Vá em "Add Products" e adicione o `Instagram Graph API` e o `Facebook Login for Business`. Nas permissões (App Review) você vai pedir `instagram_content_publish` e `pages_manage_posts`.
   - Eles pedirão a política de privacidade (URL do seu próprio site da Palavra Viva).

2. **TikTok**
   - **Onde ir:** [TikTok for Developers](https://developers.tiktok.com/)
   - **Ação:** Aplicar para o "Content Posting API". Se for negado na primeira via de direto, habilitamos primeiro o "Share to TikTok SDK".
