# CORREÇÃO: MODAL DE PUBLICAÇÃO E FLUXO DA API

Olá Lovable, o modal "Postar no LinkedIn" (e demais redes) que você projetou ficou visualmente fora do padrão (um fundo marrom escuro que destoa do resto) e é apenas um componente estático (dummy). Precisamos repaginá-lo visualmente e ligar o fluxo estrutural de publicação nas nuvens.

Por favor, faça as duas correções cruciais abaixo:

## 1. Correção Visual do Modal de Publicação
*   **Problema:** O Modal está usando fundo marrom escuro chapado. 
*   **Correção:** Faça esse modal/Dialog possuir a mesma estética limpa da interface. Use o `Dialog` do `shadcn/ui` ou Tailwind padrão (`bg-background` adaptável para Light/Dark mode), bordas arredondadas suaves, texto legível, e o botão primário de "Publicar" acompanhando a cor da marca da *Palavra Viva*.

## 2. A Engenharia de Publicação (Fluxo da Arquitetura Real)
**Atenção Redobrada aqui:** Você não pode simplesmente "abrir um link do LinkedIn" para publicar o carrossel, porque a imagem do Canvas existe apenas localmente na memória do navegador (Base64/Blob). Para a rede social aceitar e indexar, essa foto precisa estar salva num servidor público.

Quando o usuário apertar em **"Publicar"**, execute OBRIGATORIAMENTE esse fluxo `async`:

1.  **Loading State:** Bloqueie o botão (Estado de carregamento giratório).
2.  **Upload da Imagem (Supabase Storage):** Pegue o Blob gerado no canvas e faça upload pelo cliente Supabase.js para um Bucket chamado `social_arts` (atribuindo um nome de arquivo único com o `user_id` do cliente logado).
3.  **Captura da URL Pública:** Obtenha a URL pública dessa imagem (Usando `supabase.storage.from('social_arts').getPublicUrl('...')`).
4.  **Acionar Edge Function de Despacho:** Dispare o método `supabase.functions.invoke('publish-social')`. 
    *   O Payload (Body) do POST deve ser estruturado assim: 
        `{ platform: 'linkedin', imageUrl: 'https://...', message: 'Legenda digitada no textarea' }`
5.  **Toast de Sucesso/Erro:** Avalie o resultado. Se a edge function voltar Sucesso, solte confetes ou um `toast.success`. Se der erro (ex: credenciais da API faltando), use `toast.error` mostrando a mensagem de erro que nossa função retornou.

A Edge Function `publish-social` já foi deixada pronta no backend pelo arquiteto humano. Só resta você programar o Supabase Client do front-end para fazer essa ponte do envio da imagem! Modifique o arquivo responsável por esse Modal agora.
