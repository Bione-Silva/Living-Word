// kb-batch-ingest — Esteira de ingestão do corpus pastoral
//
// Endpoint admin-only. Suporta 3 ações via POST:
//
//   action: "enqueue"   → cria N jobs (pending) para uma mente
//   action: "process"   → processa até MAX_JOBS_PER_RUN jobs pending/error
//   action: "status"    → snapshot agregado (counts por mind/status)
//
// O fluxo de cada job:
//   pending → fetching → chunking → embedding → (translating →) embedding (PT) → ingested
//
// Cada execução respeita timeout de ~50s. Roda quantos jobs couber e retorna,
// pra ser chamada de novo pelo admin (botão "Continuar") ou um cron.
//
// Segurança:
// - Auth obrigatória (JWT)
// - Apenas master admin (bionicaosilva@gmail.com OU has_role admin) pode invocar
// - Usa SUPABASE_SERVICE_ROLE_KEY internamente para escrever em knowledge

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EMBEDDING_DIMS = 768;
const MAX_JOBS_PER_RUN = 4;          // budget conservador pra caber em 50s
const MAX_CHUNKS_PER_INGEST = 400;   // abaixo do limite (500) da kb-ingest RPC
const CHUNK_TARGET_CHARS = 2400;     // ~600 tokens
const CHUNK_OVERLAP_CHARS = 320;     // ~80 tokens

// ─── Helpers ─────────────────────────────────────────────────────────
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function chunkText(raw: string): string[] {
  const text = raw.replace(/\s+/g, " ").trim();
  if (text.length <= CHUNK_TARGET_CHARS) return [text];

  const out: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + CHUNK_TARGET_CHARS, text.length);
    // tenta quebrar em fim de frase próximo
    if (end < text.length) {
      const slice = text.slice(start, end);
      const lastDot = Math.max(
        slice.lastIndexOf(". "),
        slice.lastIndexOf("! "),
        slice.lastIndexOf("? "),
      );
      if (lastDot > CHUNK_TARGET_CHARS * 0.6) {
        end = start + lastDot + 1;
      }
    }
    out.push(text.slice(start, end).trim());
    if (end >= text.length) break;
    start = end - CHUNK_OVERLAP_CHARS;
    if (start < 0) start = 0;
  }
  return out;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/?(p|br|div|h[1-6]|li)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

async function fetchSource(url: string, format: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "LivingWord-KB-Bot/1.0 (+pastoral corpus pilot)" },
  });
  if (!res.ok) throw new Error(`Fetch ${url} -> ${res.status}`);
  const body = await res.text();
  if (format === "html") return stripHtml(body);
  return body.trim();
}

// Embedding via Gemini text-embedding-004 (768 dim) usando GEMINI_API_KEY
// Faz chamadas individuais em paralelo (a API batchEmbedContents tem comportamento
// inconsistente em algumas regiões; embedContent é o endpoint estável).
async function embedOne(text: string, apiKey: string): Promise<number[]> {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "models/text-embedding-004",
      content: { parts: [{ text }] },
      outputDimensionality: EMBEDDING_DIMS,
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Embedding API ${res.status}: ${errText.slice(0, 300)}`);
  }
  const data = await res.json();
  const values = data?.embedding?.values as number[] | undefined;
  if (!values || values.length !== EMBEDDING_DIMS) {
    throw new Error(`Embedding shape mismatch: dims=${values?.length}`);
  }
  return values;
}

async function embedBatch(texts: string[], apiKey: string): Promise<number[][]> {
  // paraleliza em sub-lotes de 8 pra não estourar rate limit do Gemini
  const out: number[][] = [];
  const CONCURRENCY = 8;
  for (let i = 0; i < texts.length; i += CONCURRENCY) {
    const slice = texts.slice(i, i + CONCURRENCY);
    const results = await Promise.all(slice.map((t) => embedOne(t, apiKey)));
    out.push(...results);
  }
  return out;
}

// Tradução EN→PT via Lovable AI Gateway (gemini-2.5-flash)
async function translateToPortuguese(text: string, lovableKey: string): Promise<string> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "Você é tradutor pastoral. Traduza o texto inglês para português brasileiro mantendo o tom homilético, citações bíblicas no formato 'Livro Cap.Vers' e nomes próprios. Devolva APENAS a tradução, sem comentários.",
        },
        { role: "user", content: text },
      ],
      temperature: 0.2,
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Translate ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content?.trim() ?? text;
}

interface JobRow {
  id: string;
  mind: string;
  source_url: string;
  source_format: string;
  title: string;
  language: string;
  target_language: string;
  bible_refs: string[] | null;
  themes: string[] | null;
  metadata: Record<string, unknown> | null;
  attempts: number;
}

async function processJob(
  supabase: ReturnType<typeof createClient>,
  job: JobRow,
  geminiKey: string,
  lovableKey: string,
): Promise<{ ok: true; chunks: number } | { ok: false; error: string }> {
  // 1) fetching
  await supabase.from("kb_ingestion_jobs")
    .update({ status: "fetching", started_at: new Date().toISOString(), attempts: job.attempts + 1 })
    .eq("id", job.id);

  let rawText = await fetchSource(job.source_url, job.source_format);

  // sanity: se o conteúdo veio minúsculo (página de erro / index), aborta cedo
  if (rawText.length < 800) {
    throw new Error(`Source too small (${rawText.length} chars) — likely not a sermon page`);
  }

  // 2) tradução opcional EN→PT antes de chunkar
  if (job.target_language === "pt" && job.language === "en") {
    await supabase.from("kb_ingestion_jobs").update({ status: "translating" }).eq("id", job.id);
    // Traduz por blocos de ~3500 chars pra não estourar contexto
    const blocks = chunkText(rawText).map((b) => b);
    const translated: string[] = [];
    for (const b of blocks) {
      translated.push(await translateToPortuguese(b, lovableKey));
    }
    rawText = translated.join("\n\n");
  }

  // 3) chunking
  await supabase.from("kb_ingestion_jobs").update({ status: "chunking" }).eq("id", job.id);
  const chunks = chunkText(rawText);
  if (chunks.length === 0) throw new Error("No chunks produced");

  // 4) embeddings em sub-lotes de 50
  await supabase.from("kb_ingestion_jobs").update({ status: "embedding" }).eq("id", job.id);
  const allEmb: number[][] = [];
  for (let i = 0; i < chunks.length; i += 50) {
    const slice = chunks.slice(i, i + 50);
    const emb = await embedBatch(slice, geminiKey);
    allEmb.push(...emb);
  }

  // 5) ingest via RPC kb_ingest_document (em sub-batches se passar do limite)
  let totalInserted = 0;
  let documentId: string | null = null;

  // o esquema aceita 1 documento por chamada -> ingerimos tudo de uma vez,
  // mas a RPC limita por chamada; partimos em batches concatenando metadados
  for (let i = 0; i < chunks.length; i += MAX_CHUNKS_PER_INGEST) {
    const cSlice = chunks.slice(i, i + MAX_CHUNKS_PER_INGEST);
    const eSlice = allEmb.slice(i, i + MAX_CHUNKS_PER_INGEST);
    const chunksPayload = cSlice.map((text, idx) => ({
      chunk_index: i + idx,
      chunk_text: text,
      embedding: `[${eSlice[idx].join(",")}]`,
      token_count: Math.round(text.length / 4),
      metadata: { batch_offset: i },
    }));
    const isFirstBatch = i === 0;
    const { data, error } = await supabase.rpc("kb_ingest_document", {
      p_document: {
        title: isFirstBatch ? job.title : `${job.title} (cont. ${i})`,
        source: job.source_url,
        mind: job.mind,
        language: job.target_language,
        bible_refs: job.bible_refs ?? null,
        themes: job.themes ?? null,
        metadata: { ...(job.metadata ?? {}), ingestion_job_id: job.id },
      },
      p_chunks: chunksPayload,
      p_upsert: isFirstBatch, // primeiro batch substitui se já existir
    });
    if (error) throw new Error(`RPC kb_ingest_document: ${error.message}`);
    const r = data as { document_id: string; chunks_inserted: number };
    totalInserted += r.chunks_inserted;
    if (isFirstBatch) documentId = r.document_id;
  }

  // 6) marca como ingested
  await supabase.from("kb_ingestion_jobs").update({
    status: "ingested",
    document_id: documentId,
    chunks_count: totalInserted,
    finished_at: new Date().toISOString(),
    last_error: null,
  }).eq("id", job.id);

  return { ok: true, chunks: totalInserted };
}

// ─── Handler ─────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  // Auth
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  if (!GEMINI_API_KEY) return jsonResponse({ error: "GEMINI_API_KEY missing" }, 500);

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: cErr } = await userClient.auth.getUser();
  if (cErr || !userData?.user) return jsonResponse({ error: "Unauthorized" }, 401);

  const userEmail = userData.user.email;
  if (userEmail !== "bionicaosilva@gmail.com") {
    const { data: roleOk } = await userClient.rpc("is_admin");
    if (!roleOk) return jsonResponse({ error: "Forbidden" }, 403);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }
  const action = payload.action as string;

  // ── action: status ───────────────────────────────────────────────
  if (action === "status") {
    const { data, error } = await admin
      .from("kb_ingestion_jobs")
      .select("mind, status")
      .limit(2000);
    if (error) return jsonResponse({ error: error.message }, 500);
    const summary: Record<string, Record<string, number>> = {};
    for (const row of data ?? []) {
      const m = row.mind as string;
      const s = row.status as string;
      summary[m] ??= {};
      summary[m][s] = (summary[m][s] ?? 0) + 1;
    }
    return jsonResponse({ ok: true, summary });
  }

  // ── action: enqueue ──────────────────────────────────────────────
  if (action === "enqueue") {
    const jobs = payload.jobs as Array<{
      mind: string;
      source_url: string;
      title: string;
      source_format?: string;
      language?: string;
      target_language?: string;
      bible_refs?: string[];
      themes?: string[];
      metadata?: Record<string, unknown>;
      batch_id?: string;
    }>;
    if (!Array.isArray(jobs) || jobs.length === 0) {
      return jsonResponse({ error: "jobs[] required" }, 400);
    }
    const rows = jobs.map((j) => ({
      mind: j.mind,
      source_url: j.source_url,
      source_format: j.source_format ?? "html",
      title: j.title,
      language: j.language ?? "en",
      target_language: j.target_language ?? "en",
      bible_refs: j.bible_refs ?? [],
      themes: j.themes ?? [],
      metadata: j.metadata ?? {},
      batch_id: j.batch_id ?? null,
      status: "pending",
    }));
    const { error, count } = await admin
      .from("kb_ingestion_jobs")
      .upsert(rows, { onConflict: "source_url,target_language", ignoreDuplicates: true, count: "exact" });
    if (error) return jsonResponse({ error: error.message }, 500);
    return jsonResponse({ ok: true, enqueued: count ?? rows.length });
  }

  // ── action: process ──────────────────────────────────────────────
  if (action === "process") {
    const mindFilter = (payload.mind as string | undefined) ?? null;
    const limit = Math.min(Number(payload.limit ?? MAX_JOBS_PER_RUN), MAX_JOBS_PER_RUN);

    let q = admin
      .from("kb_ingestion_jobs")
      .select("*")
      .in("status", ["pending", "error"])
      .lt("attempts", 3)
      .order("created_at", { ascending: true })
      .limit(limit);
    if (mindFilter) q = q.eq("mind", mindFilter);

    const { data: jobs, error } = await q;
    if (error) return jsonResponse({ error: error.message }, 500);
    if (!jobs || jobs.length === 0) {
      return jsonResponse({ ok: true, processed: 0, message: "No pending jobs" });
    }

    const results: Array<{ id: string; status: string; chunks?: number; error?: string }> = [];
    for (const job of jobs as JobRow[]) {
      try {
        const r = await processJob(admin, job, GEMINI_API_KEY, LOVABLE_API_KEY ?? "");
        if (r.ok) {
          results.push({ id: job.id, status: "ingested", chunks: r.chunks });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await admin.from("kb_ingestion_jobs").update({
          status: "error",
          last_error: msg.slice(0, 500),
          finished_at: new Date().toISOString(),
        }).eq("id", job.id);
        results.push({ id: job.id, status: "error", error: msg.slice(0, 200) });
      }
    }
    return jsonResponse({ ok: true, processed: results.length, results });
  }

  return jsonResponse({ error: `Unknown action: ${action}` }, 400);
});
