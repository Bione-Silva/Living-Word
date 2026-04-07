// ═══════════════════════════════════════════════════════════════
// Living Word — Plan Configuration (Single Source of Truth)
// ═══════════════════════════════════════════════════════════════

export type PlanSlug = 'free' | 'starter' | 'pro' | 'igreja';

export type PlanFeature =
  | 'pesquisa_basica'
  | 'criacao_core'
  | 'criacao_extras'
  | 'youtube_to_blog'
  | 'mentes_brilhantes'
  | 'ilustracoes'
  | 'calendar'
  | 'automacao_basica'
  | 'automacao_avancada'
  | 'equipe'
  | 'workspaces_multiplos'
  | 'portal_avancado'
  | 'multiportal'
  | 'white_label'
  | 'suporte_prioritario'
  | 'suporte_vip'
  | 'biblioteca_ilimitada';

// ── Plan hierarchy (lower index = lower tier) ──
const PLAN_ORDER: PlanSlug[] = ['free', 'starter', 'pro', 'igreja'];

export function planIndex(plan: PlanSlug): number {
  return PLAN_ORDER.indexOf(plan);
}

// ── Monthly credits per plan ──
export const PLAN_CREDITS: Record<PlanSlug, number> = {
  free: 150,
  starter: 3_000,
  pro: 10_000,
  igreja: 30_000,
};

// ── Credit cost per tool ──
export const TOOL_CREDITS: Record<string, number> = {
  // Research (5 tools)
  'topic-explorer': 5,
  'verse-finder': 3,
  'historical-context': 5,
  'quote-finder': 4,
  'original-text': 4,
  'lexical': 5,
  // Create — Core
  'studio': 20,
  'biblical-study': 30,
  'free-article': 15,
  'free-article-universal': 10,
  'title-gen': 3,
  'metaphor-creator': 4,
  'bible-modernizer': 6,
  'illustrations': 10,
  'youtube-blog': 0, // special pricing
  // Create — Extras
  'reels-script': 15,
  'cell-group': 15,
  'social-caption': 10,
  'newsletter': 30,
  'announcements': 10,
  'trivia': 20,
  'poetry': 15,
  'kids-story': 20,
  'deep-translation': 15,
};

// ── Feature access map ──
// Which plan FIRST unlocks each feature
const FEATURE_MIN_PLAN: Record<PlanFeature, PlanSlug> = {
  pesquisa_basica: 'free',
  criacao_core: 'free',
  criacao_extras: 'starter',
  youtube_to_blog: 'pro',
  mentes_brilhantes: 'pro',
  ilustracoes: 'pro',
  calendar: 'pro',
  automacao_basica: 'pro',
  automacao_avancada: 'igreja',
  equipe: 'pro',
  workspaces_multiplos: 'pro',
  portal_avancado: 'pro',
  multiportal: 'igreja',
  white_label: 'igreja',
  suporte_prioritario: 'pro',
  suporte_vip: 'igreja',
  biblioteca_ilimitada: 'starter',
};

// ── Tool → feature mapping ──
// Maps each tool ID to the feature it belongs to
const TOOL_FEATURE: Record<string, PlanFeature> = {
  'topic-explorer': 'pesquisa_basica',
  'verse-finder': 'pesquisa_basica',
  'historical-context': 'pesquisa_basica',
  'quote-finder': 'pesquisa_basica',
  'original-text': 'pesquisa_basica',
  'lexical': 'pesquisa_basica',
  'studio': 'criacao_core',
  'biblical-study': 'criacao_core',
  'free-article': 'criacao_core',
  'free-article-universal': 'criacao_core',
  'title-gen': 'criacao_core',
  'metaphor-creator': 'criacao_core',
  'bible-modernizer': 'criacao_core',
  'illustrations': 'ilustracoes',
  'youtube-blog': 'youtube_to_blog',
  'reels-script': 'criacao_extras',
  'cell-group': 'criacao_extras',
  'social-caption': 'criacao_extras',
  'newsletter': 'criacao_extras',
  'announcements': 'criacao_extras',
  'trivia': 'criacao_extras',
  'poetry': 'criacao_extras',
  'kids-story': 'criacao_extras',
  'deep-translation': 'criacao_extras',
};

// ── Helpers ──

/** Check if a plan has access to a feature */
export function hasAccess(userPlan: PlanSlug, feature: PlanFeature): boolean {
  const minPlan = FEATURE_MIN_PLAN[feature];
  return planIndex(userPlan) >= planIndex(minPlan);
}

/** Get the minimum plan required for a feature */
export function getMinPlanFor(feature: PlanFeature): PlanSlug {
  return FEATURE_MIN_PLAN[feature];
}

/** Check if a specific tool is locked for a given plan */
export function isToolLockedForPlan(toolId: string, userPlan: PlanSlug): boolean {
  const feature = TOOL_FEATURE[toolId];
  if (!feature) return false;
  return !hasAccess(userPlan, feature);
}

/** Get the minimum plan required to unlock a specific tool */
export function getMinPlanForTool(toolId: string): PlanSlug {
  const feature = TOOL_FEATURE[toolId];
  if (!feature) return 'free';
  return FEATURE_MIN_PLAN[feature];
}

/** Badge type for the upgrade gap */
export type UpgradeBadgeType = 'lock' | 'crown' | 'church';

export function getUpgradeBadge(currentPlan: PlanSlug, requiredPlan: PlanSlug): UpgradeBadgeType {
  if (requiredPlan === 'igreja') return 'church';
  if (requiredPlan === 'pro') return 'crown';
  return 'lock';
}

// ── Plan display names (trilingual) ──
type L = 'PT' | 'EN' | 'ES';

export const PLAN_DISPLAY_NAMES: Record<PlanSlug, Record<L, string>> = {
  free: { PT: 'Grátis', EN: 'Free', ES: 'Gratis' },
  starter: { PT: 'Starter', EN: 'Starter', ES: 'Starter' },
  pro: { PT: 'Pro', EN: 'Pro', ES: 'Pro' },
  igreja: { PT: 'Igreja', EN: 'Church', ES: 'Iglesia' },
};

// ── Plan prices (USD) ──
export const PLAN_PRICES = {
  monthly: {
    starter: 9.90,
    pro: 29.90,
    igreja: 79.90,
  },
  annual: {
    starter: 8.25,  // ~2 months free
    pro: 24.92,
    igreja: 66.58,
  },
  annualSavings: {
    starter: 19.80,
    pro: 59.80,
    igreja: 159.80,
  },
} as const;

// ── Free plan: tools that are available 1x/month ──
// All research + core creation tools allow 1 use per month for free users
export const FREE_MONTHLY_TOOLS = new Set([
  'topic-explorer', 'verse-finder', 'historical-context', 'quote-finder',
  'original-text', 'lexical',
  'studio', 'biblical-study', 'free-article', 'free-article-universal',
  'title-gen', 'metaphor-creator', 'bible-modernizer',
]);

/** Get the current month key (São Paulo timezone) */
export function getCurrentMonthKey(): string {
  const now = new Date();
  // Approximate BRT offset (-3h)
  const brt = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const y = brt.getUTCFullYear();
  const m = String(brt.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}
