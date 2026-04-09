# Auditoria e Correção Absoluta de Responsividade (Mobile & Web)

**Lovable, preste muita atenção.** A plataforma "Living Word" está com problemas críticos de responsividade, quebras de layout, e bugs de zoom indesejado na versão Mobile. Requeremos uma **varredura completa (100%)** e correção imadiata e total de toda a aplicação — desde a Landing Page até as rotas internas da Plataforma (Dashboard, Estúdios, Biblioteca, etc).

Você deve agir como um **Engenheiro Front-end Sênior (Especialista em UX Mobile e TailwindCSS)**. Siga rigorosamente este checklist de auditoria e correção em TODOS os componentes e rotas:

## 1. Correção do Bug de Zoom (Viewport Scale)
É comum que o iOS e alguns Androids deem "zoom automático" quando o usuário clica em um "input" ou seleciona um texto, quebrando a tela.
- **Ação:** Certifique-se de que a meta tag de viewport no `index.html` (ou configuração equivalente do framework) esteja blindada para evitar scale indesejado.
- **Ação em Inputs:** Garanta que todos os campos de texto (`input`, `textarea`, `select`) tenham font-size de no mínimo `16px` em mobile (Text-base no Tailwind: `text-base` ou `text-[16px]`). Isso por si só já impede que o iOS aplique o zoom automático ao focar no campo.

## 2. Prevenção de Overflow Horizontal (Scroll Indesejado)
- Analise absolutamente todas as telas: **Landing Page, Onboarding, Dashboard, Barra Lateral, Cards e Tabelas**. 
- Nenhuma tela deve ter scroll horizontal não intencional (scroll horizontal pra fora da tela). 
- Certifique-se de que containers principais possuam `overflow-x-hidden` caso elementos filhos estejam quebrando a tela.
- Em tabelas ou blocos de código/textos extensos, garanta que se houver overflow, ele seja local (`overflow-x-auto` e `max-w-full`).

## 3. Revisão de Espaçamentos, Paddings e Tipografia (Mobile-First)
- Muitos textos grandes e margens generosas da versão Web esmagam o layout no Mobile.
- **Ação:** Ajuste todas as tipografias e espaçamentos pesados usando a hierarquia do Tailwind. Exemplo: Se é `p-8` e `text-4xl` no desktop, no mobile deve cair para algo como `p-4 md:p-8 text-2xl md:text-4xl`.
- Conserte headers, navbars e modais que estão vazando ou sobrepondo conteúdo na tela pequena do smartphone.

## 4. Botões e Alvos de Toque (Touch Targets)
- Ninguém consegue clicar em botões minúsculos no celular. 
- Verifique se ícones, botões de ação (ex: Salvar, Fechar Modal, Criar Estudo, Play, Copiar) têm espaçamento amigável para dedos. Use paddings confortáveis (no mínimo `h-10 w-10` para botões com ícones) e margem entre eles.

## 5. Menus e Sidebars (Navegação Mobile)
- Se há uma Sidebar (Barra Lateral) na plataforma, ela deve estar colapsável corretamente em telas pequenas (escondida atrás de um menu hambúrguer `Sheet` do shadcn ou off-canvas).
- A Landing Page precisa ter o menu do topo adequadamente adaptado para mobile (hamburger menu se houver muitos links).

---
### 🛠 INSTRUÇÃO DE EXECUÇÃO PARA O LOVABLE:

**"Inicie imediatamente uma auditoria global baseada nestes 5 pilares.**
Não espere minhas instruções tela a tela. Verifique ativamente os componentes de Layout (`Layout.tsx`, `Sidebar.tsx`, `Navbar.tsx`), a página principal da LP (`Index.tsx` ou `Landing.tsx`) e as views principais da plataforma.

**Corrija os problemas no código e responda confirmando os arquivos que você modificou, focando em garantir uma experiência Mobile primorosa, sem zooms quebrados e sem elementos vazando para fora da tela."**
