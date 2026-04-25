import type { PlanSlug } from '@/lib/plans';

/**
 * Maps any plan slug — including legacy ones (pastoral/church/ministry) —
 * to a current normalized PlanSlug. Defensive: returns 'free' for unknown values.
 *
 * Always use this when reading `profile.plan` from the DB instead of casting,
 * to avoid silent breakage when legacy rows exist.
 */
const LEGACY_PLAN_MAP: Record<string, PlanSlug> = {
  free: 'free',
  starter: 'starter',
  pro: 'pro',
  igreja: 'igreja',
  // legacy slugs — keep forever for backward compat
  pastoral: 'starter',
  church: 'pro',
  ministry: 'igreja',
  master: 'igreja',
  lifetime: 'igreja',
};

export function normalizePlan(plan?: string | null): PlanSlug {
  if (!plan) return 'free';
  return LEGACY_PLAN_MAP[plan.toLowerCase()] ?? 'free';
}

/** True if the plan (after normalization) is the free tier. */
export function isFreePlan(plan?: string | null): boolean {
  return normalizePlan(plan) === 'free';
}
