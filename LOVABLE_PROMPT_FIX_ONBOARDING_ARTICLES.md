# 🚨 BUILD: Wizard de Onboarding & Configurações de API

O backend das Edge Functions (`provision-user-blog` e `generate-blog-article`) foi totalmente refatorado para suportar o novo fluxo de onboarding com limites restritos (exatamente 3 artigos iniciais, 1 imagem hero gerada por artigo via Gemini Imagen 3, e estrutura SEO inspirada no modelo do Omniseen).

Agora, as seguintes atualizações devem ser refletidas na interface pelo time de frontend / agente Lovable.

## 🎯 AJUSTES OBRIGATÓRIOS PARA O FRONTEND

### 1. Wizard de Onboarding de Personalização (9 Passos)
- Substitua a antiga e rápida tela de disparo por um **Wizard de Personificação de 9 passos**, focado em retenção (aos moldes do formulário do Omniseen).
- O wizard deve obrigatoriamente coletar (e não mais usar mock defaults):
  - Idioma (`language`)
  - Linha Doutrinária (`doctrine_line`)
  - Tom Pastoral (`tone`)
  - Cor Tema (`theme_color`)
  - Tipografia (`font_family`)
  - Estilo de Layout (`layout_style`)
- **Ação Final:** Ao chegar no último passo e confirmar, a função `provision-user-blog` (do Supabase Functions) DEVE ser disparada enviando esses dados no payload (seja via `user_metadata` atualizado no auth, ou diretamente no JSON de trigger caso o onboarding seja posterior ao signup).

### 2. Parar de tentar disparar Múltiplos Artigos no Frontend
- Anteriormente a UI forçava um loop gerando múltiplos artigos ou chamavam `generateInitialContent()` pedindo muitos.
- **Pare com isso.**
- Apenas dispare a função de infraestrutura de blog **uma** vez (`provision-user-blog`). A própria Edge Function gasta do lado do servidor para garantir as imagens e retornar **exatamente 3 devocionais** com formatação de hero image.
- Renderize um *Loading* com placeholders de texto dinâmicos (ex: "Semeando suas palavras...", "Preparando a capa..."), pois a chamada server-side demorará cerca de 20-40 segundos.

### 3. Bypass Temporário na Stripe (Para rodar no Sandbox Lovable)
- No momento, o backend na infra de UI do Lovable está bloqueando o acesso/rendering pois está batendo de frente com a API do Stripe sem a 'Restricted Key'.
- **Bloqueio de Desenvolvimento:** Crie um *Mock Mode* de pagamento, ou seja, se a env de Stripe estiver ausente ou o API call der erro no frontend, force os usuários para o status de "Free" e faça bypass na barreira. Apenas logue no console e deixe a interface carregar. O foco agora é testar as mudanças do Onboarding Wizard na tela, sem depender de integrações financeiras rígidas no dev!
