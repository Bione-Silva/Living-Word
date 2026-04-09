# ARQUITETURA FRONTEND: i18n, Mobile UX e PWA Completo

**Atenção Lovable:**
Como Engenheiro de Produto responsável pela arquitetura frontend, preciso que você aplique uma **AUDITORIA MÁXIMA E IMPLEMENTAÇÃO** no repositório React atual. O backend já foi blindado para receber a variável language e forçar toda a IA a respeitar a internacionalização, mas o frontend precisa espelhar essa excelência.

Implemente o checklist abaixo, arquivo por arquivo, e garanta que o código gerado seja focado, seguro e não quebre rotas existentes.

---

## PARTE 1 — INTERNACIONALIZAÇÃO (i18n) E INTEGRAÇÃO DE IDIOMA
1. **Purgação de Hardcoded:** Escaneie Dashboard, Sidebar, Modais de Criação e Landing Page. Nenhum texto fixo em português pode existir diretamente no componente. Tudo deve usar chaves do dicionário (ex: t('dashboard.title')).
2. **Contexto Persistente:** O seletor de idioma (PT, EN, ES) deve salvar o estado em localStorage (ex: lw_language_pref) E repassar isso para a prop global de linguagem.
3. **Payload da API:**
   - Nos componentes que disparam o serviço de IA, localize a função de fetch ou supabase.functions.invoke.
   - Certifique-se **absolutamente** que no body enviado para generate-pastoral-material, generate-biblical-study e generate-blog-article, incluímos { "language": currentLanguage }. Isso é obrigatório.
4. **Fallback:** Se uma chave não existir em Espanhol, o sistema deve usar a versão correspondente em Inglês de forma nativa.

## PARTE 2 — UX E RESPONSIVIDADE MOBILE FULL
1. **Navegação (Sidebar vs Bottom Nav):**
   - O Sidebar atual deve colapsar em um Drawer (menu sanduíche) em telas menores que md (< 768px).
   - Considere uma BottomNavigation para links crus se fizer sentido para a usabilidade rápida (Dashboard, Estúdio, Perfil).
2. **Grid de Cartões (Mentes Brilhantes & Planos):**
   - No celular, os layouts de grade (grid-cols-3 ou grid-cols-4) obrigatoriamente devem cair para grid-cols-1.
   - Ajuste o gap para separar bem os cards.
3. **Inputs e Touch Areas:**
   - Todo campo de input, select e botão deve ter pelo menos 44px ou 48px de altura mínima (min-h-[48px]) para não penalizar dedos em telas touch (Requisito mínimo de acessibilidade da Apple/Google).
4. **Modais:**
   - Modais sobrepostos não devem ter margem flutuante no celular; force-os a tomar 100% da tela mobile (w-full h-full rounded-none m-0), com um botão de "Voltar/Fechar" acessível no header.

## PARTE 3 — IMPLEMENTAÇÃO PWA (PROGRESSIVE WEB APP)
O Living Word deixará de ser apenas um web app e precisa ser instalável (Home Screen). Gere os seguintes arquivos e lógicas na pasta public/ e raiz:

1. **manifest.json (Colocar no /public)**
   {
     "name": "Living Word",
     "short_name": "LivingWord",
     "start_url": "/",
     "display": "standalone",
     "background_color": "#ffffff",
     "theme_color": "#000000",
     "icons": [
       { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
       { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
     ]
   }
2. **Registro do index.html:**
   Adicione <link rel="manifest" href="/manifest.json" /> e as tags apple-touch-icon, theme-color no head.
3. **Gatilho de Instalação no React (Install Prompt):**
   Crie um hook personalizado usePWAInstall.tsx que ouça o evento beforeinstallprompt. Exiba um CTA (ex: "🚀 Instale o aplicativo Living Word para acesso offline e rápido") no Dashboard ou logo após o Login do usuário.

## PARTE 4 — LANDING PAGE CTA E BENEFÍCIOS
1. Na Landing Page (em cima ou logo abaixo do Hero principal), injete o benefício da instalação nativa: "Acesse offline, sem depender de navegador" (usando a var de i18n correspondente).
2. Certifique-se de que a Landing Page flui perfeitamente no mobile, empilhando o formulário de onboarding 100% visível, tirando imagens de fundo que causem confusão visual e aumentando contrastes na chamada para a ação principal.

---
**Instrução Operacional ao Lovable:** Comece a auditoria agora. Crie os manifestos e arquivos de i18n se faltarem, injete Tailwind onde há falta de responsividade, e no final, me dê um breve relatório confirmando que as chamadas às APIs de IA no Supabase agora repassam o parâmetro de language do estado global do usuário.
