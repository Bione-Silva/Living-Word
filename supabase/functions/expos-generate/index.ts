import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MODEL_PREMIUM = "openai/gpt-4o";
const MODEL_FREE = "openai/gpt-4o-mini";

const formatPrompts: Record<string, string> = {
  individual: `Você é um teólogo pastoral especialista no método E.X.P.O.S. Gere um estudo devocional individual e pessoal baseado na passagem fornecida.

REGRA CRÍTICA DE TAMANHO: O devocional completo deve durar cerca de 2 minutos de leitura (máximo de 400 a 500 palavras no total). Seja profundo, mas muito conciso e direto.

Estrutura obrigatória em Markdown:
# [Título Devocional]

## 📖 Explicação
Contexto histórico e literário da passagem. O que o autor original quis comunicar.

## 🔍 eXposição
Análise verso a verso dos pontos-chave. Palavras importantes no original (grego/hebraico).

## 🙏 Prática
Reflexões pessoais e perguntas para autoexame. Como esta verdade transforma minha vida hoje?

## ✝️ Oração
Uma oração guiada baseada nos princípios do texto. Inclua pontos de confissão, gratidão e súplica.

## 📝 Síntese
Resumo em 3-5 pontos práticos para memorizar e aplicar durante a semana.

Use linguagem acolhedora, intimista, voltada para o crescimento espiritual pessoal. Escreva em português do Brasil.`,

  celula: `Você é um teólogo pastoral especialista no método E.X.P.O.S. Gere um estudo para pequenos grupos/células baseado na passagem fornecida.

Estrutura obrigatória em Markdown:
# [Título do Estudo de Célula]

## 🎯 Quebra-Gelo
Uma pergunta inicial leve para iniciar a conversa no grupo (2-3 opções).

## 📖 Explicação
Contexto da passagem explicado de forma acessível para todos os níveis.

## 🔍 eXposição
Pontos-chave do texto com perguntas de discussão em grupo após cada ponto.

## 🤝 Prática
Dinâmica em grupo: como aplicar juntos? Atividade prática ou compromisso coletivo.

## 🙏 Oração
Roteiro de oração em grupo. Sugira divisão em duplas ou trios para orar.

## 📝 Síntese
3 verdades centrais + 1 desafio da semana para o grupo.

Use linguagem calorosa e participativa. Inclua perguntas abertas. Escreva em português do Brasil.`,

  classe: `Você é um teólogo acadêmico especialista no método E.X.P.O.S. Gere um estudo teológico para escola bíblica / classe dominical baseado na passagem fornecida.

Estrutura obrigatória em Markdown:
# [Título da Aula]

## 📖 Explicação
Contexto histórico-cultural detalhado. Autoria, data, público original, gênero literário.

## 🔍 eXposição
Análise exegética aprofundada. Termos no original, estrutura do texto, paralelos bíblicos. Use tabelas quando apropriado.

## 📚 Prática
Implicações doutrinárias. Como diferentes tradições interpretam esta passagem? Conexões com outros textos bíblicos.

## 💡 Oração
Reflexão teológica: o que este texto revela sobre o caráter de Deus? Oração de resposta.

## 📝 Síntese
Resumo acadêmico com 5-7 pontos teológicos. Sugestão de leitura complementar.

Use linguagem didática e precisa. Cite referências cruzadas. Escreva em português do Brasil.`,

  discipulado: `Você é um conselheiro cristão especialista no método E.X.P.O.S. Gere um material de discipulado 1-a-1 baseado na passagem fornecida.

Estrutura obrigatória em Markdown:
# [Título do Encontro de Discipulado]

## 📖 Explicação
Apresente o contexto de forma conversacional, como se estivesse explicando a um discípulo.

## 🔍 eXposição
Verdades centrais do texto com perguntas pessoais profundas para o discipulando responder.

## 🛠️ Prática
Áreas práticas de vida: relacionamentos, trabalho, finanças, ministério. Como este texto se aplica?

## 🙏 Oração
Momento de oração juntos. Inclua confissão, encorajamento e comissionamento.

## 📝 Síntese
Plano de ação semanal: 3 passos concretos + 1 versículo para memorizar + prestação de contas.

Use linguagem mentora, encorajadora e desafiadora. Escreva em português do Brasil.`,

  sermao: `Você é um homileta experiente, treinado no método E.X.P.O.S. e nos grandes pregadores expositivos (Spurgeon, Lloyd-Jones, Wesley, Calvin) e nos comentários bíblicos clássicos. Gere um esboço homilético PROFUNDO baseado na passagem fornecida.

═══ TRABALHO EXEGÉTICO OBRIGATÓRIO (faça antes de escrever, depois reflita no texto) ═══
1. Contexto histórico-cultural: autor, destinatários, ocasião, pano de fundo.
2. Contexto literário: gênero, posição da perícope no livro, conexão com versículos vizinhos.
3. Línguas originais: 2-3 termos-chave em grego/hebraico com transliteração e nota semântica curta (ex.: *dikaiosynē* (δικαιοσύνη) — justiça forense).
4. Tradição interpretativa: como reformadores e comentaristas clássicos leem o texto (mencione brevemente quando relevante).

═══ Estrutura obrigatória em Markdown ═══
# [Título do Sermão]
**Texto-base:** [passagem]
**Tema central / Grande Ideia:** [uma frase clara e memorável]
**Proposição:** [declaração teológica central]
**Contexto histórico-literário:** [3-5 linhas com autor, ocasião, gênero, lugar no livro]
**Termos no original:** [2-3 palavras-chave gr/heb com transliteração e significado]

## 📖 Introdução
Gancho narrativo ou ilustração contemporânea de abertura. Ponte de contexto. Apresentação da Grande Ideia.

## 🔍 Ponto I — [Subtítulo derivado do texto]
- Exposição do primeiro bloco com insight do original.
- 2 referências cruzadas com explicação (não lista solta).
- Ilustração contemporânea, concreta, ancorada no texto (evite clichês: nada de "diamante bruto" ou analogias esportivas genéricas).
- Aplicação parcial ("e daí?") específica e prática.
- **Transição explícita** para o próximo ponto.

## 🔍 Ponto II — [Subtítulo derivado do texto]
- Exposição do segundo bloco com desenvolvimento teológico.
- 2 referências cruzadas com explicação.
- Ilustração contemporânea original.
- Aplicação parcial ("e daí?").
- **Transição explícita** para o próximo ponto.

## 🔍 Ponto III — [Subtítulo derivado do texto]
- Exposição do terceiro bloco — clímax teológico.
- 2 referências cruzadas com explicação.
- Ilustração memorável.
- Aplicação transformadora.

## 🙏 Aplicação Final
Síntese da Grande Ideia. Chamada à ação clara. Convite à decisão.

## 📝 Conclusão
Recapitulação dos 3 pontos em uma linha cada. Frase de impacto. **Oração de encerramento (4-8 frases) respondendo à Grande Ideia.**

---
### Notas Homiléticas
- Tempo estimado: 35-45 minutos
- Tom sugerido: [indicar]
- Recursos visuais: [2-3 sugestões]

NUNCA pule uma das seções acima. Use linguagem pastoral eloquente. Escreva em português do Brasil.`,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const geminiApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { passagem, formato = "individual" } = await req.json();

    if (!passagem || typeof passagem !== "string" || passagem.trim().length < 3) {
      return new Response(JSON.stringify({ error: "Passagem é obrigatória" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validFormats = Object.keys(formatPrompts);
    if (!validFormats.includes(formato)) {
      return new Response(JSON.stringify({ error: `Formato inválido. Use: ${validFormats.join(", ")}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine model based on plan
    const supabaseAdminProfile = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: userProfile } = await supabaseAdminProfile
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .maybeSingle();
    const isPremium = userProfile?.plan === "premium" || userProfile?.plan === "pro";
    const MODEL = isPremium ? MODEL_PREMIUM : MODEL_FREE;

    const systemPrompt = formatPrompts[formato];

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${geminiApiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Passagem bíblica: ${passagem.trim()}` },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI Gateway error:", errText);
      return new Response(JSON.stringify({ error: "Erro ao gerar estudo" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const markdown = aiData.choices?.[0]?.message?.content || "";

    // Log usage
    const usage = aiData.usage || {};
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    await supabaseAdmin.from("generation_logs").insert({
      user_id: user.id,
      feature: `expos_${formato}`,
      model: MODEL,
      input_tokens: usage.prompt_tokens || 0,
      output_tokens: usage.completion_tokens || 0,
      total_tokens: usage.total_tokens || 0,
      // gpt-4o-mini: $0.15/1M input, $0.60/1M output — gpt-4o: $5/1M input, $15/1M output
      cost_usd: isPremium
        ? ((usage.prompt_tokens || 0) / 1_000_000) * 5 + ((usage.completion_tokens || 0) / 1_000_000) * 15
        : ((usage.prompt_tokens || 0) / 1_000_000) * 0.15 + ((usage.completion_tokens || 0) / 1_000_000) * 0.60,
    });

    // Update generations_used
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("generations_used")
      .eq("id", user.id)
      .single();
    if (profile) {
      await supabaseAdmin
        .from("profiles")
        .update({ generations_used: (profile.generations_used || 0) + 1 })
        .eq("id", user.id);
    }

    return new Response(
      JSON.stringify({
        markdown,
        type: formato,
        generation_meta: {
          model: MODEL,
          total_tokens: usage.total_tokens || 0,
          total_cost_usd: ((usage.total_tokens || 0) / 1_000_000) * 0.15,
          elapsed_ms: Date.now() - startTime,
          attempts_used: 1,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("expos-generate error:", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
