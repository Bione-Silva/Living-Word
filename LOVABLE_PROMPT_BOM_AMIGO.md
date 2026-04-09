# MÓDULO 2: O Bom Amigo (Apoio Emocional Pastoral)

**Objetivo:** Criar uma interface de Chat Imersiva, acolhedora e segura, que atue como um "conselheiro pastoral de bolso" usando a `Edge Function` `generate-emotional-support`.

## 1. UX / UI Design (A Estética do Acolhimento)
- **Cores & Tema:** Use as variáveis do tema principal atual (Clean, Premium, Soft). O fundo da tela do chat pode ser um tom muito suave (ex: um off-white ou papel de linho levíssimo). Evite cores ansiosas (vermelho vivo, amarelo neon).
- **Bolhas de Chat (Bubbles):**
  - **Usuário:** Bolha com cor primária suave, alinhada à direita.
  - **O Bom Amigo (IA):** Bolha branca/cinza claro, alinhada à esquerda, com uma sombra sutil (glassmorphism leve).
- **Avatar:** Use um ícone acolhedor ou uma âncora minimalista para o bot "O Bom Amigo". 
- **Entrada de Texto:** Uma barra inferior flutuante com sombra suave, cantos arredondados, campo de texto auto-expansível (textarea) e um botão de envio (ícone de avião de papel ou "Enviar").

## 2. Estrutura de Retorno da IA (Renderização do JSON da Edge Function)
Quando você invocar a Supabase Edge Function `generate-emotional-support` passando um `{ "user_input": "...", "user_id": "...", "session_id": "..." }`, ela NÃO retorna uma string simples. Ela retorna um Payload Estruturado:

```json
{
  "detected_emotion": "ansiedade",
  "anchor_verse": "Filipenses 4:6-7",
  "anchor_verse_text": "Não andem ansiosos por coisa alguma...",
  "comfort_text": "Amigo, eu sei que a ansiedade parece uma nuvem escura...",
  "closing_prayer": "Senhor, acalma o coração do teu filho hoje. Amém."
}
```

**Como renderizar a bolha do Bot na UI:**
Quando a IA responde, não jogue um texto corrido. Formate a mensagem de maneira rica:
1. **Pílula da Emoção (Opcional):** Um pequeno badge sutil no topo da mensagem (ex: "🧠 Detectamos Ansiedade").
2. **O Versículo Âncora:** Renderize o `anchor_verse_text` em itálico, com aspas, e a referência (`anchor_verse`) em negrito logo abaixo. (Dar destaque visual a isso é VITAL para o produto cristão).
3. **Texto de Conforto:** Renderize o `comfort_text` como texto normal.
4. **Oração Final:** Em uma caixinha com fundo levemente destacado (ex: um tom pastel muito claro da cor primária) ou com um ícone de mãos orando (🙏).

## 3. Estado e Banco de Dados (Sessão de Conversa)
Para que o usuário sinta que está em uma mesma conversa:
- Quando a página carregar, gere no Front um `sessionId` local na memória (ou um `UUID` padrão) se o usuário estiver começando um chat novo. 
- Dispare a chamada via: 
  `supabase.functions.invoke('generate-emotional-support', { body: { user_input: mensagem, user_id: userId, session_id: sessionId }})`
- A Edge Function mesma já cuida de salvar o Histórico (Logs) no Banco de Dados (`emotional_support_logs`). O seu trabalho no Frontend é apenas desenhar o Array de Mensagens da sessão atual visualmente.

## 4. Loader Sensível
- Durante o `loading` da Edge Function, não use um spinner comum.
- Gire um texto sutil e acolhedor (typing effect): *"Buscando a palavra certa para você..."* ou *"Lendo com carinho..."*.

## 5. REGRAS GERAIS PARA O BÔT (Contexto de Front)
- NUNCA exponha erros técnicos de API para o usuário nessa tela. Se der erro na Edge Function, exiba: *"Aconteceu um pequeno erro. Tente expressar o que sente de outra forma, por favor."*
- Se o usuário digitar algo muito curto (menos de 3 letras), trave o botão de envio ou exiba um Toast suave pedindo mais detalhes.
