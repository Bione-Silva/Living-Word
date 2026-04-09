# Transformação em PWA (Progressive Web App) Nativo

**Lovable, precisamos transformar a plataforma "Living Word" em um verdadeiro PWA (Progressive Web App) instalável.** 
O objetivo é que os usuários possam "baixar/instalar" o aplicativo diretamente pelo navegador, tanto no celular quanto no computador, e que o app fique salvo na tela inicial (Home Screen) com a nossa logo e o nome do aplicativo.

Atue como um **Engenheiro Front-end Especialista em PWA**. Execute as seguintes implementações passo a passo:

## 1. Configuração do Web App Manifest (manifest.json)
Crie ou configure o manifesto da aplicação para garantir que o navegador reconheça o site como instalável.
- **name:** "Living Word"
- **short_name:** "Living Word"
- **display:** "standalone" (para ocultar a barra de endereços e parecer um app nativo)
- **background_color & theme_color:** Configure com a cor principal (brand color) do nosso app.
- **icons:** Defina a estrutura para os ícones obrigatórios (ex: 192x192 e 512x512 maskable). *Se os arquivos de ícone oficiais ainda não estiverem no repositório, gere placeholders coloridos (ou use a logo atual) garantindo que os caminhos no manifest funcionem.*

## 2. Implementação do Service Worker
Para que o alerta nativo de instalação seja acionado (especialmente no Android/Chrome) e o app funcione offline (ou pelo menos carregue a casca inicial), precisamos de um Service Worker registrado.
- **Ação:** Integre o Service Worker. Como usamos o Vite, a maneira mais robusta é instalar e configurar o pacote `vite-plugin-pwa`.
- Adicione a configuração necessária no `vite.config.ts` para gerar o Service Worker automaticamente e registrar o manifest.

## 3. Botão ou Banner de Instalação (PWA Install Banner)
Não podemos depender apenas de o usuário saber que "dá pra instalar pelo menu do navegador". Queremos uma opção explícita na UI.
- **Ação:** Crie um hook React (ex: `usePWAInstall`) que intercepte o evento `beforeinstallprompt`.
- Crie um componente de botão (ex: "Instalar App") que só aparece se o app puder ser instalado e ainda não estiver instalado.
- Coloque este botão em um lugar estratégico (ex: no rodapé do Menu Lateral / Sidebar ou no menu de perfil). 

## 4. Meta Tags Essenciais no index.html
Certifique-se de que o `index.html` possua as meta tags cruciais para PWA, especialmente para iOS (Apple Mobile Web App tags):
- `<meta name="theme-color" content="...">`
- `<link rel="apple-touch-icon" href="...">`
- `<meta name="apple-mobile-web-app-capable" content="yes">`
- `<meta name="apple-mobile-web-app-status-bar-style" content="default">`

### 🛠 INSTRUÇÃO DE EXECUÇÃO:

**"Por favor, configure o PWA da aplicação agora. Altere o `vite.config.ts`, adicione as configurações de manifesto e Service Worker, ajuste o `index.html` com as meta tags da Apple e crie o componente/lógica para o botão de 'Instalar App'."**

*Me informe assim que concluir e indique quais bibliotecas instalou ou arquivos criou.*
