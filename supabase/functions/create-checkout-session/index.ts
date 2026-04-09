import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.0.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" });

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRICE_IDS: Record<string, Record<string, string>> = {
  starter:  { monthly: Deno.env.get("STRIPE_PRICE_STARTER_MONTHLY") ?? "",  annual: Deno.env.get("STRIPE_PRICE_STARTER_ANNUAL") ?? "" },
  pro:      { monthly: Deno.env.get("STRIPE_PRICE_PRO_MONTHLY") ?? "",      annual: Deno.env.get("STRIPE_PRICE_PRO_ANNUAL") ?? "" },
  igreja:   { monthly: Deno.env.get("STRIPE_PRICE_IGREJA_MONTHLY") ?? "", annual: Deno.env.get("STRIPE_PRICE_IGREJA_ANNUAL") ?? "" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401 });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
  if (authError || !user) return new Response(JSON.stringify({ error: "Token inválido" }), { status: 401 });

  const { plan, interval = "monthly", priceId, success_url, cancel_url } = await req.json();

  // Usa o priceId enviado pelo frontend, ou busca nas variáveis de ambiente como fallback
  const finalPriceId = priceId || (PRICE_IDS[plan] && PRICE_IDS[plan][interval]);

  if (!finalPriceId) {
    return new Response(JSON.stringify({ error: "Plano, intervalo ou priceId inválido" }), { status: 400 });
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
    mode: "subscription", // TODO: Se for Addon (topup), o mode deveria ser "payment", mas trataremos no webhook
    payment_method_types: ["card"],
    line_items: [{ price: finalPriceId, quantity: 1 }],
    success_url: success_url ?? `${Deno.env.get("APP_URL") ?? "http://localhost:8080"}/dashboard?upgraded=true`,
    cancel_url: cancel_url ?? `${Deno.env.get("APP_URL") ?? "http://localhost:8080"}/pricing?canceled=true`,
    subscription_data: {
      metadata: { plan, interval, supabase_user_id: user.id },
    },
    allow_promotion_codes: true,
    locale: "pt-BR",
  });

  return new Response(JSON.stringify({ checkout_url: session.url }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
