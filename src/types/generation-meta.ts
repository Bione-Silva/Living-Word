export interface GenerationMetaDetail {
  tokens: number;
  words?: number;
  cost_usd: number;
  attempts?: number;
}

export interface GenerationMeta {
  model: string;
  total_tokens: number;
  total_cost_usd: number;
  elapsed_ms: number;
  attempts_used?: number;
  per_format?: Record<string, GenerationMetaDetail>;
}