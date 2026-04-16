// kb-search — Internal RAG gateway (Gemini edition)
// Receives a natural-language query, generates a Google Gemini embedding
// (text-embedding-004, 768 dims), then calls knowledge.search_corpus()
// via service_role and returns the top-K chunks ranked by cosine similarity.
//
// Designed to be called from other edge functions (e.g. mind-chat) — NOT
// directly from the browser. We still expose CORS for internal tooling
// and admin debugging, but the function should be considered private.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─────────────────────────────────────────────────────────────
// Config — Google Gemini embeddings
// ─────────────────────────────────────────────────────────────
const EMBEDDING_MODEL = "text-embedding-004"; // 768 dims — must match knowledge.chunks
const EMBEDDING_DIMS = 768;
const GEMINI_EMBED_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent`;

interface KbSearchBody {
  query: string;
  filter_mind?: string | null;
  filter_language?: string | null;
  filter_bible_ref?: string | null;
  top_k?: number;
  similarity_threshold?: number;
  // Optional: "RETRIEVAL_QUERY" (default) or "RETRIEVAL_DOCUMENT"
  // Use RETRIEVAL_DOCUMENT only if you ever reuse this function for ingestion.
  task_type?: "RETRIEVAL_QUERY" | "RETRIEVAL_DOCUMENT";
}

interface SearchResultRow {
  chunk_id: string;
  document_id: string;
  chunk_index: number;
  chunk_text: string;
  document_title: string;
  document_source: string | null;
  mind: string | null;
  language: string | null;
  bible_refs: string[] | null;
  themes: string[] | null;
  similarity: number;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

async function embedQuery(
  text: string,
  geminiKey: string,
  taskType: "RETRIEVAL_QUERY" | "RETRIEVAL_DOCUMENT" = "RETRIEVAL_QUERY",
): Promise<number[]> {
  const url = `${GEMINI_EMBED_URL}?key=${encodeURIComponent(geminiKey)}`;

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      // The model field is required by the v1beta REST contract even though
      // it's already in the URL path.
      model: `models/${EMBEDDING_MODEL}`,
      content: {
        parts: [{ text }],
      },
      taskType,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    console.error("[kb-search] Gemini embeddings error:", resp.status, errText);
    throw new Error(`Gemini embeddings failed (${resp.status}): ${errText}`);
  }

  const data = await resp.json();
  const embedding: number[] | undefined = data?.embedding?.values;

  if (!Array.isArray(embedding) || embedding.length !== EMBEDDING_DIMS) {
    throw new Error(
      `Unexpected embedding shape: got ${
        Array.isArray(embedding) ? embedding.length : typeof embedding
      }, expected ${EMBEDDING_DIMS}`,
    );
  }

  return embedding;
}

// ─────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed. Use POST." }, 405);
  }

  try {
    // ── Secrets ──────────────────────────────────────────────
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[kb-search] Missing Supabase env vars");
      return jsonResponse({ error: "Server misconfigured (supabase)" }, 500);
    }
    if (!GEMINI_API_KEY) {
      console.error("[kb-search] Missing GEMINI_API_KEY");
      return jsonResponse(
        { error: "Server misconfigured (GEMINI_API_KEY missing)" },
        500,
      );
    }

    // ── Parse + validate body ────────────────────────────────
    let body: KbSearchBody;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const query = (body.query ?? "").toString().trim();
    if (!query) {
      return jsonResponse({ error: "`query` is required" }, 400);
    }
    if (query.length > 4000) {
      return jsonResponse(
        { error: "`query` is too long (max 4000 chars)" },
        400,
      );
    }

    const top_k = isFiniteNumber(body.top_k)
      ? Math.min(Math.max(Math.trunc(body.top_k), 1), 25)
      : 5;

    const similarity_threshold = isFiniteNumber(body.similarity_threshold)
      ? Math.min(Math.max(body.similarity_threshold, 0), 1)
      : 0.7;

    const filter_mind = body.filter_mind?.toString().trim() || null;
    const filter_language = body.filter_language?.toString().trim() || null;
    const filter_bible_ref = body.filter_bible_ref?.toString().trim() || null;
    const task_type = body.task_type === "RETRIEVAL_DOCUMENT"
      ? "RETRIEVAL_DOCUMENT"
      : "RETRIEVAL_QUERY";

    // ── 1. Generate embedding via Gemini ─────────────────────
    const t0 = Date.now();
    const embedding = await embedQuery(query, GEMINI_API_KEY, task_type);
    const tEmbed = Date.now() - t0;

    // ── 2. Call RPC via service_role ─────────────────────────
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      db: { schema: "knowledge" },
    });

    const t1 = Date.now();
    const { data, error } = await supabase.rpc("search_corpus", {
      query_embedding: embedding,
      filter_mind,
      filter_language,
      filter_bible_ref,
      top_k,
      similarity_threshold,
    });
    const tRpc = Date.now() - t1;

    if (error) {
      console.error("[kb-search] RPC error:", error);
      return jsonResponse(
        { error: "Knowledge search failed", details: error.message },
        500,
      );
    }

    const results = (data ?? []) as SearchResultRow[];

    return jsonResponse({
      query,
      filters: { filter_mind, filter_language, filter_bible_ref },
      top_k,
      similarity_threshold,
      count: results.length,
      timings_ms: { embedding: tEmbed, rpc: tRpc, total: tEmbed + tRpc },
      embedding_model: EMBEDDING_MODEL,
      embedding_dims: EMBEDDING_DIMS,
      task_type,
      results,
    });
  } catch (err) {
    console.error("[kb-search] Unhandled error:", err);
    return jsonResponse(
      { error: err instanceof Error ? err.message : "Unknown error" },
      500,
    );
  }
});
