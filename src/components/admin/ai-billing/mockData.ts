import type { AIMetrics } from './types';

export const MOCK_DATA: AIMetrics = {
  total_cost_usd: 47.83,
  total_tokens: 8_742_510,
  total_generations: 1_284,
  top_feature: 'Blog Creator',
  models_usage: [
    { model: 'gpt-4o-mini', cost_usd: 12.45, tokens: 3_210_400, generations: 580 },
    { model: 'gpt-4o', cost_usd: 18.72, tokens: 1_840_200, generations: 210 },
    { model: 'gemini-2.5-flash', cost_usd: 8.34, tokens: 2_490_310, generations: 340 },
    { model: 'gemini-2.5-pro', cost_usd: 5.12, tokens: 820_100, generations: 98 },
    { model: 'claude-3-haiku', cost_usd: 3.20, tokens: 381_500, generations: 56 },
  ],
  features_usage: [
    { feature: 'Blog Creator', cost_usd: 15.40, tokens: 2_980_000, generations: 420 },
    { feature: 'Sermão', cost_usd: 11.20, tokens: 2_100_000, generations: 310 },
    { feature: 'Devocional', cost_usd: 7.85, tokens: 1_450_000, generations: 215 },
    { feature: 'Estudo Bíblico', cost_usd: 6.30, tokens: 1_120_000, generations: 180 },
    { feature: 'Série Temática', cost_usd: 4.08, tokens: 692_510, generations: 102 },
    { feature: 'Resumo', cost_usd: 3.00, tokens: 400_000, generations: 57 },
  ],
  tenants_usage: [
    { identifier: 'pastor.silva@email.com', plan: 'ministry', generations_count: 189, total_tokens: 1_420_000, cost_usd: 8.42 },
    { identifier: 'igreja-central.blog', plan: 'church', generations_count: 156, total_tokens: 1_180_000, cost_usd: 7.15 },
    { identifier: 'carlos.mendes@email.com', plan: 'pastoral', generations_count: 134, total_tokens: 980_000, cost_usd: 5.90 },
    { identifier: 'comunidade-graca.blog', plan: 'church', generations_count: 112, total_tokens: 850_000, cost_usd: 4.78 },
    { identifier: 'ana.costa@email.com', plan: 'pastoral', generations_count: 98, total_tokens: 720_000, cost_usd: 4.20 },
    { identifier: 'ministerio-paz.blog', plan: 'ministry', generations_count: 87, total_tokens: 640_000, cost_usd: 3.85 },
    { identifier: 'pedro.lima@email.com', plan: 'free', generations_count: 45, total_tokens: 310_000, cost_usd: 2.10 },
    { identifier: 'joao.batista@email.com', plan: 'pastoral', generations_count: 67, total_tokens: 480_000, cost_usd: 3.22 },
    { identifier: 'igreja-esperanca.blog', plan: 'church', generations_count: 92, total_tokens: 690_000, cost_usd: 4.01 },
    { identifier: 'maria.santos@email.com', plan: 'free', generations_count: 28, total_tokens: 190_000, cost_usd: 1.30 },
    { identifier: 'ministerio-louvor.blog', plan: 'ministry', generations_count: 145, total_tokens: 1_082_510, cost_usd: 2.90 },
    { identifier: 'lucas.ferreira@email.com', plan: 'pastoral', generations_count: 131, total_tokens: 200_000, cost_usd: 0.00 },
  ],
};
