# MEGA PROMPT — Living Word: Kids `/kids`
## Baseado no mapeamento real do Zeal Pro (08/04/2026)

Crie a rota `/kids` com design vibrante, colorido e acolhedor para crianças de 4 a 10 anos.

---

### ESTRUTURA DA TELA:

**1. Header**
- Título: "📖 Histórias da Bíblia" em fonte arredondada (Nunito ou Poppins Bold)
- Subtítulo: "Escolha um personagem bíblico e eu conto a história para você!"
- Fundo gradiente suave: `linear-gradient(135deg, #FFF8E7 0%, #E8F4FD 100%)`

**2. Grid de Personagens (20 cards)**
Exibir um grid responsivo (2 colunas mobile, 4 desktop) com os seguintes personagens:
`Davi`, `Moisés`, `Daniel`, `Ester`, `José`, `Rute`, `Samuel`, `Jonas`, `Sansão`, `Josué`, `Gideão`, `Jesus`, `Noé`, `Adão e Eva`, `Salomão`, `Zaqueu`, `Apóstolo Pedro`, `Balaão`, `Abraão`, `Jacó`

Cada card deve ter:
- Ícone emoji representativo (ex: 🦁 Daniel, ⚓ Noé, ⭐ Davi)
- Nome do personagem em fonte grande arredondada
- Mini descrição (ex: "O pequeno pastor que se tornou rei")
- Borda colorida animada com hover scale

**3. Tela de Geração (após clicar em personagem)**
- Exibir loading spinner fofo com animação de livro abrindo
- Chamar Edge Function: `POST /functions/v1/generate-kids-story` com `{ character: nomeSelecionado }`
- Exibir resultado:
  - Header: "✨ História especial para você ✨"
  - Imagem gerada (se disponível no `image_url`) em destaque
  - Texto da história em 3 parágrafos, fonte grande `font-size: 1.2rem`, `line-height: 2`
  - Lição moral em card dourado: "💡 Lição: {lesson}"
  - Botões: [📋 Copiar] [📤 Compartilhar] [💬 WhatsApp] [🎨 Gerar Desenho]
  - "Gerar Desenho" chama a mesma função com `generate_image: true`

**4. Botão "← Voltar" para o grid de personagens**

---

### PALETA KIDS
- Primário: `#6C63FF` (roxo vibrante)
- Accent: `#FFB347` (laranja quente)
- Fundo: `#FAFFF4` (verde claríssimo)
- Cards: brancos com `box-shadow` colorida suave
- Tipografia: `Nunito` (Google Fonts) — arredondada e amigável
