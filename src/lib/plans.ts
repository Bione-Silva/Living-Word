// ═══════════════════════════════════════════════════════════════
// Living Word — Plan Configuration (Single Source of Truth)
// Credit Wallet Model
// ═══════════════════════════════════════════════════════════════

export type PlanSlug = 'free' | 'starter' | 'pro' | 'pastor_pro' | 'igreja';

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
  | 'biblioteca_ilimitada'
  | 'multiplicacao_conteudo';

// ── Plan hierarchy (lower index = lower tier) ──
const PLAN_ORDER: PlanSlug[] = ['free', 'starter', 'pro', 'pastor_pro', 'igreja'];

export function planIndex(plan: PlanSlug): number {
  return PLAN_ORDER.indexOf(plan);
}

// ── Monthly credits per plan (Credit Wallet) ──
export const PLAN_CREDITS: Record<PlanSlug, number> = {
  free: 999999,
  starter: 999999,
  pro: 999999,
  pastor_pro: 999999,
  igreja: 999999,
};

// ── Generation potential per plan (for tooltips) ──
export const PLAN_GENERATION_POTENTIAL: Record<PlanSlug, { titles: number; outlines: number; sermons: number; studies: number }> = {
  free:    { titles: 100,   outlines: 33,    sermons: 10,  studies: 5 },
  starter: { titles: 400,   outlines: 100,   sermons: 50,  studies: 25 },
  pro:     { titles: 1_200, outlines: 400,   sermons: 150, studies: 75 },
  pastor_pro: { titles: 2_500, outlines: 800, sermons: 300, studies: 150 },
  igreja:  { titles: 5_000, outlines: 1_600, sermons: 600, studies: 300 },
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
const FEATURE_MIN_PLAN: Record<PlanFeature, PlanSlug> = {
  pesquisa_basica: 'free',
  criacao_core: 'free',
  criacao_extras: 'starter',
  biblioteca_ilimitada: 'starter',
  suporte_prioritario: 'pro',
  equipe: 'pro',
  workspaces_multiplos: 'pro',
  portal_avancado: 'pro',
  ilustracoes: 'pro',
  calendar: 'pro',
  automacao_basica: 'pro',
  youtube_to_blog: 'pastor_pro',
  mentes_brilhantes: 'pastor_pro',
  multiplicacao_conteudo: 'pastor_pro',
  automacao_avancada: 'igreja',
  multiportal: 'igreja',
  white_label: 'igreja',
  suporte_vip: 'igreja',
};

// ── Tool → feature mapping ──
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

export function hasAccess(userPlan: PlanSlug, feature: PlanFeature): boolean {
  const minPlan = FEATURE_MIN_PLAN[feature];
  return planIndex(userPlan) >= planIndex(minPlan);
}

export function getMinPlanFor(feature: PlanFeature): PlanSlug {
  return FEATURE_MIN_PLAN[feature];
}

export function isToolLockedForPlan(toolId: string, userPlan: PlanSlug): boolean {
  // BYPASS: All tools are unlocked for development
  return false;
}

export function getMinPlanForTool(toolId: string): PlanSlug {
  const feature = TOOL_FEATURE[toolId];
  if (!feature) return 'free';
  return FEATURE_MIN_PLAN[feature];
}

export type UpgradeBadgeType = 'lock' | 'crown' | 'church';

export function getUpgradeBadge(currentPlan: PlanSlug, requiredPlan: PlanSlug): UpgradeBadgeType {
  if (requiredPlan === 'igreja') return 'church';
  if (requiredPlan === 'pastor_pro' || requiredPlan === 'pro') return 'crown';
  return 'lock';
}

// ── Plan display names (trilingual) ──
type L = 'PT' | 'EN' | 'ES';

export const PLAN_DISPLAY_NAMES: Record<PlanSlug, Record<L, string>> = {
  free: { PT: 'Grátis', EN: 'Free', ES: 'Gratis' },
  starter: { PT: 'Essential (Starter)', EN: 'Essential', ES: 'Essential' },
  pro: { PT: 'Pastoral', EN: 'Pastoral', ES: 'Pastoral' },
  pastor_pro: { PT: 'Pastor Pro', EN: 'Pastor Pro', ES: 'Pastor Pro' },
  igreja: { PT: 'Igreja (Church)', EN: 'Church', ES: 'Iglesia' },
};

// ── Plan prices (USD) ──
export const PLAN_PRICES = {
  monthly: {
    starter: 9.90,
    pro: 29.90,
    pastor_pro: 49.90,
    igreja: 79.90,
  },
  annual: {
    starter: 8.25,
    pro: 24.92,
    pastor_pro: 41.58,
    igreja: 66.58,
  },
  annualSavings: {
    starter: 19.80,
    pro: 59.80,
    pastor_pro: 99.80,
    igreja: 159.80,
  },
} as const;


// ── Plan prices (BRL) ──
export const PLAN_PRICES_BRL = {
  monthly: {
    starter: 37.00,
    pro: 79.00,
    igreja: 197.00,
  },
  annual: {
    starter: 308.00,
    pro: 660.00,
    igreja: 1640.00,
  },
  annualSavings: {
    starter: 136.00,
    pro: 158.00,
    igreja: 394.00,
  },
} as const;

// ── Top-up add-on pricing ──
export const TOPUP_CREDITS = 4_000;
export const TOPUP_PRICE_USD = 7.00;
export const TOPUP_PRICE_BRL = 27.00;

// ── Low credit threshold (show top-up when below this) ──
export const LOW_CREDITS_THRESHOLD = 200;

// ── Free plan: tools that are available (limited by credit wallet now) ──
export const FREE_MONTHLY_TOOLS = new Set([
  'topic-explorer', 'verse-finder', 'historical-context', 'quote-finder',
  'original-text', 'lexical',
  'studio', 'biblical-study', 'free-article', 'free-article-universal',
  'title-gen', 'metaphor-creator', 'bible-modernizer',
]);

/** Get the current month key (São Paulo timezone) */
export function getCurrentMonthKey(): string {
  const now = new Date();
  const brt = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const y = brt.getUTCFullYear();
  const m = String(brt.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}
