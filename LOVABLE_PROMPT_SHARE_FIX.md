# Instruções Críticas para o Lovable: Correção de Compartilhamento (Redes Sociais)

Lovable, o sistema de botões de compartilhamento ("Compartilhe esta mensagem") no rodapé dos Artigos ou Materiais gerados está quebrado! 

## 1. O Problema
Atualmente, quando o usuário clica no botão do **WhatsApp** ou do **Facebook** na nossa interface, as âncoras não estão levando ao compartilhamento nativo correto contendo a URL e o título do artigo no qual ele está lendo.

## 2. A Solução (Ação Imediata)
- Revise minuciosamente o componente que contém os botões de compartilhamento social (geralmente presentes na visualização dos Artigos e Leituras).
- O botão do **WhatsApp** deve obrigatoriamente acionar a URL `https://api.whatsapp.com/send?text=` contendo um gatilho como: `encodeURIComponent(`Leia este artigo da Living Word: ${window.location.href}`)` (ou similar).
- O botão do **Facebook** deve direcionar diretamente ao Sharer: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`.
- O botão do **X/Twitter** (se ativo) deve abrir `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(articleTitle)}`.
- O botão **Copiar Link** deve realmente injetar a URL no Clipboard via API de navegador (`navigator.clipboard.writeText`) exibindo um Toast de "Link Copiado!".

## 3. A Integração do Código
- Garanta que a URL dinâmica seja capturada corretamente (utilizando Hooks de roteamento ou `window.location.href` onde aplicável).
- Corrige toda essa hierarquia de links sociais agora. Eles devem levar direto ao ponto de disparar as postagens / mensagens finais.
