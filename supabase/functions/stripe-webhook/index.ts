// stripe-webhook/index.ts
// Edge Function: Processar webhooks do Stripe
// Gerencia upgrades, downgrades, trials e cancelamentos
// IMPORTANTE: Esta função NÃO requer auth do usuário — usa signing secret do Stripe

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../common/utils.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

// Mapeamento Stripe Price ID → Plano Living Word
const PRICE_TO_PLAN: Record<string, string> = {
  // Configurar com os price_ids reais do Stripe
  "price_pastoral_monthly": "pastoral",
  "price_church_monthly": "church",
  "price_ministry_monthly": "ministry",
};

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    // 1. Verificar assinatura do webhook (em produção)
    // Em dev, permitir sem verificação
    let event: any;

    if (STRIPE_WEBHOOK_SECRET && signature) {
      // Verificação manual da assinatura Stripe (sem SDK pesado)
      const isValid = await verifyStripeSignature(body, signature, STRIPE_WEBHOOK_SECRET);
      if (!isValid) {
        return new Response(
          JSON.stringify({ error: "Assinatura do webhook inválida" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
      event = JSON.parse(body);
    } else {
      // Dev mode: aceitar sem verificação
      event = JSON.parse(body);
      console.warn("⚠️ Stripe webhook sem verificação de assinatura (dev mode)");
    }

    // 2. Criar admin client (service_role)
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 3. Processar evento por tipo
    const eventType = event.type;
    const eventData = event.data.object;

    console.log(`📬 Stripe webhook: ${eventType} | ${event.id}`);

    // 4. Registrar evento bruto no log
    await adminClient.from("stripe_events").insert({
      stripe_event_id: event.id,
      event_type: eventType,
      customer_id: eventData.customer,
      raw_event: event,
    });

    // 5. Processar por tipo de evento
    switch (eventType) {
      // === CHECKOUT CONCLUÍDO (Trial ou pagamento imediato) ===
      case "checkout.session.completed": {
        const customerId = eventData.customer;
        const subscriptionId = eventData.subscription;
        const customerEmail = eventData.customer_email || eventData.customer_details?.email;

        // Buscar usuário por email ou stripe_customer_id
        const user = await findUser(adminClient, customerId, customerEmail);
        if (!user) {
          console.error("❌ Usuário não encontrado para checkout:", customerId, customerEmail);
          break;
        }

        // Atualizar stripe_customer_id no perfil
        await adminClient.from("users").update({
          stripe_customer_id: customerId,
        }).eq("id", user.id);

        // Buscar subscription para determinar plano
        if (subscriptionId) {
          // Será processado por customer.subscription.created
          console.log("✅ Checkout completo, aguardando subscription.created");
        }

        // Registrar evento de conversão
        await adminClient.from("conversion_events").insert({
          user_id: user.id,
          event_type: "trial_started",
          plan_from: user.plan,
          metadata: { stripe_customer_id: customerId, checkout_session_id: eventData.id },
        });

        break;
      }

      // === ASSINATURA CRIADA ===
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const customerId = eventData.customer;
        const subscriptionId = eventData.id;
        const status = eventData.status; // active, trialing, past_due, canceled
        const priceId = eventData.items?.data?.[0]?.price?.id;
        const newPlan = priceId ? (PRICE_TO_PLAN[priceId] || "pastoral") : "pastoral";

        const user = await findUser(adminClient, customerId);
        if (!user) {
          console.error("❌ Usuário não encontrado para subscription:", customerId);
          break;
        }

        // Atualizar ou criar subscription
        await adminClient.from("subscriptions").upsert({
          user_id: user.id,
          stripe_subscription_id: subscriptionId,
          stripe_customer_id: customerId,
          plan: newPlan,
          status: status,
          trial_start: eventData.trial_start ? new Date(eventData.trial_start * 1000).toISOString() : null,
          trial_end: eventData.trial_end ? new Date(eventData.trial_end * 1000).toISOString() : null,
          current_period_start: new Date(eventData.current_period_start * 1000).toISOString(),
          current_period_end: new Date(eventData.current_period_end * 1000).toISOString(),
          cancel_at_period_end: eventData.cancel_at_period_end || false,
          amount_cents: eventData.items?.data?.[0]?.price?.unit_amount || 0,
          currency: eventData.currency || "usd",
          updated_at: new Date().toISOString(),
        }, { onConflict: "stripe_subscription_id" });

        // Atualizar plano do usuário (se ativo ou em trial)
        if (status === "active" || status === "trialing") {
          await adminClient.rpc("process_plan_upgrade", {
            p_user_id: user.id,
            p_new_plan: newPlan,
            p_stripe_customer_id: customerId,
            p_stripe_subscription_id: subscriptionId,
          });
          console.log(`✅ Plano atualizado: ${user.plan} → ${newPlan} para ${user.email}`);
        }

        // Atualizar evento Stripe com user_id
        await adminClient.from("stripe_events").update({
          user_id: user.id,
          plan_from: user.plan,
          plan_to: newPlan,
        }).eq("stripe_event_id", event.id);

        break;
      }

      // === ASSINATURA CANCELADA ===
      case "customer.subscription.deleted": {
        const customerId = eventData.customer;
        const subscriptionId = eventData.id;

        const user = await findUser(adminClient, customerId);
        if (!user) {
          console.error("❌ Usuário não encontrado para cancelamento:", customerId);
          break;
        }

        // Downgrade para free
        await adminClient.rpc("process_plan_downgrade", {
          p_user_id: user.id,
          p_reason: "subscription_canceled",
        });

        // Atualizar subscription
        await adminClient.from("subscriptions").update({
          status: "canceled",
          canceled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq("stripe_subscription_id", subscriptionId);

        console.log(`⚠️ Assinatura cancelada: ${user.email} → free`);

        // Atualizar evento Stripe
        await adminClient.from("stripe_events").update({
          user_id: user.id,
          plan_from: user.plan,
          plan_to: "free",
        }).eq("stripe_event_id", event.id);

        break;
      }

      // === PAGAMENTO FALHOU ===
      case "invoice.payment_failed": {
        const customerId = eventData.customer;
        const user = await findUser(adminClient, customerId);

        if (user) {
          // Não faz downgrade imediato — Stripe tentará novamente
          // Apenas registra para monitoramento
          await adminClient.from("stripe_events").update({
            user_id: user.id,
            status: "payment_failed",
          }).eq("stripe_event_id", event.id);

          console.warn(`⚠️ Pagamento falhou para ${user.email}`);
        }
        break;
      }

      // === TRIAL VAI EXPIRAR (3 dias antes) ===
      case "customer.subscription.trial_will_end": {
        const customerId = eventData.customer;
        const user = await findUser(adminClient, customerId);

        if (user) {
          // Registrar evento para trigger de email
          await adminClient.from("conversion_events").insert({
            user_id: user.id,
            event_type: "trial_expired",
            trigger_name: "email_day25",
            metadata: {
              trial_end: eventData.trial_end,
              action: "send_retention_email",
            },
          });
          console.log(`📧 Trial expirando em 3 dias: ${user.email}`);
        }
        break;
      }

      default:
        console.log(`ℹ️ Evento não processado: ${eventType}`);
    }

    // 6. Retornar sucesso para o Stripe
    return new Response(
      JSON.stringify({ received: true, event_type: eventType }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("stripe-webhook fatal error:", error);
    return new Response(
      JSON.stringify({ error: "Webhook processing failed", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

// === UTILIDADES ===

/**
 * Buscar usuário por stripe_customer_id ou email
 */
async function findUser(
  client: any,
  customerId?: string,
  email?: string
): Promise<{ id: string; email: string; plan: string } | null> {
  // Tentar por stripe_customer_id primeiro
  if (customerId) {
    const { data } = await client
      .from("users")
      .select("id, email, plan")
      .eq("stripe_customer_id", customerId)
      .single();

    if (data) return data;
  }

  // Fallback: buscar por email
  if (email) {
    const { data } = await client
      .from("users")
      .select("id, email, plan")
      .eq("email", email)
      .single();

    if (data) return data;
  }

  return null;
}

/**
 * Verificar assinatura do webhook Stripe (HMAC SHA-256)
 */
async function verifyStripeSignature(
  payload: string,
  signatureHeader: string,
  secret: string
): Promise<boolean> {
  try {
    const pairs = signatureHeader.split(",").map((p) => p.trim().split("="));
    const timestamp = pairs.find(([k]) => k === "t")?.[1];
    const sig = pairs.find(([k]) => k === "v1")?.[1];

    if (!timestamp || !sig) return false;

    // Verificar que o timestamp não é muito antigo (5 min tolerance)
    const tolerance = 300; // 5 minutos
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(timestamp)) > tolerance) return false;

    // Calcular expected signature
    const signedPayload = `${timestamp}.${payload}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
    const expected = Array.from(new Uint8Array(signatureBytes))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return expected === sig;
  } catch {
    return false;
  }
}
