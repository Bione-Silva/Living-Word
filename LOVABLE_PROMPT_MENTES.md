# Instruções Avançadas para o Lovable: Motor de Mentes Brilhantes e Custos (Premium)

Olá, Lovable. Nós acabamos de finalizar um grande refatoramento na nossa arquitetura de backend Deno (Edge Functions Supabase) para a plataforma **Living Word**. Finalizamos o suporte completo de DNA Extendido para as Vozes Pastorais (Billy Graham, Spurgeon, Wesley, Calvino, Marco Feliciano, Tiago Brunet) e otimizamos a topologia de custos com roteamento dinâmico de IA.

Sua Interface de Usuário (UI) precisa refletir essa engenharia e passar a sensação de um "SaaS Premium Impecável". **Siga rigorosamente as diretrizes abaixo para reconstruir e adequar a UI de Mentes Brilhantes.**

---

## 1. Topologia de Custos e Modelos: Roteamento Inteligente (Atenção ao Payload!)
Em nosso backend, alteramos o fluxo do generate-pastoral-material e generate-biblical-study. 
- **Usuários Nível Free:** Usam agora **Gemini 2.5 Flash** (rápido, custo muito baixo).
- **Usuários Nível Teste / Pagadores:** Usam **GPT-4o** (raciocínio profundo, alinhamento rigoroso à biografia da 'Mente').

**Sua Tarefa Técnica no Front:**
Quando você acionar a chamada (fetch/RPC) para generate-pastoral-material na página de criação de material, você DEVE garantir que o status do plano do usuário (seja "pro", "teste" ou "free") e o parâmetro da voz (pastoral_voice) sejam passados corretamente no payload.
Exemplo Teórico do Payload a ser enviado:

{
  "prompt": "...",
  "pastoral_voice": "Billy Graham",
  "isFree": false // Se for Free = true, backend vai p/ Gemini Flash
}

Certifique-se de que a seleção do plano do usuário na UI comunique a expectativa correta:
- Para usuários **Pagantes** e de **Teste**, exiba um badge sutil na hora da geração: *⚡ Powered by GPT-4o (Alta Exegese)* ou equivalente.
- Para usuários **Free**, o modelo rodará silenciosamente no Gemini.

---

## 2. A Vitrine das Mentes (/dashboard/mentes)
**⚠️ REGRA DE OURO DO DESIGN:** Absoluto CLEAN DESIGN. Use a paleta oficial (branco, bege, tons pastéis claros) e evite fundos escuros (Dark Mode é apenas para o painel Back-office admin).

Exiba os Cards em um Grid elegante. Adicione uma bandeira ou indicador da nacionalidade e o status se a Mente está desbloqueada ou bloqueada de acordo com a hierarquia da assinatura.

**Lista de Mentes Pronta no Backend:**
1. **Billy Graham 🇺🇸** (Liberado/Free) - *O Evangelista da América*
2. **Charles Spurgeon 🇬🇧** (Bloqueado 🔒) - *O Príncipe dos Pregadores*
3. **John Wesley 🇬🇧** (Bloqueado 🔒) - *O Fundador do Metodismo*
4. **João Calvino 🇫🇷/🇨🇭** (Bloqueado 🔒) - *O Teólogo de Genebra*
5. **Marco Feliciano 🇧🇷** (Bloqueado 🔒) - *O Profeta do Avivamento*
6. **Tiago Brunet 🇧🇷** (Bloqueado 🔒) - *O Mentor de Destinos*

Se o usuário logado for de um tier que não permite acesso a certa mente, ao clicar exiba um **Belo Paywall**: *"Desbloqueie a Sabedoria Histórica - $100/mês"*. Destaque que as Mentes Premium usam "Matriz de IA GPT-4o Profunda".

---

## 3. O Componente Modal "A Central da Mente" (FUNDAMENTAL)
Quando o usuário conseguir clicar num card que ele tem acesso (Ex: Billy Graham), **ABRA UM COMPONENTE SHEET, DRAWER OU DIALOG GIGANTE COM SCROLL**. O usuário deve entender o "Peso do DNA" da IA antes de usá-la.

Faça neste modal (fundo claro, clean):
### A. Hero Section (Topo)
Foto circular da Mente, nome e Subtítulo.
- **Badges de IA:** *(Ex: "350+ Horas de Vídeo", "Modelo Alinhado via RAG", "Comportamento Estrito")*.

### B. Biografia e Perfil Psicológico
Crie uma área de texto rica sobre como a IA pensa. Para Billy Graham, mencione "Urgência Evangelística, foco na cruz". Para Spurgeon, "Poder descritivo intenso, retórica poética reformada". Para Tiago Brunet, "Mentoria de destinos em 4 movimentos".

### C. Assinaturas e Matriz Teológica 
Checklist estruturado que o backend foi programado a obedecer:
- **Especialidades:** (Varia por Mente)
- **Assinaturas Verbais:** Frases icônicas ou jargões da pessoa (O backend usará nativamente!).
- **Matriz Teológica:** O posicionamento denominacional em que ela bate o martelo.

### D. Acervo da Memória (Os Arquivos da IA)
Mostre os arquivos que abastecem o cérebro (RAG):
*Exemplo Billy Graham:* "Paz com Deus (1953)", "A Cruzada de Los Angeles (1949)" etc.

### E. Módulo de Engate (Call to Actions de Geração)
No fim desse Modal, crie Cards que roteiem o usuário para o gerador de conteúdo ou para uma interface de chat (/dashboard/mentes/chat) pré-selecionando aquela voz:
1. 📖 **Devocional Diário**
2. 📝 **Preparação de Sermão**
3. 🗣️ **Aconselhamento / Mentoria**
4. 📚 **Estudo de Exegese**

Construa essa UX dando brilho à transição e tipografia. É um sistema Premium, o usuário precisa sentir que o sistema de inteligência artificial é massivamente poderoso. Avance!
