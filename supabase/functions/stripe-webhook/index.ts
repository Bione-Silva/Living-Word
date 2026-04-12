// stripe-webhook/index.ts
// Edge Function: Processar webhooks do Stripe
// Gerencia upgrades, downgrades, trials, cancelamentos e addon de seats
// 
// SISTEMA DE CRÉDITOS: Cada evento Stripe sincroniza créditos no banco.
// IMPORTANTE: Esta função NÃO requer auth do usuário — usa signing secret do Stripe.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../common/utils.ts";
import {
  STRIPE_PRICE_TO_PLAN,
  STRIPE_ADDON_PRICE_IDS,
  calculateTotalCredits,
  PLAN_CREDITS,
} from "../common/credits.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    // 1. Verificar assinatura do webhook (em produção)
    let event: any;

    if (STRIPE_WEBHOOK_SECRET && signature) {
      const isValid = await verifyStripeSignature(body, signature, STRIPE_WEBHOOK_SECRET);
      if (!isValid) {
        return new Response(
          JSON.stringify({ error: "Assinatura do webhook inválida" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
      event = JSON.parse(body);
    } else {
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
        const planFromMetadata = eventData.metadata?.plan || eventData.subscription_data?.metadata?.plan;

        const user = await findUser(adminClient, customerId, customerEmail);
        if (!user) {
          console.error("❌ Usuário não encontrado para checkout:", customerId, customerEmail);
          break;
        }

        // Se for uma recarga (addon_topup), o modo é 'payment' e não tem subscription
        if (planFromMetadata === "addon_topup") {
          const topupAmount = 4000; // Valor fixo definido na arquitetura
          await adminClient.rpc("add_credits_topup", {
            p_user_id: user.id,
            p_amount: topupAmount,
            p_stripe_session_id: eventData.id
          });
          console.log(`💰 Recarga realizada: +${topupAmount} créditos para ${user.email}`);
          
          await adminClient.from("conversion_events").insert({
            user_id: user.id,
            event_type: "topup_purchased",
            metadata: { stripe_customer_id: customerId, checkout_session_id: eventData.id, amount: topupAmount },
          });
          break;
        }

        // Atualizar stripe_customer_id no perfil para assinaturas normais
        await adminClient.from("profiles").update({
          stripe_customer_id: customerId,
        }).eq("id", user.id);

        if (subscriptionId) {
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

      // === ASSINATURA CRIADA OU ATUALIZADA ===
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const customerId = eventData.customer;
        const subscriptionId = eventData.id;
        const status = eventData.status; // active, trialing, past_due, canceled
        const items = eventData.items?.data ?? [];

        // Detectar plano base e addon de seats
        let newPlan = "starter";
        let extraSeats = 0;

        for (const item of items) {
          const priceId = item.price?.id;
          
          // Addon de seats (Igreja)
          if (typeof STRIPE_ADDON_PRICE_IDS !== "undefined" && STRIPE_ADDON_PRICE_IDS.includes(priceId)) {
            extraSeats = item.quantity ?? 0;
            continue;
          }

          // Plano base
          if (priceId && STRIPE_PRICE_TO_PLAN[priceId]) {
            newPlan = STRIPE_PRICE_TO_PLAN[priceId];
          }
        }

        const user = await findUser(adminClient, customerId);
        if (!user) {
          console.error("❌ Usuário não encontrado para subscription:", customerId);
          break;
        }

        // Calcular créditos totais (inclui seats extras para igreja)
        const totalCredits = calculateTotalCredits(newPlan, extraSeats);

        // Upsert na tabela subscriptions
        await adminClient.from("subscriptions").upsert({
          user_id: user.id,
          stripe_subscription_id: subscriptionId,
          stripe_customer_id: customerId,
          plan: newPlan,
          status: status,
          extra_seats: extraSeats,
          trial_start: eventData.trial_start ? new Date(eventData.trial_start * 1000).toISOString() : null,
          trial_end: eventData.trial_end ? new Date(eventData.trial_end * 1000).toISOString() : null,
          current_period_start: new Date(eventData.current_period_start * 1000).toISOString(),
          current_period_end: new Date(eventData.current_period_end * 1000).toISOString(),
          cancel_at_period_end: eventData.cancel_at_period_end || false,
          amount_cents: items.reduce((sum: number, i: any) => sum + (i.price?.unit_amount ?? 0) * (i.quantity ?? 1), 0),
          currency: eventData.currency || "usd",
          updated_at: new Date().toISOString(),
        }, { onConflict: "stripe_subscription_id" });

        // Atualizar plano e créditos se ativo ou em trial
        if (status === "active" || status === "trialing") {
          await adminClient.rpc("process_plan_upgrade", {
            p_user_id: user.id,
            p_new_plan: newPlan,
            p_stripe_customer_id: customerId,
            p_stripe_subscription_id: subscriptionId,
            p_extra_seats: extraSeats,
          });
          console.log(`✅ Plano: ${user.plan} → ${newPlan} | Créditos: ${totalCredits} | Seats: ${1 + extraSeats} | ${user.email}`);
        }

        // Atualizar evento Stripe com contexto
        await adminClient.from("stripe_events").update({
          user_id: user.id,
          plan_from: user.plan,
          plan_to: newPlan,
          metadata: { extra_seats: extraSeats, credits_assigned: totalCredits },
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

        // Downgrade para free (500 créditos)
        await adminClient.rpc("process_plan_downgrade", {
          p_user_id: user.id,
          p_reason: "subscription_canceled",
        });

        // Atualizar subscription
        await adminClient.from("subscriptions").update({
          status: "canceled",
          extra_seats: 0,
          canceled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq("stripe_subscription_id", subscriptionId);

        console.log(`⚠️ Cancelado: ${user.email} → free (500 créditos)`);

        await adminClient.from("stripe_events").update({
          user_id: user.id,
          plan_from: user.plan,
          plan_to: "free",
        }).eq("stripe_event_id", event.id);

        break;
      }

      // === FATURA PAGA (reset mensal de créditos) ===
      case "invoice.paid": {
        const customerId = eventData.customer;
        const subscriptionId = eventData.subscription;

        // Ignorar faturas sem subscription (pagamentos avulsos)
        if (!subscriptionId) break;

        const user = await findUser(adminClient, customerId);
        if (!user) break;

        // Reset mensal de créditos via função SQL
        await adminClient.rpc("reset_monthly_credits", {
          p_user_id: user.id,
        });

        console.log(`💳 Pagamento recebido + créditos resetados: ${user.email}`);
        break;
      }

      // === PAGAMENTO FALHOU ===
      case "invoice.payment_failed": {
        const customerId = eventData.customer;
        const user = await findUser(adminClient, customerId);

        if (user) {
          await adminClient.from("stripe_events").update({
            user_id: user.id,
            status: "payment_failed",
          }).eq("stripe_event_id", event.id);

          console.warn(`⚠️ Pagamento falhou: ${user.email}`);
        }
        break;
      }

      // === TRIAL VAI EXPIRAR (3 dias antes) ===
      case "customer.subscription.trial_will_end": {
        const customerId = eventData.customer;
        const user = await findUser(adminClient, customerId);

        if (user) {
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
  if (customerId) {
    const { data } = await client
      .from("profiles")
      .select("id, email, plan")
      .eq("stripe_customer_id", customerId)
      .single();

    if (data) return data;
  }

  if (email) {
    const { data } = await client
      .from("profiles")
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

    const tolerance = 300; // 5 minutos
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(timestamp)) > tolerance) return false;

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
