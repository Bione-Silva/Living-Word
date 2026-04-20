// ═══════════════════════════════════════════════════════════════
// Living Word — Shared Plan Normalization (Edge Functions)
// Single source of truth for plan slug handling on the backend.
// Mirrors src/lib/plan-normalization.ts
// ═══════════════════════════════════════════════════════════════

export type NormalizedPlan = 'free' | 'starter' | 'pro' | 'igreja';

const PLAN_ALIAS: Record<string, NormalizedPlan> = {
  free: 'free',
  starter: 'starter',
  pro: 'pro',
  igreja: 'igreja',
  // legacy slugs — keep mapping forever for backward compat
  pastoral: 'starter',
  church: 'pro',
  ministry: 'igreja',
};

export function normalizePlan(plan?: string | null): NormalizedPlan {
  if (!plan) return 'free';
  return PLAN_ALIAS[plan.toLowerCase()] ?? 'free';
}

// Monthly credits per normalized plan (mirrors PLAN_CREDITS in src/lib/plans.ts)
export const PLAN_CREDITS: Record<NormalizedPlan, number> = {
  free: 500,
  starter: 4_000,
  pro: 8_000,
  igreja: 20_000,
};

// Monthly biblical-scene generation quota per plan
export const BIBLICAL_SCENE_QUOTA: Record<NormalizedPlan, number> = {
  free: 0,
  starter: 0,
  pro: 20,
  igreja: 50,
};

// Plans allowed to use the biblical scene studio (search + generate)
export const SCENE_STUDIO_PLANS = new Set<NormalizedPlan>(['starter', 'pro', 'igreja']);

// USD price tiers (for MRR estimates)
export const PLAN_PRICE_USD: Record<NormalizedPlan, number> = {
  free: 0,
  starter: 9.90,
  pro: 29.90,
  igreja: 79.90,
};
