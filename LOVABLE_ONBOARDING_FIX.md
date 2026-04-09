# REESTRUTURAÇÃO COMPLETA: ONBOARDING PROGRESSIVO (ZERO FRICÇÃO)

Olá Lovable. Em vez de focarmos num grande questionário gigante (7 passos iniciais) nós migramos agora para a metodologia de ONBOARDING PROGRESSIVO. O objetivo fundamental é "baixíssima fricção na entrada e engajamento constante dentro da plataforma".

Destrua qualquer rascunho longo do formulário de Onboarding anterior e construa a UI utilizando os dois princípios abaixo:

## Fase 1: Onboarding Inicial Expresso (Focado na Criação de Conta)
O formulário inaugural ("Fora do App") agora possui **apenas 3 passos ultrarrápidos**. 
Não liste passos fantasma; exiba apenas uma indicação sutil de progresso (ex: bolinhas ou `Passo X/3`), e aplique aquela marca d'água bíblica ultra-fina (`opacity-5`) que já configuramos. O background principal continua como bege/branco elegante.

### Passo 1: Informações Básicas
*   Campos: Nome completo, Email, Senha, Idioma.

### Passo 2: Papel e Ministério (A Encruzilhada)
*   Campos: Igreja, Denominação Histórica.
*   Pergunta Primordial: *"Você exerce alguma liderança na igreja?"* (Radio Button/Cards)
    *   *Sim (Pastor, líder, professor, pregador).*
    *   *Não, sou um estudioso da Bíblia / membro.*

### Passo 3: Direção Teológica
Esse passo renderizará o formulário diferente baseado na escolha do Passo 2!
*   **Se for Líder:** Mostre um <select> perguntando sua linha teológica principal para guiar a doutrina (Evangélica, Batista, Pentecostal, Reformada, Carismática, Outra).
*   **Se for Membro:** Mostre um <select> similar com a label: *"Qual visão doutrinária você deseja que a IA respeite e estude com você?"*

Finalize o Fluxo e envie as respostas para o backend.

## Fase 2: Módulo Progressivo Interno (Dashboard)
Ao entrar na plataforma pela primeira vez, o Supabase salvará que ele está em "40% do perfil completo"  (`profile_completion_done = 4`, de um total de 10). 

Sua principal missão é desenhar um **Profile Progress Card** que deve ser injetado permanentemente, porém de maneira muito sutil e polida, no topo ou rodapé do Dashboard do usuário.

### O Card Interno (Gamificação do Perfil)
*   Visual: Uma barra de progresso elegante.
*   Headers: *"Você completou 4 de 10 itens do seu perfil ministerial/teológico."*
*   Sub-title: *"Personalize a IA respondendo pequenas perguntas rápidas para resultados muito melhores nas suas gerações."*
*   Botões: `[Melhorar minha IA / Completar Perfil]` e `[Fazer depois]`.

### A Janela/Modal de Completude ("O que falta")
Quando o usuário clicar em "Completar Perfil", mostre perguntas progressivas baseadas na inteligência (Líder vs Membro) em formato de micro-passos (um por vez ou num checklist clean).
*   *Se Líder:* Pergunte seu estilo de pregação, quem ele pastoreia primariamente (jovens, mista), tom de escrita preferido e o nível de profundidade que busca em estudos materiais.
*   *Se Membro:* Pergunte se a leitura é para devocional íntimo ou estudo árduo, linguagem necessária (simples vs teológica profunda) e seu foco de vida atual.

Implemente essas UIs agora para garantirmos a jornada perfeita nos dois escopos.
