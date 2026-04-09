Crie a página principal `/sermoes` no estilo "Lovable Premium Immersive" com tipografia serifada luxuosa e UI glassmorphic.

**Objetivo:** Uma página interativa ("Wizard") para pastores e líderes gerarem esboços de pregação com IA de alta qualidade.
**Backend Conectado:** O banco tem a tabela `sermons` e consumiremos a nossa nova Edge Function `generate-sermon`.

### Funcionalidades do Frontend exigidas:
1. **Formulário Passo a Passo (Wizard):** 
   - **Step 1 (Tema):** Input Text grande focado no "Tema da sua Mensagem ou Passagem Bíblica".
   - **Step 2 (Público & Tom):** Dropdowns interativos para "Público-Alvo" (ex: Jovens, Congregação, Mulheres) e "Tom da Pregação" (ex: Inspiracional, Expositivo).
   - **Step 3 (Duração & Extras):** Slider deslizando de 15 a 60 minutos. E um textarea opcional para anotações extras do usuário.
   
2. **Botão de Geração:**
   - Um botão vibrante que ao clicar invoca chamada REST (fetch JWT header) para a Edge Function de Sermons.
   - Exiba um Estado de Loading luxuoso com animações shimmers durante a geração do gpt-4o.

3. **Visualizador do Sermão (Sermon Result View):**
   - Utilize um componente Markdown Renderer com Tailwind Typography integrado.
   - **[CRÍTICO] Componente `<BibleRichText />`:** Para TODO link Markdown (`[Joao 3:1](/biblia/joao/3)`), intercepte-o. Não modifique a URL no browser, ao invés disso abra um **Bottom Sheet/Modal pop-up** carregando os versos da API `get-bible-verse` criada no Supabase.

4. **Painel Base de Dados:**
   - Opcionalmente (em uma lateral ou drawer) buscar os registros do histórico efetuando fetch da tabela Supabase `sermons` ordenada pelos recém-criados.

**Guidelines de CSS:**
Design premium. Tons beges `#F5F0E8` no fundo e um Dark Mode polido para leitura. Fonte *Inter* para os forms / botões, *Playfair Display* preta ou terracota para as pregações textuais e títulos.
