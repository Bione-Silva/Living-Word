

## Problema
Os botões na página de artigo da Central de Ajuda (`HelpArticlePage.tsx`) têm contraste insuficiente — o texto não é legível. O problema afeta:

1. **Botão CTA principal** (linhas 70-78 e 243-249): usa `text-white` sobre gradiente `hsl(35,50%,45%)` — lightness de 45% é insuficiente para branco.
2. **Botão "Voltar" ghost** (linha 65): usa `text-[hsl(220,10%,50%)]` — texto cinza claro sobre fundo claro.
3. **Botão outline "Voltar para a Central"** (linha 251): herda cores do tema que podem ter baixo contraste.

## Correções

### Arquivo: `src/pages/HelpArticlePage.tsx`

1. **Botões CTA com gradiente** (linhas 73 e 245): escurecer o gradiente para garantir contraste com texto branco:
   - `from-[hsl(28,45%,32%)] to-[hsl(25,40%,26%)]` (mais escuro, lightness ~30%)
   - Hover: `from-[hsl(28,45%,38%)] to-[hsl(25,40%,32%)]`

2. **Botão ghost "Voltar"** (linha 65): trocar `text-[hsl(220,10%,50%)]` por `text-[hsl(24,30%,30%)]` (mais escuro e no tom quente correto).

3. **Botão outline "Voltar para a Central"** (linha 251): adicionar `text-[hsl(24,30%,20%)] border-[hsl(30,15%,78%)]` para garantir texto escuro e borda visível.

Todas as alterações são apenas em `src/pages/HelpArticlePage.tsx`, ajustando valores HSL inline para garantir ratio de contraste WCAG AA (4.5:1+).

