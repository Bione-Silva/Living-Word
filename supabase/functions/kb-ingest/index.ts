// kb-ingest — Internal RAG ingestion gateway
//
// Receives a document + array of chunks (with pre-computed Gemini 768-dim
// embeddings) and inserts everything into the `knowledge` schema using
// service_role privileges.
//
// AUTH: Protected by a shared bearer token (KB_INGEST_TOKEN secret).
// This function is meant to be called by a TRUSTED external agent
// (e.g. an Antigravity ingestion script) — never from the browser.
//
// Endpoint:  POST /functions/v1/kb-ingest
// Header:    Authorization: Bearer <KB_INGEST_TOKEN>
//
// Body shape (see PayloadSchema below):
// {
//   "document": {
//     "title": "...",
//     "source": "...",
//     "mind": "spurgeon",          // optional
//     "language": "en",            // optional
//     "bible_refs": ["Rom 8:28"],  // optional
//     "themes": ["grace"],         // optional
//     "metadata": { ... }          // optional, free-form JSON
//   },
//   "chunks": [
//     {
//       "chunk_index": 0,
//       "chunk_text": "...",
//       "embedding": [0.012, -0.034, ... 768 floats ...],
//       "token_count": 412,        // optional
//       "metadata": { ... }        // optional
//     },
//     ...
//   ],
//   "upsert": false                // optional — if true, replaces existing doc by (source, title)
// }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EMBEDDING_DIMS = 768;
const MAX_CHUNKS_PER_REQUEST = 500;
const MAX_CHUNK_TEXT_LEN = 8000;

// ─── Helpers ─────────────────────────────────────────────────────────
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

interface IncomingDocument {
  title: string;
  source?: string | null;
  mind?: string | null;
  language?: string | null;
  bible_refs?: string[] | null;
  themes?: string[] | null;
  metadata?: Record<string, unknown> | null;
}

interface IncomingChunk {
  chunk_index: number;
  chunk_text: string;
  embedding: number[];
  token_count?: number | null;
  metadata?: Record<string, unknown> | null;
}

interface IngestPayload {
  document: IncomingDocument;
  chunks: IncomingChunk[];
  upsert?: boolean;
}

function validatePayload(raw: unknown): { ok: true; data: IngestPayload } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") return { ok: false, error: "Body must be a JSON object" };
  const p = raw as Record<string, unknown>;

  // document
  const doc = p.document as Record<string, unknown> | undefined;
  if (!doc || typeof doc !== "object") return { ok: false, error: "`document` is required" };
  if (typeof doc.title !== "string" || doc.title.trim().length === 0) {
    return { ok: false, error: "`document.title` must be a non-empty string" };
  }
  if (doc.title.length > 500) return { ok: false, error: "`document.title` too long (max 500)" };

  // chunks
  const chunks = p.chunks as unknown[];
  if (!Array.isArray(chunks) || chunks.length === 0) {
    return { ok: false, error: "`chunks` must be a non-empty array" };
  }
  if (chunks.length > MAX_CHUNKS_PER_REQUEST) {
    return { ok: false, error: `Too many chunks (max ${MAX_CHUNKS_PER_REQUEST} per request)` };
  }

  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i] as Record<string, unknown>;
    if (!c || typeof c !== "object") return { ok: false, error: `chunks[${i}] must be an object` };
    if (typeof c.chunk_index !== "number" || !Number.isInteger(c.chunk_index) || c.chunk_index < 0) {
      return { ok: false, error: `chunks[${i}].chunk_index must be a non-negative integer` };
    }
    if (typeof c.chunk_text !== "string" || c.chunk_text.length === 0) {
      return { ok: false, error: `chunks[${i}].chunk_text must be a non-empty string` };
    }
    if (c.chunk_text.length > MAX_CHUNK_TEXT_LEN) {
      return { ok: false, error: `chunks[${i}].chunk_text too long (max ${MAX_CHUNK_TEXT_LEN})` };
    }
    if (!Array.isArray(c.embedding) || c.embedding.length !== EMBEDDING_DIMS) {
      return {
        ok: false,
        error: `chunks[${i}].embedding must be a vector of exactly ${EMBEDDING_DIMS} numbers`,
      };
    }
    for (let j = 0; j < c.embedding.length; j++) {
      const v = (c.embedding as unknown[])[j];
      if (typeof v !== "number" || !Number.isFinite(v)) {
        return { ok: false, error: `chunks[${i}].embedding[${j}] must be a finite number` };
      }
    }
  }

  return {
    ok: true,
    data: {
      document: doc as unknown as IncomingDocument,
      chunks: chunks as unknown as IncomingChunk[],
      upsert: p.upsert === true,
    },
  };
}

// ─── Handler ─────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed. Use POST." }, 405);
  }

  // ── Auth (shared bearer token) ────────────────────────────────────
  const expectedToken = Deno.env.get("KB_INGEST_TOKEN");
  if (!expectedToken) {
    console.error("[kb-ingest] KB_INGEST_TOKEN not configured");
    return jsonResponse({ error: "Server misconfigured (token missing)" }, 500);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const presented = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";

  if (!presented || !constantTimeEqual(presented, expectedToken)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  // ── Supabase env ──────────────────────────────────────────────────
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[kb-ingest] Missing Supabase env vars");
    return jsonResponse({ error: "Server misconfigured (supabase)" }, 500);
  }

  // ── Parse + validate body ─────────────────────────────────────────
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const validation = validatePayload(raw);
  if (!validation.ok) {
    return jsonResponse({ error: validation.error }, 400);
  }

  const { document, chunks, upsert } = validation.data;

  // Cliente no schema `public` — vamos chamar uma RPC SECURITY DEFINER
  // (`public.kb_ingest_document`) que escreve no schema `knowledge` por dentro
  // do Postgres. Isso evita ter que expor o schema `knowledge` ao PostgREST.
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const t0 = Date.now();

    // Embeddings precisam virar string no formato pgvector "[0.1,0.2,...]"
    // pra que o cast `(c->>'embedding')::vector(768)` na RPC funcione.
    const chunksPayload = chunks.map((c) => ({
      chunk_index: c.chunk_index,
      chunk_text: c.chunk_text,
      embedding: `[${c.embedding.join(",")}]`,
      token_count: c.token_count ?? null,
      metadata: c.metadata ?? null,
    }));

    const { data, error } = await supabase.rpc("kb_ingest_document", {
      p_document: {
        title: document.title,
        source: document.source ?? null,
        mind: document.mind ?? null,
        language: document.language ?? null,
        bible_refs: document.bible_refs ?? null,
        themes: document.themes ?? null,
        metadata: document.metadata ?? null,
      },
      p_chunks: chunksPayload,
      p_upsert: upsert,
    });

    if (error) {
      console.error("[kb-ingest] RPC kb_ingest_document failed:", error);
      return jsonResponse(
        { error: "Failed to ingest document", details: error.message },
        500,
      );
    }

    const result = data as { document_id: string; chunks_inserted: number };
    const elapsedMs = Date.now() - t0;

    return jsonResponse({
      ok: true,
      document_id: result.document_id,
      chunks_inserted: result.chunks_inserted,
      elapsed_ms: elapsedMs,
      embedding_model: "text-embedding-004",
      embedding_dims: EMBEDDING_DIMS,
    }, 201);
  } catch (err) {
    console.error("[kb-ingest] Unhandled error:", err);
    return jsonResponse(
      { error: err instanceof Error ? err.message : "Unknown error" },
      500,
    );
  }
});
