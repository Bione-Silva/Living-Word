/**
 * Living Word — Shared Utilities (Common Module)
 * 
 * Módulo compartilhado por todas as Edge Functions.
 * SEGURANÇA: Implementa o padrão "Scoped Client" — jamais usa service_role 
 * para operações do usuário. Cada request cria um client autenticado com o JWT do usuário.
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"

// ============================================================
// CORS Headers
// ============================================================
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
}

export function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }
  return null
}

// ============================================================
// Scoped Client — O PADRÃO CORRETO DE SEGURANÇA
// ============================================================
// Cria um client Supabase que herda as permissões do JWT do usuário.
// Isso garante que TODAS as queries passem pelo RLS.
// O service_role NUNCA é usado para ler/escrever dados do usuário.

export function createScopedClient(authHeader: string): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: {
        headers: { Authorization: authHeader },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

// Client com service_role — SOMENTE para operações administrativas
// (ex: generation_logs, admin_cost_snapshot, contagem de gerações)
export function createAdminClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )
}

// ============================================================
// Autenticação
// ============================================================
export async function getAuthUser(req: Request) {
  const authHeader = req.headers.get("Authorization")
  if (!authHeader) return { user: null, authHeader: null, error: "missing_auth" }

  const scopedClient = createScopedClient(authHeader)
  const { data: { user }, error } = await scopedClient.auth.getUser()

  if (error || !user) return { user: null, authHeader: null, error: "invalid_token" }
  return { user, authHeader, error: null }
}

// ============================================================
// Limites por Plano (DEPRECIADO — use credits.ts)
// ============================================================
// PLAN_LIMITS foi migrado para common/credits.ts
// Use PLAN_CREDITS + checkAndDebitCredits() ao invés deste.
// Mantido como stub para não quebrar imports legados.
/** @deprecated Use PLAN_CREDITS de credits.ts */
export const PLAN_LIMITS: Record<string, number> = {
  free: 500,
  starter: 2000,
  pro: 8000,
  church: 10000,
}

// ============================================================
// Detecção de Tópicos Sensíveis (Trilíngue)
// ============================================================
const SENSITIVE_KEYWORDS: Record<string, string[]> = {
  PT: ["depressão","depressao","trauma","abuso","violência","violencia","documentos","deportação","deportacao","suicídio","suicidio","luto","separação","separacao","ansiedade"],
  EN: ["depression","trauma","abuse","violence","documents","deportation","suicide","grief","separation","anxiety"],
  ES: ["depresión","depresion","trauma","abuso","violencia","documentos","deportación","deportacion","suicidio","duelo","separación","separacion","ansiedad"],
}

export function detectSensitiveTopics(text: string, language = "PT"): string[] {
  const lower = text.toLowerCase()
  const keywords = SENSITIVE_KEYWORDS[language] ?? SENSITIVE_KEYWORDS.PT
  return keywords.filter(k => lower.includes(k))
}

// ============================================================
// Slugify (handles de usuário e SEO slugs)
// ============================================================
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40)
}

// ============================================================
// Utilidades de Resposta
// ============================================================
export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

export function errorResponse(error: string, status: number, extra?: Record<string, unknown>): Response {
  return jsonResponse({ error, ...extra }, status)
}
