/**
 * Living Word — Credits Engine (Geo Pricing)
 * 
 * Motor centralizado de créditos, limitadores e roteamento de IA.
 */
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"

export const PLAN_CREDITS: Record<string, number> = {
  free: 500,
  starter: 3000,
  pro: 10000,
  igreja: 30000,
}

export const GENERATION_COSTS: Record<string, number> = {
  sermon: 20, study: 30, devotional: 10, post: 5,
  outline: 15, reels: 10, bilingual: 25, cell: 15,
}

export const RATE_LIMITS: Record<string, { per_minute: number; per_day: number }> = {
  free:    { per_minute: 2,  per_day: 10  },
  starter: { per_minute: 5,  per_day: 50  },
  pro:     { per_minute: 10, per_day: 200 },
  igreja:  { per_minute: 15, per_day: 500 },
}

const MODEL_ROUTING: Record<string, Record<string, string>> = {
  free: {
    post: "gemini-2.5-flash", devotional: "gemini-2.5-flash", outline: "gemini-2.5-flash",
    reels: "gemini-2.5-flash", cell: "gemini-2.5-flash", sermon: "gemini-2.5-flash",
    study: "gemini-2.5-flash", bilingual: "gemini-2.5-flash",
  },
  starter: {
    post: "gpt-4o-mini", devotional: "gpt-4o-mini", outline: "gpt-4o-mini",
    reels: "gpt-4o-mini", cell: "gpt-4o-mini", sermon: "gpt-4o",
    study: "gpt-4o", bilingual: "gpt-4o",
  },
  pro: {
    post: "gpt-4o-mini", devotional: "gpt-4o", outline: "gpt-4o",
    reels: "gpt-4o-mini", cell: "gpt-4o-mini", sermon: "gpt-4o",
    study: "gpt-4o", bilingual: "gpt-4o",
  },
  igreja: {
    post: "gpt-4o-mini", devotional: "gpt-4o", outline: "gpt-4o",
    reels: "gpt-4o-mini", cell: "gpt-4o-mini", sermon: "gpt-4o",
    study: "gpt-4o", bilingual: "gpt-4o",
  },
}

// Mapeamento Regional (Geo Pricing) — Sincronizado com src/utils/geoPricing.ts
export const STRIPE_PRICE_TO_PLAN: Record<string, string> = {
  // --- BRL ---
  "price_1TJg0mEaDBbHafP6EjCuGgmk": "starter",
  "price_1TJg0nEaDBbHafP6R0XrOxCo": "starter",
  "price_1TJg0oEaDBbHafP6bC747uSG": "pro",
  "price_1TJg0pEaDBbHafP6ToL24iXI": "pro",
  "price_1TJg0qEaDBbHafP6gyw9BqQ1": "igreja",
  "price_1TJg0rEaDBbHafP69yZFNvtc": "igreja",
  
  // --- USD ---
  "price_1TIbCqEaDBbHafP6AqYI1lQ3": "starter",
  "price_1TIbCsEaDBbHafP6qOWGnzjp": "pro",
  "price_1TIbCtEaDBbHafP6D1krnMzA": "igreja",

  // --- LATAM ---
  "price_1TIbCrEaDBbHafP6gO6Z5UPt": "starter",
  "price_1TIbCsEaDBbHafP6kY9apvOc": "pro",
  "price_1TIbCtEaDBbHafP6Rh4uTD5Q": "igreja",

  // --- TEST ($1) ---
  "price_1TIbCrEaDBbHafP6dRTQO3m2": "starter",
  "price_1TIbCsEaDBbHafP6ximO1Myd": "pro",
  "price_1TIbCuEaDBbHafP6RlbFZvJH": "igreja",
}

export const STRIPE_ADDON_PRICE_IDS = [
  "price_1TJl2SEaDBbHafP6pmEHdFEq", // BRL Topup
  "price_1TJl2TEaDBbHafP6X6urHSkN", // USD Topup
  "price_1TIbCvEaDBbHafP6DM4entar", // LATAM Topup
  "price_1TIbCvEaDBbHafP6WaieVawh", // TEST Topup
]

// ============================================================
// Funções Principais
// ============================================================

export function calculateTotalCost(outputModes: string[]): number {
  return outputModes.reduce((total, mode) => total + (GENERATION_COSTS[mode] ?? 10), 0)
}

export function getGenerationCost(type: string): number {
  return GENERATION_COSTS[type] ?? 10
}

export function calculateTotalCredits(plan: string, extraSeats: number = 0): number {
  const base = PLAN_CREDITS[plan] ?? 500
  if (plan === "igreja" && extraSeats > 0) return base + Math.floor(base * 0.10 * extraSeats)
  return base
}

export function selectAIModel(plan: string, generationType: string): string {
  const planRouting = MODEL_ROUTING[plan] ?? MODEL_ROUTING.free
  return planRouting[generationType] ?? planRouting.sermon ?? "gemini-2.5-flash"
}

export function isGeminiModel(model: string): boolean {
  return model.startsWith("gemini")
}

export async function checkRateLimit(
  adminClient: SupabaseClient,
  userId: string,
  plan: string,
  endpoint: string
): Promise<{ allowed: boolean; retryAfterSeconds?: number; error?: string }> {
  const limits = RATE_LIMITS[plan] ?? RATE_LIMITS.free
  const now = new Date()

  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000).toISOString()
  const { count: minuteCount } = await adminClient
    .from("rate_limit_log")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", oneMinuteAgo)

  if ((minuteCount ?? 0) >= limits.per_minute) {
    return { allowed: false, retryAfterSeconds: 60, error: `rate_limit` }
  }

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const { count: dayCount } = await adminClient
    .from("rate_limit_log")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", todayStart)

  if ((dayCount ?? 0) >= limits.per_day) {
    return { allowed: false, retryAfterSeconds: 3600, error: `rate_limit` }
  }

  await adminClient.from("rate_limit_log").insert({ user_id: userId, endpoint })
  return { allowed: true }
}

export async function checkAndDebitCredits(
  adminClient: SupabaseClient,
  userId: string,
  generationType: string,
  materialId?: string,
  customAmount?: number
): Promise<{ success: boolean; remaining: number; cost: number; error?: string }> {
  const cost = customAmount ?? getGenerationCost(generationType)
  const { data, error } = await adminClient.rpc("debit_credits", {
    p_user_id: userId,
    p_amount: cost,
    p_generation_type: generationType,
    p_material_id: materialId ?? null,
    p_description: `Generation: ${generationType} (${cost} credits)`,
  })

  if (error) return { success: false, remaining: 0, cost, error: "credits_debit_failed" }

  const result = data?.[0] ?? data
  if (!result?.success) return { success: false, remaining: result?.balance_remaining ?? 0, cost, error: result?.error_message ?? "insufficient" }

  return { success: true, remaining: result.balance_remaining, cost }
}

export async function getCreditsBalance(
  adminClient: SupabaseClient,
  userId: string
): Promise<{ balance: number; plan: string; maxSeats: number }> {
  const { data } = await adminClient
    .from("profiles")
    .select("credits_remaining, plan, max_seats")
    .eq("id", userId)
    .single()

  return { 
    balance: data?.credits_remaining ?? 0, 
    plan: data?.plan ?? "free", 
    maxSeats: data?.max_seats ?? 1 
  }
}

export function estimateApiCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  const costs: Record<string, { input: number; output: number }> = {
    "gemini-2.5-flash": { input: 0.000000075, output: 0.0000003 },
    "gpt-4o-mini": { input: 0.00000015, output: 0.0000006 },
    "gpt-4o": { input: 0.0000025, output: 0.00001 },
  }
  const c = costs[model] ?? costs["gpt-4o-mini"]
  return (inputTokens * c.input) + (outputTokens * c.output)
}


export function estimateApiCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  const costs: Record<string, { input: number; output: number }> = {
    "gemini-2.5-flash": { input: 0.000000075, output: 0.0000003 },
    "gpt-4o-mini": { input: 0.00000015, output: 0.0000006 },
    "gpt-4o": { input: 0.0000025, output: 0.00001 },
  }
  const c = costs[model] ?? costs["gpt-4o-mini"]
  return (inputTokens * c.input) + (outputTokens * c.output)
}
