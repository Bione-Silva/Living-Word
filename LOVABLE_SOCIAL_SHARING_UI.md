# INTERFACE DE COMPARTILHAMENTO DIRETO E APIs (ESTÚDIO SOCIAL)

Olá Lovable! Nosso "Estúdio Social" agora também deve agir como um "Hub de Publicação". Precisamos do painel que gerencia as publicações diretas para as redes e do fluxo nativo do sistema operacional.

Modifique o painel de exportação adicionando a interface de **"Publicar agora"**. Siga essa regra estrita para os estados dos botões:

## 1. O Compartilhamento Viral Imediato (Web Share API)
*   **Botão:** `"📲 Compartilhar para Status / WhatsApp"` (Ou apenas Compartilhar).
*   **Comportamento:** Aciona a API nativa de compartilhamento (`navigator.share({ files: [imageFile] })`). Isso funciona incrivelmente bem no iOS e Android, abrindo a gaveta do celular do usuário e permitindo a ele jogar a imagem direto para qualquer app no aparelho dele. Zero burocracia, 100% livre.

## 2. Redes "Open API" (Conectar Imediato)
*   Crie botões para as redes que faremos a integração imediata:
    *   `[ Postar no LinkedIn ]`
    *   `[ Salvar no Pinterest ]`
    *   `[ Postar no X (Twitter) ]`
*   *(Estes devem ter uma roleta visual de carregamento ou abrir um modal para preencher a legenda).*

## 3. As Big Techs Burocráticas (Gatilho "Em Breve")
*   Exiba essas opções de forma visual, mas desabilitadas (`disabled={true}`).
*   Elas devem ter uma plaquinha ou 'badge' tipo: **"Em Breve"** ou **"Em Avaliação"**.
    *   `[ Instagram Business ]` (Badge: Em breve)
    *   `[ Facebook Pages ]` (Badge: Em breve)
    *   `[ TikTok Direto ]` (Badge: Em breve)
*   Se o usuário tentar clicar ou passar o mouse, exiba um *Tooltip*: "Estamos passando pela auditoria de segurança corporativa da Meta/ByteDance para seu conforto. Liberado nas próximas semanas!"

Isso vai entregar a solução hoje para o que importa, além de criar antecipação. Desenhe essa UI de conexão espetacular dentro do Estúdio.
