# MEGA PROMPT — Living Word: Quiz Bíblico `/quiz`
## Baseado no mapeamento real do Zeal Pro (08/04/2026)

Crie o sistema completo de Quiz Bíblico com gamificação XP, ranking e bônus diário.

---

### ROTA 1: Hub do Quiz `/quiz`

**Seção de Stats do Usuário:**
- Fetch do perfil: `supabase.from('profiles').select('score, streak_days').eq('id', user.id).single()`
- Exibir: Nível Atual (baseado no score), XP total, Partidas jogadas, 🔥 Sequência, Melhor pontuação
- Barra de XP com progresso para o próximo nível

**Calendário de Bônus Diário:**
- Verificar se o usuário já resgatou hoje em `quiz_daily_bonus`
- Exibir 7 dias com XP crescente: Dia1=+10, Dia2=+15, Dia3=+20, Dia4=+25, Dia5=+35, Dia6=+50, Dia7=🎁+100
- Botão: "RESGATAR DIA X (+Y XP)" que faz INSERT em `quiz_daily_bonus`

**CTAs:**
- [⚡ Jogar Agora] → `/quiz/categorias`
- [🏆 Ranking] → `/quiz/ranking`

---

### ROTA 2: Categorias `/quiz/categorias`

Grid de 6 opções:
- 📜 Antigo Testamento — Médio — 10 perguntas
- ✝️ Novo Testamento — Médio — 10 perguntas
- 👤 Personagens Bíblicos — Fácil — 10 perguntas
- 📚 Livros da Bíblia — Fácil — 10 perguntas
- 🎵 Salmos e Provérbios — Difícil — 10 perguntas
- 🎲 Modo Aleatório — Todas as categorias

---

### ROTA 3: Quiz Ativo `/quiz/jogar?category=X`

**Fetch perguntas:**
`supabase.from('quiz_questions').select('*').eq('category', category).limit(10).order('random()')`

**Layout por pergunta:**
- Header: [Sair] | Categoria | "Pergunta X/10" | "Y pts"
- Card da pergunta com referência bíblica e texto em heading grande
- 4 botões de opção (A/B/C/D) com hover animado
- **Timer regressivo de 15s** com barra colorida (verde→amarelo→vermelho)
- "⚡ Responda rápido para ganhar mais pontos!"
- Botão: [Confirmar Resposta]
- Feedback visual: verde (acerto) + confetti | vermelho (erro) + resposta correta

**Ao terminar as 10 perguntas:**
- Tela de resultado com pontuação e XP ganho
- INSERT em `quiz_sessions` (score, category, correct_answers, time_taken)
- Chamar `update-streak` com `action_type: 'quiz_completed'`
- Botões: [Jogar Novamente] [Ver Ranking]

---

### ROTA 4: Ranking `/quiz/ranking`

**Tabs:** [🏆 Geral] [📅 Mensal] [⚡ Semanal]

**Fetch ranking:**
`supabase.from('profiles').select('id, full_name, avatar_url, score').order('score', {ascending: false}).limit(50)`

- Top 3 com medalhas grandes (🥇🥈🥉)
- Resto em lista compacta com posição, avatar, nome e pontos
- Destacar visualmente a posição do usuário logado
- Botão: [Jogar e Subir no Ranking]

---

### UI DO QUIZ
- Fundo: `#0F0A1E` (dark dramático)
- Accent neon: `#A855F7` (roxo vibrante)
- Timer em vermelho pulsante nos últimos 5s
- Animações de entrada Framer Motion em cada pergunta
- Efeito confetti ao acertar
