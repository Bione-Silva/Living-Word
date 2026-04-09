/**
 * Living Word — setup-webhook
 * 
 * Cria/atualiza o endpoint de webhook no Stripe.
 * Executar UMA VEZ: supabase functions invoke setup-webhook
 * 
 * SEGURANÇA: Lê a chave da env var, NUNCA hardcode.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno"

serve(async (_req) => {
  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")
    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: "STRIPE_SECRET_KEY não está configurada. Use: supabase secrets set STRIPE_SECRET_KEY=sk_..." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    if (!supabaseUrl) {
      return new Response(
        JSON.stringify({ error: "SUPABASE_URL não configurada" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    // Deletar webhooks antigos apontando para o mesmo URL (evitar duplicatas)
    const webhookUrl = `${supabaseUrl}/functions/v1/stripe-webhook`
    const existingEndpoints = await stripe.webhookEndpoints.list({ limit: 100 })
    
    for (const ep of existingEndpoints.data) {
      if (ep.url === webhookUrl) {
        await stripe.webhookEndpoints.del(ep.id)
        console.log(`🗑️ Webhook antigo removido: ${ep.id}`)
      }
    }

    // Criar webhook com TODOS os eventos necessários
    const webhookEndpoint = await stripe.webhookEndpoints.create({
      url: webhookUrl,
      enabled_events: [
        'checkout.session.completed',
        'customer.subscription.created',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'customer.subscription.trial_will_end',
        'invoice.paid',
        'invoice.payment_failed',
      ],
    })

    console.log("✅ Webhook criado com sucesso!")
    console.log(`🔑 Secret: ${webhookEndpoint.secret}`)
    console.log(`📡 URL: ${webhookUrl}`)
    console.log(`📋 Eventos: ${webhookEndpoint.enabled_events?.join(", ")}`)

    return new Response(
      JSON.stringify({ 
        message: '✅ WEBHOOK CRIADO COM SUCESSO!',
        webhook_secret: webhookEndpoint.secret,
        webhook_url: webhookUrl,
        webhook_id: webhookEndpoint.id,
        enabled_events: webhookEndpoint.enabled_events,
        instrucoes: [
          '1. Copie o webhook_secret acima',
          '2. Execute: supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...',
          '3. Faça deploy: supabase functions deploy stripe-webhook',
        ]
      }, null, 2),
      { headers: { "Content-Type": "application/json" } },
    )
  } catch (error) {
    console.error("❌ Erro ao criar webhook:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { "Content-Type": "application/json" }, status: 400 },
    )
  }
})
