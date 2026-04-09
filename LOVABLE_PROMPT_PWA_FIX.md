# Correção do PWA: Direcionamento para a Plataforma e Botão de Instalação

**Lovable, precisamos corrigir o comportamento do PWA que você acabou de configurar.** O PWA instalou corretamente, mas está abrindo na **Landing Page** em vez de abrir dentro da **Plataforma/App**, e está com as proporções gigantes (zoom).

Aja como Engenheiro Front-end e resolva os seguintes pontos críticos:

## 1. Alterar o start_url do Manifest
O PWA abriu a Landing Page porque o `start_url` no `vite.config.ts` (ou no `manifest.json`) foi configurado como `"/"` (que é a rota da LP).
- **AÇÃO:** Altere a propriedade `start_url` no `vite.config.ts` (dentro da configuração do VitePWA) para a rota principal do aplicativo (Exemplo: `"/auth"`, `"/login"`, ou `"/dashboard"` – use a rota correta onde o usuário deve cair para fazer login ou usar a plataforma).

## 2. Inserir Botão "Instale o App" Fixo no Rodapé
Não deixe a instalação escondida ou apenas dependendo do banner que você criou antes. 
- **AÇÃO:** Adicione um ícone/botão bonito e visível no **Rodapé (Footer)** do site e da plataforma com os dizeres: **"📱 Instale o App Agora"**.
- Esse botão deve acionar o evento do PWA para forçar o aviso de instalação (`beforeinstallprompt`). Se o app já estiver instalado, esse botão pode ser ocultado usando CSS ou estado React (ex: `window.matchMedia('(display-mode: standalone)').matches`).

## 3. Investigar e Corrigir o "Zoon Gigante" no Mobile
A landing page e a plataforma quando abertas como PWA ficaram gigantes e desconfiguradas.
- **AÇÃO:** Certifique-se de que o `index.html` tenha a seguinte meta tag EXATA na seção `<head>` para travar a responsividade e o zoom automático:
  `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0">`
- Reveja novamente se há elementos na Landing Page vazando da tela (faltando `overflow-x-hidden` ou larguras não responsivas).

### 🛠 INSTRUÇÃO DE EXECUÇÃO:

**"Por favor, aplique essas três correções imediatamente: 1) Mude o start_url para a rota da plataforma e não da landing page; 2) Crie o botão 'Instale o App Agora' no rodapé; 3) Trave o viewport com user-scalable=0 no index.html para impedir o zoom descontrolado. Me confirme assim que finalizar."**
