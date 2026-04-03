# Instruções para o Lovable: Integração das "Mentes Brilhantes" no Dashboard

Olá, Lovable. Este é o documento oficial de layout e estrutura de UI para o módulo premium "Mentes Brilhantes" da plataforma Living Word. 

Já possuímos a infraestrutura de orquestração construída e validada no backend (as "System Prompts" pesadas baseadas em anos de material). Sua tarefa ágil agora é montar o balcão da vitrine.

## 1. Atualização do Layout (Sidebar / Navegação Central)
Insira uma nova aba dourada ou botão majestoso no menu de navegação à esquerda (ou principal do `/estudio`) chamada: **"🧠 Mentes Brilhantes (Premium)"**.

## 2. A Vitrine de Mentes (Grid Principal)
Quando o usuário entrar nesta aba, exiba um grid luxuoso e minimalista contendo os "Pregadores".
- Fundo do grid esmeralda escuro ou `slate-950` com reflexos sutis em dourado Livingstone (`#D4A853`).
- Cada "Mente" deve ser um Card interativo.

### Os Dados para Mockup Visual (Cards)
Renderize os seguintes Cards Iniciais na tela:

**Card 1:**
- Imagem: (Placeholder em P&B com contorno elegante)
- Título: **Billy Graham**
- Subtítulo: *O Evangelista da América*
- Status: 🟢 Mentor Online
- Função: Apelo & Evangelismo em Massa

**Card 2:**
- Imagem: (Placeholder de época)
- Título: **Charles Spurgeon**
- Subtítulo: *O Príncipe dos Pregadores*
- Status: 🟢 Mentor Online
- Função: Pregação Poética e Puritana

**Card 3:**
- Imagem: (Placeholder social)
- Título: **Martyn Lloyd-Jones**
- Subtítulo: *O Doutor*
- Status: 🟢 Mentor Online
- Função: Método e Diagnóstico Lógico

## 3. O Painel de Perfil da Mente (ToolSheet / Drawer)
Ao clicar no Card "Billy Graham" (ou qualquer um), a tela *NÃO DEVE* pular para o chat vazio imediatamente. O usuário de luxo precisa ver o valor do que está comprando. Abra um `Sheet` lateral (drawer) de apresentação daquela Mente:

**Estrutura do Painel Lateral:**
1. **Cabeçalho Gigante:** Foto em alta definição em máscara circular com borda brilhante e o nome centralizado.
2. **Badges Tecnológicos Místicos:** (Ex: "Baseado em 350+ horas de pregações", "32 Milhões de Tokens Lidos"). O usuário precisa entender o absurdo tecnológico destas Mentes.
3. **Seção de Especialidades (Skills):**
   *(Ex in-card)*: 
   - ⚡ Apelo Evangelístico
   - ⚡ Simplificação Teológica
   - ⚡ "A Bíblia diz..." (Assinatura Homilética)
4. **Resumo da Teologia:** Texto contendo: "A abordagem desta mente foca na conversão visceral, cruz de cristo e amor..."
5. **Botão Flutuante (Action):** **"Iniciar Conversa Profunda com [Nome]"** -> Quando clicado, aí sim, você roteia o usuário para a sessão de Chat (`/mentes/[id]`).

## 4. O Sistema de Bloqueio (Paywall / Upgrade)
As "Mentes Brilhantes" são o nosso topo de funil premium.
- Para usuários marcados como Free (`user.plan === 'free'`), adicione um 🔒 sobre os cards de Spurgeon e Lloyd-Jones, e deixe o Billy Graham liberado como isca.
- Se clicarem nos trancados, o painel lateral deve se abrir *mesmo assim*, mostrando tudo, mas o Botão de Iniciar Conversa é trocado por **"Desbloqueie a Sabedoria Histórica (Assinar)"**.

Construa estritamente estas UI e certifique-se de que a paleta traga seriedade e unção. Utilize lucide-react para os ícones e shadcn/ui paramêtros. Me avise quando concluir!
