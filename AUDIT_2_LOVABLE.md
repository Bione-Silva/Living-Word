# Auditoria de Roteamento - Ferramenta de Criação de Blog

Lovable, precisamos de uma correção urgente no componente de **Criação de Blog Principal** (provavelmente o formulário ou a tela principal onde o usuário clica para "Criar um Artigo do Zero" ou na "Ferramenta de Criação de Blog").

**O Problema Atual:**
O usuário clica para gerar um Blog, mas o resultado continua saindo como um texto curto comum e sem Imagens, o que indica que **este fluxo específico NÃO está chamando a Edge Function `generate-blog-article`**, ou está chamando um endpoint antigo chamado `ai-tool`, ou até chamando a OpenAI direto no Client-side.

**Ação Exigida:**
1. Rastreie TODOS os componentes, Modais e Botões dentro da plataforma que levam a palavra "Blog" ou "Artigo".
2. Verifique qual função ou Endpoint é disparado no `onSubmit` ou `onClick` da geração do artigo.
3. Se o código estiver chamando outras coisas ou batendo direto numa route handler e não na nossa função nativa recém-atualizada faça a substituição imediata.
4. **SUBSTITUA IMEDIATAMENTE** qualquer chamada relacionada a Blog para invocar a Edge Function correta do Supabase:
   
```typescript
const { data, error } = await supabase.functions.invoke('generate-blog-article', {
  body: {
    category: "blog",
    bible_passage: input, 
    language: generationLang,
    title: toolTitle 
  },
});
```

*(Lembrete: Em `generate-blog-article`, só precisamos passar os metadados. O "Prompt" estrito de SEO com 3000 Tokens e Image Gen já vive isolado e bloqueado lá dentro da Edge Function).*

Corrija TODOS os arquivos do frontend que criam conteúdo para Blog e me informe quais arquivos você alterou para eu ter certeza que agora o botão está finalmente conectado à nova Edge Function.
