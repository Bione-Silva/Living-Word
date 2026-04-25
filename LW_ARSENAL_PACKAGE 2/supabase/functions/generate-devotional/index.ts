// generate-devotional — Living Word Edge Function
// Generates devotionals in 2 modes: palavra_amiga (general) | profundo (advanced)
// Outputs: text (PT-BR, EN, ES) + audio script for TTS

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SKILL_MD = `
[Inject full contents of .antigravity/skills/lw-devotional/SKILL.md here at build time]
`;

interface DevotionalRequest {
  user_id: string;
  modo: "palavra_amiga" | "profundo";
  // Series mode
  serie?: {
    tema: string;           // "fidelidade-confianca"
    texto_base: string;     // "Malaquias 3"
    dia_atual: number;      // 1-5
    total_dias: number;     // 3, 5, 7, 30
    dias_anteriores?: string[]; // summaries for context
  };
  // Single day mode
  texto?: string;           // "Malaquias 3:10"
  tema_do_mes?: string;
  versao_biblica?: string;  // "NVI" | "ARA" | "NAA"
  idiomas?: string[];       // ["pt_br", "en", "es"]
  gerar_audio?: boolean;
}

interface DevotionalDay {
  dia: number;
  titulo: string;
  texto_biblico: { referencia: string; texto: string; versao: string };
  abertura: string;
  explicacao: string;
  por_tras_da_palavra: {
    palavra_original: string;
    transliteracao: string;
    idioma: string;
    iluminacao: string; // max 3 sentences
  };
  aplicacao: string;
  oracao: string;
  frase_memoravel: string;
  // Profundo mode extras
  contexto_historico?: string;
  analise_morfologica?: object;
  arco_canonico?: string;
  perguntas_grupo?: string[];
  para_aprofundar?: Array<{ referencia: string; conexao: string }>;
  // Audio
  script_audio?: string; // ≤280 words, TTS-optimized
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const body: DevotionalRequest = await req.json();
  const {
    user_id,
    modo = "palavra_amiga",
    serie,
    texto,
    versao_biblica = "NVI",
    idiomas = ["pt_br"],
    gerar_audio = true,
  } = body;

  // ── 1. Load user context from Supabase ──────────────────────────────────
  const { data: userPref } = await supabase
    .from("user_preferences")
    .select("versao_biblica, idioma_preferido, nivel_teologico")
    .eq("user_id", user_id)
    .single();

  // ── 2. Load calendar context ─────────────────────────────────────────────
  const { data: calendar } = await supabase
    .from("devotional_calendar")
    .select("tema_mes, serie_ativa, dia_serie")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // ── 3. Build system prompt ───────────────────────────────────────────────
  const systemPrompt = `${SKILL_MD}

MODO ATIVO: ${modo.toUpperCase()}
VERSÃO BÍBLICA: ${userPref?.versao_biblica || versao_biblica}
IDIOMAS SOLICITADOS: ${idiomas.join(", ")}
${serie ? `SÉRIE: ${serie.tema} — Dia ${serie.dia_atual} de ${serie.total_dias}` : ""}
${serie?.dias_anteriores ? `CONTEXTO DIAS ANTERIORES:\n${serie.dias_anteriores.join("\n")}` : ""}

RETORNE EXCLUSIVAMENTE JSON válido no seguinte formato:
{
  "pt_br": { ...DevotionalDay },
  "en": { ...DevotionalDay },    // apenas se solicitado
  "es": { ...DevotionalDay }     // apenas se solicitado
}`;

  // ── 4. Build user prompt ─────────────────────────────────────────────────
  const userPrompt = serie
    ? `Gere o Dia ${serie.dia_atual} da série "${serie.tema}" baseada em ${serie.texto_base}.
       Siga o arco de 5 dias do SKILL.md. O arco atual: dor → diagnóstico → clímax → expansão → fundamento.
       Este é o Dia ${serie.dia_atual}: ${getDayFocus(serie.dia_atual)}`
    : `Gere um devocional individual no modo ${modo} baseado em: ${texto || calendar?.tema_mes || "Salmos 23"}.`;

  // ── 5. Call GPT-4o ───────────────────────────────────────────────────────
  const gptResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      temperature: 0.72, // slight creativity while maintaining quality
      max_tokens: modo === "profundo" ? 3000 : 1500,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!gptResponse.ok) {
    const err = await gptResponse.text();
    return new Response(JSON.stringify({ error: "GPT error", detail: err }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const gptData = await gptResponse.json();
  const rawContent = gptData.choices[0].message.content;

  let devotional: Record<string, DevotionalDay>;
  try {
    devotional = JSON.parse(rawContent);
  } catch (e) {
    return new Response(JSON.stringify({ error: "Parse error", raw: rawContent }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── 6. Generate TTS audio (PT-BR only, Modo Palavra Amiga) ───────────────
  const audioUrls: Record<string, string> = {};

  if (gerar_audio && devotional.pt_br?.script_audio) {
    const ttsResponse = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "tts-1-hd",
        voice: "nova",
        speed: 0.92,
        input: devotional.pt_br.script_audio,
      }),
    });

    if (ttsResponse.ok) {
      const audioBuffer = await ttsResponse.arrayBuffer();
      const audioFileName = `devotionals/${user_id}/${Date.now()}.mp3`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("audio")
        .upload(audioFileName, audioBuffer, {
          contentType: "audio/mpeg",
          upsert: false,
        });

      if (!uploadError && uploadData) {
        const { data: { publicUrl } } = supabase.storage
          .from("audio")
          .getPublicUrl(audioFileName);
        audioUrls.pt_br = publicUrl;
      }
    }
  }

  // ── 7. Save to Supabase ──────────────────────────────────────────────────
  const { data: savedDevotional, error: saveError } = await supabase
    .from("devotionals")
    .insert({
      user_id,
      modo,
      data: new Date().toISOString().split("T")[0],
      serie_tema: serie?.tema || null,
      dia_serie: serie?.dia_atual || null,
      total_dias: serie?.total_dias || null,
      conteudo_pt_br: devotional.pt_br,
      conteudo_en: devotional.en || null,
      conteudo_es: devotional.es || null,
      audio_url_pt_br: audioUrls.pt_br || null,
      versao_biblica: userPref?.versao_biblica || versao_biblica,
      tokens_used: gptData.usage?.total_tokens || 0,
    })
    .select()
    .single();

  if (saveError) {
    console.error("Save error:", saveError);
  }

  // ── 8. Return ────────────────────────────────────────────────────────────
  return new Response(
    JSON.stringify({
      success: true,
      id: savedDevotional?.id,
      devotional,
      audio_urls: audioUrls,
      modo,
      tokens_used: gptData.usage?.total_tokens || 0,
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
});

function getDayFocus(dia: number): string {
  const focus: Record<number, string> = {
    1: "ABERTURA EMOCIONAL — porta de entrada pela dor/dúvida humana. O texto responde ANTES de exigir obediência.",
    2: "DIAGNÓSTICO PROFUNDO — raiz do problema é sempre teológica, nunca apenas comportamental.",
    3: "CLÍMAX / CONVITE — o texto mais ousado da série. Pede ação concreta antes de ver o resultado.",
    4: "EXPANSÃO DA VISÃO — a promessa é maior do que o leitor imagina. Dimensão comunitária.",
    5: "FUNDAMENTO TEOLÓGICO — termina não com exortação, mas com a segurança do caráter imutável de Deus.",
  };
  return focus[dia] || "Devocional temático";
}
