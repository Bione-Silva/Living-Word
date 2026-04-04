# Instrução para o Lovable: Layout Premium para Artigos de Blog (Textos Longos & DALL-E)

O backend foi evoluído. Agora, quando geramos um artigo de blog, a inteligência artificial envia um texto longo (Narrativa rica de até 800+ palavras) e insere estrategicamente **4 belas ilustrações de alta resolução (DALL-E 3)** diretamente no texto, usando a sintaxe padrão de Markdown `![Ilustração editorial](URL_DA_IMAGEM)`.

Seu objetivo no Frontend agora é **preparar a interface e a renderização do Markdown** para esse nível profissional (estilo Medium / Substack).

### O que você deve ajustar na renderização do Artigo (Visualização do post):

1. **O Componente React Markdown:**
   - O componente que renderiza a variável `article.body` deve utilizar a classe `prose` do Tailwind Typography com as seguintes configurações:
     `className="prose prose-lg prose-stone dark:prose-invert max-w-3xl mx-auto"`
   
2. **Estilização das Imagens Injetadas:**
   - Como as 4 imagens virão via Markdown, elas precisam de classes específicas para não quebrarem o layout. Adicione no container pai ou plugin as instruções via Tailwind prose modifier:
     `prose-img:rounded-2xl prose-img:shadow-2xl prose-img:mx-auto prose-img:w-full prose-img:object-cover prose-img:my-10`
   - Isso garantirá que as ilustrações que a IA gerou fiquem com um visual de "fotografia editorial", com cantos bem arredondados e sombra premium, espaçadas elegantemente no meio da leitura.

3. **Tipografia e Espaçamento da Narrativa:**
   - Os parágrafos agora são longos. Certifique-se de usar `prose-p:leading-relaxed prose-p:text-stone-700 dark:prose-p:text-stone-300`.
   - Os H2 (`##`) que dividem a narrativa devem saltar aos olhos: `prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-stone-900`.

4. **Tratamento de Estado Vazio ou Loading:**
   - Como o backend agora invoca a IA gpt-4o e gera 4 imagens no DALL-E em paralelo, a geração pode levar cerca de **15 a 25 segundos**.
   - Coloque um Spinner elegante ou "Skeleton" com mensagens como *"Expandindo a narrativa e pintando ilustrações (isso pode levar ~20s)..."* na UI do botão de "Gerar Artigo".
   - Isso evita que o usuário ache que o sistema travou ou feche a tela.
