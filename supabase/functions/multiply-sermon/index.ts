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

    const { material_id, output_type } = await req.json();
    if (!material_id || !output_type) {
      throw new Error("Missing required parameters (material_id, output_type)");
    }

    console.log(`[Multiply Sermon] User ${userData.user.id} requested ${output_type} for material: ${material_id}`);

    // 1. Fetch Sermon Content
    const { data: material, error: matError } = await supabaseClient
      .from("materials")
      .select("title, passage, content")
      .eq("id", material_id)
      .single();

    if (matError || !material) {
      throw new Error("No sermon material found or unreadable.");
    }

    // 2. Consume Credits (e.g. 15 credits for Multiplication)
    const COST = 15;
    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: creditData, error: creditError } = await adminSupabase.rpc("debit_credits", {
      p_user_id: userData.user.id,
      p_amount: COST,
      p_generation_type: `multiply_${output_type}`,
      p_material_id: material_id,
      p_description: `Subproduto (${output_type}) gerado via Sermon Builder`
    });

    if (creditError || (creditData && creditData[0] && !creditData[0].success)) {
      console.error("Credit error:", creditError?.message || "Insufficient Credits");
      return new Response(
        JSON.stringify({ error: "Saldo de créditos insuficiente. Faça um top-up ou mude de plano." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. System Prompts Mapping
    let systemInstruction = "";
    switch (output_type) {
      case "blog":
        systemInstruction = "Converta este sermão em um artigo de blog longo, otimizado para SEO, com introdução cativante, intertítulos fortes e conclusão.";
        break;
      case "social":
        systemInstruction = "Crie uma série de carrosséis para Instagram (máximo 5 slides) resumindo os pontos chave deste sermão.";
        break;
      case "devotional":
        systemInstruction = "Escreva um devocional íntimo de 1 página baseado neste sermão. Inclua 1 versículo, aplicação prática diária e oração final.";
        break;
      case "cell_study":
        systemInstruction = "Transforme este sermão em um guia prático para estudo em Pequeno Grupo/Célula (Icebreaker, 4 perguntas de aprofundamento e Desafio).";
        break;
      default:
        throw new Error("Invalid output_type");
    }

    const fullPrompt = `${systemInstruction}\n\n[TÍTULO DO SERMÃO]: ${material.title}\n[PASSAGEM BÍBLICA]: ${material.passage || 'N/A'}\n[CONTEÚDO]:\n${material.content}`;

    // 4. Generate with Gemini
    const googleApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!googleApiKey) throw new Error("Missing GEMINI_API_KEY");

    console.log("[Multiply Sermon] Calling Gemini API...");
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${googleApiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: fullPrompt }] }
        ],
        generationConfig: {
          temperature: 0.7,
        }
      }),
    });

    if (!response.ok) {
      const txt = await response.text();
      console.error("Gemini Error:", txt);
      // Reembolso caso AI falhe
      await adminSupabase.rpc("add_credits_topup", { p_user_id: userData.user.id, p_amount: COST });
      throw new Error(`Google API falhou: ${txt}`);
    }

    const { candidates } = await response.json();
    const generatedContent = candidates?.[0]?.content?.parts?.[0]?.text || "Erro na geração";

    // 5. Salvar resultado na tabela `multiply_outputs`
    const { data: insertedOutput, error: insertError } = await adminSupabase
      .from("multiply_outputs")
      .insert({
        user_id: userData.user.id,
        material_id: material_id,
        output_type: output_type,
        content: generatedContent
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert Output Error:", insertError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      content: generatedContent, 
      output_id: insertedOutput?.id,
      credits_remaining: creditData[0]?.balance_remaining 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in multiply-sermon:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
