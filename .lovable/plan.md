

## Bug: Imagens Duplicadas em `generate-article-images`

### Causa Raiz
A função `generate-article-images` analisa os headings H2/H3 do markdown e insere imagens após cada um. Porém, o gerador de artigos (`generate-blog-article`) já insere imagens `![Ilustração N](url)` no conteúdo. A função não verifica se já existe uma imagem próxima ao heading, resultando em 2 imagens seguidas por seção.

### Correção

**Arquivo:** `supabase/functions/generate-article-images/index.ts`

1. **Na função `analyzeSections`**: após encontrar um heading, verificar se as linhas seguintes (até 4 linhas abaixo) já contêm um padrão `![...](...)`. Se sim, pular esse heading — ele já tem imagem.

2. **Lógica adicional de segurança**: antes de inserir no markdown (linha ~141), re-verificar que não existe `![` nas 3 linhas após o ponto de inserção.

Isso garante que a função é idempotente — pode ser chamada múltiplas vezes sem duplicar imagens, e respeita imagens já inseridas por outros geradores.

### Mudança concreta

```typescript
// analyzeSections: skip headings that already have an image nearby
function analyzeSections(markdown: string): Section[] {
  const lines = markdown.split("\n");
  const sections: Section[] = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^#{2,3}\s+(.+)/);
    if (m) {
      // Check if next 4 lines already contain an image
      const nearby = lines.slice(i + 1, i + 5).join("\n");
      if (/!\[.*?\]\(.*?\)/.test(nearby)) continue; // skip — already has image
      
      const snippet = lines.slice(i + 1, i + 6).join(" ")
        .replace(/[#*_\[\]()>`~]/g, " ").trim().slice(0, 120);
      sections.push({ heading: m[1], lineIndex: i, snippet });
    }
  }
  return sections;
}
```

Nenhuma alteração no frontend — apenas a Edge Function precisa ser corrigida e re-deployada.

