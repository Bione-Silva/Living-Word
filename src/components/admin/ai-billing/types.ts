export interface ModelUsage {
  model: string;
  cost_usd: number;
  tokens: number;
  generations: number;
}

export interface FeatureUsage {
  feature: string;
  cost_usd: number;
  tokens: number;
  generations: number;
}

export interface TenantUsage {
  identifier: string;
  plan: string;
  generations_count: number;
  total_tokens: number;
  cost_usd: number;
}

export interface AIMetrics {
  total_cost_usd: number;
  total_tokens: number;
  total_generations: number;
  top_feature: string;
  models_usage: ModelUsage[];
  features_usage: FeatureUsage[];
  tenants_usage: TenantUsage[];
}
