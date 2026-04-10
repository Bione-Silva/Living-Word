import type { PlanSlug } from '@/lib/plans';

const LEGACY_PLAN_MAP: Record<string, PlanSlug> = {
  free: 'free',
  starter: 'starter',
  pro: 'pro',
  igreja: 'igreja',
  pastoral: 'starter',
  church: 'pro',
  ministry: 'igreja',
  // keep both spellings
};

export function normalizePlan(plan?: string | null): PlanSlug {
  if (!plan) return 'free';
  return LEGACY_PLAN_MAP[plan.toLowerCase()] ?? 'free';
}