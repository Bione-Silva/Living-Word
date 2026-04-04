# Instruções para o Lovable: Nova Feature na UI (Bíblia Comentada / RAG)

Tanto o gerador de Artigos de Blog quanto o Estúdio Pastoral (Sermões/Devocionais) agora retornam no JSON uma nova variável chamada `historical_sources_used`.

**A Modificação na UI (Padrão Omniseen):**
- Quando um artigo ou material pastoral for gerado e exibido na tela, valide se a variável `historical_sources_used` (string) existe e é válida.
- Caso seja válida, crie um **Alert Box** ou um **Card Destaque** levemente estilizado após o título e antes da leitura do artigo.
- **Visual sugerido:** Fundo creme muito calmo (`bg-stone-50`), borda finíssima (`border border-stone-200`), ícone de livro clássico. 
- **Conteúdo do card:** *"📚 Fontes Históricas Utilizadas pelo Sistema RAG:"* e logo abaixo imprima a string da variável.
- Isso trará profunda credibilidade acadêmica ao sistema.
- Se a variável vier como `null` ou vazia (porque o usuário não tem dados ou o motor não encontrou citação aderente ao tema), faça o frontend **silenciar graciosamente** (esconder o componente), sem exibir estado de erro na interface.
