import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data: userData, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !userData.user) {
      throw new Error("Unauthorized");
    }

    const { query, verse_reference } = await req.json();
    if (!query && !verse_reference) {
      throw new Error("Missing query or verse reference.");
    }

    // 1. Consume Credits (e.g. 5 credits for Research)
    const COST = 5;
    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: creditData, error: creditError } = await adminSupabase.rpc("debit_credits", {
      p_user_id: userData.user.id,
      p_amount: COST,
      p_generation_type: "sermon_research",
      p_description: "Pesquisa Acadêmica / Exegética (Research Suite)"
    });

    if (creditError || (creditData && creditData[0] && !creditData[0].success)) {
      return new Response(
        JSON.stringify({ error: "Saldo insuficiente para pesquisa avançada." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Generate Prompt for Gemini
    let prompt = `Você é um exímio teólogo e exegeta bíblico. 
Sua tarefa é fornecer uma pesquisa profunda e estruturada para auxiliar na construção de um sermão.\n\n`;

    if (query && verse_reference) {
      prompt += `TEMA/TÓPICO: ${query}\nPASSAGEM BASE: ${verse_reference}\n`;
    } else if (verse_reference) {
      prompt += `PASSAGEM: ${verse_reference}\n`;
    } else {
      prompt += `TEMA TÓPICO: ${query}\n`;
    }

    prompt += `\nPor favor, retorne um objeto JSON ESTRITO com a exata seguinte estrutura:
{
  "background_context": "Contexto histórico e cultural detalhado.",
  "theological_insights": "2 ou 3 insights teológicos profundos sobre o tema/versículo.",
  "original_language_notes": "'Palavra no Grego/Hebraico' - Significado original explorado rapidamente."
}
*AVISO:* Responda APENAS com o JSON. Nenhuma palavra a mais ou a menos.`;

    const googleApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!googleApiKey) throw new Error("Missing GEMINI_API_KEY");

    // 3. Request from Gemini
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${googleApiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.6, response_mime_type: "application/json" }
      }),
    });

    if (!response.ok) {
      const txt = await response.text();
      await adminSupabase.rpc("add_credits_topup", { p_user_id: userData.user.id, p_amount: COST });
      throw new Error(`Google API falhou: ${txt}`);
    }

    const { candidates } = await response.json();
    const generatedText = candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    
    // Validate JSON structure
    let resultObj;
    try {
      resultObj = JSON.parse(generatedText);
    } catch {
      throw new Error("Falha ao analisar a resposta do modelo como JSON.");
    }

    // 4. Salvar em cache (research_cache)
    const { data: cacheData, error: cacheError } = await adminSupabase
      .from("research_cache")
      .insert({
        query: query || null,
        verse_reference: verse_reference || null,
        background_context: resultObj.background_context,
        theological_insights: resultObj.theological_insights,
        original_language_notes: resultObj.original_language_notes
      })
      .select()
      .single();

    if (cacheError) console.error("Research Cache Insert Error:", cacheError);

    return new Response(JSON.stringify({ 
      success: true, 
      research: resultObj,
      cache_id: cacheData?.id,
      credits_remaining: creditData[0]?.balance_remaining
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in sermon-research:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
