# MEGA PROMPT — Living Word: Devocional Imersivo `/devocional`
## Baseado no mapeamento real do Zeal Pro (08/04/2026)

Crie a rota `/devocional` como uma experiência imersiva premium de leitura e escuta espiritual.

---

### ESTRUTURA DA TELA (ordem de cima para baixo):

**1. Header**
- Título: "Café com Deus Pai"
- Subtítulo dinâmico com a data: `{dia da semana}, {dia} de {mês} de {ano}` (ex: "quarta-feira, 8 de abril de 2026")
- Consuma o devocional do dia via: `supabase.from('devotionals').select('*').eq('scheduled_date', hoje).single()`

**2. Card Principal do Devocional**
- Badge de categoria colorido (ex: "✦ Santidade" em dourado suave)
- Título em `Playfair Display`, tamanho grande (h1)
- Card de versículo âncora destacado com borda esquerda dourada e fundo `#FEFCF5`

**3. Player de Áudio (CRÍTICO - COM SELETOR DE VOZES)**
- 🚨 NUNCA USE ELEVENLABS NEM QUALQUER API DE TTS NO FRONTEND. Os áudios JÁ ESTÃO GERADOS e salvos no Storage.
- O mock ou resposta do banco retornará três URLs de áudio preenchidas: `audio_url_nova` (Feminina), `audio_url_alloy` (Masculina Suave), e `audio_url_onyx` (Masculina Forte).
- Crie um seletor visual sutil (ex: 3 chips ou botões sutis no player) para o usuário escolher qual voz ouvir (Default: Nova).
- Utilize a URL da voz selecionada para tocar usando a tag `<audio>` nativa do HTML5.
- Exibir: botão Play/Pause, barra de progresso, duração e velocidade (0.75x / 1x / 1.25x / 1.5x)
- Ícone de ondas animadas enquanto tocando (CSS keyframe)

**4. Imagem de Capa (se `cover_image_url` não for null)**
- Exibir em formato widescreen 16:9, `border-radius: 12px`, com botões: [Salvar Imagem] [Compartilhar] [WhatsApp]

**5. Corpo da Reflexão**
- Renderizar `body_text` usando o componente `<BibleRichText />` que intercepta links `[Livro Cap:Ver](/biblia/...)` e abre Bottom Sheet com o versículo
- Fonte: Georgia/serif, `line-height: 1.9`, `font-size: 1.1rem`
- Ao final, exibir `reflection_question` em itálico com borda esquerda

**6. Oração Final**
- Fundo leve `#F0EBE1`, `border-radius: 8px`, ícone de mãos 🙏
- Texto da `closing_prayer`

**7. Journaling Pessoal (NOVO — gap do Zeal)**
- Label: "✍️ Minha Reflexão Pessoal"
- Textarea com placeholder: "Escreva suas reflexões, orações ou pensamentos sobre o devocional de hoje..."
- Botão: [Salvar Reflexão] → INSERT em `devotional_journals` (user_id, devotional_id, journal_text)

**8. Botões de Ação Pós-Leitura**
- [📋 Copiar] [📤 Compartilhar] [💬 Continuar no Chat]
- Ao clicar em "Salvar Reflexão", dispare também a Edge Function `update-streak` com `action_type: 'read_devotional'`

**9. Sidebar — Histórico dos Últimos 30 Dias**
- Fetch: `supabase.from('devotionals').select('id, title, category, scheduled_date').order('scheduled_date', {ascending: false}).limit(30)`
- Exibir em lista lateral (desktop) ou accordion (mobile): título | categoria badge | data

---

### PALETA E TIPOGRAFIA
- Fundo: `#F5F0E8` (papiro suave)
- Texto principal: `#2C2416` (marrom escuro)
- Dourado accent: `#C9A84C`
- Fonte títulos: `Playfair Display` (Google Fonts)
- Fonte corpo: `Georgia, serif`
- Fonte UI (botões, labels): `Inter`
