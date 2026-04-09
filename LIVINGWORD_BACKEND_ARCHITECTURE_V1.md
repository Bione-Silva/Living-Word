# LIVING WORD — ESPECIFICAÇÃO COMPLETA DE BACKEND
## Documento para o Antigravity — Supabase + Stripe — Versão 1.0 — Abril 2026

---

## 1. VISÃO GERAL DA ARQUITETURA

```
Frontend (Lovable)
    ↓ chamadas autenticadas
Supabase Edge Functions   ←→   Stripe (webhooks + checkout)
    ↓
Supabase Database (PostgreSQL + RLS)
    ↓
Claude API (Anthropic)
```

**Regra de ouro:** nenhum cálculo de crédito, verificação de plano ou chamada à Claude API acontece no frontend. Tudo via Edge Functions com autenticação JWT.

---

## 2. SCHEMA DO BANCO DE DADOS (Supabase PostgreSQL)

### 2.1 Tabela `profiles`

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  plan TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'starter', 'pro', 'igreja')),
  plan_interval TEXT DEFAULT NULL
    CHECK (plan_interval IN ('monthly', 'annual', NULL)),
  credits_remaining INTEGER NOT NULL DEFAULT 150,
  credits_monthly_limit INTEGER NOT NULL DEFAULT 150,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  subscription_status TEXT DEFAULT 'inactive'
    CHECK (subscription_status IN ('active', 'inactive', 'past_due', 'canceled', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuário lê o próprio perfil"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "usuário atualiza o próprio perfil"
  ON profiles FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

---

### 2.2 Tabela `free_tool_usage`
Controla o "1 uso por ferramenta" do plano Free.

```sql
CREATE TABLE free_tool_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  tool_slug TEXT NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  reset_at TIMESTAMPTZ NOT NULL, -- primeiro dia do próximo mês
  UNIQUE(user_id, tool_slug, reset_at)
);

CREATE INDEX idx_free_tool_usage_user ON free_tool_usage(user_id, tool_slug, reset_at);
ALTER TABLE free_tool_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usuário vê seu próprio uso" ON free_tool_usage FOR SELECT USING (auth.uid() = user_id);
```

---

### 2.3 Tabela `credit_transactions`
Auditoria de todo consumo de créditos.

```sql
CREATE TABLE credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  tool_slug TEXT NOT NULL,
  credits_used INTEGER NOT NULL,
  credits_before INTEGER NOT NULL,
  credits_after INTEGER NOT NULL,
  generation_id UUID, -- referência ao conteúdo gerado
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_credit_transactions_user ON credit_transactions(user_id, created_at DESC);
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usuário vê suas transações" ON credit_transactions FOR SELECT USING (auth.uid() = user_id);
```

---

### 2.4 Tabela `generated_content`
Armazena todo conteúdo gerado.

```sql
CREATE TABLE generated_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  tool_slug TEXT NOT NULL,
  input_params JSONB NOT NULL DEFAULT '{}',
  output_content TEXT NOT NULL,
  output_tokens INTEGER,
  favorito BOOLEAN DEFAULT FALSE,
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_generated_content_user ON generated_content(user_id, created_at DESC);
CREATE INDEX idx_generated_content_tool ON generated_content(user_id, tool_slug);
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usuário vê seu conteúdo" ON generated_content FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "usuário cria conteúdo" ON generated_content FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "usuário atualiza conteúdo" ON generated_content FOR UPDATE USING (auth.uid() = user_id);
```

---

### 2.5 Tabela `workspaces`

```sql
CREATE TABLE workspaces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan_required TEXT NOT NULL DEFAULT 'free'
    CHECK (plan_required IN ('free', 'starter', 'pro', 'igreja')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner gerencia workspace" ON workspaces FOR ALL USING (auth.uid() = owner_id);
```

---

### 2.6 Tabela `workspace_members`

```sql
CREATE TABLE workspace_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  UNIQUE(workspace_id, user_id)
);
```

---

### 2.7 Tabela `stripe_events`
Log de webhooks do Stripe para idempotência.

```sql
CREATE TABLE stripe_events (
  id TEXT PRIMARY KEY, -- stripe event id
  type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  payload JSONB NOT NULL
);
```

---

## 3. CONFIGURAÇÃO DOS PLANOS — CRÉDITOS MENSAIS

```sql
-- Tabela de referência (não editada pelo usuário)
CREATE TABLE plan_config (
  plan TEXT PRIMARY KEY CHECK (plan IN ('free', 'starter', 'pro', 'igreja')),
  credits_monthly INTEGER NOT NULL,
  max_users INTEGER NOT NULL,
  max_workspaces INTEGER, -- NULL = ilimitado
  max_portals INTEGER NOT NULL,
  stripe_price_id_monthly TEXT,
  stripe_price_id_annual TEXT
);

INSERT INTO plan_config VALUES
  -- Free: $0/mês | Starter: $9,90/mês | Pro: $29,90/mês | Igreja: $79,90/mês + $5,90/usuário extra
  ('free',     150,    1, 1, 1, NULL, NULL),
  ('starter',  3000,   1, 1, 1, 'price_starter_monthly', 'price_starter_annual'),
  ('pro',      10000,  3, 3, 1, 'price_pro_monthly',     'price_pro_annual'),
  ('igreja',  30000,  10, NULL, 5, 'price_igreja_monthly', 'price_igreja_annual');
```

---

## 4. TABELA DE CUSTO POR FERRAMENTA

```sql
CREATE TABLE tool_config (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('pesquisa', 'criacao_core', 'criacao_extras', 'premium')),
  credits_cost INTEGER NOT NULL,
  min_plan TEXT NOT NULL DEFAULT 'free'
    CHECK (min_plan IN ('free', 'starter', 'pro', 'igreja')),
  available_on_free BOOLEAN NOT NULL DEFAULT FALSE
);

INSERT INTO tool_config (slug, name, category, credits_cost, min_plan, available_on_free) VALUES
-- PESQUISA
('explorador_temas',     'Explorador de Temas',    'pesquisa',        5,  'free',    TRUE),
('versiculos',           'Versículos',             'pesquisa',        3,  'free',    TRUE),
('contexto_historico',   'Contexto Histórico',     'pesquisa',        5,  'free',    TRUE),
('citacoes',             'Citações',               'pesquisa',        4,  'free',    TRUE),
('texto_original',       'Texto Original',         'pesquisa',        4,  'free',    TRUE),
('analise_lexical',      'Análise Lexical',        'pesquisa',        5,  'free',    TRUE),
-- CRIAÇÃO CORE
('estudio_pastoral',     'Estúdio Pastoral',       'criacao_core',   20,  'free',    TRUE),
('estudo_biblico',       'Estudo Bíblico',         'criacao_core',   30,  'free',    TRUE),
('blog',                 'Blog',                   'criacao_core',   15,  'free',    TRUE),
('artigo',               'Artigo',                 'criacao_core',   15,  'free',    TRUE),
('titulos',              'Títulos Criativos',      'criacao_core',    3,  'free',    TRUE),
('metaforas',            'Criador de Metáforas',   'criacao_core',    4,  'free',    TRUE),
('modernizador',         'Modernizador Bíblico',   'criacao_core',    6,  'free',    TRUE),
('redator_universal',    'Redator Universal',      'criacao_core',   10,  'free',    TRUE),
-- CRIAÇÃO EXTRAS (min_plan = starter)
('roteiro_reels',        'Roteiro Reels',          'criacao_extras', 15,  'starter', FALSE),
('celula',               'Célula',                 'criacao_extras', 15,  'starter', FALSE),
('legendas',             'Legendas',               'criacao_extras', 10,  'starter', FALSE),
('newsletter',           'Newsletter',             'criacao_extras', 30,  'starter', FALSE),
('avisos',               'Avisos',                 'criacao_extras', 10,  'starter', FALSE),
('quiz_biblico',         'Quiz Bíblico',           'criacao_extras', 20,  'starter', FALSE),
('poesia',               'Poesia',                 'criacao_extras', 15,  'starter', FALSE),
('infantil',             'Infantil',               'criacao_extras', 20,  'starter', FALSE),
('traducao',             'Tradução',               'criacao_extras', 15,  'starter', FALSE),
('youtube_to_blog',      'YouTube → Blog',         'criacao_extras', 25,  'pro',     FALSE),
-- PREMIUM (min_plan = pro)
('mentes_brilhantes',    'Mentes Brilhantes',      'premium',        40,  'pro',     FALSE),
('ilustracoes',          'Ilustrações Sermões',    'premium',        25,  'pro',     FALSE);
```

---

## 5. EDGE FUNCTIONS

### 5.1 `check-and-consume-credits` — Função central de controle de acesso

```typescript
// supabase/functions/check-and-consume-credits/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401 });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Verificar JWT e obter user_id
  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace("Bearer ", "")
  );
  if (authError || !user) return new Response(JSON.stringify({ error: "Token inválido" }), { status: 401 });

  const { tool_slug } = await req.json();

  // Buscar perfil + config da ferramenta em paralelo
  const [profileResult, toolResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("tool_config").select("*").eq("slug", tool_slug).single(),
  ]);

  if (profileResult.error || toolResult.error) {
    return new Response(JSON.stringify({ error: "Configuração não encontrada" }), { status: 400 });
  }

  const profile = profileResult.data;
  const tool = toolResult.data;

  // Verificar se o plano do usuário tem acesso à ferramenta
  const planOrder = ["free", "starter", "pro", "igreja"];
  const userPlanIndex = planOrder.indexOf(profile.plan);
  const requiredPlanIndex = planOrder.indexOf(tool.min_plan);

  if (userPlanIndex < requiredPlanIndex) {
    return new Response(JSON.stringify({
      allowed: false,
      reason: "plan_insufficient",
      required_plan: tool.min_plan,
      current_plan: profile.plan,
    }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Lógica específica do plano Free
  if (profile.plan === "free") {
    if (!tool.available_on_free) {
      return new Response(JSON.stringify({
        allowed: false,
        reason: "not_on_free",
        required_plan: tool.min_plan,
      }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Verificar se já usou esta ferramenta no mês
    const resetAt = getNextMonthReset();
    const { data: existingUsage } = await supabase
      .from("free_tool_usage")
      .select("id")
      .eq("user_id", user.id)
      .eq("tool_slug", tool_slug)
      .gte("reset_at", new Date().toISOString())
      .maybeSingle();

    if (existingUsage) {
      return new Response(JSON.stringify({
        allowed: false,
        reason: "free_monthly_limit_reached",
        reset_at: resetAt,
      }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Verificar créditos globais residuais do Free
    if (profile.credits_remaining < tool.credits_cost) {
      return new Response(JSON.stringify({
        allowed: false,
        reason: "insufficient_credits",
        credits_remaining: profile.credits_remaining,
        credits_needed: tool.credits_cost,
      }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Registrar uso no Free e deduzir créditos em transação
    const newCredits = profile.credits_remaining - tool.credits_cost;

    const [, , txError] = await Promise.all([
      supabase.from("free_tool_usage").insert({
        user_id: user.id,
        tool_slug,
        reset_at: resetAt,
      }),
      supabase.from("profiles").update({ credits_remaining: newCredits }).eq("id", user.id),
      supabase.from("credit_transactions").insert({
        user_id: user.id,
        tool_slug,
        credits_used: tool.credits_cost,
        credits_before: profile.credits_remaining,
        credits_after: newCredits,
      }),
    ]);

    if (txError) return new Response(JSON.stringify({ error: "Erro ao registrar uso" }), { status: 500 });

    return new Response(JSON.stringify({ allowed: true, credits_remaining: newCredits }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Planos pagos: verificar créditos
  if (profile.credits_remaining < tool.credits_cost) {
    return new Response(JSON.stringify({
      allowed: false,
      reason: "insufficient_credits",
      credits_remaining: profile.credits_remaining,
      credits_needed: tool.credits_cost,
      reset_at: profile.current_period_end,
    }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Deduzir créditos para planos pagos
  const newCredits = profile.credits_remaining - tool.credits_cost;

  await Promise.all([
    supabase.from("profiles").update({ credits_remaining: newCredits }).eq("id", user.id),
    supabase.from("credit_transactions").insert({
      user_id: user.id,
      tool_slug,
      credits_used: tool.credits_cost,
      credits_before: profile.credits_remaining,
      credits_after: newCredits,
      credits_after: newCredits,
    }),
  ]);

  return new Response(JSON.stringify({ allowed: true, credits_remaining: newCredits }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});

function getNextMonthReset(): string {
  const now = new Date();
  const reset = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);
  return reset.toISOString();
}
```

---

### 5.2 `stripe-webhook` — Processar eventos do Stripe

```typescript
// supabase/functions/stripe-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.0.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" });
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

const PLAN_CREDITS: Record<string, number> = {
  free: 150,
  starter: 3000,
  pro: 10000,
  igreja: 30000,
};

serve(async (req) => {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return new Response("Webhook signature inválida", { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Idempotência: verificar se evento já foi processado
  const { data: existingEvent } = await supabase
    .from("stripe_events")
    .select("id")
    .eq("id", event.id)
    .maybeSingle();

  if (existingEvent) {
    return new Response(JSON.stringify({ received: true, skipped: true }), { status: 200 });
  }

  // Registrar evento
  await supabase.from("stripe_events").insert({ id: event.id, type: event.type, payload: event });

  switch (event.type) {

    // Assinatura criada ou reativada
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const planSlug = getPlanFromPriceId(sub.items.data[0].price.id);

      await supabase.from("profiles")
        .update({
          plan: planSlug,
          stripe_subscription_id: sub.id,
          subscription_status: sub.status,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          credits_remaining: PLAN_CREDITS[planSlug],
          credits_monthly_limit: PLAN_CREDITS[planSlug],
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_customer_id", sub.customer as string);
      break;
    }

    // Renovação mensal/anual — repõe créditos
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.billing_reason === "subscription_cycle") {
        const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
        const planSlug = getPlanFromPriceId(sub.items.data[0].price.id);

        await supabase.from("profiles")
          .update({
            credits_remaining: PLAN_CREDITS[planSlug],
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", invoice.customer as string);
      }
      break;
    }

    // Cancelamento / downgrade para Free
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await supabase.from("profiles")
        .update({
          plan: "free",
          subscription_status: "canceled",
          stripe_subscription_id: null,
          credits_remaining: PLAN_CREDITS["free"],
          credits_monthly_limit: PLAN_CREDITS["free"],
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_customer_id", sub.customer as string);
      break;
    }

    // Pagamento falhou — marcar como past_due mas NÃO remover acesso ainda
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      await supabase.from("profiles")
        .update({ subscription_status: "past_due", updated_at: new Date().toISOString() })
        .eq("stripe_customer_id", invoice.customer as string);
      break;
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});

// Mapeia price_id do Stripe para slug do plano
function getPlanFromPriceId(priceId: string): string {
  const map: Record<string, string> = {
    [Deno.env.get("STRIPE_PRICE_STARTER_MONTHLY") ?? ""]: "starter",
    [Deno.env.get("STRIPE_PRICE_STARTER_ANNUAL") ?? ""]: "starter",
    [Deno.env.get("STRIPE_PRICE_PRO_MONTHLY") ?? ""]: "pro",
    [Deno.env.get("STRIPE_PRICE_PRO_ANNUAL") ?? ""]: "pro",
    [Deno.env.get("STRIPE_PRICE_IGREJA_MONTHLY") ?? ""]: "igreja",
    [Deno.env.get("STRIPE_PRICE_IGREJA_ANNUAL") ?? ""]: "igreja",
  };
  return map[priceId] ?? "free";
}
```

---

### 5.3 `create-checkout-session` — Criar sessão de pagamento no Stripe

```typescript
// supabase/functions/create-checkout-session/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.0.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" });

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRICE_IDS: Record<string, Record<string, string>> = {
  starter:  { monthly: Deno.env.get("STRIPE_PRICE_STARTER_MONTHLY")!,  annual: Deno.env.get("STRIPE_PRICE_STARTER_ANNUAL")! },
  pro:      { monthly: Deno.env.get("STRIPE_PRICE_PRO_MONTHLY")!,      annual: Deno.env.get("STRIPE_PRICE_PRO_ANNUAL")! },
  igreja: { monthly: Deno.env.get("STRIPE_PRICE_IGREJA_MONTHLY")!, annual: Deno.env.get("STRIPE_PRICE_IGREJA_ANNUAL")! },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401 });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
  if (!user) return new Response(JSON.stringify({ error: "Token inválido" }), { status: 401 });

  const { plan, interval = "monthly", success_url, cancel_url } = await req.json();

  if (!PRICE_IDS[plan]) {
    return new Response(JSON.stringify({ error: "Plano inválido" }), { status: 400 });
  }

  // Buscar ou criar customer no Stripe
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  let customerId = profile?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: PRICE_IDS[plan][interval], quantity: 1 }],
    success_url: success_url ?? `${Deno.env.get("APP_URL")}/dashboard?upgraded=true`,
    cancel_url: cancel_url ?? `${Deno.env.get("APP_URL")}/pricing?canceled=true`,
    subscription_data: {
      metadata: { plan, interval, supabase_user_id: user.id },
    },
    allow_promotion_codes: true,
    locale: "pt-BR",
  });

  return new Response(JSON.stringify({ checkout_url: session.url }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
```

---

### 5.4 `create-customer-portal` — Portal de gerenciamento de assinatura

```typescript
// supabase/functions/create-customer-portal/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.0.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" });

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401 });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
  if (!user) return new Response(JSON.stringify({ error: "Token inválido" }), { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("stripe_customer_id").eq("id", user.id).single();

  if (!profile?.stripe_customer_id) {
    return new Response(JSON.stringify({ error: "Nenhuma assinatura encontrada" }), { status: 400 });
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${Deno.env.get("APP_URL")}/settings/billing`,
  });

  return new Response(JSON.stringify({ portal_url: portalSession.url }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
```

---

### 5.5 `reset-free-credits` — Cron job mensal para resetar Free

```typescript
// supabase/functions/reset-free-credits/index.ts
// Configurar como cron: "0 3 1 * *" (dia 1 de cada mês às 03:00 UTC)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Resetar créditos de todos os usuários Free
  const { error } = await supabase
    .from("profiles")
    .update({ credits_remaining: 150, updated_at: new Date().toISOString() })
    .eq("plan", "free");

  if (error) {
    console.error("Erro ao resetar créditos Free:", error);
    return new Response(JSON.stringify({ success: false }), { status: 500 });
  }

  console.log("Créditos Free resetados com sucesso.");
  return new Response(JSON.stringify({ success: true }), { status: 200 });
});
```

---

## 6. VARIÁVEIS DE AMBIENTE NECESSÁRIAS

```bash
# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1...   # NUNCA expor no frontend

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (criar no Stripe Dashboard)
STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_STARTER_ANNUAL=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_ANNUAL=price_...
STRIPE_PRICE_IGREJA_MONTHLY=price_...
STRIPE_PRICE_IGREJA_ANNUAL=price_...

# App
APP_URL=https://app.livingword.com   # ou domínio de produção

# Claude
ANTHROPIC_API_KEY=sk-ant-...
```

---

## 7. CONFIGURAÇÃO DO STRIPE DASHBOARD

### 7.1 Produtos e preços a criar

```
Produto: "Living Word Starter"
  - Preço mensal: $9,90 / USD / recurring / monthly
  - Preço anual:  $99,00 / USD / recurring / yearly  (2 meses grátis)

Produto: "Living Word Pro"
  - Preço mensal: $29,90 / USD / recurring / monthly
  - Preço anual:  $299,00 / USD / recurring / yearly  (2 meses grátis)

Produto: "Living Word Igreja"
  - Preço mensal: $79,90 / USD / recurring / monthly
  - Preço anual:  $799,00 / USD / recurring / yearly  (2 meses grátis)
  - Preço por usuário extra: $5,90 / USD / per seat / monthly
```

### 7.2 Webhook endpoint a registrar

```
URL: https://{project}.supabase.co/functions/v1/stripe-webhook
Eventos a escutar:
  ✅ customer.subscription.created
  ✅ customer.subscription.updated
  ✅ customer.subscription.deleted
  ✅ invoice.payment_succeeded
  ✅ invoice.payment_failed
```

### 7.3 Customer Portal — configurar no Stripe Dashboard
```
Features habilitadas:
  ✅ Cancelar assinatura
  ✅ Atualizar método de pagamento
  ✅ Upgrade/downgrade de plano
  ✅ Ver histórico de faturas

Business information:
  - Nome: Living Word
  - URL: https://livingword.com
  - Privacy URL: https://livingword.com/privacy
  - Terms URL: https://livingword.com/terms
```

---

## 8. DEPLOY COMPLETO — ORDEM DE EXECUÇÃO

```bash
# 1. Instalar Supabase CLI
npm install -g supabase
supabase login

# 2. Aplicar migrações do banco
supabase db push

# 3. Configurar secrets
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set STRIPE_PRICE_STARTER_MONTHLY=price_...
supabase secrets set STRIPE_PRICE_STARTER_ANNUAL=price_...
supabase secrets set STRIPE_PRICE_PRO_MONTHLY=price_...
supabase secrets set STRIPE_PRICE_PRO_ANNUAL=price_...
supabase secrets set STRIPE_PRICE_IGREJA_MONTHLY=price_...
supabase secrets set STRIPE_PRICE_IGREJA_ANNUAL=price_...
supabase secrets set APP_URL=https://app.livingword.com

# 4. Deploy das Edge Functions
supabase functions deploy check-and-consume-credits
supabase functions deploy stripe-webhook
supabase functions deploy create-checkout-session
supabase functions deploy create-customer-portal
supabase functions deploy reset-free-credits

# 5. Configurar cron para reset mensal (no Supabase Dashboard → Edge Functions → Schedules)
# reset-free-credits → "0 3 1 * *"

# 6. Registrar webhook no Stripe Dashboard com a URL da função stripe-webhook
```

---

## 9. REGRAS DE NEGÓCIO CRÍTICAS

### Não fazer jamais
- ❌ NUNCA processar pagamento sem verificar webhook signature
- ❌ NUNCA modificar `plan` ou `credits_remaining` diretamente pelo frontend
- ❌ NUNCA expor `SUPABASE_SERVICE_ROLE_KEY` ou `STRIPE_SECRET_KEY` no cliente
- ❌ NUNCA deduzir créditos sem registrar em `credit_transactions`
- ❌ NUNCA remover acesso imediatamente em `invoice.payment_failed` — dar grace period via `past_due`

### Grace period para `past_due`
```
subscription_status = 'past_due'
  → manter acesso por 7 dias
  → enviar email D+1, D+3, D+7
  → se D+7 sem pagamento: downgrade para free
```

### Comportamento de downgrade
```
Downgrade Pro → Starter:
  → workspaces extras: modo somente leitura por 30 dias
  → Mentes Brilhantes: bloqueado imediatamente
  → créditos: ajustar para limit do Starter no próximo ciclo

Cancelamento → Free:
  → acesso pago mantido até current_period_end
  → no vencimento: plan = 'free', credits_remaining = 150
  → dados preservados por 90 dias em modo arquivado
```

---

## 10. MARGEM FINANCEIRA DE REFERÊNCIA

| Plano | Receita/mês | Custo API máx. (est.) | Margem bruta |
|---|---|---|---|
| Free | $0 | ~$0,36 | — (CAC) |
| Starter | $9,90 | ~$2,40 | ~76% |
| Pro | $29,90 | ~$6,00 | ~80% |
| Igreja | $79,90 | ~$16,00 | ~80% |

**Nota:** custos assumem uso próximo ao máximo. Uso real médio: 30–50% dos créditos → margem real de 90–95%.
