import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { YoutubeTranscript } from "npm:youtube-transcript";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) throw new Error('URL is required');

    // Fallback scheme: first try 'pt', then 'pt-BR', then default.
    let transcriptOptions = [{ lang: 'pt' }, { lang: 'pt-BR' }, undefined];
    let transcript = null;
    let lastError = null;

    for (const opt of transcriptOptions) {
      try {
        transcript = await YoutubeTranscript.fetchTranscript(url, opt);
        if (transcript && transcript.length > 0) break;
      } catch (e: any) {
        lastError = e;
      }
    }

    if (!transcript || transcript.length === 0) {
      throw lastError || new Error('Transcriptions not found');
    }

    const text = transcript.map(t => t.text).join(' ');

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error("YouTube Fetch Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
